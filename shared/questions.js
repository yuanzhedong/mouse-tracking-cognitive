/* Shared math question bank for the task battery.
   Fixed 30-item bank (easy → medium → challenge). Questions are served in
   bank order on the first pass, then reshuffled for subsequent passes.
   Multiple-choice options are generated as answer ± 1..4 (unique). */

const MATH_BANK = [
  { id:  1, level: 'easy',      text: '7 + 8 = ?',            answer: 15 },
  { id:  2, level: 'easy',      text: '14 − 6 = ?',           answer: 8 },
  { id:  3, level: 'easy',      text: '6 × 4 = ?',            answer: 24 },
  { id:  4, level: 'easy',      text: '35 ÷ 5 = ?',           answer: 7 },
  { id:  5, level: 'easy',      text: '25 + 17 = ?',          answer: 42 },
  { id:  6, level: 'easy',      text: '60 − 24 = ?',          answer: 36 },
  { id:  7, level: 'easy',      text: 'half of 30 = ?',       answer: 15 },
  { id:  8, level: 'easy',      text: '10% of 70 = ?',        answer: 7 },
  { id:  9, level: 'easy',      text: 'double 16 = ?',        answer: 32 },
  { id: 10, level: 'easy',      text: 'x + 4 = 11,  x = ?',   answer: 7 },
  { id: 11, level: 'medium',    text: '6 × 7 − 10 = ?',       answer: 32 },
  { id: 12, level: 'medium',    text: '20 ÷ 4 + 9 = ?',       answer: 14 },
  { id: 13, level: 'medium',    text: '5 + 3 × 4 = ?',        answer: 17 },
  { id: 14, level: 'medium',    text: '50% of 48 = ?',        answer: 24 },
  { id: 15, level: 'medium',    text: '25% of 40 = ?',        answer: 10 },
  { id: 16, level: 'medium',    text: '10% of 250 = ?',       answer: 25 },
  { id: 17, level: 'medium',    text: '3 + (−8) = ?',         answer: -5 },
  { id: 18, level: 'medium',    text: '2x = 18,  x = ?',      answer: 9 },
  { id: 19, level: 'medium',    text: 'x − 7 = 12,  x = ?',   answer: 19 },
  { id: 20, level: 'medium',    text: '3x = 24,  x = ?',      answer: 8 },
  { id: 21, level: 'challenge', text: '15% of 60 = ?',        answer: 9 },
  { id: 22, level: 'challenge', text: '2x + 3 = 15,  x = ?',  answer: 6 },
  { id: 23, level: 'challenge', text: '4² + 5 = ?',           answer: 21 },
  { id: 24, level: 'challenge', text: '√64 = ?',              answer: 8 },
  { id: 25, level: 'challenge', text: '17 × 6 = ?',           answer: 102 },
  { id: 26, level: 'challenge', text: '45 − 3 × 9 = ?',       answer: 18 },
  { id: 27, level: 'challenge', text: '20% of 35 = ?',        answer: 7 },
  { id: 28, level: 'challenge', text: '5x − 4 = 26,  x = ?',  answer: 6 },
  { id: 29, level: 'challenge', text: '3³ = ?',               answer: 27 },
  { id: 30, level: 'challenge', text: '84 ÷ 7 = ?',           answer: 12 },
];

const QuestionBank = (() => {
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let queue = MATH_BANK.slice();   // first pass: bank order (easy → challenge)

  function next(){
    if (queue.length === 0) queue = shuffle(MATH_BANK);
    const q = queue.shift();
    const opts = new Set([q.answer]);
    while (opts.size < 4){
      opts.add(q.answer + randInt(1, 4) * (Math.random() < 0.5 ? -1 : 1));
    }
    return { ...q, options: shuffle([...opts]) };
  }

  function reset(){
    queue = MATH_BANK.slice();
  }

  return { next, reset };
})();
