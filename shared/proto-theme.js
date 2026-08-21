/* Runtime theme switch for the PUBLISHED prototypes (Urban, 2026-08-21).
   Every token already carries a light value and `mock.css` ships the `[data-theme="light"]`
   block, so flipping polarity is one attribute - no second set of pages, no extra renders.

   Three things it has to get right, and each one is a bug we would otherwise ship:
   1. The lane view is an IFRAME. Setting `data-theme` on the frame alone leaves the screen
      inside it dark, so the attribute is applied to both documents, and re-applied on every
      iframe `load` because a navigation inside the frame resets it.
   2. The default is the VIEWER's system setting (`prefers-color-scheme`), not ours. That is
      the same rule we are recommending OFF adopt on the web, so the prototype demonstrates it.
   3. The choice is remembered per browser (`localStorage`), and storage can throw in a
      private window or when site data is blocked - so every read and write is guarded.

   Never imported by a source screen: a render must not move when the prototype chrome changes
   (same rule as `shared/proto.css`). `tools/publish.py` injects it at publish time. */
(function () {
  'use strict';
  var KEY = 'off-mock-theme';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(v) {
    try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) { /* private window */ }
  }
  function systemPrefersLight() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  function resolve() {
    var s = stored();
    if (s === 'light' || s === 'dark') { return s; }
    return systemPrefersLight() ? 'light' : 'dark';
  }

  function paint(doc, theme) {
    if (!doc || !doc.documentElement) { return; }
    if (theme === 'light') { doc.documentElement.setAttribute('data-theme', 'light'); }
    else { doc.documentElement.removeAttribute('data-theme'); }
  }

  function frames() {
    var out = [document];
    var list = document.getElementsByTagName('iframe');
    for (var i = 0; i < list.length; i++) {
      // same-origin only; a cross-origin frame throws on contentDocument
      try { if (list[i].contentDocument) { out.push(list[i].contentDocument); } } catch (e) { /* ignore */ }
    }
    return out;
  }

  function apply(theme) {
    frames().forEach(function (doc) { paint(doc, theme); });
    var btn = document.getElementById('themeswitch');
    if (btn) {
      btn.textContent = theme === 'light' ? 'dark mode' : 'light mode';
      btn.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode');
    }
  }

  var current = resolve();
  apply(current);

  function button() {
    var b = document.createElement('button');
    b.id = 'themeswitch';
    b.type = 'button';
    b.className = 'themeswitch';
    b.addEventListener('click', function () {
      current = current === 'light' ? 'dark' : 'light';
      remember(current);
      apply(current);
    });
    // the lane view already has chrome to put it in; a bare screen gets a floating pill
    var bar = document.querySelector('.lanebar');
    if (bar) { bar.appendChild(b); } else { b.classList.add('floating'); document.body.appendChild(b); }
    apply(current);
  }

  // ⛔ The lane view injects this file into BOTH documents: the frame and the screen inside it.
  // A framed screen must not draw its own control - it obeys the parent, or the viewer sees two
  // switches, one of them floating over the page content. Opened standalone ("open full size"),
  // the same page is not framed and does get the floating pill.
  var framed = false;
  try { framed = window.parent !== window; } catch (e) { framed = true; }

  if (!framed) {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', button); }
    else { button(); }
  }

  // a screen loaded into the lane frame starts dark again, so re-apply per load
  window.addEventListener('load', function () { apply(current); });
  document.addEventListener('load', function (e) {
    if (e.target && e.target.tagName === 'IFRAME') { apply(current); }
  }, true);

  // follow the system only while the viewer has made no choice of their own
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onChange = function () { if (!stored()) { current = resolve(); apply(current); } };
    if (mq.addEventListener) { mq.addEventListener('change', onChange); }
    else if (mq.addListener) { mq.addListener(onChange); }
  }
})();
