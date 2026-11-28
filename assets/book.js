/* "Book a meeting" pop-up: opens David's Google Calendar booking page in an overlay.
   Any link pointing at the booking page gets this behavior; without JavaScript the
   link still opens the booking page in a new tab. */
(function () {
  var BOOKING_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ37yHjQVZm6MskVN1oxWJ5WVDE3Xfcg4UtC3cCjw6FSAfmXAC5f7WMBRCLaLPpiTFqYE5bsKwr3?gv=true';
  var links = document.querySelectorAll('a[href*="calendar.app.google"], a[href*="calendar.google.com/calendar/appointments"], a[data-book]');
  if (!links.length) return;

  var css = document.createElement('style');
  css.textContent =
    '.book-modal{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(8,8,9,.85);padding:24px}' +
    '.book-modal[hidden]{display:none}' +
    '.book-panel{position:relative;width:min(1000px,100%);height:min(760px,100%);background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
    '.book-panel iframe{width:100%;height:100%;border:0;display:block}' +
    '.book-close{position:absolute;top:8px;right:8px;width:40px;height:40px;border:0;border-radius:50%;background:#1a1a1b;color:#fff;font-size:24px;line-height:40px;cursor:pointer;z-index:1}' +
    '.book-close:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '@media (max-width:700px){.book-modal{padding:0}.book-panel{width:100%;height:100%;border-radius:0}}';
  document.head.appendChild(css);

  var modal = document.createElement('div');
  modal.className = 'book-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Book a meeting with David');
  modal.innerHTML = '<div class="book-panel"><button class="book-close" type="button" aria-label="Close">&times;</button></div>';
  document.body.appendChild(modal);
  var panel = modal.querySelector('.book-panel');
  var closeBtn = modal.querySelector('.book-close');
  var lastFocus = null;

  function open(e) {
    e.preventDefault();
    lastFocus = document.activeElement;
    if (!panel.querySelector('iframe')) {           // load the calendar on first open only
      var f = document.createElement('iframe');
      f.src = BOOKING_URL;
      f.title = 'Book a meeting';
      panel.appendChild(f);
    }
    document.body.classList.remove('menu-open');     // close the site menu if it was open
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function close() {
    modal.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  links.forEach(function (a) { a.addEventListener('click', open); });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
})();
