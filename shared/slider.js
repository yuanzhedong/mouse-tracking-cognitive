/* Pointer handling for every <input type=range> on the page (also ones
   added later). Pressing anywhere on the track jumps the thumb there and
   dragging follows the pointer — the same with mouse, trackpad or finger
   (iPad Safari/Chrome otherwise ignore taps on the track). Changes are
   reported as normal 'input' events, so page code needs no changes.
   Keyboard arrows keep the native behavior. Load shared/slider.css too. */
(() => {
  const THUMB = 28;   // px, matches slider.css
  const paint = r => r.style.setProperty('--fill', (100 * (r.value - r.min) / ((+r.max || 100) - r.min)) + '%');
  function setFromX(r, clientX){
    const box = r.getBoundingClientRect();
    const min = +r.min || 0, max = r.max === '' ? 100 : +r.max, step = +r.step || 1;
    const f = Math.min(1, Math.max(0, (clientX - box.left - THUMB / 2) / (box.width - THUMB)));
    const v = Math.round((min + f * (max - min)) / step) * step;
    if (String(v) !== r.value || r.classList.contains('untouched')){
      r.value = v;
      r.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  document.addEventListener('pointerdown', e => {
    const r = e.target;
    if (!(r instanceof HTMLInputElement) || r.type !== 'range' || r.disabled || e.button > 0) return;
    e.preventDefault();               // take over from the native drag
    r.setPointerCapture(e.pointerId);
    setFromX(r, e.clientX);
    const move = ev => setFromX(r, ev.clientX);
    const end = () => {
      r.removeEventListener('pointermove', move);
      r.removeEventListener('pointerup', end);
      r.removeEventListener('pointercancel', end);
      r.dispatchEvent(new Event('change', { bubbles: true }));
    };
    r.addEventListener('pointermove', move);
    r.addEventListener('pointerup', end);
    r.addEventListener('pointercancel', end);
  });
  document.addEventListener('input', e => { if (e.target.type === 'range') paint(e.target); });
})();
