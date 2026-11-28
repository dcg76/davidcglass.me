(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-menu');
  function setOpen(open, returnFocus) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) nav.querySelector('a').focus();
    else if (returnFocus) btn.focus();
  }
  btn.addEventListener('click', function () { setOpen(!document.body.classList.contains('menu-open')); });
  nav.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setOpen(false, true);
  });
})();
// Keep the footer copyright year current
document.querySelectorAll('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });
