/* Battery-wide configuration. Edit this file (no build step). */

const CONFIG = {
  // Google Apps Script web-app URL (see backend/SETUP.md). Leave empty to
  // run local-only: data stays in the browser and can be downloaded as CSV
  // from the final page.
  ENDPOINT: '',

  // Participant-facing language: 'pt'. Students only ever see Portuguese;
  // ?lang=en is for researcher review.
  DEFAULT_LANG: 'pt',

  // Student session order. Each step is a page; Session.next() walks it.
  FLOW: ['survey', 'ratings', 'daily_reset', 'task1', 'allocation', 'task2', 'done'],

  // Ratings (stimulus norming, doc "Task 1 Candidate Activity Stimuli v2")
  RATINGS_ACTIVITIES_N: 90,   // how many of the 90 activities each student rates (?n= overrides)
  RATINGS_VIDEOS_N: 18,       // how many video previews (?nv= overrides)
  RATINGS_SAVE_EVERY: 15,     // upload activity ratings in chunks of this size

  // Task 1 — goal–temptation mouse-tracking over the rated activities
  TASK1_PRACTICE_TRIALS: 3,   // practice rounds (neutral vs. neutral activity, not scored)
  TASK1_TRIALS: 30,           // study vs. entertainment trials (30 = every study and every
                              // entertainment activity once, randomly paired per student; ?trials= overrides)
  TASK1_INIT_WARN_MS: 300,    // "start moving sooner" reminder (pilot: tune from the recorded init times)

  // 150-problem allocation (allocation/)
  ALLOC_TOTAL: 150,

  // Task 2 — split-screen (seconds). ?practice= and ?dur= override.
  TASK2_PRACTICE_SEC: 2 * 60,
  TASK2_MAIN_SEC: 10 * 60,
};
