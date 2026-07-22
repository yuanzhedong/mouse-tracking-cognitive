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
         side counts negative. */

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

  let xFlips = 0;
  for (let i = 2; i < norm.length; i++){
    const a = norm[i - 1].x - norm[i - 2].x;
    const b = norm[i].x     - norm[i - 1].x;
    if (a * b < 0 && Math.abs(b) > 0.01) xFlips++;
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
