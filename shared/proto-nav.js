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

  // 2. back arrows
  document.querySelectorAll('.back, .appbar .ico, .lbar .ico').forEach(function (el) {
    if (el.closest('a[href]') || el.hasAttribute('data-href')) return;
    if (el.classList.contains('todo')) return;
    if ((el.textContent || '').indexOf('←') === -1) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () { history.back(); });
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
