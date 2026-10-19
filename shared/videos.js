/* Task 2 video playlist — YouTube video IDs with categories.
   Edit this file to change the playlist; task2/index.html loads it as-is
   and shuffles the order per session.
   `n` is the row number in the team's video review sheet (2026-10-19).
   Every id was verified to play in the embedded IFrame player (2026-10-19);
   four rows from the sheet were dropped for embed error 150 (owner
   disallows embedding): #35 UtVyBIOWvwQ, #36 aaA3qhC79sg,
   #41 ptuDLn_lutA, #43 qtC4yf6GPqA.
   Notes from Karine's review: #7 (Jooj Natu) may skew too young for 15–17;
   #32 is the same channel as #31, which she flagged as English. */

const VIDEOS = [
  { n: 5,  cat: 'Humor',   id: 'StxXSPG2_N0' },  // Oli Natu — friend who checks with mom
  { n: 6,  cat: 'Humor',   id: '-_USSkS1hOc' },  // Gustta Shoow — fake iPhone
  { n: 7,  cat: 'Humor',   id: 'Qe4Q6jq3QS4' },  // Jooj Natu — siblings
  { n: 8,  cat: 'Humor',   id: 'on7aVQjAnLk' },  // Oli Natu — being late
  { n: 9,  cat: 'Humor',   id: 'j4ylgPc-wwM' },  // Gustta Shoow / Gahh — reactions
  { n: 11, cat: 'Humor',   id: 'IEZWbuQBZM4' },  // Sofia Santino — everyday mishaps
  { n: 10, cat: 'Games',   id: 'hmXBEC20sfs' },  // T3ddy — gaming reactions
  { n: 13, cat: 'Games',   id: '4KfA3rfFdUw' },  // Julia MineGirl — Roblox
  { n: 14, cat: 'Games',   id: 'EWrREqByCCA' },  // Julia MineGirl / Tex HS — with parents
  { n: 16, cat: 'Games',   id: 'vVJJdyW5jHI' },  // Creative Squad — chaotic friend
  { n: 17, cat: 'Games',   id: 'taCFAIL4Ydc' },  // Creative Squad — hide-and-seek
  { n: 18, cat: 'Games',   id: 'X8e9CG-QlWI' },  // Creative Squad — no letter A
  { n: 21, cat: 'KPop',    id: '44TnXWGlDfY' },  // Stray Kids — Chk Chk Boom
  { n: 22, cat: 'KPop',    id: 'bUKF6rpeqaA' },  // ILLIT — Magnetic teaser
  { n: 23, cat: 'KPop',    id: 'VyqV-fRB3Yo' },  // TWICE — What is Love? teaser
  { n: 25, cat: 'Fantasy', id: 'CWoAuS6KfkI' },  // Greek gods as Brazilians
  { n: 26, cat: 'Fantasy', id: 'pg26EHk8qyU' },  // Hermes, Dionysus' babysitter
  { n: 27, cat: 'Fantasy', id: 'RqlF5oq9oEk' },  // Disney Jr. — Hercules meets Pegasus
  { n: 28, cat: 'Fantasy', id: '--aK-TJ-pNA' },  // Tanuki transformation
  { n: 29, cat: 'Fantasy', id: 'xRo3TO2ahVc' },  // Yae Miko PT-BR fandub
  { n: 30, cat: 'Fantasy', id: 'j9nUZvuSTOo' },  // Tsukumogami stories
  { n: 32, cat: 'Sports',  id: 'inRT_1UW3MA' },  // Chelsea — Estêvão
  { n: 37, cat: 'Sports',  id: '5f8slUpj8Tc' },  // Neymar — training goal
  { n: 38, cat: 'Sports',  id: 'rsJ4lwOk81M' },  // Neymar — golaço
  { n: 42, cat: 'Sports',  id: '3dr7PQAV4_s' },  // Rayssa — world skate champion
];

/* Category names shown to participants. */
const VIDEO_CAT_LABELS = {
  Humor:   { en: 'Comedy',  pt: 'Humor' },
  Games:   { en: 'Games',   pt: 'Games' },
  KPop:    { en: 'K-pop',   pt: 'K-pop' },
  Fantasy: { en: 'Fantasy', pt: 'Fantasia' },
  Sports:  { en: 'Sports',  pt: 'Esportes' },
};
