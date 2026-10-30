/* Battery-wide configuration. Edit this file (no build step). */

const CONFIG = {
  // Google Apps Script web-app URL (see backend/SETUP.md). Leave empty to
  // run local-only: data stays in the browser and can be downloaded as CSV
  // from the final page.
  ENDPOINT: 'https://script.google.com/macros/s/AKfycbxVKc7DdfgbQy3eixK6GnwnB4f8eo_N7ctvhm2rRE6fIvZOPXIwFSvcwkJNHuwbo9YJ3A/exec',

  // Default language; students can switch EN / PT on the entry page.
  DEFAULT_LANG: 'pt',

  // Student session order (team doc 10/28). Each step is a page;
  // Session.next() walks it. Not in the flow but still available as pages:
  // 'daily_reset', 'allocation'.
  FLOW: ['task1', 'task2', 'survey', 'ratings', 'done'],

  // Ratings (stimulus norming)
  RATINGS_ACTIVITIES_N: 90,   // how many of the 90 activities each student rates (?n= overrides)
  RATINGS_VIDEOS_N: 25,       // how many video previews (?nv= overrides)
  RATINGS_SAVE_EVERY: 15,     // upload activity ratings in chunks of this size

  // Task 1 — goal–temptation mouse-tracking (trial order: TASK1_TRIAL_LIST
  // in shared/stimuli.js; ?trials=N runs only the first N)
  TASK1_PRACTICE_TRIALS: 3,   // practice rounds (TASK1_PRACTICE_LIST in shared/stimuli.js, not scored)
  TASK1_INIT_WARN_MS: 1000,   // "start moving sooner" appears if the cursor hasn't moved by then
  TASK1_MOVE_THRESHOLD_PX: 10,// cursor counts as moving once it is this far from the start
  TASK1_SAMPLE_MS: 16,        // fixed sampling interval (~60 Hz), still periods included
  TASK1_SAVE_EVERY: 10,       // upload trials in batches of this size

  // 150-problem allocation (allocation/, not in the flow)
  ALLOC_TOTAL: 150,

  // Task 2 (ADT split screen), seconds: practice → block 1 → lock-screen
  // question → block 2. ?practice=, ?b1=, ?b2= override (?dur= sets both blocks).
  TASK2_PRACTICE_SEC: 60,
  TASK2_BLOCK1_SEC: 4 * 60,
  TASK2_BLOCK2_SEC: 3 * 60,
};
