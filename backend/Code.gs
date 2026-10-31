/* Google Apps Script backend for the Self-Control task battery.
   Deploy as a Web App from the Google account that should own the data
   (see SETUP.md). Three jobs:

   1. doPost — receives each upload from the student pages
        { pid, session_id, step, save_id, tables: { <sheetName>: [ {col: value}, ... ] } }
      and stores it as one JSON file in the "raw" folder on Drive. No lock
      and no spreadsheet write per request, so ~100 students uploading at
      the same time don't queue behind each other.

   2. doGet?action=assign&pid=X&token=T — hands out the pilot groups. Each
      group (mt: A/B, hz: weeks/months) is dealt from shuffled blocks of 4
      (2 + 2), so the groups stay 50/50 as students arrive. A student ID is
      tied to the browser that used it first (its token): that browser gets
      the same answer again (resume after a reload or crash), any other one
      gets error 'used'. TEST codes are never locked. To let a student
      continue on another device: note "unlock" + unlockMarkedStudents.

   3. buildSheets — copies new raw files into the spreadsheet, one tab per
      sheetName (columns = union of the keys seen; duplicates of the same
      save_id are skipped), then moves each file to "processed". Run it from
      the editor or let the trigger from setupTrigger() run it every 10 min.

   Student IDs: generateIds() writes pre-generated IDs into the
   "student_ids" tab. Only those IDs are real participants: the entry page
   refuses other codes, and uploads from codes starting with TEST (for
   trying the site) go to separate TEST_<table> tabs and don't use up the
   50/50 group blocks. The ID list stays in the spreadsheet, never in the
   public repo.

   The raw JSON files are the primary copy of the data; the spreadsheet can
   always be rebuilt from them (resetSheets). */

const DATA_FOLDER_NAME = 'self-control-battery-data';   // created in My Drive on first use
const SPREADSHEET_ID = '';   // leave empty when the script is bound to the spreadsheet
const GROUPS = { mt: ['A', 'B'], hz: ['weeks', 'months'] };
const ID_SHEET = 'student_ids';
const ID_START = 1000;   // student IDs are consecutive integers from here

/* ---------- student IDs ---------- */

const normId = s => String(s || '').replace(/\s+/g, '').toUpperCase();
const isTestId = id => id.indexOf('TEST') === 0;

/* Run from the editor: appends n new IDs (default 1000) to the student_ids
   tab — consecutive integers continuing after the highest one there (the
   first is ID_START). */
function generateIds(n){
  n = Number(n) || 1000;
  const ss = book();
  let sh = ss.getSheetByName(ID_SHEET);
  if (!sh){
    sh = ss.insertSheet(ID_SHEET, 0);
    sh.appendRow(['no', 'student_id', 'school', 'class', 'given_to', 'note']);
    sh.setFrozenRows(1);
  }
  const last = sh.getLastRow();
  let next = ID_START;
  if (last > 1) sh.getRange(2, 2, last - 1, 1).getValues().forEach(r => { const v = Number(r[0]); if (v >= next) next = v + 1; });
  const rows = [];
  for (let i = 0; i < n; i++) rows.push([last + i, next + i, '', '', '', '']);
  sh.getRange(last + 1, 1, rows.length, 6).setValues(rows);
  CacheService.getScriptCache().remove('ids');
  Logger.log('added IDs ' + next + '-' + (next + n - 1) + '; total ' + (sh.getLastRow() - 1));
}

/* Set of valid IDs (cached 10 min; edits to the tab show up after that). */
function realIds(){
  const cache = CacheService.getScriptCache();
  const hit = cache.get('ids');
  if (hit) return JSON.parse(hit);
  const sh = book().getSheetByName(ID_SHEET);
  const set = {};
  if (sh && sh.getLastRow() > 1){
    sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues().forEach(r => { const id = normId(r[0]); if (id) set[id] = 1; });
  }
  cache.put('ids', JSON.stringify(set), 600);
  return set;
}
const isRealId = id => !isTestId(id) && !!realIds()[id];

/* The bound spreadsheet, also from web-app requests. */
function book(){
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const props = PropertiesService.getScriptProperties();
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active){ props.setProperty('ss_id', active.getId()); return active; }
  return SpreadsheetApp.openById(props.getProperty('ss_id'));
}

/* ---------- 1. uploads ---------- */

function doPost(e){
  try {
    const text = e.postData.contents;
    const body = JSON.parse(text);
    if (!body || typeof body.tables !== 'object') throw new Error('no tables');
    const saveId = String(body.save_id || Utilities.getUuid()).replace(/[^\w-]/g, '');
    const pid = normId(body.pid).replace(/[^\w-]/g, '').slice(0, 40) || 'unknown';
    const real = isRealId(pid);
    const name = (real ? '' : 'TEST__') + pid + '__' + saveId + '.json';
    const raw = folders().raw;
    if (!raw.getFilesByName(name).hasNext()){          // a retry of an upload that already arrived
      raw.createFile(name, JSON.stringify({ server_ts: new Date().toISOString(), real: real, body: body }), 'application/json');
    }
    return json({ ok: true });
  } catch (err){
    return json({ ok: false, error: String(err) });
  }
}

/* ---------- 2. group assignment ---------- */

function doGet(e){
  const p = (e && e.parameter) || {};
  if (p.action === 'assign') return json(assign(normId(p.pid), String(p.token || '')));
  return ContentService.createTextOutput('self-control battery endpoint: OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function assign(pid, token){
  if (!pid) return { ok: false, error: 'no pid' };
  const test = isTestId(pid);
  if (!test && !isRealId(pid)) return { ok: false, error: 'unknown_code' };
  const props = PropertiesService.getScriptProperties();
  const key = 'pid_' + pid;
  const blockKey = g => (test ? 'testblock_' : 'block_') + g;   // test codes don't touch the real 50/50 blocks
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const known = props.getProperty(key);
    if (known){
      const k = JSON.parse(known);
      if (!test && k.token && token !== k.token) return { ok: false, error: 'used' };   // another device
      if (!test && !k.token && token){ k.token = token; props.setProperty(key, JSON.stringify(k)); }  // (after unlock)
      return { ok: true, repeat: true, mt: k.mt, hz: k.hz, real: k.real, assigned_at: k.assigned_at };
    }
    const out = {};
    for (const g in GROUPS){
      let block = JSON.parse(props.getProperty(blockKey(g)) || '[]');
      if (!block.length) block = shuffle([0, 0, 1, 1]);
      out[g] = GROUPS[g][block.shift()];
      props.setProperty(blockKey(g), JSON.stringify(block));
    }
    out.real = !test;
    out.assigned_at = new Date().toISOString();
    props.setProperty(key, JSON.stringify(Object.assign({ token: token }, out)));
    return Object.assign({ ok: true }, out);
  } finally {
    lock.releaseLock();
  }
}

function shuffle(a){
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* Group counts so far over listed student IDs (run from the editor; output
   in the log), plus which IDs have a group and any leftover codes that are
   not on the list (clearTestData removes those). */
function groupCounts(){
  const all = PropertiesService.getScriptProperties().getProperties();
  const n = { A: 0, B: 0, weeks: 0, months: 0 }, ids = [], other = [];
  Object.keys(all).filter(k => k.indexOf('pid_') === 0).forEach(k => {
    const id = k.slice(4), g = JSON.parse(all[k]);
    if (!isRealId(id)){ if (!isTestId(id)) other.push(id); return; }
    n[g.mt]++; n[g.hz]++; ids.push(id + ':' + g.mt + '/' + g.hz);
  });
  Logger.log(JSON.stringify(n) + '  students: ' + (ids.join(' ') || 'none') + (other.length ? '  not on the list: ' + other.join(' ') : ''));
}

/* ---------- 3. raw files → spreadsheet ---------- */

function buildSheets(){
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;                     // a previous run is still going
  try {
    const f = folders();
    const ss = book();
    const t0 = Date.now();
    const byTable = {}, done = [];
    const files = f.raw.getFiles();
    while (files.hasNext() && Date.now() - t0 < 4 * 60 * 1000){
      const file = files.next();
      if (file.isTrashed()) continue;                   // Drive still lists trashed files in their folder
      if (f.processed.getFilesByName(file.getName()).hasNext()){ file.moveTo(f.processed); continue; }   // duplicate
      let rec;
      try { rec = JSON.parse(file.getBlob().getDataAsString()); }
      catch (err){ Logger.log('skip unreadable ' + file.getName()); continue; }
      const tables = (rec.body && rec.body.tables) || {};
      const prefix = rec.real === false || file.getName().indexOf('TEST__') === 0 ? 'TEST_' : '';   // test codes → TEST_ tabs
      for (const name in tables){
        const tab = sanitizeName(prefix + name);
        (byTable[tab] = byTable[tab] || [])
          .push.apply(byTable[tab], tables[name].map(r => Object.assign({ server_ts: rec.server_ts }, r)));
      }
      done.push(file);
    }
    for (const name in byTable) appendRows(ss, name, byTable[name]);
    SpreadsheetApp.flush();
    done.forEach(file => file.moveTo(f.processed));
    Logger.log('processed ' + done.length + ' uploads');
  } finally {
    lock.releaseLock();
  }
}

/* Run once: buildSheets every 10 minutes. */
function setupTrigger(){
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'buildSheets').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('buildSheets').timeBased().everyMinutes(10).create();
}

/* Start the spreadsheet over from the raw files: deletes the data tabs and
   moves every processed file back to raw; then run buildSheets. */
function resetSheets(){
  const f = folders();
  const ss = book();
  ss.insertSheet('_tmp');
  ss.getSheets().filter(s => s.getName() !== '_tmp' && s.getName() !== ID_SHEET).forEach(s => ss.deleteSheet(s));
  const files = f.processed.getFiles();
  while (files.hasNext()) files.next().moveTo(f.raw);
  ss.getSheetByName('_tmp').setName('README').getRange(1, 1).setValue('Data tabs are rebuilt by buildSheets().');
}

/* Run before the pilot (and any time later): removes everything from TEST
   codes — TEST_ tabs, their raw/processed files (to Drive trash), their
   group assignments. Also removes data saved before student IDs existed
   (codes not on the list). If no real student has been assigned yet, the
   50/50 blocks restart from zero too. */
function clearTestData(){
  const ss = book(), f = folders(), props = PropertiesService.getScriptProperties();
  ss.getSheets().filter(s => s.getName().indexOf('TEST_') === 0).forEach(s => ss.deleteSheet(s));
  let n = 0;
  [f.raw, f.processed].forEach(folder => {
    const it = folder.getFiles();
    while (it.hasNext()){
      const file = it.next(), pid = file.getName().replace(/^TEST__/, '').split('__')[0];
      if (file.isTrashed()) continue;
      if (file.getName().indexOf('TEST__') === 0 || !isRealId(pid)){ file.setTrashed(true); n++; }
    }
  });
  const all = props.getProperties();
  Object.keys(all).filter(k => k.indexOf('pid_') === 0 && !isRealId(k.slice(4))).forEach(k => props.deleteProperty(k));
  const realLeft = Object.keys(props.getProperties()).some(k => k.indexOf('pid_') === 0);
  if (!realLeft) Object.keys(GROUPS).forEach(g => props.deleteProperty('block_' + g));
  // tabs built from pre-ID test uploads: drop data tabs if no real files remain
  const anyLeft = folder => { const it = folder.getFiles(); while (it.hasNext()) if (!it.next().isTrashed()) return true; return false; };
  if (!anyLeft(f.processed) && !anyLeft(f.raw)){
    ss.getSheets().filter(s => s.getName() !== ID_SHEET && s.getName().indexOf('Sheet') !== 0).forEach(s => ss.deleteSheet(s));
  }
  Logger.log('trashed ' + n + ' test files' + (realLeft ? '' : '; group blocks reset'));
}

/* Wipe single students, e.g. an ID used for testing: write "clear" in the
   note column of student_ids, then run clearMarkedStudents (from the
   editor). Their upload files go to the Drive trash, their rows leave every
   data tab, their group assignment is dropped (the ID starts fresh), and
   the note becomes "cleared <date>". If no real student is left, the 50/50
   blocks restart from zero. */
function clearMarkedStudents(){
  const ss = book(), sh = ss.getSheetByName(ID_SHEET), f = folders();
  const props = PropertiesService.getScriptProperties();
  if (!sh || sh.getLastRow() < 2) return;
  const marked = {};
  sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().forEach((r, i) => {
    if (String(r[5]).trim().toLowerCase() === 'clear') marked[normId(r[1])] = i + 2;
  });
  if (!Object.keys(marked).length){ Logger.log('no row has "clear" in the note column'); return; }
  let files = 0, rows = 0;
  [f.raw, f.processed].forEach(folder => {
    const it = folder.getFiles();
    while (it.hasNext()){
      const file = it.next(), pid = file.getName().replace(/^TEST__/, '').split('__')[0];
      if (!file.isTrashed() && pid in marked){ file.setTrashed(true); files++; }
    }
  });
  ss.getSheets().forEach(s => {
    if (s.getName() === ID_SHEET || s.getLastRow() < 2) return;
    const col = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].indexOf('pid');
    if (col < 0) return;
    const pids = s.getRange(2, col + 1, s.getLastRow() - 1, 1).getValues();
    for (let i = pids.length - 1; i >= 0; i--){
      if (normId(pids[i][0]) in marked){ s.deleteRow(i + 2); rows++; }
    }
  });
  const today = new Date().toISOString().slice(0, 10);
  Object.keys(marked).forEach(id => { props.deleteProperty('pid_' + id); sh.getRange(marked[id], 6).setValue('cleared ' + today); });
  const realLeft = Object.keys(props.getProperties()).some(k => k.indexOf('pid_') === 0 && isRealId(k.slice(4)));
  if (!realLeft) Object.keys(GROUPS).forEach(g => props.deleteProperty('block_' + g));
  Logger.log('cleared ' + Object.keys(marked).join(', ') + ': ' + files + ' files to trash, ' + rows + ' rows removed' + (realLeft ? '' : '; group blocks reset'));
}

/* Let a student continue on a different device (e.g. their computer broke):
   write "unlock" in the note column of student_ids, then run
   unlockMarkedStudents. Their data and group stay; the next device that
   uses the ID takes it over. The note becomes "unlocked <date>". */
function unlockMarkedStudents(){
  const sh = book().getSheetByName(ID_SHEET), props = PropertiesService.getScriptProperties();
  if (!sh || sh.getLastRow() < 2) return;
  const today = new Date().toISOString().slice(0, 10), done = [];
  sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().forEach((r, i) => {
    if (String(r[5]).trim().toLowerCase() !== 'unlock') return;
    const id = normId(r[1]), raw = props.getProperty('pid_' + id);
    if (raw){ const k = JSON.parse(raw); k.token = ''; props.setProperty('pid_' + id, JSON.stringify(k)); }
    sh.getRange(i + 2, 6).setValue('unlocked ' + today);
    done.push(id);
  });
  Logger.log(done.length ? 'unlocked ' + done.join(', ') : 'no row has "unlock" in the note column');
}

function folders(){
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('data_folder');
  let root = null;
  if (id){ try { root = DriveApp.getFolderById(id); } catch (err) { root = null; } }
  if (!root){
    root = DriveApp.createFolder(DATA_FOLDER_NAME);
    props.setProperty('data_folder', root.getId());
  }
  const sub = name => { const it = root.getFoldersByName(name); return it.hasNext() ? it.next() : root.createFolder(name); };
  return { root: root, raw: sub('raw'), processed: sub('processed') };
}

function appendRows(ss, name, rows){
  let sheet = ss.getSheetByName(name);
  if (!sheet){ sheet = ss.insertSheet(name); sheet.setFrozenRows(1); }

  let header = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String)
    : [];
  const extra = [];
  rows.forEach(r => Object.keys(r).forEach(k => {
    if (header.indexOf(k) < 0 && extra.indexOf(k) < 0) extra.push(k);
  }));
  if (extra.length){
    header = header.concat(extra);
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
  const values = rows.map(r => header.map(k => {
    const v = r[k];
    if (v === undefined || v === null) return '';
    const s = (typeof v === 'object') ? JSON.stringify(v) : v;
    return (typeof s === 'string' && s.length > 49000) ? s.slice(0, 49000) + '…[cut: see raw file]' : s;
  }));
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, header.length).setValues(values);
}

function sanitizeName(s){ return String(s).replace(/[\[\]\*\?\/\\:]/g, '_').slice(0, 90); }

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
