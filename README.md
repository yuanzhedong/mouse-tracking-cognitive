# Self-Control Task Battery for Cognitive Science

A small, hackable, dependency-free battery of browser questionnaires and
tasks for studying adolescent self-control and attention allocation in the
face of temptation. Served via **GitHub Pages**; no build step. Participant
text is **Portuguese (Brazil)** by default, with an **English / Português**
switch on the entry page.

## Student session flow (team doc 10/28)

```
index.html → task1/ → task2/ → survey/ → ratings/ → done.html
 entry +     Game 1    Game 2   8-item    activities  thank-you
 groups      mouse-    ADT      self-     + videos
             tracking           report
```

**The single student link is the site root** (`index.html`). The student
types their code (case and spaces are ignored: `s 001` = `S001`); the entry
page then gets the pilot groups (below) and starts the flow.
`index.html?pid=S001` pre-fills the code. Each page saves its data as it
goes, then advances via `Session.next()`; progress is remembered per code
so a closed window can resume from the entry page.

| step | content | data tables |
|---|---|---|
| `task1/` | instructions (version A or B, doc text) → 3 practice rounds (fixed study-vs-other pairs, not scored) → **60 trials in one fixed order** (`shared/task1_trial_list_60.csv`: 30 goal–temptation + 30 goal–neutral picked from `Task1_trial_list_60x60`, each study activity twice, every other activity once, sides balanced), illustrated cards from `Task1_activity_illustrations` | `task1_trials`, `task1_trajectories` |
| `task2/` | split-screen ADT (doc text, 4 screens): practice 30 s ("Sessão de prática" + timer) → block 1, 4 min → lock-screen question (put the videos away / keep them; mouse-tracked) → block 2, 3 min. No time-remaining display in the blocks | `task2_events`, `task2_summary` |
| `survey/` | 8-item self-report, 7-point agree scale (doc 10/28) | `survey` |
| `ratings/` | Part A: the 90 activity cards on two 0–100 sliders (enjoyable now, useful for the quiz), shuffled · Part B: Task 2 video previews on one 0–100 interest slider | `activity_ratings`, `video_ratings` |
| all | task start / end | `task_status` (`completion_status`: not_completed / completed) |
| all | milestones | `session_log` |

Still in the repo but not in the flow (add back via `CONFIG.FLOW`):
`allocation/` (150-problem split + predictions), `daily_reset/` (questions
pending), and the earlier questionnaire sections 1–5 (`SURVEYS` in
`shared/surveys.js`).

### Pilot groups

Each participant code gets two groups, fixed for good (stored per code and
carried in every page URL; a reload or restart never re-randomizes). With
the upload server configured, the server deals them from shuffled blocks of
4, so the groups stay **exactly 50/50**; without it, the entry page flips a
coin. Every saved row carries `mt_version`, `horizon_group` and
`group_source` (`server` / `local` / `url`).

| group | | |
|---|---|---|
| `mt` — Task 1 prompt | **A** "Você terá uma prova em breve. Qual atividade você gostaria de fazer agora?" | **B** "Você terá uma prova em breve. Qual atividade mais ajudaria você a ir bem na prova?" |
| `hz` — allocation horizon (allocation not in the flow) | **weeks**: 1 week / 2 weeks from now | **months**: 1 month / 2 months from now |

### Task 1 recording

- **Fixed-rate sampling**: from the moment the options appear (t = 0) to
  the choice, the cursor position is recorded every **16 ms (~60 Hz)**,
  whether or not it moves — the still period before the first movement is
  in the record. Saved per trial in `task1_trajectories`: `t_ms`, `x`, `y`
  (px from the stage's top-left), plus 101 time-normalized bins.
- **initiation_time**: ms from the options appearing to the cursor first
  being 10 px from the start (from the pointer event itself).
  **warning_shown** = 1 if the "Comece a mover o mouse mais cedo!" reminder
  appeared, which happens when the cursor hasn't moved by **1000 ms**.
- **x_flips**: reversals of horizontal direction; a reversal counts once the
  cursor comes back ≥ 0.02 normalized units (≈ 5–8 px) from the furthest
  point reached.
- **AUC / MD units**: normalized space where start → chosen option is 1
  horizontally and 1.5 vertically. MD is a distance in those units, AUC an
  area in units² — unitless and comparable across screen sizes. A straight
  path gives 0; positive = bent toward the unchosen option.
- Each row has `trial_id` (= row of the trial list), `trial_type`,
  `left_id` / `right_id`, `left_image` / `right_image`, `goal_side`,
  `chosen_id`, `chose_goal`, `rt_ms`, `auc`, `md`, `x_flips`.

**Touch screens (iPad / Android tablets):** a finger sends no
mouse-movement stream, so on touch/pen input the choice trials (Task 1 and
the Task 2 lock choice) run as a drag: pressing START puts a round cursor
under the finger and the student drags it onto an option and lets go. The
drag path is sampled the same way; rows record `input_type` (`mouse` /
`touch` / `pen`) — analyze touch trials separately. `?drag=1` forces drag
mode with a mouse for testing (`mouse_drag`).

In the Task 2 split screen a finger can't hover, so on a touch screen
(`(hover: none)`) the intro says "tap a side to use it" and each inactive
side shows "Toque para estudar / assistir"; the last side tapped stays
active. Switch events record `via` (`hover` / `tap` / `click`).

### URL parameters

| param | where | effect |
|---|---|---|
| `pid=S001` | any page | participant code (required for the session flow) |
| `lang=pt\|en` | any page | language (default `pt`; also set by the entry page switch) |
| `mt=A\|B`, `hz=weeks\|months` | any page | force a pilot group |
| `review=1` | any page | researcher views: researcher panel on the entry page, trajectory plots, metrics, CSV buttons |
| `n=N`, `nv=N` | ratings | number of activities / videos to rate (default all) |
| `practice=N`, `trials=N` | task1 | practice rounds / run only the first N trials of the list |
| `practice=SEC`, `b1=SEC`, `b2=SEC`, `dur=SEC` | task2 | phase lengths (`dur` sets both blocks) |

A task page opened **without** `pid` runs standalone (demo mode, researcher
view on, nothing uploaded).

### Data collection

Every save goes to (a) `localStorage` in the student's browser and (b) a
Google Apps Script web app owned by the study's Google account
(yzd@stanford.edu), which stores each upload as a JSON file in Drive and
copies them into a Google Sheet every 10 minutes — free, no server, and
built for ~100 students at once. Setup in **`backend/SETUP.md`**, then
paste the URL into `shared/config.js`.

Saving is incremental — Task 1 every 10 trials, Task 2 at the end of each
phase, ratings every 15 items — and every upload sits in a browser queue
until the server confirms it, so a student who leaves midway keeps
everything done so far. With no endpoint configured the battery still runs
and the final page (`?review=1`) downloads each table as CSV.

## Repo structure

```
index.html            – session entry (participant code, EN / PT switch)
task1/index.html      – Task 1: goal–temptation mouse-tracking (fixed trial list)
task2/index.html      – Task 2: split-screen ADT (study vs. YouTube videos)
  lock_stimuli/       – icon cards for the lock-screen choice trial
survey/index.html     – 8-item self-report
ratings/index.html    – stimulus norming: activity cards + video-preview ratings
allocation/index.html – 150-problem allocation + predictions (not in the flow)
daily_reset/index.html – Daily Reset questionnaire slot (not in the flow)
done.html             – thank-you page (+ researcher CSV download)
shared/
  config.js           – endpoint URL, flow, timings, sampling, batch sizes
  i18n.js             – EN/PT UI strings
  surveys.js          – questionnaire content (EN/PT)
  stimuli.js          – the 90 activities (EN/PT), Task 1 trial list, picture helpers
  activity_images/    – the 90 illustrated cards (study/, entertainment/, neutral/)
  activity.css        – activity card styling (ratings + Task 1)
  surveyrunner.js     – questionnaire renderer
  session.js          – participant id, groups, save/upload queue, navigation
  questions.js        – ADT math bank: the team's 152 items (smarte_math_unique_items.csv)
  videos.js           – Task 2 YouTube playlist (video ids + categories)
  mousetracking.js    – fixed-rate sampler, AUC/MD/x-flips metrics
  dragcursor.js/.css  – drag cursor for mouse-tracking on touch screens
  slider.js/.css      – 0–100 / allocation sliders (mouse + touch)
backend/
  Code.gs             – Google Apps Script: uploads → Drive files → Sheet; 50/50 groups
  SETUP.md            – deployment steps
README.md
```

### Known gaps / for the team

- **Drafts not from the team doc** (please check): the Task 2
  "Sessão de prática" label (the doc has it in English only), the touch-screen
  version of the Task 2 intro ("Toque em um lado…"), the touch-screen version of Task 1 instruction 5
  ("Arraste o círculo…"), the self-report title and instruction line, and
  the entry-page text.
- **Version A question**: the doc's practice intro says "você *escolhe
  fazer* agora?" but its trial-stem rows say "você *gostaria de fazer*
  agora?"; the site uses "gostaria de fazer" everywhere.
- **Card text is final** (team, 10/30): some card labels differ from
  `index.csv` / the trial list; the `pt` / `en` strings in
  `shared/stimuli.js` are only used in the data, and some English ones are
  outdated.
- **Same-type runs**: the 60-trial list keeps the source order, so up to 6
  trials of the same type (goal–temptation or goal–neutral) can come in a row.
- The lock cards still show "STUDY / LOCKED / FUN" inside the artwork.
- A student who reloads a task page restarts that task (previous data is
  kept, so duplicates are distinguishable by `session_id` / `client_ts`).
- No movement deadline in Task 1 — slow starts are warned and flagged
  (`warning_shown`), not excluded.

## Task 1 — Goal–Temptation Mouse-Tracking

A binary-choice **mouse-tracking** paradigm after:

> Stillman, P. E., Shen, X., & Ferguson, M. J. (2018).
> **How mouse-tracking can advance social cognitive theory.**
> *Trends in Cognitive Sciences*, **22**(6), 531–543.
> https://doi.org/10.1016/j.tics.2018.03.012

Practice rounds, then a fixed list of 60 trials (study activity
vs. entertainment or chore). Cursor trajectories are recorded and scored
with the standard metrics — **AUC**, **MD**, **x-flips**,
**RT**, **initiation time** — plus time-normalized trajectory exports.

## Task 2 — Split-Screen ADT (study vs. videos)

A free-choice attention-allocation task: ~8 minutes before a quiz, split
screen with **math questions on the left** (the team's 152-item bank in
`shared/questions.js`, blocks B → E by difficulty; typed on a keypad with eraser / skip 🤔 / submit ✅) and **YouTube videos on the right** (playlist
via the YouTube IFrame API). **Whichever side the mouse is over becomes
active**: hovering the study side pauses the video and enables answering;
hovering the video side plays the video and disables (dims) the math panel.
Videos auto-advance when finished and can be skipped with a "next" button.
Header: only the time
remaining during practice only.

Flow: intro → **practice** (30 s) → **block 1** (4 min) → **lock-screen
instructions** → **lock-screen choice** (锁屏选择, the design's core
measure) → **block 2** (3 min) → researcher summary. The
instructions page explains the two options; the choice itself is a
Task-1-style **mouse-tracking trial** (Start button at the bottom, the two
options at the top corners, sides randomized) between
"[ Put the videos away ]" (the video side turns off for all of block 2 —
irreversible) and "[ Keep the videos on my screen ]" (everything
stays as in practice). The choice trajectory is scored with the shared
AUC/MD metrics (`shared/mousetracking.js`) and its 101-bin time-normalized
trajectory is included in the CSV. There is no right or wrong choice.

Logged events (exportable CSV, tagged by phase): the lock choice, side
switches, per-side dwell time, every answer (question id, level, response,
correctness, running points), and video load/play/pause/complete/skip with
video id + category. `?practice=`, `?b1=`, `?b2=` (seconds) override the
phase lengths for piloting.

---

## Task 1 — what's implemented

| Component | Status | Notes |
|---|---|---|
| Binary-choice goal–temptation task (activity cards) | done | Fixed list of 60 trials (30 goal–temptation, 30 goal–neutral, sides balanced), 3 fixed practice trials (study vs. other) |
| Two prompt versions (A choose now vs. B helps on the quiz) | done | 50/50 per student (server-balanced), fixed, or `?mt=` |
| Start button → cursor centered → options appear | done | Matches Figure 1 of the paper |
| Fixed-rate cursor sampling | done | Every 16 ms (~60 Hz) from the options appearing, still periods included |
| **AUC** (signed area vs. idealized straight line) | done | Ideal line = trajectory start → endpoint (Freeman & Ambady, 2010); positive = deviation toward unchosen option |
| **MD** (signed maximum perpendicular deviation) | done | Same sign convention as AUC |
| **X-flips** (number of direction reversals on x-axis) | done | Backtrack ≥ 0.02 normalized units from the furthest point |
| **RT** and **initiation time** | done | Live reminder if no movement by 1000 ms (`warning_shown`) |
| Time-normalization to **101 bins** | done | Standard MouseTracker convention (Freeman & Ambady, 2010) |
| Coordinate normalization to (0,0) → (−1, 1.5) | done | MouseTracker frame; mirrored across x so the chosen target is top-left, unchosen toward +x |
| Per-trial researcher view | done | Trajectory, ideal line, uniform AUC shading, MD marker, metrics overlay |
| CSV export (sample-level, with trial-level metrics) | done | One row per raw sample |
| Aggregate panel (mean AUC, MD, RT across trials) | done | |

## Roadmap — paper features not yet implemented

These map directly to sections of Stillman, Shen & Ferguson (2018):

- [ ] **Social-categorization task** (Figure 1, top row) — categorize a face/word
      stimulus as Female/Male, Black/White, etc. The current code is structured
      around food choice; adding a stimulus image + category labels is mostly a
      config change.
- [x] **Stimulus images** — the 90 illustrated activity cards in
      `shared/activity_images/`.
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
- [x] **Practice trials** and instructions screen.
- [x] **Counterbalancing** — goal side balanced per item in the trial list.
- [x] **Server-side data collection** — Google Apps Script → Google Sheet
      (`backend/`), with localStorage mirror and CSV fallback.

## Methodological notes

### Coordinate frame

Following Freeman & Ambady's MouseTracker convention:

- Translate raw screen coordinates so the **start click** is at `(0, 0)`.
- Scale x so the **chosen option** lands at `x = ±1`, then **mirror** so
  the chosen option is always at `x = −1` (unchosen toward `+x`). This makes
  AUC sign meaningful: positive = deviation *toward the unchosen option*.
  (Freeman & Ambady's software remaps to the right instead; the two are
  mirror-equivalent and produce identical AUC/MD values.)
- Scale y so the chosen option lands at `y = 1.5`.
- Re-interpolate the (x, y, t) samples to **101 equally-spaced** time bins.

### AUC and MD

Per Freeman & Ambady (2010, p. 230), the idealized response trajectory is
"a straight line between each trajectory's start and endpoints" — i.e. from
`(0, 0)` to the recorded click position, not to the button center. Let `d(t)`
be the signed perpendicular distance from the actual point at time bin `t` to
this line, with the normal oriented so that positive values point toward the
unchosen option.

- **AUC** = trapezoidal integral of `d` w.r.t. distance along the ideal line
  (area on the far side of the line counts negative).
- **MD**  = the `d` with the largest magnitude (signed).

Verified against the known-value simulation in the paper's Table 2
(90° trajectory: MD = 0.8321, AUC = 0.7500).

These are the conventional MouseTracker definitions and are typically correlated
at *r* = 0.8–0.9 (Stillman et al. 2018).

### Caveats from the paper

- Single trials are noisy — you need at least 25–50 trials per condition.
- If a participant decides *before* moving, trajectories will be uninformatively
  straight. The apparatus reminds at init > 1000 ms; published studies usually
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
