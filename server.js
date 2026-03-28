const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function transportAvailable() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendVerificationEmail(email, code) {
  if (!transportAvailable()) {
    console.log(`[DEV] Codice verifica per ${email}: ${code}`);
    return { delivered: false };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'EquaCoach <no-reply@equacoach.local>',
    to: email,
    subject: 'Codice verifica account EquaCoach',
    text: `Il tuo codice temporaneo e: ${code} (valido 10 minuti).`,
    html: `<p>Il tuo codice temporaneo e <strong>${code}</strong> (valido 10 minuti).</p>`
  });

  return { delivered: true };
}

// ─── Numeri razionali ────────────────────────────────────────────────────────
function gcd(a, b) {
  a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function lcm(a, b) { return (a * b) / gcd(a, b); }
function rat(n, d = 1) {
  n = Math.round(n); d = Math.round(d);
  if (d === 0) return { n: 0, d: 1 };
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d);
  return { n: n / g, d: d / g };
}
function ratAdd(a, b) { return rat(a.n * b.d + b.n * a.d, a.d * b.d); }
function ratSub(a, b) { return rat(a.n * b.d - b.n * a.d, a.d * b.d); }
function ratMul(a, b) { return rat(a.n * b.n, a.d * b.d); }
function ratDiv(a, b) { if (b.n === 0) return null; return rat(a.n * b.d, a.d * b.n); }
function ratStr(r) { return r.d === 1 ? String(r.n) : `${r.n}/${r.d}`; }
function ratToFloat(r) { return r.n / r.d; }

// ─── Parser robusto (supporta frazioni ax/b) ─────────────────────────────────
function parseSideRobust(expr) {
  expr = expr.replace(/\s+/g, '');
  if (expr[0] !== '-') expr = '+' + expr;
  const tokenRegex = /([+-])(\d*)(?:(x)(?:\/(\d+))?\/?(\d+)?|(\/(\d+)))?/g;
  // Simplified tokenizer: match each signed term
  const termRegex = /([+-])(\d+)?(x)?(?:\/(\d+))?/g;
  let xCoeff = rat(0);
  let constant = rat(0);
  let m;
  // Reset and re-tokenize
  const clean = expr;
  // Use a manual walk instead of unreliable regex backtracking
  let i = 0;
  while (i < clean.length) {
    if (clean[i] !== '+' && clean[i] !== '-') { i++; continue; }
    const sign = clean[i] === '-' ? -1 : 1;
    i++;
    let numStr = '';
    while (i < clean.length && /\d/.test(clean[i])) { numStr += clean[i++]; }
    const hasX = clean[i] === 'x';
    if (hasX) i++;
    let xDen = 1;
    if (clean[i] === '/') {
      i++;
      let denStr = '';
      while (i < clean.length && /\d/.test(clean[i])) { denStr += clean[i++]; }
      xDen = denStr ? Number(denStr) : 1;
    }
    if (hasX) {
      const num = numStr ? Number(numStr) : 1;
      xCoeff = ratAdd(xCoeff, rat(sign * num, xDen));
    } else if (numStr) {
      const num = Number(numStr);
      // xDen here is actually a constant denominator (e.g. +3/2 constant)
      constant = ratAdd(constant, rat(sign * num, xDen));
    }
  }
  return { xR: xCoeff, cR: constant };
}

function parseEquationRobust(equation) {
  const normalized = equation.replace(/\s+/g, '');
  const eqIdx = normalized.indexOf('=');
  if (eqIdx < 0) return null;
  const left = parseSideRobust(normalized.slice(0, eqIdx));
  const right = parseSideRobust(normalized.slice(eqIdx + 1));
  if (!left || !right) return null;
  return {
    lx: ratToFloat(left.xR), lc: ratToFloat(left.cR),
    rx: ratToFloat(right.xR), rc: ratToFloat(right.cR),
    lxR: left.xR, lcR: left.cR, rxR: right.xR, rcR: right.cR
  };
}

function parseUserAnswer(str) {
  str = String(str || '').replace(',', '.').trim();
  if (str.includes('/')) {
    const [num, den] = str.split('/').map((s) => Number(s.trim()));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return NaN;
    return num / den;
  }
  return Number(str);
}

function solveParsed(parsed) {
  const a = parsed.lx - parsed.rx;
  const b = parsed.rc - parsed.lc;
  if (a === 0) return null;
  return b / a;
}

function evaluateSide(coeffX, constant, xValue) {
  return coeffX * xValue + constant;
}

// ─── Formattazione display termini razionali ─────────────────────────────────
function formatXTermR(r) {
  if (r.n === 0) return null;
  const sign = r.n < 0 ? '-' : '';
  const absN = Math.abs(r.n);
  if (r.d === 1) { return absN === 1 ? `${sign}x` : `${sign}${absN}x`; }
  return absN === 1 ? `${sign}x/${r.d}` : `${sign}${absN}x/${r.d}`;
}
function formatConstR(r) {
  if (r.n === 0) return null;
  return r.d === 1 ? String(r.n) : `${r.n}/${r.d}`;
}
function formatSideR(xR, cR) {
  const xPart = formatXTermR(xR);
  const cPart = formatConstR(cR);
  if (!xPart && cPart === null) return '0';
  if (!xPart) return cPart;
  if (cPart === null) return xPart;
  const cVal = ratToFloat(cR);
  if (cVal > 0) return `${xPart} + ${cPart}`;
  return `${xPart} - ${formatConstR(rat(-cR.n, cR.d))}`;
}

function generateEquation(difficulty) {
  if (difficulty === 'hard') return generateHardEquation();

  const levels = {
    easy: { coeffMin: 1, coeffMax: 6, constMin: -12, constMax: 12 },
    medium: { coeffMin: 2, coeffMax: 10, constMin: -20, constMax: 20 }
  };
  const cfg = levels[difficulty] || levels.easy;

  while (true) {
    const lx = randomNonZero(cfg.coeffMin, cfg.coeffMax);
    const rx = randomNonZero(cfg.coeffMin, cfg.coeffMax);
    if (lx === rx) continue;
    const lc = randomInt(cfg.constMin, cfg.constMax);
    const rc = randomInt(cfg.constMin, cfg.constMax);
    const x = (rc - lc) / (lx - rx);
    if (!Number.isFinite(x)) continue;
    if (Math.abs(x) > 100) continue;
    const equation = `${formatCoeff(lx)}x${formatConst(lc)} = ${formatCoeff(rx)}x${formatConst(rc)}`;
    return { equation, solution: x };
  }
}

function generateHardEquation() {
  const denoms = [2, 3, 4, 6];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  while (true) {
    const b = pick(denoms);
    const f = pick(denoms);
    const a = randomNonZero(1, 5);
    const e = randomNonZero(1, 5);

    const lxR = rat(a, b);
    const rxR = rat(e, f);
    // verifica lx != rx
    if (lxR.n * rxR.d === rxR.n * lxR.d) continue;

    const lc = randomInt(-8, 8);
    const rc = randomInt(-8, 8);
    const lcR = rat(lc);
    const rcR = rat(rc);

    const diffX = ratSub(lxR, rxR);
    const diffC = ratSub(rcR, lcR);
    const xSol = ratDiv(diffC, diffX);
    if (!xSol) continue;
    const xFloat = ratToFloat(xSol);
    if (!Number.isFinite(xFloat)) continue;
    if (Math.abs(xFloat) > 30) continue;

    const lxDisp = formatXTermR(lxR) || '0';
    const rxDisp = formatXTermR(rxR) || '0';
    const equation = `${lxDisp}${formatConst(lc)} = ${rxDisp}${formatConst(rc)}`;
    return { equation, solution: xFloat, type: 'hard' };
  }
}

function formatCoeff(value) {
  if (value === 1) return '';
  if (value === -1) return '-';
  return String(value);
}

function formatConst(value) {
  if (value > 0) return ` + ${value}`;
  if (value < 0) return ` - ${Math.abs(value)}`;
  return '';
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNonZero(min, max) {
  let n = 0;
  while (n === 0) {
    n = randomInt(min, max);
    if (Math.random() < 0.5) n *= -1;
  }
  return n;
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'missing_token' });

  const db = readDb();
  const session = db.sessions.find((s) => s.token === token && s.expiresAt > Date.now());
  if (!session) return res.status(401).json({ error: 'invalid_token' });

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return res.status(401).json({ error: 'user_not_found' });

  req.user = user;
  req.db = db;
  req.session = session;
  next();
}

function computeUserStats(db, userId) {
  const attempts = db.attempts.filter((a) => a.userId === userId);
  const solved = attempts.filter((a) => a.correct);

  let streak = 0;
  let bestStreak = 0;
  const ordered = [...attempts].sort((a, b) => a.createdAt - b.createdAt);
  for (const att of ordered) {
    if (att.correct) {
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
    }
  }

  const solvedByDiff = {
    easy: solved.filter((a) => a.difficulty === 'easy').length,
    medium: solved.filter((a) => a.difficulty === 'medium').length,
    hard: solved.filter((a) => a.difficulty === 'hard').length
  };

  const points = solved.reduce((sum, s) => {
    const weight = s.difficulty === 'hard' ? 3 : s.difficulty === 'medium' ? 2 : 1;
    return sum + weight;
  }, 0);

  const achievements = [
    {
      id: 'first_win',
      unlocked: solved.length >= 1,
      title: '🦸 Super Esordiente — Prima equazione risolta!',
      title_en: '🦸 Super Rookie — First equation solved!',
      title_es: '🦸 Super Novata — ¡Primera ecuación resuelta!'
    },
    {
      id: 'streak_5',
      unlocked: bestStreak >= 5,
      title: '⚡ Super Flash — 5 risposte giuste di fila!',
      title_en: '⚡ Super Flash — 5 correct answers in a row!',
      title_es: '⚡ Super Flash — ¡5 respuestas correctas seguidas!'
    },
    {
      id: 'solver_25',
      unlocked: solved.length >= 25,
      title: '🌟 Super Hero — 25 equazioni risolte!',
      title_en: '🌟 Super Hero — 25 equations solved!',
      title_es: '🌟 Super Héroe — ¡25 ecuaciones resueltas!'
    },
    {
      id: 'hard_10',
      unlocked: solvedByDiff.hard >= 10,
      title: '💥 Ultra Super Hero — 10 frazioni dominate!',
      title_en: '💥 Ultra Super Hero — 10 hard fractions mastered!',
      title_es: '💥 Ultra Super Héroe — ¡10 fracciones dominadas!'
    }
  ];

  return {
    attempts: attempts.length,
    solved: solved.length,
    accuracy: attempts.length ? Math.round((solved.length / attempts.length) * 100) : 0,
    bestStreak,
    solvedByDiff,
    points,
    achievements
  };
}

function buildStepByStep(parsed) {
  // Usa campi razionali se disponibili (da parseEquationRobust), altrimenti ricava
  const lxR = parsed.lxR || rat(parsed.lx);
  const lcR = parsed.lcR || rat(parsed.lc);
  const rxR = parsed.rxR || rat(parsed.rx);
  const rcR = parsed.rcR || rat(parsed.rc);

  const leftSide = formatSideR(lxR, lcR);
  const rightSide = formatSideR(rxR, rcR);
  const steps = [];
  steps.push(`Partenza: ${leftSide} = ${rightSide}`);

  const hasFractions = [lxR, lcR, rxR, rcR].some((r) => r.d > 1);
  let wLx = lxR, wLc = lcR, wRx = rxR, wRc = rcR;

  if (hasFractions) {
    const allDens = [lxR.d, lcR.d, rxR.d, rcR.d];
    const LCD = allDens.reduce((acc, d) => lcm(acc, d), 1);
    const uniqueDens = [...new Set(allDens.filter((d) => d > 1))].join(', ');
    steps.push(`Individuazione del Minimo Comune Multiplo (MCM) tra i denominatori ${uniqueDens}: MCM = ${LCD}`);
    steps.push(`Moltiplico tutti i termini per ${LCD} per eliminare le frazioni:`);
    const lcdR = rat(LCD);
    wLx = ratMul(lxR, lcdR); wLc = ratMul(lcR, lcdR);
    wRx = ratMul(rxR, lcdR); wRc = ratMul(rcR, lcdR);
    steps.push(`${formatSideR(wLx, wLc)} = ${formatSideR(wRx, wRc)}`);
  }

  const a = ratSub(wLx, wRx); // coefficiente: lx - rx
  const b = ratSub(wRc, wLc); // costante: rc - lc

  steps.push(`Porto i termini con x a sinistra e i termini noti a destra:`);
  steps.push(`(${ratStr(wLx)} - ${ratStr(wRx)})x = ${ratStr(wRc)} - (${ratStr(wLc)})`);
  steps.push(`${ratStr(a)}x = ${ratStr(b)}`);

  const xSol = ratDiv(b, a);
  if (!xSol) {
    steps.push('Equazione impossibile o indeterminata.');
    return steps;
  }

  steps.push(`Divido entrambi i membri per ${ratStr(a)}:`);
  const xFloat = ratToFloat(xSol);
  if (xSol.d > 1) {
    steps.push(`x = ${ratStr(b)} ÷ ${ratStr(a)} = ${ratStr(xSol)} ≈ ${trimFloat(xFloat)}`);
  } else {
    steps.push(`x = ${ratStr(b)} ÷ ${ratStr(a)} = ${ratStr(xSol)}`);
  }
  steps.push(`✅ Risultato: x = ${ratStr(xSol)}`);
  return steps;
}

function trimFloat(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1000) / 1000);
}

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, nickname, avatar } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const cleanEmail = normalizeEmail(email);
  const db = readDb();

  if (db.users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ error: 'email_exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  db.users.push({
    id: userId,
    email: cleanEmail,
    passwordHash,
    nickname: String(nickname).trim(),
    avatar: avatar || '',
    verified: false,
    createdAt: Date.now()
  });

  const code = generateCode();
  db.verificationCodes = db.verificationCodes.filter((v) => v.email !== cleanEmail);
  db.verificationCodes.push({
    id: uuidv4(),
    email: cleanEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  writeDb(db);

  try {
    const result = await sendVerificationEmail(cleanEmail, code);
    return res.json({ ok: true, mailSent: result.delivered, devCode: result.delivered ? undefined : code });
  } catch (err) {
    return res.status(500).json({ error: 'mail_error', detail: err.message });
  }
});

app.post('/api/auth/resend-code', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = normalizeEmail(email);
  const db = readDb();
  const user = db.users.find((u) => u.email === cleanEmail);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const code = generateCode();
  db.verificationCodes = db.verificationCodes.filter((v) => v.email !== cleanEmail);
  db.verificationCodes.push({
    id: uuidv4(),
    email: cleanEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000
  });
  writeDb(db);

  try {
    const result = await sendVerificationEmail(cleanEmail, code);
    return res.json({ ok: true, mailSent: result.delivered, devCode: result.delivered ? undefined : code });
  } catch (err) {
    return res.status(500).json({ error: 'mail_error', detail: err.message });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { email, code } = req.body;
  const cleanEmail = normalizeEmail(email);

  const db = readDb();
  const record = db.verificationCodes.find((v) => v.email === cleanEmail && v.code === String(code));
  if (!record) return res.status(400).json({ error: 'invalid_code' });
  if (record.expiresAt < Date.now()) return res.status(400).json({ error: 'expired_code' });

  const user = db.users.find((u) => u.email === cleanEmail);
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  user.verified = true;
  db.verificationCodes = db.verificationCodes.filter((v) => v.email !== cleanEmail);
  writeDb(db);

  return res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = normalizeEmail(email);

  const db = readDb();
  const user = db.users.find((u) => u.email === cleanEmail);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });

  const isOk = await bcrypt.compare(password || '', user.passwordHash);
  if (!isOk) return res.status(401).json({ error: 'invalid_credentials' });
  if (!user.verified) return res.status(403).json({ error: 'not_verified' });

  const token = uuidv4();
  db.sessions.push({
    token,
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  writeDb(db);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar
    }
  });
});

app.get('/api/profile', auth, (req, res) => {
  const stats = computeUserStats(req.db, req.user.id);
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      nickname: req.user.nickname,
      avatar: req.user.avatar
    },
    stats
  });
});

app.put('/api/profile', auth, (req, res) => {
  const { nickname, avatar } = req.body;
  if (nickname) req.user.nickname = String(nickname).trim();
  if (typeof avatar === 'string') req.user.avatar = avatar;
  writeDb(req.db);

  return res.json({
    ok: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      nickname: req.user.nickname,
      avatar: req.user.avatar
    }
  });
});

app.post('/api/equation/new', auth, (req, res) => {
  const difficulty = String(req.body?.difficulty || 'easy');
  const generated = generateEquation(difficulty);

  return res.json({
    prompt: 'Nuova equazione AI generata',
    equation: generated.equation,
    difficulty,
    hiddenSolution: generated.solution
  });
});

app.post('/api/equation/check', auth, (req, res) => {
  const { equation, userAnswer, difficulty } = req.body;

  const parsed = parseEquationRobust(String(equation || ''));
  if (!parsed) return res.status(400).json({ error: 'invalid_equation_format' });

  const expected = solveParsed(parsed);
  if (expected === null) return res.status(400).json({ error: 'no_single_solution' });

  const answerNum = parseUserAnswer(userAnswer);
  if (!Number.isFinite(answerNum)) return res.status(400).json({ error: 'invalid_answer' });

  const leftValue = evaluateSide(parsed.lx, parsed.lc, answerNum);
  const rightValue = evaluateSide(parsed.rx, parsed.rc, answerNum);

  const equal = Math.abs(leftValue - rightValue) < 1e-6;
  const correct = Math.abs(answerNum - expected) < 1e-6;

  // Calcola soluzione in forma razionale per display
  const diffX = ratSub(parsed.lxR, parsed.rxR);
  const diffC = ratSub(parsed.rcR, parsed.lcR);
  const xSolR = ratDiv(diffC, diffX);
  const expectedStr = xSolR ? ratStr(xSolR) : trimFloat(expected);

  req.db.attempts.push({
    id: uuidv4(),
    userId: req.user.id,
    equation,
    difficulty: difficulty || 'easy',
    userAnswer: answerNum,
    expectedAnswer: expected,
    correct,
    verification: {
      leftValue,
      rightValue,
      equal
    },
    createdAt: Date.now()
  });
  writeDb(req.db);

  return res.json({
    correct,
    expectedAnswer: expected,
    expectedAnswerStr: expectedStr,
    verification: {
      leftValue,
      rightValue,
      equal
    },
    canViewSteps: true
  });
});

app.post('/api/equation/steps', auth, (req, res) => {
  const { equation } = req.body;
  const parsed = parseEquationRobust(String(equation || ''));
  if (!parsed) return res.status(400).json({ error: 'invalid_equation_format' });

  const steps = buildStepByStep(parsed);
  return res.json({ steps });
});

app.get('/api/ranking', auth, (req, res) => {
  const db = req.db;

  const usersScores = db.users
    .filter((u) => u.verified)
    .map((u) => {
      const stats = computeUserStats(db, u.id);
      return {
        userId: u.id,
        nickname: u.nickname,
        avatar: u.avatar,
        points: stats.points,
        solved: stats.solved,
        accuracy: stats.accuracy,
        bestStreak: stats.bestStreak
      };
    })
    .sort((a, b) => b.points - a.points);

  const personal = usersScores.find((u) => u.userId === req.user.id) || {
    userId: req.user.id,
    nickname: req.user.nickname,
    avatar: req.user.avatar,
    points: 0,
    solved: 0,
    accuracy: 0,
    bestStreak: 0
  };

  const allPoints = usersScores.map((u) => u.points);
  const average = allPoints.length ? Math.round(allPoints.reduce((a, b) => a + b, 0) / allPoints.length) : 0;
  const max = allPoints.length ? Math.max(...allPoints) : 0;

  return res.json({
    personal,
    leaderboard: usersScores.slice(0, 20),
    benchmark: {
      average,
      max
    },
    achievements: computeUserStats(db, req.user.id).achievements
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'equacoach' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EquaCoach in ascolto su http://localhost:${PORT}`);
});
