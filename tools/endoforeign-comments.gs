/**
 * Comment notebook for /endoforeign/ — a Google Sheet is the database.
 *
 * Setup (about three minutes):
 *  1. Create a new Google Sheet. Extensions → Apps Script. Paste this file in.
 *  2. Replace TOKEN below with a random string (node tools/endoforeign.mjs token).
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as: Me.   Who has access: Anyone.
 *     Authorize when asked, copy the "Web app" URL.
 *  4. Put the URL and the same token in private/endoforeign/config.json
 *       { "endpoint": "https://script.google.com/macros/s/…/exec", "token": "…" }
 *     and run:  node tools/endoforeign.mjs pack
 *
 * The URL and token live only inside the encrypted vault, so only people who
 * have the password ever learn them. Comments land in the "comments" tab, one row each.
 * Each row holds the page, the quoted passage and the comment. Write in the "reply" column and your answer shows under that note on the site.
 * Delete a row to delete a comment. Editing this script later needs a new
 * deployment version (Deploy → Manage deployments → edit → New version).
 */
var TOKEN = 'REPLACE-WITH-A-RANDOM-STRING';
var HEADERS = ['id', 'ts', 'page', 'version', 'section', 'block', 'name', 'quote', 'comment', 'lang', 'reply'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('comments');
  if (!sh) {
    sh = ss.insertSheet('comments');
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange('1:1').setFontWeight('bold');
    sh.setColumnWidth(8, 360); sh.setColumnWidth(9, 420); sh.setColumnWidth(11, 360);
  }
  return sh;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (!e.parameter || e.parameter.token !== TOKEN) return out_({ error: 'auth' });
  var sh = sheet_(), n = sh.getLastRow() - 1;
  var rows = n > 0 ? sh.getRange(2, 1, n, HEADERS.length).getDisplayValues() : [];
  return out_({
    comments: rows.filter(function (r) { return r[0] && r[2] && r[8]; }).map(function (r) {
      return { id: r[0], ts: r[1], page: r[2], version: r[3], section: r[4], block: r[5], name: r[6], quote: r[7], text: r[8], lang: r[9], reply: r[10] };
    })
  });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: 'bad' }); }
  if (d.token !== TOKEN) return out_({ error: 'auth' });
  var page = String(d.page || ''), version = String(d.version || ''), section = String(d.section || ''), block = String(d.block == null ? '' : d.block);
  var name = String(d.name || '').trim(), text = String(d.text || '').trim(), quote = String(d.quote || '').trim();
  if (!/^[a-z0-9-]+$/.test(page) || !/^[0-9-]*$/.test(version) || !/^[a-z0-9_-]*$/.test(section) || !/^[0-9]*$/.test(block) || !name || !text) return out_({ error: 'invalid' });
  name = name.slice(0, 80); text = text.slice(0, 4000); quote = quote.slice(0, 800);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = sheet_(), row = sh.getLastRow() + 1;
    // plain-text cells, so a comment that starts with "=" can never run as a formula
    sh.getRange(row, 1, 1, HEADERS.length).setNumberFormat('@')
      .setValues([[Utilities.getUuid(), new Date().toISOString(), page, version, section, block, name, quote, text, String(d.lang || '').slice(0, 5), '']]);
  } finally { lock.releaseLock(); }
  return out_({ ok: true });
}
