const largeNums = [25, 50, 75, 100];
const smallNums = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10];
let currentNumbers = [];
let targetNumber = 0;
let timerInterval;
let timeLeft = 30;
const themeAudio = document.getElementById('themeAudio');
const themeToggle = document.getElementById('themeToggle');

const vowels = (
  'AAAAAAAAAAAAAAEEEEEEEEEEEEEEEEEEEIIIIIIIIIIIOOOOOOOOOOOOUUUUU'
).split('');
const consonants = (
  'BBCCDDDFFGGHHJKLLLLMMMNNNNNNNPPQRRRRRRRSSSSSSSSTTTTTTTVVWWXYYZ'
).split('');
const vowelsTamil = 'அஆஇஈஉஊஎஏஐஒஓஔ'.repeat(2).split('');
const consonantsTamil = 'கஙசஞடணதநபமயரலவழளறன'.repeat(2).split('');
const vowelSigns = ['', 'ா','ி','ீ','ு','ூ','ெ','ே','ை','ொ','ோ','ௌ'];
const uyirmeiTamil = [];
consonantsTamil.forEach(c => {
  vowelSigns.forEach(v => uyirmeiTamil.push(c + v));
});
let lettersTamil = false;
let currentLetters = [];
let vowelCount = 0;
let consonantCount = 0;
let lettersTimerInterval;
let lettersTimeLeft = 30;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function startGame() {
  const largeCount = parseInt(document.getElementById('largeCount').value, 10);
  if (isNaN(largeCount) || largeCount < 0 || largeCount > 4) {
    alert('Please enter a number between 0 and 4');
    return;
  }
  const lnums = [...largeNums];
  const snums = [...smallNums];
  shuffle(lnums);
  shuffle(snums);
  currentNumbers = lnums.slice(0, largeCount).concat(snums.slice(0, 6 - largeCount));
  targetNumber = Math.floor(Math.random() * 900) + 100; // 100-999

  const tilesDiv = document.getElementById('numberTiles');
  tilesDiv.innerHTML = '';
  currentNumbers.forEach(n => {
    const d = document.createElement('div');
    d.textContent = n;
    tilesDiv.appendChild(d);
  });
  document.getElementById('target').textContent = targetNumber;

  timeLeft = 30;
  document.getElementById('timer').textContent = timeLeft;
  if (themeAudio) {
    themeAudio.currentTime = 0;
    themeAudio.play();
  }
  document.getElementById('game').classList.remove('hidden');
  document.getElementById('answerPanel').classList.add('hidden');
  document.getElementById('doneBtn').classList.add('hidden');

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;
    if (timeLeft <= 0) {
      stopTimer();
    }
  }, 1000);
  document.getElementById('doneBtn').classList.remove('hidden');
}

function stopTimer() {
  clearInterval(timerInterval);
  if (themeAudio) {
    themeAudio.pause();
    themeAudio.currentTime = 0;
  }
  document.getElementById('doneBtn').classList.add('hidden');
  document.getElementById('answerPanel').classList.remove('hidden');
}

function checkExpression() {
  const expr = document.getElementById('answer').value;
  const validRegex = /^[0-9+\-*/()\s]+$/;
  if (!validRegex.test(expr)) {
    document.getElementById('result').textContent = 'Invalid characters in expression.';
    return;
  }
  const tokens = expr.match(/[0-9]+|[+\-*/()]/g);
  if (!tokens) {
    document.getElementById('result').textContent = 'Invalid expression.';
    return;
  }
  if (!checkNumbers(tokens)) {
    document.getElementById('result').textContent = 'Expression uses invalid numbers.';
    return;
  }
  const rpn = toRPN(tokens);
  const evalResult = evalRPN(rpn);
  if (evalResult === null) {
    document.getElementById('result').textContent = 'Expression violates Countdown rules.';
    return;
  }
  const diff = Math.abs(evalResult - targetNumber);
  if (diff === 0) {
    document.getElementById('result').textContent = 'Correct!';
  } else if (diff <= 5) {
    document.getElementById('result').textContent = `Close! You are ${diff} away.`;
  } else if (diff <= 10) {
    document.getElementById('result').textContent = `Not bad, you are ${diff} away.`;
  } else {
    document.getElementById('result').textContent = `Too far. You are ${diff} away.`;
  }
}

function checkNumbers(tokens) {
  const available = {};
  currentNumbers.forEach(n => {
    available[n] = (available[n] || 0) + 1;
  });
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      const num = parseInt(t, 10);
      if (!available[num]) {
        return false;
      }
      available[num]--;
      if (available[num] < 0) return false;
    }
  }
  return true;
}

function toRPN(tokens) {
  const output = [];
  const ops = [];
  const prec = { '+':1, '-':1, '*':2, '/':2 };
  tokens.forEach(t => {
    if (/^\d+$/.test(t)) {
      output.push(t);
    } else if (t === '+' || t === '-' || t === '*' || t === '/') {
      while (ops.length && ops[ops.length-1] !== '(' && prec[ops[ops.length-1]] >= prec[t]) {
        output.push(ops.pop());
      }
      ops.push(t);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while (ops.length && ops[ops.length-1] !== '(') {
        output.push(ops.pop());
      }
      ops.pop();
    }
  });
  while (ops.length) output.push(ops.pop());
  return output;
}

function evalRPN(rpn) {
  const stack = [];
  for (const token of rpn) {
    if (/^\d+$/.test(token)) {
      stack.push(parseInt(token,10));
    } else {
      if (stack.length < 2) return null;
      const b = stack.pop();
      const a = stack.pop();
      let res;
      switch(token) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          if (res <= 0) return null;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0 || a % b !== 0) return null;
          res = a / b;
          break;
        default:
          return null;
      }
      if (res <= 0 || !Number.isInteger(res)) return null;
      stack.push(res);
    }
  }
  if (stack.length !== 1) return null;
  return stack[0];
}

function findBestSolution(numbers, target) {
  let bestDiff = Infinity;
  let bestExpr = null;

  function search(nums, exprs) {
    if (nums.length === 1) {
      const val = nums[0];
      const diff = Math.abs(target - val);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestExpr = exprs[0];
      }
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const a = nums[i];
        const b = nums[j];
        const exprA = exprs[i];
        const exprB = exprs[j];

        const restNums = nums.filter((_, idx) => idx !== i && idx !== j);
        const restExprs = exprs.filter((_, idx) => idx !== i && idx !== j);

        const push = (val, expr) => {
          restNums.push(val);
          restExprs.push(expr);
          search(restNums, restExprs);
          restNums.pop();
          restExprs.pop();
        };

        push(a + b, `(${exprA}+${exprB})`);
        if (a - b > 0) push(a - b, `(${exprA}-${exprB})`);
        if (b - a > 0) push(b - a, `(${exprB}-${exprA})`);
        push(a * b, `(${exprA}*${exprB})`);
        if (b !== 0 && a % b === 0) push(a / b, `(${exprA}/${exprB})`);
        if (a !== 0 && b % a === 0) push(b / a, `(${exprB}/${exprA})`);
      }
    }
  }

  search(numbers, numbers.map(n => n.toString()));
  return { bestDiff, bestExpr };
}

function showSolution() {
  const sol = findBestSolution(currentNumbers, targetNumber);
  document.getElementById('solution').classList.remove('hidden');
  if (sol.bestExpr) {
    const text = `Best solution (${sol.bestDiff === 0 ? 'exact' : sol.bestDiff + ' away'}): ${sol.bestExpr} = ${evalRPN(toRPN(sol.bestExpr.match(/[0-9]+|[+\-*/()]/g)))}.`;
    document.getElementById('solution').textContent = text;
  } else {
    document.getElementById('solution').textContent = 'No solution found';
  }
}

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('doneBtn').addEventListener('click', stopTimer);
document.getElementById('checkBtn').addEventListener('click', checkExpression);
document.getElementById('solutionBtn').addEventListener('click', showSolution);

function startLettersRound(tamil = false) {
  lettersTamil = tamil;
  currentLetters = [];
  vowelCount = 0;
  consonantCount = 0;
  lettersTimeLeft = 30;
  document.getElementById('lettersTiles').innerHTML = '';
  document.getElementById('lettersTimer').textContent = lettersTimeLeft;
  document.getElementById('lettersAnswerPanel').classList.add('hidden');
  document.getElementById('lettersGame').classList.remove('hidden');
  document.getElementById('lettersDoneBtn').classList.add('hidden');
  const uyirmeiBtn = document.getElementById('uyirmeiBtn');
  if (tamil) {
    uyirmeiBtn.classList.remove('hidden');
  } else {
    uyirmeiBtn.classList.add('hidden');
  }
}

function pickLetter(fromVowels, useUyirmei = false) {
  if (currentLetters.length >= 9) return;
  let pool;
  let cls;
  if (lettersTamil && useUyirmei) {
    pool = uyirmeiTamil;
    cls = 'uyirmei';
  } else if (lettersTamil) {
    pool = fromVowels ? vowelsTamil : consonantsTamil;
    cls = fromVowels ? 'vowel' : 'consonant';
  } else {
    pool = fromVowels ? vowels : consonants;
    cls = fromVowels ? 'vowel' : 'consonant';
  }
  const letter = pool[Math.floor(Math.random() * pool.length)];
  currentLetters.push(letter);
  if (useUyirmei) {
    vowelCount++;
    consonantCount++;
  } else {
    fromVowels ? vowelCount++ : consonantCount++;
  }
  const d = document.createElement('div');
  d.textContent = letter;
  d.classList.add(cls);
  document.getElementById('lettersTiles').appendChild(d);

  const remaining = 9 - currentLetters.length;
  if (remaining === 0) {
    if (vowelCount < 3) {
      for (let i = vowelCount; i < 3; i++) pickLetter(true);
    }
    if (consonantCount < 4) {
      for (let i = consonantCount; i < 4; i++) pickLetter(false);
    }
    startLettersTimer();
  } else {
    if (remaining === 3 - vowelCount) document.getElementById('consonantBtn').disabled = true;
    if (remaining === 4 - consonantCount) document.getElementById('vowelBtn').disabled = true;
  }
}

function startLettersTimer() {
  document.getElementById('vowelBtn').disabled = true;
  document.getElementById('consonantBtn').disabled = true;
  if (themeAudio) {
    themeAudio.currentTime = 0;
    themeAudio.play();
  }
  document.getElementById('lettersDoneBtn').classList.remove('hidden');
  lettersTimerInterval = setInterval(() => {
    lettersTimeLeft--;
    document.getElementById('lettersTimer').textContent = lettersTimeLeft;
    if (lettersTimeLeft <= 0) stopLettersTimer();
  }, 1000);
}

function stopLettersTimer() {
  clearInterval(lettersTimerInterval);
  if (themeAudio) {
    themeAudio.pause();
    themeAudio.currentTime = 0;
  }
  document.getElementById('lettersDoneBtn').classList.add('hidden');
  document.getElementById('lettersAnswerPanel').classList.remove('hidden');
}

function lettersUsesAvailable(word) {
  const counts = {};
  currentLetters.forEach(l => {
    counts[l] = (counts[l] || 0) + 1;
  });
  if (lettersTamil) {
    const tokens = Object.keys(counts).sort((a, b) => b.length - a.length);
    let idx = 0;
    while (idx < word.length) {
      let found = null;
      for (const t of tokens) {
        if (word.startsWith(t, idx)) {
          found = t;
          break;
        }
      }
      if (!found || !counts[found]) return false;
      counts[found]--;
      idx += found.length;
    }
    return true;
  } else {
    for (const ch of word.toUpperCase()) {
      if (!counts[ch]) return false;
      counts[ch]--;
    }
    return true;
  }
}

async function checkWord() {
  const word = document.getElementById('lettersAnswer').value.trim();
  if (!word) {
    document.getElementById('lettersResult').textContent = 'Enter a word.';
    return;
  }
  if (!lettersUsesAvailable(word)) {
    document.getElementById('lettersResult').textContent = 'Word uses invalid letters.';
    return;
  }
  if (lettersTamil) {
    document.getElementById('lettersResult').textContent = `Length ${word.length}.`;
  } else {
    let valid = false;
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (res.ok) valid = true;
    } catch (e) {}
    document.getElementById('lettersResult').textContent = valid ? `Valid word! Length ${word.length}.` : 'Word not found.';
  }
}

document.getElementById('startLettersBtn').addEventListener('click', () => startLettersRound(false));
document.getElementById('startTamilLettersBtn').addEventListener('click', () => startLettersRound(true));
document.getElementById('vowelBtn').addEventListener('click', () => pickLetter(true));
document.getElementById('consonantBtn').addEventListener('click', () => pickLetter(false));
document.getElementById('uyirmeiBtn').addEventListener('click', () => pickLetter(false, true));
document.getElementById('lettersDoneBtn').addEventListener('click', stopLettersTimer);
document.getElementById('lettersCheckBtn').addEventListener('click', checkWord);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const dark = document.body.classList.contains('dark');
    themeToggle.textContent = dark ? '☀️' : '🌙';
  });
}

