/* Click-through prototype navigation. Added 2026-08-27.
   ⛔ Loaded ONLY by the published lanes (publish.py injects it), never by a screen source, so it
   cannot move a render or a posted image.

   Two jobs, and the second one is why silent dead ends cannot come back:

     1. BACK ARROWS work. A back arrow has no single target - it depends on where you came from -
        so drawing an href on it would be a lie on every other route in. history.back() is the
        real behaviour.
     2. Anything that LOOKS clickable and is not a link gets marked, at runtime, the same way a
        hand-written `class="todo"` is. Before this, ~500 affordances across the two lanes were
        silently dead: a reviewer clicked and nothing happened, with no way to tell "not drawn
        yet" from "broken". Marking is done here rather than in 100 source files so a screen
        drawn tomorrow is covered without anyone remembering a rule.
*/
(function () {
  var AFFORDANCE = [
    '.setrow', '.srow', '.srow2', '.pact', '.cta', '.btn', '.btnpeach', '.act', '.lrow',
    '.plrow', '.prow2', '.gcard', '.icard', '.pcard', '.pcell', '.tile', '.task', '.fix',
    '.qitem', '.bell', '.chip', '.chipw', '.searchpill', '.field', '.krow', '.more', '.res',
    '.rank', '.vert', '.way', '.statlink', '.a'
  ].join(',');

  function isLink(el) {
    return el.closest('a[href]') !== null;
  }

  function marked(el) {
    var c = el.classList;
    // `on` = the current tab or the selected item, `off` = a control the design disables,
    // `todo` = already marked by hand. None of the three is a dead end.
    return c.contains('on') || c.contains('off') || c.contains('todo') || c.contains('dead');
  }

  // 1. back arrows
  document.querySelectorAll('.back, .appbar .ico, .lbar .ico').forEach(function (el) {
    if (isLink(el) || el.classList.contains('todo')) return;
    if ((el.textContent || '').indexOf('←') === -1) return;
    el.style.cursor = 'pointer';
    el.addEventListener('click', function () { history.back(); });
  });

  // 2. everything else that looks clickable and is not
  document.querySelectorAll(AFFORDANCE).forEach(function (el) {
    if (isLink(el) || marked(el)) return;
    if (el.querySelector('a[href]')) return;   // a container whose child is the real link
    el.classList.add('dead');
    if (!el.title) el.title = 'Not in the prototype yet';
  });
})();
