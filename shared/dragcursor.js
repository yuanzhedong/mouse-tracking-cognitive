/* Drag cursor — mouse-tracking on touch screens (iPad etc.).
   A finger produces no mousemove stream, so on touch/pen input the trial
   runs as a drag: pressing START starts the trial and puts a round cursor
   under the finger; the student drags it onto an option and lets go to
   choose. Every pointermove is a trajectory sample, so the path is scored
   exactly like a mouse path. Lifting the finger outside an option leaves
   the cursor in place to be picked up again; tapping an option directly
   does nothing. Mouse input is untouched (normal cursor + click), unless
   ?drag=1 forces drag mode (to try it on a computer).

   DragCursor.create({ stage, startBtn, targets: [leftEl, rightEl], hint,
                       onStart(e, inputType) → true if a trial started,
                       onMove(x, y), onDrop(targetIndex, e) })
   → { reset(), active }. Needs shared/dragcursor.css. */

const DragCursor = (() => {
  const FORCE = new URLSearchParams(location.search).get('drag') === '1';

  function create({ stage, startBtn, targets, hint, onStart, onMove, onDrop }){
    const dot = document.createElement('div');
    dot.className = 'drag-dot hidden';
    const tip = document.createElement('div');
    tip.className = 'drag-hint hidden';
    tip.textContent = hint || '';
    stage.append(dot, tip);
    // touch-action is fixed when the finger lands, so it must already be
    // 'none' on START or the browser takes the press as a page scroll.
    stage.style.touchAction = 'none';

    let active = false, pointer = null;
    const place = (x, y) => {
      const r = stage.getBoundingClientRect();
      dot.style.left = (x - r.left) + 'px';
      dot.style.top  = (y - r.top) + 'px';
    };
    const targetAt = (x, y) => targets.findIndex(el => {
      if (el.classList.contains('hidden')) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
    const grab = e => { pointer = e.pointerId; try { stage.setPointerCapture(e.pointerId); } catch (_) {} };

    function reset(){
      active = false; pointer = null;
      stage.classList.remove('drag-mode');
      dot.classList.add('hidden'); tip.classList.add('hidden');
      targets.forEach(el => el.classList.remove('drag-over'));
    }

    startBtn.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && !FORCE) return;      // mouse: normal click flow
      e.preventDefault();
      const inputType = e.pointerType === 'mouse' ? 'mouse_drag' : e.pointerType;
      if (!onStart(e, inputType)) return;
      active = true;
      stage.classList.add('drag-mode');
      place(e.clientX, e.clientY);
      dot.classList.remove('hidden'); tip.classList.remove('hidden');
      grab(e);                                              // same press keeps dragging
    });
    dot.addEventListener('pointerdown', e => { if (active){ e.preventDefault(); grab(e); } });

    stage.addEventListener('pointermove', e => {
      if (!active || e.pointerId !== pointer) return;
      const pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      (pts.length ? pts : [e]).forEach(p => onMove(p.clientX, p.clientY));
      place(e.clientX, e.clientY);
      tip.classList.add('hidden');
      const i = targetAt(e.clientX, e.clientY);
      targets.forEach((el, j) => el.classList.toggle('drag-over', j === i));
    });
    const release = e => {
      if (!active || e.pointerId !== pointer) return;
      pointer = null;
      const i = targetAt(e.clientX, e.clientY);
      if (i >= 0){ reset(); onDrop(i, e); }
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', e => { if (e.pointerId === pointer) pointer = null; });

    return { reset, get active(){ return active; } };
  }

  return { create, FORCE };
})();
