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

function parseEquation(equation) {
  const normalized = equation.replace(/\s+/g, '');
  const parts = normalized.split('=');
  if (parts.length !== 2) return null;

  const [left, right] = parts;
  const leftMatch = left.match(/^([+-]?\d*)x([+-]\d+)?$/);
  const rightMatch = right.match(/^([+-]?\d*)x([+-]\d+)?$/);
  if (!leftMatch || !rightMatch) return null;

  const lx = coefficientFromStr(leftMatch[1]);
  const lc = constantFromStr(leftMatch[2]);
  const rx = coefficientFromStr(rightMatch[1]);
  const rc = constantFromStr(rightMatch[2]);

  return { lx, lc, rx, rc };
}

function coefficientFromStr(value) {
  if (value === '' || value === '+') return 1;
  if (value === '-') return -1;
  return Number(value);
}

function constantFromStr(value) {
  if (!value) return 0;
  return Number(value);
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

function generateEquation(difficulty) {
  const levels = {
    easy: { coeffMin: 1, coeffMax: 6, constMin: -12, constMax: 12 },
    medium: { coeffMin: 2, coeffMax: 10, constMin: -20, constMax: 20 },
    hard: { coeffMin: 3, coeffMax: 16, constMin: -40, constMax: 40 }
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
      title: 'Primo centro',
      title_en: 'First success',
      title_es: 'Primer acierto'
    },
    {
      id: 'streak_5',
      unlocked: bestStreak >= 5,
      title: 'Serie da 5',
      title_en: '5-win streak',
      title_es: 'Racha de 5'
    },
    {
      id: 'solver_25',
      unlocked: solved.length >= 25,
      title: 'Risolutrice esperta',
      title_en: 'Expert solver',
      title_es: 'Resolutora experta'
    },
    {
      id: 'hard_10',
      unlocked: solvedByDiff.hard >= 10,
      title: 'Maestra hard',
      title_en: 'Hard mode master',
      title_es: 'Maestra modo difícil'
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
  const a = parsed.lx - parsed.rx;
  const b = parsed.rc - parsed.lc;

  return [
    `Partenza: ${formatLinear(parsed.lx, parsed.lc)} = ${formatLinear(parsed.rx, parsed.rc)}`,
    `Porto i termini con x a sinistra e i termini noti a destra: (${parsed.lx} - ${parsed.rx})x = ${parsed.rc} - (${parsed.lc})`,
    `Ottengo: ${a}x = ${b}`,
    `Divido entrambi i membri per ${a}: x = ${b} / ${a}`,
    `Risultato: x = ${trimFloat(b / a)}`
  ];
}

function formatLinear(coeff, constant) {
  const left = `${coeff === 1 ? '' : coeff === -1 ? '-' : coeff}x`;
  if (constant > 0) return `${left} + ${constant}`;
  if (constant < 0) return `${left} - ${Math.abs(constant)}`;
  return left;
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

  const parsed = parseEquation(String(equation || ''));
  if (!parsed) return res.status(400).json({ error: 'invalid_equation_format' });

  const expected = solveParsed(parsed);
  if (expected === null) return res.status(400).json({ error: 'no_single_solution' });

  const answerNum = Number(String(userAnswer).replace(',', '.'));
  if (!Number.isFinite(answerNum)) return res.status(400).json({ error: 'invalid_answer' });

  const leftValue = evaluateSide(parsed.lx, parsed.lc, answerNum);
  const rightValue = evaluateSide(parsed.rx, parsed.rc, answerNum);

  const equal = Math.abs(leftValue - rightValue) < 1e-9;
  const correct = Math.abs(answerNum - expected) < 1e-9;

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
  const parsed = parseEquation(String(equation || ''));
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
