/* Google Apps Script backend for the Self-Control task battery.
   Deploy as a Web App from the Google account that should own the data
   (see SETUP.md). Three jobs:

   1. doPost — receives each upload from the student pages
        { pid, session_id, step, save_id, tables: { <sheetName>: [ {col: value}, ... ] } }
      and stores it as one JSON file in the "raw" folder on Drive. No lock
      and no spreadsheet write per request, so ~100 students uploading at
      the same time don't queue behind each other.

   2. doGet?action=assign&pid=X — hands out the pilot groups. Each group
      (mt: A/B, hz: weeks/months) is dealt from shuffled blocks of 4
      (2 + 2), so the groups stay 50/50 as students arrive. The same pid
      always gets the same answer.

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
const ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';   // 31 symbols: no 0/O, 1/I/L

/* ---------- student IDs ---------- */

const normId = s => String(s || '').replace(/\s+/g, '').toUpperCase();
const isTestId = id => id.indexOf('TEST') === 0;

/* Last character = check character: weighted sum mod 31 (prime), so any
   single wrong character or swap of two neighbours is caught. Same rule
   as idValid() in shared/session.js. */
function idCheckChar(body){
  let s = 0;
  for (let i = 0; i < body.length; i++) s += (i + 1) * ID_ALPHABET.indexOf(body[i]);
  return ID_ALPHABET[s % ID_ALPHABET.length];
}

/* Run from the editor: appends n new IDs (default 1000) to the student_ids
   tab, numbered on from the last one. */
function generateIds(n){
  n = Number(n) || 1000;
  const ss = book();
  let sh = ss.getSheetByName(ID_SHEET);
  if (!sh){
    sh = ss.insertSheet(ID_SHEET, 0);
    sh.appendRow(['no', 'student_id', 'school', 'class', 'given_to', 'note']);
    sh.setFrozenRows(1);
  }
  const have = {};
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 2, last - 1, 1).getValues().forEach(r => have[r[0]] = true);
  const rows = [];
  let no = last - 1;
  while (rows.length < n){
    let body = '';
    for (let i = 0; i < 5; i++) body += ID_ALPHABET[Math.floor(Math.random() * ID_ALPHABET.length)];
    const id = body + idCheckChar(body);
    if (have[id] || isTestId(id)) continue;
    have[id] = true;
    rows.push([++no, id, '', '', '', '']);
  }
  sh.getRange(last + 1, 1, rows.length, 6).setValues(rows);
  sh.getRange(2, 2, sh.getLastRow() - 1, 1).setFontFamily('Roboto Mono');
  CacheService.getScriptCache().remove('ids');
  Logger.log('added ' + n + ' IDs; total ' + (sh.getLastRow() - 1));
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
  if (p.action === 'assign') return json(assign(normId(p.pid)));
  return ContentService.createTextOutput('self-control battery endpoint: OK')
    .setMimeType(ContentService.MimeType.TEXT);
}

function assign(pid){
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
    if (known) return Object.assign({ ok: true, repeat: true }, JSON.parse(known));
    const out = {};
    for (const g in GROUPS){
      let block = JSON.parse(props.getProperty(blockKey(g)) || '[]');
      if (!block.length) block = shuffle([0, 0, 1, 1]);
      out[g] = GROUPS[g][block.shift()];
      props.setProperty(blockKey(g), JSON.stringify(block));
    }
    out.real = !test;
    out.assigned_at = new Date().toISOString();
    props.setProperty(key, JSON.stringify(out));
    return Object.assign({ ok: true }, out);
  } finally {
    lock.releaseLock();
  }
}

function shuffle(a){
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* Group counts so far (run from the editor; output in the log). */
function groupCounts(){
  const all = PropertiesService.getScriptProperties().getProperties();
  const n = { A: 0, B: 0, weeks: 0, months: 0 };
  Object.keys(all).filter(k => k.indexOf('pid_') === 0).forEach(k => {
    const g = JSON.parse(all[k]); if (g.real === false || isTestId(k.slice(4))) return;
    n[g.mt]++; n[g.hz]++;
  });
  Logger.log(JSON.stringify(n));
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
      if (file.getName().indexOf('TEST__') === 0 || !isRealId(pid)){ file.setTrashed(true); n++; }
    }
  });
  const all = props.getProperties();
  Object.keys(all).filter(k => k.indexOf('pid_') === 0 && !isRealId(k.slice(4))).forEach(k => props.deleteProperty(k));
  const realLeft = Object.keys(props.getProperties()).some(k => k.indexOf('pid_') === 0);
  if (!realLeft) Object.keys(GROUPS).forEach(g => props.deleteProperty('block_' + g));
  // tabs built from pre-ID test uploads: drop data tabs if no real files remain
  if (!f.processed.getFiles().hasNext() && !f.raw.getFiles().hasNext()){
    ss.getSheets().filter(s => s.getName() !== ID_SHEET && s.getName().indexOf('Sheet') !== 0).forEach(s => ss.deleteSheet(s));
  }
  Logger.log('trashed ' + n + ' test files' + (realLeft ? '' : '; group blocks reset'));
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
