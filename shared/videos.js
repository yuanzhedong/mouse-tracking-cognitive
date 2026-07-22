/* Task 2 video playlist — YouTube video IDs with categories.
   Edit this file to change the playlist; task2/index.html loads it as-is
   and shuffles the order per session.
   Original URLs were youtube.com/shorts/<id> (one youtube.com/watch?v=<id>).
   Every id was verified to play in the embedded IFrame player (2026-07-21);
   five ids from the original list were dropped for embed error 150
   (owner disallows embedding): UtVyBIOWvwQ, aaA3qhC79sg, kdPgAM002jQ,
   ptuDLn_lutA, qtC4yf6GPqA. */

const VIDEOS = [
  { cat: 'Sports',     id: 'uWdb4qbsQFw' },
  { cat: 'Sports',     id: 'inRT_1UW3MA' },
  { cat: 'Sports',     id: 'C2pyOAe-iGo' },
  { cat: 'Sports',     id: '5X4v-T6sxv0' },
  { cat: 'Sports',     id: '5f8slUpj8Tc' },
  { cat: 'Sports',     id: 'rsJ4lwOk81M' },
  { cat: 'Sports',     id: 'RQIy6_1N3N4' },
  { cat: 'Sports',     id: '3dr7PQAV4_s' },
  { cat: 'Animals',    id: '3Q5R0ePFTqI' },
  { cat: 'Animals',    id: '84_RaEfzmec' },
  { cat: 'Animals',    id: 'DEyhNXVCmDo' },
  { cat: 'Animals',    id: 'S0aa-9mysSw' },
  { cat: 'Animals',    id: 'a__yNRAxKpw' },
  { cat: 'Animals',    id: 'ipieZmxqRtE' },
  { cat: 'Animals',    id: 'pRD6GskW5XA' },
  { cat: 'Satisfying', id: '6KOyj9_dA8Y' },
  { cat: 'Satisfying', id: 'SRNUksuwQHc' },
  { cat: 'Satisfying', id: '4PpNDrEQUwo' },
];
