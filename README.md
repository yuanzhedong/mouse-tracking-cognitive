# Mouse-Tracking for Cognitive Science

A browser-based re-implementation of the binary-choice **mouse-tracking** paradigm
described in:

> Stillman, P. E., Shen, X., & Ferguson, M. J. (2018).
> **How mouse-tracking can advance social cognitive theory.**
> *Trends in Cognitive Sciences*, **22**(6), 531–543.
> https://doi.org/10.1016/j.tics.2018.03.012

The goal of this repo is to provide a small, hackable, dependency-free apparatus
for running mouse-tracking experiments (Figure 1 of the paper) and computing the
standard trajectory metrics (Figure 2): **AUC**, **MD**, **x-flips**, **RT**,
**initiation time**, plus time-normalized trajectory exports for downstream
analysis.

The live demo is served via **GitHub Pages** from `index.html`. No build step.

---

## What's implemented

| Component | Status | Notes |
|---|---|---|
| Binary-choice self-control task (vice vs. virtue food pairs) | done | 10 default stimulus pairs, randomized side assignment |
| Start button → cursor centered → options appear | done | Matches Figure 1 of the paper |
| Continuous cursor sampling via `mousemove` | done | Native event rate (typically 60–120 Hz) |
| **AUC** (signed perpendicular area, idealized straight line) | done | Mirrored so chosen target is always on the right; positive AUC = deviation toward unchosen option |
| **MD** (maximum perpendicular deviation) | done | Same sign convention as AUC |
| **X-flips** (number of direction reversals on x-axis) | done | Threshold 0.01 normalized units |
| **RT** and **initiation time** | done | Soft warning if initiation > 500 ms |
| Time-normalization to **101 bins** | done | Standard MouseTracker convention (Freeman & Ambady, 2010) |
| Coordinate normalization to (0,0) → (1, 1.5) | done | MouseTracker frame; mirrored across x so chosen target is on the right |
| Live trajectory visualization | done | Past trials drawn faintly; most-recent in accent color |
| CSV export (sample-level, with trial-level metrics) | done | One row per (trial × time bin), 101 rows/trial |
| Aggregate panel (mean AUC, MD, RT across trials) | done | |

## Roadmap — paper features not yet implemented

These map directly to sections of Stillman, Shen & Ferguson (2018):

- [ ] **Social-categorization task** (Figure 1, top row) — categorize a face/word
      stimulus as Female/Male, Black/White, etc. The current code is structured
      around food choice; adding a stimulus image + category labels is mostly a
      config change.
- [ ] **Stimulus images** for the food task (currently text-only). The paper's
      Figure 2 uses brownie/broccoli photos.
- [ ] **Movement deadline** — paper mentions enforcing movement initiation
      within ~400 ms and discarding offending trials. Currently we only warn.
- [ ] **Integration-times analysis** ([Sullivan et al. 2015],
      Stillman et al. citation [40,55,110]) — fit per-time-bin regressions of
      mouse angle on stimulus attributes (e.g., tastiness vs. healthiness) and
      report when each attribute first significantly predicts movement.
- [ ] **Bimodality / Hartigan dip test** on the AUC distribution (Box 1) — to
      adjudicate dual-system vs. dynamical-systems accounts.
- [ ] **Velocity & acceleration profiles** per time bin (Figure 2, right panel).
- [ ] **Sample-entropy** of trajectories (Hehman et al. 2015).
- [ ] **Practice trials** and instructions screen (currently a single greeting).
- [ ] **Counterbalancing** beyond random side assignment (e.g., block-level
      balancing of which side the virtue appears on).
- [ ] **Server-side data collection** — currently CSV export is client-side
      only. A small endpoint (e.g., a Cloudflare Worker or Google Form) would
      let this be used for real online data collection.

## Methodological notes

### Coordinate frame

Following Freeman & Ambady's MouseTracker convention:

- Translate raw screen coordinates so the **start button** is at `(0, 0)`.
- Scale x so the **chosen option** lands at `x = ±1`, then **mirror** so
  the chosen option is always at `x = +1`. This makes AUC sign meaningful:
  positive = deviation *toward the unchosen option*.
- Scale y so the chosen option lands at `y = 1.5`.
- Re-interpolate the (x, y, t) samples to **101 equally-spaced** time bins.

### AUC and MD

The ideal trajectory is the straight line from `(0, 0)` to `(1, 1.5)`. Let
`d(t)` be the signed perpendicular distance from the actual point at time bin
`t` to this line, with the normal oriented so that positive values point toward
the unchosen option `(-1, 1.5)`.

- **AUC** = trapezoidal integral of `d` w.r.t. distance along the ideal line.
- **MD**  = max of `d`.

These are the conventional MouseTracker definitions and are typically correlated
at *r* = 0.8–0.9 (Stillman et al. 2018).

### Caveats from the paper

- Single trials are noisy — you need at least 25–50 trials per condition.
- If a participant decides *before* moving, trajectories will be uninformatively
  straight. The apparatus warns at init > 500 ms; published studies usually
  also enforce a movement deadline (≈400 ms) and exclude offending trials.

---

## Running locally

No dependencies. Just open `index.html` in any modern browser, or serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

The site is designed to be served as a static GitHub Pages site from the
repository root. After pushing to GitHub:

1. Repo → **Settings → Pages**
2. Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)**
3. The experiment will be live at
   `https://<your-username>.github.io/<repo-name>/`

---

## Citations

- Stillman, P. E., Shen, X., & Ferguson, M. J. (2018). How mouse-tracking can
  advance social cognitive theory. *Trends in Cognitive Sciences*, 22(6),
  531–543. https://doi.org/10.1016/j.tics.2018.03.012
- Freeman, J. B., & Ambady, N. (2010). MouseTracker: Software for studying
  real-time mental processing using a computer mouse-tracking method.
  *Behavior Research Methods*, 42(1), 226–241.
- Hehman, E., Stolier, R. M., & Freeman, J. B. (2015). Advanced mouse-tracking
  analytic techniques for enhancing psychological science. *Group Processes &
  Intergroup Relations*, 18(3), 384–401.
- Sullivan, N., Hutcherson, C., Harris, A., & Rangel, A. (2015). Dietary
  self-control is related to the speed with which attributes of healthfulness
  and tastiness are processed. *Psychological Science*, 26(2), 122–134.

## License

MIT (see `LICENSE` if present, otherwise add one before publishing).
