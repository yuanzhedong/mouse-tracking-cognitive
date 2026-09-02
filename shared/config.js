/* Battery-wide configuration. Edit this file (no build step). */

const CONFIG = {
  // Google Apps Script web-app URL (see backend/SETUP.md). Leave empty to
  // run local-only: data stays in the browser and can be downloaded as CSV
  // from the final page.
  ENDPOINT: '',

  // Participant-facing language: 'pt' (default) or 'en'. Override per
  // session with ?lang=en.
  DEFAULT_LANG: 'pt',

  // Student session order. Each step is a page; Session.next() walks it.
  FLOW: ['survey', 'task1', 'task2', 'done'],

  // Task 1 — goal–temptation mouse-tracking
  TASK1_PRACTICE_TRIALS: 3,   // practice rounds (not scored)
  TASK1_REPEATS: 2,           // each icon pair shown this many times → 5 × 2 = 10 trials
  TASK1_INIT_WARN_MS: 500,    // "too slow to start" warning threshold

  // Task 2 — split-screen (seconds). ?practice= and ?dur= override.
  TASK2_PRACTICE_SEC: 2 * 60,
  TASK2_MAIN_SEC: 10 * 60,
};
