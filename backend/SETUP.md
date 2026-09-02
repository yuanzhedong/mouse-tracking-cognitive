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
| `task1_trajectories` | Task 1 trial × time bin (101/trial) | `trial`, `t_norm`, `x_norm`, `y_norm` |
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
- Apps Script quotas (free Gmail account) are far above a pilot's needs
  (~20k URL-fetch/day is the closest limit; a session makes ~12 POSTs).
