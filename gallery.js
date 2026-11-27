(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.g-item'));
  // Filters
  document.querySelectorAll('.filters button').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      document.querySelectorAll('.filters button').forEach(function (x) {
        var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on);
      });
      items.forEach(function (it) { it.hidden = !(f === 'all' || it.getAttribute('data-cat') === f); });
    });
  });
  // Lightbox
  var lb = document.getElementById('lightbox'), img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  var list = [], idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + list.length) % list.length;
    var a = list[idx].querySelector('a');
    img.src = a.getAttribute('href'); img.alt = a.getAttribute('data-caption') || '';
    cap.textContent = a.getAttribute('data-caption') || '';
  }
  function open(it) {
    list = items.filter(function (x) { return !x.hidden; });
    lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden';
    show(list.indexOf(it)); lb.querySelector('.lb-close').focus();
  }
  function close() { lb.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  items.forEach(function (it) {
    it.querySelector('a').addEventListener('click', function (e) { e.preventDefault(); open(it); });
  });
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
  });
})();
