/* Kika Kush — store routing, live hours, age gate actions, nav, tabs, reveal.
   No dependencies. Everything degrades: order links are real <a href>s,
   hours exist as static text, the gate fails closed without JS.
   All localStorage access is guarded — storage that throws (Safari
   "Block all cookies", private/embedded contexts) must never take the
   gate buttons down with it. */
(function () {
  'use strict';

  function storeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function storeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* session-only */ }
  }

  /* ---------- store routing ---------- */
  var STORES = {
    'rec':        'https://kikakush-rec.wm.store',
    'circle-med': 'https://kikakush.wm.store',
    'nevada-med': 'https://nevada-medical.wm.store'
  };
  var TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  function validStore(key) {
    return Object.prototype.hasOwnProperty.call(STORES, key);
  }
  function getStore() {
    var s = storeGet('kk_store');
    return validStore(s) ? s : 'rec';
  }
  function applyStore() {
    var store = getStore();
    document.querySelectorAll('[data-order]').forEach(function (a) {
      var fixed = a.getAttribute('data-store');
      a.href = STORES[validStore(fixed) ? fixed : store];
    });
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-store]');
    if (el && validStore(el.getAttribute('data-store'))) {
      storeSet('kk_store', el.getAttribute('data-store'));
      applyStore();
    }
  });
  applyStore();

  /* ---------- live hours (America/Denver) ---------- */
  // rec: 10:00-21:00, last call 20:45 · med: 10:00-19:00
  var LANES = {
    rec: { open: 600, close: 1260, lastCall: 1245, closeLabel: '9pm', openLabel: '10am' },
    med: { open: 600, close: 1140, lastCall: null, closeLabel: '7pm', openLabel: '10am' }
  };
  function denverMinutes() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    var h = 0, m = 0;
    parts.forEach(function (p) {
      if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
      if (p.type === 'minute') m = parseInt(p.value, 10);
    });
    return h * 60 + m;
  }
  function renderHours() {
    var now = denverMinutes();
    document.querySelectorAll('[data-hours]').forEach(function (el) {
      var lane = LANES[el.getAttribute('data-hours')];
      if (!lane) return;
      el.classList.remove('open', 'lastcall', 'closed');
      if (now >= lane.open && now < lane.close) {
        if (lane.lastCall && now >= lane.lastCall) {
          el.classList.add('lastcall');
          el.textContent = 'Last call — closes ' + lane.closeLabel;
        } else {
          el.classList.add('open');
          el.textContent = 'Open now — closes ' + lane.closeLabel;
        }
      } else {
        el.classList.add('closed');
        el.textContent = 'Closed — opens ' + lane.openLabel;
      }
    });
  }
  renderHours();
  setInterval(renderHours, 60000);

  /* ---------- age gate ---------- */
  var gate = document.getElementById('gate');
  var BEHIND = ['header', 'main', 'footer', '.bottombar'];

  function setInert(on) {
    BEHIND.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (on) el.setAttribute('inert', '');
        else el.removeAttribute('inert');
      });
    });
  }
  function unlock() {
    // unlock the page FIRST — persistence is best-effort
    document.documentElement.classList.remove('gated');
    if (gate) gate.hidden = true;
    setInert(false);
    storeSet('kk_age', JSON.stringify({ ok: true, exp: Date.now() + TTL }));
  }
  if (gate && !gate.hidden) {
    // gate.js may have already dismissed for a returning visitor
    setInert(true);
    var yes = document.getElementById('gate-yes');
    var med = document.getElementById('gate-med');
    var under = document.getElementById('gate-under');
    if (yes) { yes.addEventListener('click', unlock); yes.focus(); }
    if (med) med.addEventListener('click', function () {
      unlock();
      if (!location.pathname.startsWith('/kika-kush-preview/order')) location.href = '/kika-kush-preview/order/#medical';
    });
    if (under) under.addEventListener('click', function () {
      var card = gate.querySelector('.gate-card');
      if (card) {
        card.innerHTML =
          '<img src="/kika-kush-preview/img/leaf-300.webp" alt="" width="120" height="125" style="width:96px">' +
          '<p class="gate-title">Come back when you’re 21</p>' +
          '<p>We take the rules seriously so we can keep doing what we love. ' +
          'See you in a few trips around the sun.</p>' +
          '<span class="mono">21+ &middot; 18+ WITH A VALID CO MEDICAL CARD</span>';
        card.setAttribute('tabindex', '-1');
        card.focus();
      }
    });
  }

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- tabs (APG keyboard pattern) ---------- */
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.tab-btn'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.tabIndex = active ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- videos respect reduced motion ---------- */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.removeAttribute('autoplay');
      v.pause();
    });
  }

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
