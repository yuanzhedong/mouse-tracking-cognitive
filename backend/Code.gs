/* Google Apps Script receiver for the Self-Control task battery.
   Deploy as a Web App (see SETUP.md). Each POST carries
     { pid, session_id, step, tables: { <sheetName>: [ {col: value, ...}, ... ] } }
   and every table is appended to the Google Sheet tab of the same name
   (created on first use). Column headers are the union of the keys seen so
   far, so adding a field client-side never breaks the sheet. */

const SPREADSHEET_ID = '';   // leave empty when the script is bound to the sheet

function doPost(e){
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);   // burst → fail fast → client retries with backoff
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID)
                              : SpreadsheetApp.getActiveSpreadsheet();
    const serverTs = new Date().toISOString();
    let n = 0;
    for (const name in (body.tables || {})){
      const rows = body.tables[name];
      if (!rows || !rows.length) continue;
      appendRows(ss, sanitizeName(name), rows.map(r => Object.assign({ server_ts: serverTs }, r)));
      n += rows.length;
    }
    return json({ ok: true, rows: n });
  } catch (err){
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(){
  return ContentService.createTextOutput('self-control battery endpoint: OK')
    .setMimeType(ContentService.MimeType.TEXT);
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
    return (typeof v === 'object') ? JSON.stringify(v) : v;
  }));
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, header.length).setValues(values);
}

function sanitizeName(s){ return String(s).replace(/[\[\]\*\?\/\\:]/g, '_').slice(0, 90); }

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
