/* Shared mouse-tracking metrics — Freeman & Ambady (2010) MouseTracker
   convention. Used by Task 1 (goal–temptation trials) and Task 2 (the
   lock-screen choice trial).

   Trajectories are space-rescaled into a normalized space with the start
   at (0,0) and the CHOSEN option at (-1, 1.5) — i.e. every trajectory is
   mirrored so the chosen option is top-left, so the unchosen option
   lies toward +x. The idealized response trajectory is "a straight line
   between each trajectory's start and endpoints" (p. 230) — i.e. from
   (0,0) to the trajectory's actual final sample, NOT the button center.
   MD  = signed maximum perpendicular deviation from the ideal line
         (positive = toward the unchosen option).
   AUC = signed geometric area between actual and ideal trajectory;
         area on the unchosen side counts positive, area on the far
         side counts negative.
   Units: both are in normalized space, where the horizontal distance
   start → chosen option is 1 and the vertical distance is 1.5, so they are
   comparable across screen sizes. MD is in those distance units; AUC is an
   area in those units² (a straight path = 0; a path that goes all the way
   to the other option first ≈ 1.5–3).
   X_FLIP_MIN = smallest backtrack counted as an x-flip, same units
   (0.02 ≈ 5–8 px on a laptop screen). */

const X_FLIP_MIN = 0.02;

/* Fixed-rate cursor sampler. Pointer events only fire while the pointer
   moves, so instead the last known position is recorded every intervalMs
   from the moment the options appear (t = 0) until the choice — still
   periods (before the first movement, pauses) are in the record too.
   firstMoveT = time the pointer first got moveThresholdPx away from the
   start, taken from the pointer event itself (ms precision). */
function createSampler(intervalMs = 16, moveThresholdPx = 10){
  let timer = null, t0 = 0, pos = null, start = null;
  const s = { samples: [], firstMoveT: null,
    start(x, y){
      s.samples = []; s.firstMoveT = null;
      start = { x, y }; pos = { x, y }; t0 = performance.now();
      s.samples.push({ x, y, t: 0 });
      clearInterval(timer);
      timer = setInterval(() => s.samples.push({ x: pos.x, y: pos.y, t: performance.now() - t0 }), intervalMs);
    },
    move(x, y){
      if (!pos) return;
      pos = { x, y };
      if (s.firstMoveT === null && Math.hypot(x - start.x, y - start.y) > moveThresholdPx) s.firstMoveT = performance.now() - t0;
    },
    elapsed: () => performance.now() - t0,
    stop(x, y){           // final sample at the choice point; returns RT
      clearInterval(timer); timer = null;
      if (x !== undefined) s.move(x, y);
      const t = performance.now() - t0;
      s.samples.push({ x: pos.x, y: pos.y, t });
      pos = null;
      return t;
    },
    cancel(){ clearInterval(timer); timer = null; pos = null; },
  };
  return s;
}

function computeMetrics(samples, startPos, chosenPos, nBins = 101){
  const dx = chosenPos.x - startPos.x;
  const dy = startPos.y - chosenPos.y;          // browser y-axis is inverted
  if (dx === 0 || dy === 0 || samples.length < 2){
    return { auc: 0, md: 0, xFlips: 0, normalized: [], mdIdx: 0 };
  }

  // Normalized space: start (0,0), chosen option (-1, 1.5).
  // The x mirror puts the unchosen option on the +x side for every trial.
  const normalizeXY = p => ({
    x: -(p.x - startPos.x) / dx,
    y: ((startPos.y - p.y) / dy) * 1.5,
  });
  const norm = samples.map(p => ({ ...normalizeXY(p), t: p.t }));

  // Ideal line: (0,0) → trajectory endpoint d = (end.x, end.y).
  // For point p:
  //   s(p) = along-line coordinate   = (p · d) / |d|
  //   dev(p) = signed perp deviation = (d.y·p.x − d.x·p.y) / |d|
  //            (positive toward the unchosen option on the +x side)
  const end = norm[norm.length - 1];
  const LEN = Math.hypot(end.x, end.y);
  if (LEN === 0){
    return { auc: 0, md: 0, xFlips: 0,
             normalized: timeNormalize(norm, nBins), mdIdx: 0 };
  }
  const along = p => (p.x * end.x + p.y * end.y) / LEN;
  const dev   = p => (end.y * p.x - end.x * p.y) / LEN;

  // AUC = ∫ dev ds along the ideal line (trapezoidal rule). Segments where
  // the trajectory moves backward along the line contribute with reversed
  // sign, which is exactly the signed-area convention.
  let auc = 0;
  for (let i = 0; i < norm.length - 1; i++){
    auc += 0.5 * (dev(norm[i]) + dev(norm[i + 1]))
               * (along(norm[i + 1]) - along(norm[i]));
  }

  // MD = signed deviation with the largest magnitude
  let md = 0, mdIdx = 0;
  for (let i = 0; i < norm.length; i++){
    const d = dev(norm[i]);
    if (Math.abs(d) > Math.abs(md)){ md = d; mdIdx = i; }
  }

  // x-flips = reversals of horizontal direction. Compared against the
  // furthest point reached in the current direction (not sample to sample,
  // which at 60 Hz moves far less than any threshold): a reversal counts
  // once the cursor has come back X_FLIP_MIN from that extreme.
  let xFlips = 0, dir = 0, ext = norm[0].x;
  for (let i = 1; i < norm.length; i++){
    const x = norm[i].x;
    if (dir === 0){
      if (Math.abs(x - ext) >= X_FLIP_MIN){ dir = Math.sign(x - ext); ext = x; }
    } else if ((x - ext) * dir > 0){
      ext = x;
    } else if ((ext - x) * dir >= X_FLIP_MIN){
      xFlips++; dir = -dir; ext = x;
    }
  }

  const tNorm = timeNormalize(norm, nBins);
  return { auc, md, xFlips, normalized: tNorm, mdIdx };
}

function timeNormalize(traj, n){
  if (traj.length < 2) return traj.slice();
  const t0   = traj[0].t;
  const tEnd = traj[traj.length - 1].t;
  const dur  = tEnd - t0;
  if (dur <= 0) return Array.from({length: n}, () => ({...traj[0]}));

  const out = [];
  let j = 0;
  for (let i = 0; i < n; i++){
    const target = t0 + (i / (n - 1)) * dur;
    while (j < traj.length - 1 && traj[j+1].t < target) j++;
    if (j >= traj.length - 1){
      out.push({ ...traj[traj.length - 1] });
    } else {
      const p1 = traj[j], p2 = traj[j+1];
      const span = p2.t - p1.t;
      const f = span > 0 ? (target - p1.t) / span : 0;
      out.push({
        x: p1.x + f * (p2.x - p1.x),
        y: p1.y + f * (p2.y - p1.y),
        t: target,
      });
    }
  }
  return out;
}

/* Render a recorded trajectory review onto a canvas overlaying hostEl.
   trial needs: samples (raw viewport coords incl. the final click),
   startPos, leftPos, rightPos, chosenPos, stageRect (host rect captured
   at trial start), mdIdx (from computeMetrics). */
function drawTrajectoryReview(canvas, hostEl, trial){
  const rect = hostEl.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Convert viewport coords (from stored samples) → host-local coords.
  // Use the rect captured at trial start so trajectory aligns with where
  // the cursor actually was on screen.
  const r0 = trial.stageRect || rect;
  const toLocal = p => ({ x: p.x - r0.left, y: p.y - r0.top });

  const startL  = toLocal(trial.startPos);
  const rightL  = toLocal(trial.rightPos);
  const leftL   = toLocal(trial.leftPos);
  const chosenL = toLocal(trial.chosenPos);

  const endP = trial.samples[trial.samples.length - 1];
  const endL = toLocal(endP);

  // 1) AUC area: ONE closed shape — the trajectory out to its endpoint,
  // then straight back to the start along the ideal line (closePath). A
  // single fill keeps the opacity uniform even where the path
  // self-intersects.
  if (trial.samples.length >= 2){
    ctx.fillStyle = 'rgba(168, 50, 74, 0.14)';
    ctx.beginPath();
    ctx.moveTo(startL.x, startL.y);
    for (const s of trial.samples){
      const p = toLocal(s);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 2) ideal trajectory (dashed): straight line start → trajectory endpoint
  ctx.strokeStyle = 'rgba(31, 30, 44, 0.55)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startL.x, startL.y);
  ctx.lineTo(endL.x, endL.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 3) actual trajectory
  ctx.strokeStyle = '#a8324a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startL.x, startL.y);
  for (const s of trial.samples){
    const p = toLocal(s);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // 4) endpoint markers
  const dot = (p, fill, r = 4) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const ring = (p, stroke, r = 8) => {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();
  };
  dot(startL, '#1f1e2c', 4);
  dot(rightL, '#1f1e2c', 4);
  dot(leftL,  '#1f1e2c', 4);
  ring(chosenL, '#a8324a', 8);

  // 5) MD marker — the sample computeMetrics flagged as max deviation,
  // dropped perpendicularly onto the (unclamped) ideal line
  if (trial.mdIdx >= 0 && trial.mdIdx < trial.samples.length){
    const p  = trial.samples[trial.mdIdx];
    const vx = endP.x - trial.startPos.x;
    const vy = endP.y - trial.startPos.y;
    const t  = ((p.x - trial.startPos.x) * vx + (p.y - trial.startPos.y) * vy)
             / (vx * vx + vy * vy);
    const foot = { x: trial.startPos.x + t * vx, y: trial.startPos.y + t * vy };
    const mdL   = toLocal(p);
    const footL = toLocal(foot);
    ctx.strokeStyle = 'rgba(31, 30, 44, 0.7)';
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mdL.x,   mdL.y);
    ctx.lineTo(footL.x, footL.y);
    ctx.stroke();
    ctx.setLineDash([]);
    dot(mdL, '#a8324a', 3);
  }
}
