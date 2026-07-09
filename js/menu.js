/* Kika Kush interactive menu — vibe finder + category filter.
   Progressive enhancement over static <details> cards: with no JS the page
   is a plain browsable category list. */
(function () {
  'use strict';

  var grid = document.getElementById('menu-grid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.menu-card'));
  var vibeBtns = Array.prototype.slice.call(document.querySelectorAll('#vibe-row .chip'));
  var catBtns = Array.prototype.slice.call(document.querySelectorAll('#cat-row .chip'));
  var hint = document.getElementById('vibe-hint');
  var count = document.getElementById('menu-count');

  var HINTS = {
    chill: 'CHILL → INDICA-LEANING FLOWER, PRE-ROLLS, LOW-DOSE EDIBLES',
    social: 'SOCIAL → PRE-ROLL PACKS, SATIVA-LEANING FLOWER, LOW-DOSE GUMMIES',
    create: 'CREATIVE → SATIVA-LEANING FLOWER, ROSIN, ASK ABOUT TERPENES',
    winddown: 'WIND DOWN → EDIBLES, TINCTURES, TOPICALS, MELLOW FLOWER',
    explore: 'EXPLORING → START AT STONER 101, THEN LET A BUDTENDER STEER'
  };

  var vibe = null;
  var cat = 'all';

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var cardCat = card.getAttribute('data-cat');
      var cardVibes = (card.getAttribute('data-vibes') || '').split(' ');
      var catOk = cat === 'all' || cardCat === cat;
      var vibeOk = !vibe || cardVibes.indexOf(vibe) !== -1;
      var visible = catOk && vibeOk;
      card.classList.toggle('dim', !visible);
      card.classList.toggle('match', visible && !!vibe);
      if (visible) shown++;
      card.querySelectorAll('.menu-tag').forEach(function (tag) {
        tag.classList.toggle('hit', vibe && tag.getAttribute('data-tag') === vibe);
      });
    });
    if (hint) hint.textContent = vibe ? HINTS[vibe] : '';
    if (count) {
      count.textContent = 'SHOWING ' + shown + ' OF ' + cards.length +
        (vibe || cat !== 'all' ? ' — TAP A CHIP AGAIN TO CLEAR' : '');
    }
  }

  vibeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-vibe');
      vibe = (vibe === v) ? null : v;
      vibeBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn && vibe ? 'true' : 'false');
      });
      apply();
    });
  });

  catBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var c = btn.getAttribute('data-cat');
      cat = (cat === c && c !== 'all') ? 'all' : c;
      catBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-cat') === cat ? 'true' : 'false');
      });
      apply();
    });
  });

  // deep link: /menu/?vibe=chill preselects a vibe
  try {
    var want = new URLSearchParams(location.search).get('vibe');
    if (want && HINTS[want]) {
      vibe = want;
      vibeBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-vibe') === want ? 'true' : 'false');
      });
    }
  } catch (e) { /* no deep link */ }

  apply();
})();
