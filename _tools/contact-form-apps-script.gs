/**
 * davidcglass.me contact form -> Google Sheet + Gmail notification
 * Setup: Google Sheet > Extensions > Apps Script > paste this file > set NOTIFY_EMAIL >
 * Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone > copy the /exec URL.
 */
const NOTIFY_EMAIL = 'you@example.com';   // where new messages are sent
const SHEET_NAME   = 'Submissions';

function doPost(e) {
  const p = (e && e.parameter) || {};
  // Bots fill the hidden "website" field; humans never see it.
  if (p.website) return json({ ok: true });

  const clean = (v, max) => String(v || '').trim().slice(0, max);
  const name    = clean(p.name, 120);
  const email   = clean(p.email, 200);
  const company = clean(p.company, 160);
  const topic   = clean(p.topic, 80) || 'General';
  const message = clean(p.message, 5000);

  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) {
    return json({ ok: false, error: 'invalid' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Received', 'Name', 'Email', 'Company', 'Topic', 'Message']);
  sheet.appendRow([new Date(), name, email, company, topic, message]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject: 'davidcglass.me: ' + topic + ' from ' + name,
    body: 'Name: ' + name + '\nEmail: ' + email + '\nCompany: ' + (company || '-') +
          '\nTopic: ' + topic + '\n\n' + message
  });
  return json({ ok: true });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
