/* Keeps students from leaving a task page by accident (student sessions
   only, not the researcher view). A page can't fully stop a refresh — the
   browser's own reload button and iPad Safari ignore these — so in-task
   progress is also saved and resumed (Session.progress). This adds:
   - a "Leave site?" warning on refresh / close (desktop browsers);
   - F5, Ctrl/Cmd+R and the back keys do nothing;
   - the back button / back swipe stays on the page;
   - no right-click menu.
   The site's own page changes (Session.go) set Session.leaving, so they
   are never stopped. */
(function(){
  if (typeof Session === 'undefined' || Session.standalone || Session.review) return;

  window.addEventListener('beforeunload', e => {
    if (Session.leaving) return;
    e.preventDefault();
    e.returnValue = '';
  });

  document.addEventListener('keydown', e => {
    const k = e.key;
    const mod = e.ctrlKey || e.metaKey;
    const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (k === 'F5' || (mod && (k === 'r' || k === 'R')) ||
        (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight')) ||
        (e.metaKey && (k === '[' || k === ']')) ||
        (k === 'Backspace' && !editing)){
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  history.pushState(null, '', location.href);
  window.addEventListener('popstate', () => history.pushState(null, '', location.href));

  document.addEventListener('contextmenu', e => e.preventDefault());
})();
