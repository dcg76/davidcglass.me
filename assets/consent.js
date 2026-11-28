/* Cookie consent + Google Analytics loader for davidcglass.me
   - EU/UK visitors (by browser time zone): Analytics loads only after "Accept".
   - Everyone else: Analytics loads unless they chose "Decline" via Cookie settings.
   - Any link with data-cookie-settings reopens the notice. */
(function () {
  var ID = 'G-GWG9E7HF43', KEY = 'dcg-consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var needsConsent = /^Europe\//.test(tz) || /^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe)$/.test(tz);
  var loaded = false;

  function loadGA() {
    if (loaded) return; loaded = true;
    window['ga-disable-' + ID] = false;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
  }
  function stopGA() {
    window['ga-disable-' + ID] = true;
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^_ga/.test(n)) ['', '; domain=.davidcglass.me', '; domain=www.davidcglass.me'].forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + d;
      });
    });
  }

  var choice = get();
  if (choice === 'granted' || (!needsConsent && choice !== 'denied')) loadGA();

  var css = '.cookie-bar{position:fixed;left:16px;right:16px;bottom:16px;z-index:30;max-width:760px;margin:0 auto;display:flex;align-items:center;gap:20px;padding:16px 18px 16px 22px;background:#1a1a1b;border:1px solid rgba(255,255,255,.16);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.5);color:rgba(255,255,255,.82);font:300 .92rem/1.55 "Libre Franklin",Helvetica,Arial,sans-serif}' +
    '.cookie-bar[hidden]{display:none}.cookie-bar p{margin:0;max-width:none;color:inherit}.cookie-bar a{color:#fff;text-underline-offset:3px}' +
    '.cookie-bar .cb-actions{display:flex;gap:10px;flex-shrink:0}' +
    '.cookie-bar button{font:700 .78rem "Poppins",sans-serif;letter-spacing:.1em;text-transform:uppercase;border-radius:2px;padding:.7rem 1.1rem;cursor:pointer}' +
    '.cookie-bar .cb-accept{background:#fff;color:#1a1a1b;border:0}.cookie-bar .cb-decline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4)}' +
    '.cookie-bar button:focus-visible,.cookie-bar a:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
    '@media (max-width:700px){.cookie-bar{flex-direction:column;align-items:stretch;gap:14px;left:12px;right:12px;bottom:12px;padding:16px}.cookie-bar .cb-actions button{flex:1}}';
  var bar = null;
  function showBar() {
    if (!bar) {
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      bar = document.createElement('div');
      bar.className = 'cookie-bar'; bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Cookie notice');
      bar.innerHTML = '<p>This site uses cookies from Google Analytics to understand how visitors use it. Nothing is sold or used for ads. <a href="/privacy">Privacy Policy</a></p>' +
        '<div class="cb-actions"><button class="cb-decline" type="button">Decline</button><button class="cb-accept" type="button">Accept</button></div>';
      document.body.appendChild(bar);
      bar.querySelector('.cb-accept').addEventListener('click', function () { set('granted'); bar.hidden = true; loadGA(); });
      bar.querySelector('.cb-decline').addEventListener('click', function () { set('denied'); bar.hidden = true; stopGA(); });
    }
    bar.hidden = false;
    bar.querySelector('.cb-accept').focus();
  }
  function init() {
    if (needsConsent && !choice) showBar();
    document.querySelectorAll('[data-cookie-settings]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); showBar(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
