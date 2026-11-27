const NOTIFY_EMAIL = 'you@example.com';   // ← your email address (where notifications go)
const SHEET_NAME   = 'Submissions';
const MIN_SECONDS_ON_PAGE  = 3;    // faster than this = bot
const MAX_LINKS            = 2;    // more links than this = spam
const MAX_PER_EMAIL_PER_HR = 3;    // per sender
const MAX_PER_DAY          = 30;   // whole form

function doPost(e) {
  const p = (e && e.parameter) || {};

  // 1. Honeypot: hidden field only bots fill in. Pretend success so they don't adapt.
  if (p.website) return json({ ok: true });

  // 2. Time trap: real people take more than a few seconds to fill in the form.
  const elapsed = Number(p.elapsed);
  if (!elapsed || elapsed < MIN_SECONDS_ON_PAGE * 1000) return json({ ok: true });

  const clean = (v, max) => String(v || '').trim().slice(0, max);
  const name    = clean(p.name, 120);
  const email   = clean(p.email, 200);
  const company = clean(p.company, 160);
  const topic   = clean(p.topic, 80) || 'General';
  const message = clean(p.message, 5000);

  // 3. Email must be well formed and its domain able to receive mail.
  if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email) || !domainAcceptsMail(email.split('@')[1])) {
    return json({ ok: false, error: 'email' });
  }
  if (!name || message.length < 5) return json({ ok: false, error: 'invalid' });

  // 4. Link filter: spam is full of links, real inquiries rarely are.
  const links = (message.match(/(https?:\/\/|www\.)/gi) || []).length;
  if (links > MAX_LINKS) return json({ ok: false, error: 'links' });

  // 5. Rate limits: per sender per hour, and for the whole form per day.
  const cache = CacheService.getScriptCache();
  const senderKey = 'sender:' + email.toLowerCase();
  const dayKey = 'day:' + Utilities.formatDate(new Date(), 'America/New_York', 'yyyyMMdd');
  const sent = Number(cache.get(senderKey) || 0);
  const today = Number(cache.get(dayKey) || 0);
  if (sent >= MAX_PER_EMAIL_PER_HR || today >= MAX_PER_DAY) return json({ ok: false, error: 'limit' });
  cache.put(senderKey, String(sent + 1), 3600);       // remembered for 1 hour
  cache.put(dayKey, String(today + 1), 6 * 3600);     // refreshed through the day

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
