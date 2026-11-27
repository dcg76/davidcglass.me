const NOTIFY_EMAIL = 'you@example.com';   // ← where you want messages sent
const SHEET_NAME   = 'Submissions';

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json({ ok: true });            // spam bot caught by hidden field

  const clean = (v, max) => String(v || '').trim().slice(0, max);
  const name    = clean(p.name, 120);
  const email   = clean(p.email, 200);
  const company = clean(p.company, 160);
  const topic   = clean(p.topic, 80) || 'General';
  const message = clean(p.message, 5000);

  if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email) || !domainAcceptsMail(email.split('@')[1])) {
    return json({ ok: false, error: 'email' });
  }
  if (!name || message.length < 5) return json({ ok: false, error: 'invalid' });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(['Received','Name','Email','Company','Topic','Message']);
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

// True if the email's domain is set up to receive mail (has MX or A records).
function domainAcceptsMail(domain) {
  try {
    for (const type of ['MX', 'A']) {
      const r = UrlFetchApp.fetch('https://dns.google/resolve?name=' + encodeURIComponent(domain) + '&type=' + type,
                                  { muteHttpExceptions: true });
      const j = JSON.parse(r.getContentText());
      if (j.Status === 0 && j.Answer && j.Answer.length) return true;
    }
    return false;
  } catch (err) {
    return true;   // if the lookup itself fails, don't block a real person
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
