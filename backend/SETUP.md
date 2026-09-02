# Data backend — Google Sheets via Apps Script (free)

The battery is a static site (GitHub Pages). Data is POSTed as JSON to a
Google Apps Script web app that appends rows to a Google Sheet, one tab per
table. No server, no cost. Takes about five minutes to set up.

## 1. Create the sheet and script

1. Create a new Google Sheet (e.g. `SelfControl_Pilot_Data`).
2. In the sheet: **Extensions → Apps Script**.
3. Delete the default code, paste the contents of `backend/Code.gs`, save.

## 2. Deploy as a web app

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. *Execute as*: **Me**. *Who has access*: **Anyone** (students are not
   signed in to Google; the URL is unguessable and only accepts appends).
4. Click **Deploy**, authorize the script when prompted, and copy the
   **Web app URL** (`https://script.google.com/macros/s/…/exec`).

Open that URL in a browser once; it should say
`self-control battery endpoint: OK`.

## 3. Point the site at it

In `shared/config.js`:

```js
ENDPOINT: 'https://script.google.com/macros/s/…/exec',
```

Commit and push. The entry page's *Researcher* panel shows
"Upload endpoint: configured".

## 4. Verify

Run a session with a test code (e.g. `?pid=TEST01`). Tabs appear in the
sheet as data arrives:

| tab | one row per | key columns |
|---|---|---|
| `session_log` | milestone event | `event`, `condition` |
| `survey` | answered item | `section`, `item`, `value`, `label`, `activity` (piped block), `rank` (top-3) |
| `task1_trials` | Task 1 trial | `is_practice`, `chosen_type`, `rt_ms`, `init_time_ms`, `slow_start`, `auc`, `md`, `x_flips` |
| `task1_trajectories` | Task 1 trial | `trial`, `n_bins`, `x_norm`, `y_norm` (JSON arrays of 101 time-normalized values) |
| `task2_summary` | Task 2 session | `lock_choice`, `lock_auc`, `points`, `main_study_ms`, `main_video_ms`, `switches` |
| `task2_events` | Task 2 logged event | `type`, `phase`, `t_ms`, answer / video / lock fields |

Every row also carries `pid`, `session_id`, `step`, `lang`, `condition`,
`client_ts` and `server_ts`.

## Notes

- **Redeploying after code changes**: Deploy → Manage deployments → edit →
  *Version: New version* → Deploy. The URL stays the same.
- The browser sends with `mode: 'no-cors'`, so the client cannot read the
  response. Delivery failures (offline) are queued in `localStorage` and
  retried the next time any battery page loads in that browser.
- Every save is also mirrored to `localStorage`; the final page's
  *Researcher* panel can download each table as CSV. With `ENDPOINT` empty
  the battery runs in this local-only mode.
- Every row carries a `save_id`; if a retry ever lands twice, dedupe on it.

## Capacity — a classroom of 200 at once

- **The site** is static on GitHub Pages: 200 (or 2,000) simultaneous
  students is not a concern. YouTube streams come from YouTube; the
  school's bandwidth (~1–3 Mbps per playing video) is the practical limit.
- **This endpoint** is the narrow part. Apps Script allows ~30 concurrent
  executions per script and each append takes ~0.5–2 s under a write
  lock. A session makes ~8 requests, so 200 students ≈ 1,600 requests
  over ~25 min — fine on average, but everyone finishing Task 1 in the
  same minute produces a burst that exceeds the concurrency limit. The
  client handles this: a rejected request is retried with backoff
  (0.8 s → 1.6 s → 3.2 s), then queued in `localStorage` and re-sent every
  45 s and on the next page load. Data arrives within a few minutes of a
  burst; nothing is lost while the browser stays open, and every save is
  also mirrored locally (downloadable as CSV on the final page).
- **Sheet size**: ~50 rows per student (≈ 1,000 cells); 200 students ≈
  0.2 M cells against the 10 M-cell limit. Start a new sheet per wave if
  you run many.
- If you want headroom without the burst behaviour, swap the endpoint for
  a Supabase or Firebase table (free tiers handle hundreds of concurrent
  writes); `Session.save()` is the only place that would change.
