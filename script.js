const largeNums = [25, 50, 75, 100];
const smallNums = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10];
let currentNumbers = [];
let targetNumber = 0;
let timerInterval;
let timeLeft = 30;

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

