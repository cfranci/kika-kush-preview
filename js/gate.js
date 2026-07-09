/* Runs immediately (not deferred) right after the #gate markup so returning
   visitors never see a flash. The gate ships visible in the HTML and only JS
   dismisses it — if JS never loads, the gate stays closed (fail-closed). */
(function () {
  // signals "JS is alive" — scroll-reveal styles only apply under html.js
  document.documentElement.classList.add('js');
  try {
    var s = JSON.parse(localStorage.getItem('kk_age') || 'null');
    if (s && s.ok && Date.now() < s.exp) {
      document.documentElement.classList.remove('gated');
      var g = document.getElementById('gate');
      if (g) g.hidden = true;
    }
  } catch (e) { /* gate stays up */ }
})();
