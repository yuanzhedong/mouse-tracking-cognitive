/* Session — participant identity, language, pilot group assignment, data
   persistence/upload, and navigation through CONFIG.FLOW.

   Requires shared/config.js and shared/i18n.js to be loaded first.

   Data model: every page calls Session.save({ sheetName: [row, ...] }).
   Rows are flat objects; pid / lang / groups / timestamps are added
   automatically. Each save is (a) appended to localStorage as a fallback
   and (b) POSTed as JSON to CONFIG.ENDPOINT (Google Apps Script → one
   Google Sheet tab per sheetName; see backend/SETUP.md).

   URL parameters:
     ?pid=S001      participant code (persisted; required for the session flow)
     ?lang=pt|en    participant language (default CONFIG.DEFAULT_LANG; chosen
                    with the EN / PT switch on the entry page)
     ?mt=A|B        force the mouse-tracking prompt version (A = choose now,
                    B = helps on the test)
     ?hz=weeks|months   force the 150-problem allocation horizon group
     ?review=1      show researcher views (trajectory plots, metrics)
   A task page opened WITHOUT a pid runs standalone (demo/researcher mode). */

const Session = (() => {
  const script = document.currentScript;
  const ROOT = script ? script.src.replace(/shared\/session\.js(\?.*)?$/, '') : './';
  const qs = new URLSearchParams(location.search);

  const lsGet = k => { try { return localStorage.getItem('sc_' + k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem('sc_' + k, v); } catch (e) {} };
  const lsDel = k => { try { localStorage.removeItem('sc_' + k); } catch (e) {} };

  /* ---------- identity ---------- */
  const pid = (qs.get('pid') || '').trim();
  const standalone = !pid;
  const review = qs.get('review') === '1' || standalone;

  /* Language comes from the URL only (carried page to page by urlFor), so a
     previous student's choice on a shared machine never carries over: a
     plain link always opens in CONFIG.DEFAULT_LANG. */
  let lang = qs.get('lang') || CONFIG.DEFAULT_LANG;
  if (!STRINGS[lang]) lang = CONFIG.DEFAULT_LANG;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

  /* Pilot groups — fixed per participant code: the URL value wins (it is
     carried on every page), else the value stored for this code in this
     browser, else a new draw. So a refresh or a restart from the entry page
     never re-randomizes. The entry page first asks the server
     (fetchGroups), which hands out A/B and weeks/months in shuffled blocks
     of 4, so the groups come out exactly 50/50; the local coin flip below
     is only the fallback when there is no server.
       mt: mouse-tracking prompt version, 0 → 'A' (choose now), 1 → 'B' (helps on the test)
       hz: allocation horizon,            0 → 'weeks' (1 / 2 weeks), 1 → 'months' (1 / 2 months) */
  const GROUPS = { mt: ['A', 'B'], hz: ['weeks', 'months'] };
  const LEGACY_MT = { immediate: 'A', goal: 'B' };            // old ?cond= links
  function assignGroups(code, params = qs){
    const out = {};
    for (const [g, vals] of Object.entries(GROUPS)){
      let v = params.get(g);
      if (g === 'mt' && !vals.includes(v)) v = LEGACY_MT[params.get('cond')];
      const k = 'grp_' + g + '_' + code;
      if (!vals.includes(v)) v = code ? lsGet(k) : null;
      if (!vals.includes(v)) v = code ? vals[Math.random() < 0.5 ? 0 : 1] : vals[0];   // standalone demo → A / weeks
      if (code) lsSet(k, v);
      out[g] = v;
    }
    return out;
  }
  /* Student IDs are integers (1000, 1001, …; the server's student_ids tab
     says which exist). Codes starting with TEST are for trying the site;
     the server keeps their data apart. */
  const isTestId = code => /^TEST/.test(code);
  const idValid = code => isTestId(code) || /^\d{3,6}$/.test(code);

  /* Ask the server for this code's groups (same answer every time for the
     same code); stored so assignGroups() picks them up. Resolves to the
     groups, or { unknown: true } if the server says the code isn't on the
     student list, or { used: true } if the ID is already tied to another
     browser; falls back to assignGroups() if the server can't be reached.
     The token is a random string kept in this browser per ID — the server
     ties the ID to the first token it sees. */
  async function fetchGroups(code){
    if (CONFIG.ENDPOINT && code && !GROUPS.mt.includes(lsGet('grp_mt_' + code))){
      try {
        let token = lsGet('tok_' + code);
        if (!token){ token = Math.random().toString(36).slice(2) + Date.now().toString(36); lsSet('tok_' + code, token); }
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 8000);
        const res = await fetch(CONFIG.ENDPOINT + '?action=assign&pid=' + encodeURIComponent(code) + '&token=' + token, { signal: ctl.signal });
        clearTimeout(timer);
        const j = await res.json();
        if (j.ok === false && j.error === 'unknown_code') return { unknown: true };
        if (j.ok === false && j.error === 'used') return { used: true };
        if (GROUPS.mt.includes(j.mt) && GROUPS.hz.includes(j.hz)){
          lsSet('grp_mt_' + code, j.mt); lsSet('grp_hz_' + code, j.hz); lsSet('grp_src_' + code, 'server');
        }
      } catch (e) { console.warn('group assignment: server unreachable, using a local coin flip', e.message); }
    }
    if (code && !lsGet('grp_src_' + code)) lsSet('grp_src_' + code, 'local');
    return assignGroups(code, new URLSearchParams());
  }
  const { mt, hz } = assignGroups(pid);
  const groupCols = { mt_version: mt, mt_rand: GROUPS.mt.indexOf(mt), horizon_group: hz, hz_rand: GROUPS.hz.indexOf(hz),
                      group_source: (pid && lsGet('grp_src_' + pid)) || (qs.get('mt') ? 'url' : '') };

  const sessionId = (() => {
    if (standalone) return 'demo';
    const k = 'sid_' + pid;
    let v = lsGet(k);
    if (!v){ v = pid + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); lsSet(k, v); }
    return v;
  })();

  /* ---------- i18n ---------- */
  function t(key, vars){
    let s = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v);
    return s;
  }
  function pick(obj){ return obj?.[lang] ?? obj?.en ?? ''; }   // {en, pt} → string
  function applyI18n(root = document){
    root.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
    root.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
  }

  /* ---------- persistence ---------- */
  const storeKey = 'store_' + (standalone ? 'demo' : pid);
  function readStore(){ try { return JSON.parse(lsGet(storeKey) || '{}'); } catch (e) { return {}; } }
  function writeStore(s){ lsSet(storeKey, JSON.stringify(s)); }

  function stamp(row, step){
    return {
      pid: standalone ? 'demo' : pid,
      session_id: sessionId,
      step,
      lang,
      ...groupCols,
      client_ts: new Date().toISOString(),
      ...row,
    };
  }

  /* Upload with retry. A text/plain body avoids a CORS preflight; Apps
     Script answers (after a redirect) with Access-Control-Allow-Origin: *,
     so the JSON reply is readable and failures (quota bursts, network)
     are detected and retried with backoff. Anything still failing is
     queued in localStorage and retried on later page loads. */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function postOnce(payload){
    const res = await fetch(CONFIG.ENDPOINT, {
      method: 'POST', mode: 'cors', keepalive: true, redirect: 'follow',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json().catch(() => ({ ok: true }));
    if (j && j.ok === false) throw new Error(j.error || 'server error');
    return true;
  }
  async function upload(payload, attempts = 4){
    if (!CONFIG.ENDPOINT) return false;
    for (let i = 0; i < attempts; i++){
      try { return await postOnce(payload); }
      catch (e) {
        console.warn(`upload attempt ${i + 1} failed`, e.message);
        if (i < attempts - 1) await sleep(800 * 2 ** i + Math.random() * 600);   // 0.8–1.4 s, 1.6–2.2 s, 3.2–3.8 s
      }
    }
    return false;
  }

  /* Every payload goes into the localStorage queue BEFORE it is sent and
     leaves it only once the server confirms, so closing the tab mid-upload
     loses nothing: the next page load sends it. (A payload can then arrive
     twice; rows carry save_id, and the sheet builder drops duplicates.) */
  function readPending(){ try { return JSON.parse(lsGet('pending') || '[]'); } catch (e) { return []; } }
  function enqueue(payload){ const q = readPending(); q.push(payload); lsSet('pending', JSON.stringify(q)); }
  function dequeue(saveId){ lsSet('pending', JSON.stringify(readPending().filter(p => p.save_id !== saveId))); }
  const inFlight = new Set();
  async function send(payload, attempts){
    inFlight.add(payload.save_id);
    const ok = await upload(payload, attempts);
    inFlight.delete(payload.save_id);
    if (ok) dequeue(payload.save_id);
    return ok;
  }
  let flushing = false;
  async function flushPending(){
    if (flushing || !CONFIG.ENDPOINT) return;
    flushing = true;
    for (const p of readPending()){ if (!inFlight.has(p.save_id)) await send(p, 2); }
    flushing = false;
  }

  /* Milestone logs are buffered and ride along with the next save(), so a
     session makes ~8 requests instead of ~20. Pass flush=true to send now. */
  const logKey = 'logbuf_' + (standalone ? 'demo' : pid);
  const readLogBuf = () => { try { return JSON.parse(lsGet(logKey) || '[]'); } catch (e) { return []; } };
  function log(event, detail = {}, flush = false){
    const buf = readLogBuf();
    buf.push({ event, ...detail, log_ts: new Date().toISOString() });
    lsSet(logKey, JSON.stringify(buf));          // survives the page navigation
    return flush ? save({}) : Promise.resolve();
  }

  /* save({ sheet: [rows] }, step) — returns a promise; callers may await it
     before navigating, but never block the participant on failure. */
  async function save(tables, step){
    step = step || currentStep();
    const buf = readLogBuf();
    if (buf.length){ tables = { ...tables, session_log: [...(tables.session_log || []), ...buf] }; lsDel(logKey); }
    const saveId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const stamped = {};
    for (const [sheet, rows] of Object.entries(tables)){
      if (rows.length) stamped[sheet] = rows.map(r => ({ ...stamp(r, step), save_id: saveId }));
    }
    if (!Object.keys(stamped).length) return;
    const store = readStore();
    for (const [sheet, rows] of Object.entries(stamped)){
      (store[sheet] ||= []).push(...rows);
    }
    writeStore(store);
    const payload = { pid: standalone ? 'demo' : pid, session_id: sessionId, step, save_id: saveId, tables: stamped };
    if (!CONFIG.ENDPOINT) return;
    enqueue(payload);
    // Wait at most 4 s: if the server is slow the payload stays queued and
    // keeps retrying in the background (and on the next page), so a student
    // never sits on "Saving…" for long.
    await Promise.race([send(payload), sleep(4000)]);
  }

  /* One row per task in `task_status`: 'not_completed' when the task
     starts, 'completed' when it ends — a task whose last row is still
     not_completed was abandoned. */
  function status(task, completionStatus, extra = {}){
    return save({ task_status: [{ task, completion_status: completionStatus, ...extra }] }, task);
  }

  /* ---------- navigation ---------- */
  function currentStep(){
    const p = location.pathname;
    if (/\/done\.html$/.test(p)) return 'done';
    const m = p.match(/\/(survey|ratings|daily_reset|task1|allocation|task2)\/?(index\.html)?$/);
    return m ? m[1] : 'entry';
  }
  function urlFor(step, extra = {}){
    const params = new URLSearchParams(qs);
    if (pid) params.set('pid', pid);
    params.set('lang', lang);
    params.set('mt', mt); params.set('hz', hz);
    params.delete('cond');
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    const page = step === 'entry' ? 'index.html' : step === 'done' ? 'done.html' : step + '/';
    return ROOT + page + '?' + params.toString();
  }
  function go(step, extra){ location.href = urlFor(step, extra); }
  /* Same page in the other language (the EN / PT switch). */
  function langUrl(l){ const p = new URLSearchParams(location.search); p.set('lang', l); return location.pathname + '?' + p.toString(); }
  function next(fromStep){
    fromStep = fromStep || currentStep();
    if (!standalone) lsSet('done_' + pid, fromStep);
    const i = CONFIG.FLOW.indexOf(fromStep);
    const nxt = i < 0 ? CONFIG.FLOW[0] : CONFIG.FLOW[i + 1];
    if (nxt) go(nxt);
  }
  function lastCompleted(){ return pid ? lsGet('done_' + pid) : null; }
  function resumeStep(){
    const last = lastCompleted();
    const i = CONFIG.FLOW.indexOf(last);
    return i < 0 ? CONFIG.FLOW[0] : (CONFIG.FLOW[i + 1] || null);
  }

  /* ---------- CSV export (fallback / researcher) ---------- */
  function csvOf(rows){
    const cols = [];
    rows.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
    const q = v => { v = v === null || v === undefined ? '' : String(v); return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
    return [cols.join(',')].concat(rows.map(r => cols.map(c => q(r[c])).join(','))).join('\n');
  }
  function download(name, text){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }
  function exportSheet(sheet){
    const rows = readStore()[sheet] || [];
    if (rows.length) download(`${sheet}_${standalone ? 'demo' : pid}.csv`, csvOf(rows));
  }
  function sheets(){ return Object.keys(readStore()); }
  function clearStore(){ lsDel(storeKey); if (pid) lsDel('done_' + pid); }

  flushPending();
  setInterval(flushPending, 45000);
  window.addEventListener('online', flushPending);

  return { ROOT, pid, standalone, review, lang, mt, hz, groupCols, assignGroups, fetchGroups, idValid, isTestId, sessionId,
           t, pick, applyI18n, save, status, log, next, go, urlFor, langUrl, currentStep,
           lastCompleted, resumeStep, exportSheet, sheets, clearStore,
           csvOf, download, readStore };
})();
