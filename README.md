# Self-Control Task Battery for Cognitive Science

A small, hackable, dependency-free battery of browser questionnaires and
tasks for studying adolescent self-control and attention allocation in the
face of temptation. Served via **GitHub Pages**; no build step. Participant
text is **Portuguese (Brazil)** only for students (English is available to
researchers via `?lang=en`); content follows the team doc
*Pilot_Participant_Facing_Materials_EN_PT*.

## Student session flow

```
index.html → survey/ → ratings/ → daily_reset/ → task1/ → allocation/ → task2/ → done.html
 entry +     §1–5     activities    placeholder    Game 1    150 problems   Game 2   thank-you
 random      surveys  + pictures    (questions     mouse-    + predictions
 groups               + videos      pending)       tracking
```

**The single student link is the site root** (`index.html`). The student
types their code; the entry page then draws the pilot groups (below) and
starts the flow. `index.html?pid=S001` pre-fills the code. Each page
saves its data, then advances via `Session.next()`; progress is remembered
per code so a closed window can resume from the entry page.

| step | content | data tables |
|---|---|---|
| `survey/` | 1 Academic Goal Value · 2 Tempting Activities top-3 · 3 ratings piped from the top-3 · 4 Brief Self-Control Scale (validated PT-BR) · 5 Self-Control Strategy Use | `survey` |
| `ratings/` | Part A: 90 candidate activities (30 study / 30 entertainment / 30 neutral) each on two 0–100 sliders (enjoyable now, useful for the quiz), shuffled · Part B: video previews (thumbnail) on one 0–100 interest slider | `activity_ratings`, `video_ratings` |
| `daily_reset/` | Daily Reset questionnaire — **slot only**: questions pending (Priscilla finalizes, Karine translates). Add them to `DAILY_RESET` in `shared/surveys.js`; while it is empty, student sessions skip the step (`daily_reset_skipped` in the log) | `daily_reset` |
| `task1/` | instructions → 3 practice rounds (neutral vs. neutral) → 30 mouse-tracked trials: each of the 30 study activities paired with one of the 30 entertainment activities (random pairing per student, goal side balanced), same pictures as the ratings; one prompt version (A/B) per student | `task1_trials`, `task1_trajectories` |
| `allocation/` | split 150 practice problems between two time points (slider) + "why?" text box → two predictions (you / most classmates: move earlier · push later · keep the same) | `allocation` |
| `task2/` | split-screen practice (2 min) → lock-screen choice (mouse-tracked) → main phase (10 min) | `task2_summary`, `task2_events` |
| all | milestones | `session_log` |

### Pilot groups (meeting 10/13)

Two independent coin flips (0/1) per participant code, drawn once and then
fixed — a refresh, a reload of any page, or restarting from the entry page
keeps them (stored per code in the browser and carried in every page URL).
Every saved row carries `mt_version`, `mt_rand`, `horizon_group`, `hz_rand`.

| group | 0 | 1 |
|---|---|---|
| `mt` — Task 1 prompt | **A** "Você terá uma prova em breve. Qual atividade você escolhe fazer agora?" | **B** "Você terá uma prova em breve. Qual atividade mais ajudaria você a ir bem na prova?" |
| `hz` — allocation horizon | **weeks**: 1 week / 2 weeks from now | **months**: 1 month / 2 months from now |

**Touch screens (iPad):** a finger sends no mouse-movement stream, so on
touch/pen input the choice trials (Task 1 and the Task 2 lock choice) run
as a drag: pressing START puts a round cursor under the finger and the
student drags it onto an option and lets go (tapping an option directly
does nothing; lifting early leaves the cursor in place to pick up again).
The drag path is scored exactly like a mouse path; rows record
`input_type` (`mouse` / `touch` / `pen`) — analyze touch trials
separately, as dragging is slower than mousing. `?drag=1` forces drag mode
with a mouse for testing (`mouse_drag`).

The "start moving sooner" reminder in Task 1 fires at **300 ms**; every
trial records `init_time_ms` (and the threshold `init_warn_ms`) so the
cut-off can be re-tuned from the pilot data.

### URL parameters

| param | where | effect |
|---|---|---|
| `pid=S001` | any page | participant code (required for the session flow) |
| `lang=pt\|en` | any page | language (default `pt`; EN is for researcher review only) |
| `mt=A\|B`, `hz=weeks\|months` | any page | force a pilot group (old `cond=immediate\|goal` links map to A/B) |
| `review=1` | any page | researcher views: language switch + researcher panel on the entry page, trajectory plots, metrics, CSV buttons |
| `n=N`, `nv=N` | ratings | number of activities / videos to rate (default all) |
| `practice=N`, `trials=N` | task1 | practice rounds / main trials |
| `practice=SEC`, `dur=SEC` | task2 | phase lengths |

A task page opened **without** `pid` runs standalone (demo mode, researcher
view on, nothing uploaded).

### Data collection

Every save goes to (a) `localStorage` in the student's browser and (b) a
Google Apps Script endpoint that appends rows to a Google Sheet, one tab per
table — free, no server. Setup in **`backend/SETUP.md`** (5 minutes), then
paste the URL into `shared/config.js`. With no endpoint configured the
battery still runs and the final page's *Researcher* panel downloads each
table as CSV. Uploads retry with backoff and queue offline, so a classroom
of 200 finishing a task in the same minute degrades to "arrives a few
minutes later", not data loss (details in `backend/SETUP.md`).

## Repo structure

```
index.html            – session entry (participant code, language)
survey/index.html     – questionnaires §1–5
ratings/index.html    – stimulus norming: activity (with picture) + video-preview ratings
daily_reset/index.html – Daily Reset questionnaire slot (questions pending)
task1/index.html      – Task 1: goal–temptation mouse-tracking over the rated activities
allocation/index.html – 150-problem allocation + predictions
task2/index.html      – Task 2: split-screen ADT (study vs. YouTube videos)
  lock_stimuli/       – icon cards for the lock-screen choice trial
done.html             – thank-you page (+ researcher CSV download)
shared/
  config.js           – endpoint URL, language, trial counts, phase lengths
  i18n.js             – EN/PT UI strings + icon captions
  surveys.js          – questionnaire content (EN/PT) from the team doc
  stimuli.js          – 90 candidate activities (EN/PT), their pictures, video preview list
  activity_images/    – illustrated activity cards (10 so far)
  activity.css        – activity picture styling (ratings + Task 1)
  surveyrunner.js     – questionnaire renderer (survey/ and daily_reset/)
  session.js          – participant id, condition, save/upload, navigation
  questions.js        – fixed 30-item math bank (easy/medium/challenge)
  videos.js           – Task 2 YouTube playlist (video ids + categories)
  mousetracking.js    – AUC/MD/x-flips metrics (Freeman & Ambady 2010)
  dragcursor.js/.css  – drag cursor for mouse-tracking on touch screens
  slider.js/.css      – 0–100 / allocation sliders (mouse + touch)
backend/
  Code.gs             – Google Apps Script receiver (→ Google Sheet)
  SETUP.md            – deployment steps
README.md
```

### Known gaps / for the team

- **Activity pictures**: only 10 of the 90 activities have an illustrated
  card (`shared/activity_images/`, mapped in `ACTIVITY_IMAGES`); the other
  80 show an emoji placeholder, identical in the ratings and in Task 1. The
  mixed styles are a confound for the pilot — replace with a uniform set
  when the artwork is ready (the data records `picture: image|emoji`).
- **Translations pending Karine**: the allocation texts are a draft PT
  translation; the two prediction questions are in English on purpose
  (team decision) until her translation arrives (`pr_*` keys in
  `shared/i18n.js`).
- Task 2 videos are still the old playlist (new half-screen videos TBD).
- Stimulus PNGs carry English titles; the title band is cropped by CSS and
  a localized caption is shown instead. The lock cards still show "STUDY /
  LOCKED / FUN" inside the artwork — replace the PNGs for a fully PT version.
- `ratings/` is in the default flow after the surveys. 90 activities × 2
  sliders takes adolescents roughly 10–15 min; if the ratings are meant as
  a separate norming study, remove `'ratings'` from `CONFIG.FLOW` and run
  it standalone (`ratings/?pid=NORM01`). The activity list is pending
  Karine's review (asterisked items are flagged in the data). Video
  previews currently use the Task 2 playlist thumbnails.
- Section 3 scale is coded 1–5 (team note asked to confirm vs. 0–5).
- The Task 2 intro states the real total (practice + main = 12 min); the
  doc's wording says "about 10 minutes".
- A student who reloads a task page restarts that task (previous data is
  kept, so duplicates are distinguishable by `client_ts`).
- No movement deadline in Task 1 — slow starts are warned and flagged
  (`slow_start`), not excluded.

## Task 1 — Goal–Temptation Mouse-Tracking

A binary-choice **mouse-tracking** paradigm after:

> Stillman, P. E., Shen, X., & Ferguson, M. J. (2018).
> **How mouse-tracking can advance social cognitive theory.**
> *Trends in Cognitive Sciences*, **22**(6), 531–543.
> https://doi.org/10.1016/j.tics.2018.03.012

Practice rounds, then 10 trials (5 study-goal vs. temptation icon pairs × 2
passes, goal side balanced). Cursor trajectories are recorded and scored
with the standard metrics — **AUC**, **MD**, **x-flips**,
**RT**, **initiation time** — plus time-normalized trajectory exports.

## Task 2 — Split-Screen ADT (study vs. videos)

A free-choice attention-allocation task: ~12 minutes before a quiz, split
screen with **math questions on the left** (1 point per correct answer, fixed
bank in `shared/questions.js`) and **YouTube videos on the right** (playlist
via the YouTube IFrame API). **Whichever side the mouse is over becomes
active**: hovering the study side pauses the video and enables answering;
hovering the video side plays the video and disables (dims) the math panel.
Videos auto-advance when finished and can be skipped with a "next" button.
Persistent header: time remaining, points, "Quiz at the end" reminder.

Flow: intro → **practice phase** (default 2 min) → **lock-screen
instructions** → **lock-screen choice** (锁屏选择, the design's core
measure) → **main phase** (default 10 min) → researcher summary. The
instructions page explains the two options; the choice itself is a
Task-1-style **mouse-tracking trial** (Start button at the bottom, the two
options at the top corners, sides randomized) between
"[ Put the videos away ]" (the video side turns off for the whole main
phase — irreversible) and "[ Keep the videos on my screen ]" (everything
stays as in practice). The choice trajectory is scored with the shared
AUC/MD metrics (`shared/mousetracking.js`) and its 101-bin time-normalized
trajectory is included in the CSV. There is no right or wrong choice.

Logged events (exportable CSV, tagged by phase): the lock choice, side
switches, per-side dwell time, every answer (question id, level, response,
correctness, running points), and video load/play/pause/complete/skip with
video id + category. `?practice=SECONDS` and `?dur=SECONDS` override the
phase lengths for piloting.

---

## Task 1 — what's implemented

| Component | Status | Notes |
|---|---|---|
| Binary-choice goal–temptation task (activity stimuli + pictures) | done | 30 study × 30 entertainment activities paired randomly per student, 3 neutral practice + 30 main trials, balanced side assignment |
| Two prompt versions (A choose now vs. B helps on the test) | done | random per student at the entry page, fixed, or `?mt=` |
| Start button → cursor centered → options appear | done | Matches Figure 1 of the paper |
| Continuous cursor sampling via `mousemove` | done | Native event rate (typically 60–120 Hz) |
| **AUC** (signed area vs. idealized straight line) | done | Ideal line = trajectory start → endpoint (Freeman & Ambady, 2010); positive = deviation toward unchosen option |
| **MD** (signed maximum perpendicular deviation) | done | Same sign convention as AUC |
| **X-flips** (number of direction reversals on x-axis) | done | Threshold 0.01 normalized units |
| **RT** and **initiation time** | done | Reminder if initiation > 300 ms (pilot; re-tune from data) |
| Time-normalization to **101 bins** | done | Standard MouseTracker convention (Freeman & Ambady, 2010) |
| Coordinate normalization to (0,0) → (−1, 1.5) | done | MouseTracker frame; mirrored across x so the chosen target is top-left, unchosen toward +x |
| Per-trial researcher view | done | Trajectory, ideal line, uniform AUC shading, MD marker, metrics overlay |
| CSV export (sample-level, with trial-level metrics) | done | One row per (trial × time bin), 101 rows/trial |
| Aggregate panel (mean AUC, MD, RT across trials) | done | |

## Roadmap — paper features not yet implemented

These map directly to sections of Stillman, Shen & Ferguson (2018):

- [ ] **Social-categorization task** (Figure 1, top row) — categorize a face/word
      stimulus as Female/Male, Black/White, etc. The current code is structured
      around food choice; adding a stimulus image + category labels is mostly a
      config change.
- [x] **Stimulus images** — activity pictures in `shared/activity_images/`
      (10 illustrated, 80 emoji placeholders).
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
- [x] **Counterbalancing** — per-session balanced (shuffled) assignment of
      which side the goal appears on.
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
  straight. The apparatus reminds at init > 300 ms; published studies usually
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
