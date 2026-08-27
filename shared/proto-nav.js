/* Click-through prototype navigation. Added 2026-08-27.
   ⛔ Loaded ONLY by the published lanes (publish.py injects it), never by a screen source, so it
   cannot move a render or a posted image.

   Three jobs:

     1. `data-href` navigates. ⛔ The target rides as an ATTRIBUTE rather than the element being
        turned into an `<a>`, because turning a `<div class="tile">` into an anchor makes it
        display:inline: measured with tools/css_equal.py, one product page got 11.5px taller and
        every element below it moved. No stylesheet selects on `data-href`, so wiring a screen
        cannot change what it looks like.
     2. BACK ARROWS work. A back arrow has no single target - it depends on where you came from -
        so an href on it would be a lie on every other route in. history.back() is the real thing.
     3. Anything that still LOOKS clickable and is not wired gets marked, at runtime, the same way
        a hand-written `class="todo"` is. Before this, ~500 affordances across the two lanes were
        silently dead: a reviewer clicked and nothing happened, with no way to tell "not drawn
        yet" from "broken". Marking happens here rather than in 100 source files, so a screen
        drawn tomorrow is covered without anyone remembering a rule.
*/
(function () {
  var AFFORDANCE = [
    '.setrow', '.srow', '.srow2', '.pact', '.cta', '.btn', '.btnpeach', '.act', '.lrow',
    '.plrow', '.prow2', '.gcard', '.icard', '.pcard', '.pcell', '.tile', '.task', '.fix',
    '.qitem', '.bell', '.chip', '.chipw', '.searchpill', '.field', '.krow', '.more', '.res',
    '.rank', '.vert', '.way', '.statlink', '.a'
  ].join(',');

  // 1. anything carrying a target navigates, and looks like it will
  document.querySelectorAll('[data-href]').forEach(function (el) {
    var href = el.getAttribute('data-href');
    el.style.cursor = 'pointer';
    el.addEventListener('click', function (event) {
      event.stopPropagation();          // a card inside a card: the innermost target wins
      if (/^https?:/.test(href)) {
        window.open(href, '_blank', 'noopener');
      } else {
        location.href = href;
      }
    });
  });

  // 2. back arrows: ONE step, to the screen you actually came from, and nowhere else.
  //
  // ⛔ NOT history.back(). A screen runs inside the lane's iframe, and an iframe shares the joint
  //    session history with the page around it, so `back` unwinds entries that are not screens -
  //    it reads as jumping around at random (Urban, 2026-08-27, the first thing he noticed).
  // ⛔ NOT document.referrer either: Chrome sends no referrer for a `file://` navigation, and the
  //    lanes get opened from disk as often as from the published URL, so it is empty exactly when
  //    someone is testing locally.
  // ✅ So the prototype keeps its OWN one-entry-per-screen stack in sessionStorage. Deterministic,
  //    works on file:// and https alike, and going back POPS it, so back-back-back walks the real
  //    trail out instead of ping-ponging between two pages.
  var KEY = 'off-proto-trail';

  function trail(next) {
    try {
      if (next) { sessionStorage.setItem(KEY, JSON.stringify(next.slice(-40))); return next; }
      return JSON.parse(sessionStorage.getItem(KEY)) || [];
    } catch (e) { return []; }   // private mode, or a browser refusing storage on file://
  }

  var seen = trail();
  // After a back the destination is ALREADY the top of the trail, so this does not re-push it -
  // which is what keeps back from turning into a two-page loop.
  if (seen[seen.length - 1] !== location.href) {
    seen.push(location.href);
    trail(seen);
  }

  // the cold-open fallback: this shell's Home. The app home and the web home are two different
  // screens, so the lane is stamped on <html> at publish time rather than guessed.
  function home() {
    var tab = document.querySelector('.tabbar a[href]');
    if (tab) return tab.getAttribute('href');
    return document.documentElement.getAttribute('data-lane') === 'app'
      ? '../03-home/home-app.html'
      : '../03-home/home-web.html';
  }

  document.querySelectorAll('.back, .appbar .ico, .lbar .ico').forEach(function (el) {
    if (el.closest('a[href]') || el.hasAttribute('data-href')) return;
    if (el.classList.contains('todo')) return;
    if ((el.textContent || '').indexOf('←') === -1) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () {
      var s = trail();
      if (s.length > 1) {
        s.pop();
        trail(s);
        location.href = s[s.length - 1];
      } else {
        location.href = home();
      }
    });
  });

  // 3. everything else that looks clickable and is not
  document.querySelectorAll(AFFORDANCE).forEach(function (el) {
    var c = el.classList;
    // `on` = the current tab or the selected item, `off` = a control the design disables,
    // `todo` = already marked by hand. None of the three is a dead end.
    if (c.contains('on') || c.contains('off') || c.contains('todo') || c.contains('dead')) return;
    if (el.hasAttribute('data-href') || el.closest('a[href]')) return;
    if (el.querySelector('a[href], [data-href]')) return;   // its child is the real target
    c.add('dead');
    if (!el.title) el.title = 'Not in the prototype yet';
  });
})();
