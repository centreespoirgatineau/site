/* Four small things, and nothing the page needs to be readable:
   the mobile menu, a shadow under the header once the page scrolls,
   the YouTube players that only load once someone presses play, and the
   income-limit calculator on /aide-alimentaire. */
(function () {
  'use strict';

  // ---- Mobile menu -----------------------------------------------------------
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu');
  var header = document.querySelector('.site-header');
  var body = document.body;

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.menu-label').textContent = open ? 'Fermer' : 'Menu';
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    // A wider screen shows the full menu: never leave the overlay state behind.
    var mq = window.matchMedia('(min-width: 900px)');
    (mq.addEventListener ? mq.addEventListener('change', onWide) : mq.addListener(onWide));
    function onWide(ev) { if (ev.matches) setMenu(false); }
  }

  // ---- Header shadow once scrolled ---------------------------------------------
  if (header) {
    var scrolled = false;
    function onScroll() {
      var s = window.scrollY > 8;
      if (s !== scrolled) { scrolled = s; header.classList.toggle('is-scrolled', s); }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Reveal on scroll (subtle; off when the visitor prefers reduced motion) --
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealers = document.querySelectorAll('.reveal');
  if (revealers.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealers.forEach(function (el) { io.observe(el); });
  } else {
    revealers.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---- YouTube: thumbnail first, player on demand -------------------------------
  // Nothing from YouTube is loaded until the visitor presses play, which keeps
  // the page fast and keeps YouTube's cookies out of a visit that never watches.
  document.querySelectorAll('.video[data-id]').forEach(function (box) {
    var btn = box.querySelector('.video-play');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var id = box.getAttribute('data-id');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&hl=fr';
      iframe.title = box.getAttribute('data-title') || 'Vidéo';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      box.classList.add('is-playing');
      box.appendChild(iframe);
      iframe.focus();
    });
  });

  // ---- Income-limit calculator (/aide-alimentaire): adults and children → the limit ----
  document.querySelectorAll('[data-calc]').forEach(function (box) {
    var matrix = JSON.parse(box.getAttribute('data-calc'));
    var adults = box.querySelector('[data-calc-adults]');
    var children = box.querySelector('[data-calc-children]');
    var out = box.querySelector('[data-calc-out]');
    function show() {
      var v = matrix[adults.value] && matrix[adults.value][children.value];
      if (v) out.textContent = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' $';
    }
    adults.addEventListener('change', show);
    children.addEventListener('change', show);
  });
})();
