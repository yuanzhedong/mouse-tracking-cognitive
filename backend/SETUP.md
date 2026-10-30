# Data backend — Google Drive + Sheets via Apps Script (free)

The battery is a static site (GitHub Pages). Every save is POSTed as JSON to
a Google Apps Script web app owned by the study account (the team uses the
Stanford Google account **yzd@stanford.edu**). The script:

- stores each upload as one JSON file in a Drive folder,
  `My Drive/self-control-battery-data/raw/` — the primary copy of the data;
- every 10 minutes copies new files into a Google Sheet, one tab per table;
- hands out the A/B and weeks/months groups so they come out exactly 50/50.

Setup takes about ten minutes and must be done **signed in as the account
that should own the data**.

## 1. Create the sheet and script

1. In Google Drive (signed in as yzd@stanford.edu), create a new Google
   Sheet, e.g. `SelfControl_Pilot_Data`.
2. In the sheet: **Extensions → Apps Script**.
3. Delete the default code, paste the contents of `backend/Code.gs`, save.

## 2. Deploy as a web app

1. **Deploy → New deployment**, type **Web app**.
2. *Execute as*: **Me**. *Who has access*: **Anyone** (students are not
   signed in to Google).
   - If *Anyone* is not offered, the Stanford Workspace admin has blocked
     public web apps. Then deploy the same script from a personal Gmail
     account instead (data lands in that account's Drive; share the folder
     with the Stanford account), or ask Stanford IT.
3. **Deploy**, authorize the script when prompted (Drive + Sheets), and copy
   the **Web app URL** (`https://script.google.com/macros/s/…/exec`).

Check it: opening the URL shows `self-control battery endpoint: OK`, and
`…/exec?action=assign&pid=TEST01` returns something like
`{"ok":true,"mt":"B","hz":"weeks",…}`.

## 3. Turn on the sheet builder

In the Apps Script editor, pick **setupTrigger** in the function menu and
click **Run** once. From then on `buildSheets` copies new uploads into the
sheet every 10 minutes. (Run `buildSheets` by hand to update right away.)

## 4. Point the site at it

In `shared/config.js`:

```js
ENDPOINT: 'https://script.google.com/macros/s/…/exec',
```

Commit and push. The entry page with `?review=1` shows
"Upload endpoint: configured".

## 5. Verify

Run a session with a test code (e.g. `TEST01`). Files appear in
`self-control-battery-data/raw/` right away; tabs fill in the sheet after
the next `buildSheets` run:

| tab | one row per | key columns |
|---|---|---|
| `task_status` | task start / end | `task` (task1, task2, survey, ratings, session), `completion_status` (not_completed / completed) — the last row per task tells whether it was finished |
| `session_log` | milestone event | `event` |
| `task1_trials` | Task 1 trial | `block`, `trial_id` (= row of Task1_trial_list_60x60), `trial_type`, `left_id`, `right_id`, `left_image`, `right_image`, `goal_side`, `chosen_id`, `chose_goal`, `rt_ms`, `initiation_time`, `warning_shown`, `auc`, `md`, `x_flips`, `n_samples` |
| `task1_trajectories` | Task 1 trial | `t_ms`, `x`, `y` (JSON arrays: every ~16 ms from the options appearing to the choice, px in the stage), `x_norm`, `y_norm` (101 time-normalized bins) |
| `task2_events` | Task 2 logged event | `type`, `phase` (practice / block1 / lock / block2), `t_ms`, answer / video / lock fields; `lock_trajectory` holds the lock trial's raw samples |
| `task2_summary` | Task 2 session | `lock_choice`, `lock_auc`, `points`, `block1_study_ms`, `block1_video_ms`, `block2_study_ms`, `block2_video_ms`, `switches` |
| `survey` | answered item | `section` (self_report), `item` (1–8), `value` (1–7), `label` |
| `activity_ratings` | rated activity | `activity_id`, `category`, `image`, `enjoy`, `useful` (0–100), `order_idx`, `rt_ms` |
| `video_ratings` | rated video preview | `video_id`, `category`, `interest` (0–100) |

Every row also carries `pid`, `session_id` (unique per sitting), `step`,
`lang`, `mt_version`, `horizon_group`, `group_source` (server / local / url),
`client_ts`, `save_id` and `server_ts`.

## Notes

- **Redeploying after code changes**: Deploy → Manage deployments → edit →
  *Version: New version* → Deploy. The URL stays the same.
- **Nothing is lost if a student leaves midway.** Task 1 uploads every 10
  trials, Task 2 at the end of each phase, ratings every 15 items. Each
  upload is put in the browser's queue *before* it is sent and removed only
  after the server confirms; anything unsent goes out on the next page load
  or every 45 s. All data is also kept in the browser (the final page with
  `?review=1` can download it as CSV).
- A retried upload can arrive twice; the script skips a `save_id` it has
  already stored.
- `groupCounts` (run from the editor) logs how many students are in each group.
- `resetSheets` rebuilds the spreadsheet from the raw files.

## Capacity — 100 students at the same time

- **The site** is static on GitHub Pages; the school's bandwidth for the
  Task 2 videos (~1–3 Mbps per playing video) is the practical limit.
- **Uploads**: a session makes ~30 requests (12 in Task 1, 4 in Task 2, …),
  so 100 students ≈ 3,000 requests over ~35 min, ~1–3 per second at peaks.
  Each request only writes one small Drive file (~0.3–1 s, no lock), well
  under Apps Script's limit of ~30 simultaneous executions. A rejected
  request is retried with backoff and then re-queued, so a burst only
  delays data, it doesn't lose it.
- **Sheet size**: ~300 rows per student; 100 students ≈ 30,000 rows,
  far below the 10 M-cell limit.
