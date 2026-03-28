const state = {
  token: localStorage.getItem('equacoach_token') || '',
  user: null,
  currentEquation: '',
  currentDifficulty: 'easy',
  canShowSteps: false,
  lang: localStorage.getItem('equacoach_lang') || 'it',
  pendingVerifyEmail: ''
};

const t = {
  it: {
    subtitle: 'Allenati con le equazioni di primo grado',
    authTitle: 'Profilo studente',
    tabSignup: 'Registrazione',
    tabLogin: 'Accesso',
    emailLabel: 'Username (e-mail)',
    passLabel: 'Password',
    nickLabel: 'Nick name',
    avatarLabel: 'Foto profilo (URL oppure Base64)',
    createAccount: 'Crea account',
    verifyCode: 'Codice temporaneo',
    confirmAccount: 'Conferma account',
    resendCode: 'Reinvia codice',
    login: 'Accedi',
    logout: 'Esci',
    coachTitle: 'Allenamento equazioni',
    newEquation: 'Nuova equazione AI',
    check: 'Verifica',
    showSteps: 'Mostra soluzione passo passo',
    rankingTitle: 'Ranking e obiettivi',
    personalStats: 'Le tue performance',
    leaderboard: 'Classifica partecipanti',
    achievements: 'Premi e badge',
    difficulty: 'Difficoltà',
    easy: 'Facile',
    medium: 'Media',
    hard: 'Difficile',
    verifyPrompt: 'Inserisci il codice inviato via e-mail.',
    signedUp: 'Account creato. Controlla la e-mail e inserisci il codice.',
    verified: 'Account confermato. Ora puoi accedere.',
    wrongCredentials: 'Credenziali non valide.',
    notVerified: 'Account non verificato.',
    generated: 'Equazione generata:',
    correct: 'Corretto! Ottimo lavoro.',
    incorrect: 'Risposta non corretta.',
    verificationMath: 'Controllo sostituzione',
    left: 'Membro sinistro',
    right: 'Membro destro',
    equalYes: 'Coincidono',
    equalNo: 'Non coincidono',
    expected: 'Valore atteso',
    benchAvg: 'Media punti',
    benchMax: 'Massimo punti',
    statPoints: 'Punti',
    statSolved: 'Risolte',
    statAcc: 'Accuratezza',
    statStreak: 'Miglior serie',
    loading: 'Caricamento...',
    needEquation: 'Genera prima una nuova equazione.',
    needAnswer: 'Inserisci una risposta numerica (es: 3, -2, 3/2).',
    answerHint: 'x = (es: 3, -2, 3/2)',
    hardDesc: 'Frazioni, cambi di segno, soluzioni non intere',
    authRequired: 'Effettua accesso.',
    mailDevCode: 'Modalita sviluppo: codice',
    profileSaved: 'Profilo aggiornato.'
  },
  en: {
    subtitle: 'Practice first-degree equations',
    authTitle: 'Student profile',
    tabSignup: 'Sign up',
    tabLogin: 'Login',
    emailLabel: 'Username (e-mail)',
    passLabel: 'Password',
    nickLabel: 'Nick name',
    avatarLabel: 'Profile photo (URL or Base64)',
    createAccount: 'Create account',
    verifyCode: 'Temporary code',
    confirmAccount: 'Confirm account',
    resendCode: 'Resend code',
    login: 'Login',
    logout: 'Log out',
    coachTitle: 'Equation training',
    newEquation: 'New AI equation',
    check: 'Check',
    showSteps: 'Show step-by-step solution',
    rankingTitle: 'Ranking and goals',
    personalStats: 'Your performance',
    leaderboard: 'Participants leaderboard',
    achievements: 'Rewards and badges',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    verifyPrompt: 'Enter the code sent by e-mail.',
    signedUp: 'Account created. Check your e-mail and enter the code.',
    verified: 'Account confirmed. You can now log in.',
    wrongCredentials: 'Invalid credentials.',
    notVerified: 'Account not verified.',
    generated: 'Generated equation:',
    correct: 'Correct! Great job.',
    incorrect: 'Answer is incorrect.',
    verificationMath: 'Substitution check',
    left: 'Left side',
    right: 'Right side',
    equalYes: 'They are equal',
    equalNo: 'They are not equal',
    expected: 'Expected value',
    benchAvg: 'Average points',
    benchMax: 'Top points',
    statPoints: 'Points',
    statSolved: 'Solved',
    statAcc: 'Accuracy',
    statStreak: 'Best streak',
    loading: 'Loading...',
    needEquation: 'Generate an equation first.',
    needAnswer: 'Enter a numeric answer (e.g. 3, -2, 3/2).',
    answerHint: 'x = (e.g. 3, -2, 3/2)',
    hardDesc: 'Fractions, sign changes, non-integer solutions',
    authRequired: 'Please log in.',
    mailDevCode: 'Dev mode: code',
    profileSaved: 'Profile updated.'
  },
  es: {
    subtitle: 'Practica ecuaciones de primer grado',
    authTitle: 'Perfil de estudiante',
    tabSignup: 'Registro',
    tabLogin: 'Acceso',
    emailLabel: 'Usuario (e-mail)',
    passLabel: 'Contraseña',
    nickLabel: 'Apodo',
    avatarLabel: 'Foto de perfil (URL o Base64)',
    createAccount: 'Crear cuenta',
    verifyCode: 'Codigo temporal',
    confirmAccount: 'Confirmar cuenta',
    resendCode: 'Reenviar codigo',
    login: 'Entrar',
    logout: 'Salir',
    coachTitle: 'Entrenamiento de ecuaciones',
    newEquation: 'Nueva ecuacion AI',
    check: 'Verificar',
    showSteps: 'Mostrar solucion paso a paso',
    rankingTitle: 'Ranking y objetivos',
    personalStats: 'Tu rendimiento',
    leaderboard: 'Clasificacion de participantes',
    achievements: 'Premios e insignias',
    difficulty: 'Dificultad',
    easy: 'Facil',
    medium: 'Media',
    hard: 'Dificil',
    verifyPrompt: 'Introduce el codigo enviado por e-mail.',
    signedUp: 'Cuenta creada. Revisa tu e-mail e introduce el codigo.',
    verified: 'Cuenta confirmada. Ya puedes entrar.',
    wrongCredentials: 'Credenciales no validas.',
    notVerified: 'Cuenta no verificada.',
    generated: 'Ecuacion generada:',
    correct: 'Correcto! Muy bien.',
    incorrect: 'La respuesta no es correcta.',
    verificationMath: 'Comprobacion por sustitucion',
    left: 'Miembro izquierdo',
    right: 'Miembro derecho',
    equalYes: 'Coinciden',
    equalNo: 'No coinciden',
    expected: 'Valor esperado',
    benchAvg: 'Media de puntos',
    benchMax: 'Maximo de puntos',
    statPoints: 'Puntos',
    statSolved: 'Resueltas',
    statAcc: 'Precision',
    statStreak: 'Mejor racha',
    loading: 'Cargando...',
    needEquation: 'Primero genera una ecuacion.',
    needAnswer: 'Introduce una respuesta numerica (ej: 3, -2, 3/2).',
    answerHint: 'x = (ej: 3, -2, 3/2)',
    hardDesc: 'Fracciones, cambios de signo, soluciones no enteras',
    authRequired: 'Debes iniciar sesion.',
    mailDevCode: 'Modo desarrollo: codigo',
    profileSaved: 'Perfil actualizado.'
  }
};

const $ = (id) => document.getElementById(id);

const authSection = $('authSection');
const appSection = $('appSection');
const authMessage = $('authMessage');

function tr(key) {
  return t[state.lang][key] || key;
}

function setStatus(text, type = 'info') {
  authMessage.textContent = text;
  authMessage.style.color = type === 'error' ? 'var(--err)' : type === 'ok' ? 'var(--ok)' : 'var(--muted)';
}

function setUiLanguage() {
  $('appSubtitle').textContent = tr('subtitle');
  $('authTitle').textContent = tr('authTitle');
  $('tabSignup').textContent = tr('tabSignup');
  $('tabLogin').textContent = tr('tabLogin');
  $('labelEmailSignup').textContent = tr('emailLabel');
  $('labelPasswordSignup').textContent = tr('passLabel');
  $('labelNickname').textContent = tr('nickLabel');
  $('labelAvatar').textContent = tr('avatarLabel');
  $('signupButton').textContent = tr('createAccount');
  $('labelVerifyCode').textContent = tr('verifyCode');
  $('verifyButton').textContent = tr('confirmAccount');
  $('resendCode').textContent = tr('resendCode');
  $('labelEmailLogin').textContent = tr('emailLabel');
  $('labelPasswordLogin').textContent = tr('passLabel');
  $('loginButton').textContent = tr('login');
  $('logoutButton').textContent = tr('logout');
  $('coachTitle').textContent = tr('coachTitle');
  $('generateEquation').textContent = tr('newEquation');
  $('checkAnswer').textContent = tr('check');
  $('showSteps').textContent = tr('showSteps');
  $('rankingTitle').textContent = tr('rankingTitle');
  $('personalStatsTitle').textContent = tr('personalStats');
  $('leaderboardTitle').textContent = tr('leaderboard');
  $('achievementsTitle').textContent = tr('achievements');
  $('difficultyLabel').textContent = tr('difficulty');

  const difficultySelect = $('difficultySelect');
  difficultySelect.options[0].text = tr('easy');
  difficultySelect.options[1].text = tr('medium');
  difficultySelect.options[2].text = tr('hard');
}

function showSignupTab() {
  $('tabSignup').classList.add('active');
  $('tabLogin').classList.remove('active');
  $('signupForm').classList.remove('hidden');
  $('loginForm').classList.add('hidden');
  $('verifyForm').classList.add('hidden');
}

function showLoginTab() {
  $('tabLogin').classList.add('active');
  $('tabSignup').classList.remove('active');
  $('signupForm').classList.add('hidden');
  $('verifyForm').classList.add('hidden');
  $('loginForm').classList.remove('hidden');
}

async function api(path, method = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

function setAppVisible(isLoggedIn) {
  authSection.classList.toggle('hidden', isLoggedIn);
  appSection.classList.toggle('hidden', !isLoggedIn);
}

function setUserProfile(user) {
  state.user = user;
  $('profileNick').textContent = user.nickname;
  $('profileMail').textContent = user.email;
  $('profileAvatar').src = user.avatar || 'https://placehold.co/120x120?text=EQ';
}

async function loadProfileAndRanking() {
  const profile = await api('/api/profile');
  setUserProfile(profile.user);

  const stats = profile.stats;
  $('personalStats').innerHTML = [
    miniCard(tr('statPoints'), stats.points),
    miniCard(tr('statSolved'), stats.solved),
    miniCard(tr('statAcc'), `${stats.accuracy}%`),
    miniCard(tr('statStreak'), stats.bestStreak)
  ].join('');

  const ranking = await api('/api/ranking');
  $('benchmarks').innerHTML = [
    miniCard(tr('benchAvg'), ranking.benchmark.average),
    miniCard(tr('benchMax'), ranking.benchmark.max)
  ].join('');

  $('leaderboard').innerHTML = ranking.leaderboard
    .map((item, idx) => `
      <li>
        <div class="rank-line">
          <span>#${idx + 1} ${escapeHtml(item.nickname)}</span>
          <strong>${item.points}</strong>
        </div>
        <small>${item.solved} ${tr('statSolved').toLowerCase()} · ${item.accuracy}%</small>
      </li>
    `)
    .join('') || '<li>-</li>';

  $('achievements').innerHTML = ranking.achievements
    .map((a) => {
      const title = state.lang === 'en' ? a.title_en : state.lang === 'es' ? a.title_es : a.title;
      return `<li class="${a.unlocked ? 'badge-on' : 'badge-off'}">${escapeHtml(title)}</li>`;
    })
    .join('');
}

function miniCard(label, value) {
  return `<div class="mini-card"><small>${escapeHtml(String(label))}</small><b>${escapeHtml(String(value))}</b></div>`;
}

function escapeHtml(str) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

$('tabSignup').addEventListener('click', showSignupTab);
$('tabLogin').addEventListener('click', showLoginTab);

$('languagePicker').addEventListener('change', async (e) => {
  state.lang = e.target.value;
  localStorage.setItem('equacoach_lang', state.lang);
  setUiLanguage();
  if (state.token) await loadProfileAndRanking();
});

$('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const payload = {
      email: $('signupEmail').value.trim(),
      password: $('signupPassword').value,
      nickname: $('signupNickname').value.trim(),
      avatar: $('signupAvatar').value.trim()
    };

    const out = await api('/api/auth/signup', 'POST', payload);
    state.pendingVerifyEmail = payload.email;
    $('verifyForm').classList.remove('hidden');
    $('signupForm').classList.add('hidden');
    $('verifyInfo').textContent = tr('verifyPrompt');

    setStatus(tr('signedUp'), 'ok');
    if (out.devCode) {
      setStatus(`${tr('signedUp')} ${tr('mailDevCode')}: ${out.devCode}`, 'ok');
    }
  } catch (err) {
    setStatus(err.error || 'signup_error', 'error');
  }
});

$('verifyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/auth/verify', 'POST', {
      email: state.pendingVerifyEmail,
      code: $('verifyCode').value.trim()
    });
    setStatus(tr('verified'), 'ok');
    showLoginTab();
  } catch (err) {
    setStatus(err.error || 'verify_error', 'error');
  }
});

$('resendCode').addEventListener('click', async () => {
  if (!state.pendingVerifyEmail) return;
  try {
    const out = await api('/api/auth/resend-code', 'POST', { email: state.pendingVerifyEmail });
    if (out.devCode) {
      setStatus(`${tr('mailDevCode')}: ${out.devCode}`, 'ok');
    } else {
      setStatus(tr('verifyPrompt'), 'ok');
    }
  } catch (err) {
    setStatus(err.error || 'resend_error', 'error');
  }
});

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const out = await api('/api/auth/login', 'POST', {
      email: $('loginEmail').value.trim(),
      password: $('loginPassword').value
    });
    state.token = out.token;
    localStorage.setItem('equacoach_token', out.token);
    setAppVisible(true);
    setUserProfile(out.user);
    await loadProfileAndRanking();
  } catch (err) {
    if (err.error === 'not_verified') setStatus(tr('notVerified'), 'error');
    else setStatus(tr('wrongCredentials'), 'error');
  }
});

$('logoutButton').addEventListener('click', () => {
  state.token = '';
  state.user = null;
  localStorage.removeItem('equacoach_token');
  setAppVisible(false);
  showLoginTab();
});

$('generateEquation').addEventListener('click', async () => {
  if (!state.token) {
    setStatus(tr('authRequired'), 'error');
    return;
  }

  try {
    const difficulty = $('difficultySelect').value;
    const out = await api('/api/equation/new', 'POST', { difficulty });
    state.currentEquation = out.equation;
    state.currentDifficulty = difficulty;
    state.canShowSteps = false;

    $('equationText').textContent = `${tr('generated')} ${out.equation}`;
    $('verificationBlock').classList.add('hidden');
    $('showSteps').classList.add('hidden');
    $('stepsList').innerHTML = '';
  } catch (err) {
    setStatus(err.error || 'equation_error', 'error');
  }
});

$('answerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!state.currentEquation) {
    setStatus(tr('needEquation'), 'error');
    return;
  }

  const answer = $('userAnswer').value.trim();
  if (!answer) {
    setStatus(tr('needAnswer'), 'error');
    return;
  }

  try {
    const out = await api('/api/equation/check', 'POST', {
      equation: state.currentEquation,
      userAnswer: answer,
      difficulty: state.currentDifficulty
    });

    state.canShowSteps = !!out.canViewSteps;
    const vb = $('verificationBlock');
    vb.classList.remove('hidden');

    const solStr = out.expectedAnswerStr || trimNum(out.expectedAnswer);
    const solDisplay = solStr !== trimNum(out.expectedAnswer) ? `${solStr} (${trimNum(out.expectedAnswer)})` : solStr;
    const colorStyle = out.correct ? 'color:var(--ok)' : 'color:var(--err)';
    vb.innerHTML = `
      <p style="${colorStyle}"><strong>${out.correct ? '\u2705 ' + tr('correct') : '\u274c ' + tr('incorrect')}</strong></p>
      <p>${tr('verificationMath')}:<br>
        ${tr('left')}: ${trimNum(out.verification.leftValue)}<br>
        ${tr('right')}: ${trimNum(out.verification.rightValue)}<br>
        ${out.verification.equal ? '\u2714\ufe0f ' + tr('equalYes') : '\u274c ' + tr('equalNo')}
      </p>
      <p>${tr('expected')}: <strong>${escapeHtml(solDisplay)}</strong></p>
    `;

    $('showSteps').classList.toggle('hidden', !state.canShowSteps);
    await loadProfileAndRanking();
  } catch (err) {
    setStatus(err.error || 'check_error', 'error');
  }
});

$('showSteps').addEventListener('click', async () => {
  if (!state.canShowSteps || !state.currentEquation) return;

  try {
    const out = await api('/api/equation/steps', 'POST', { equation: state.currentEquation });
    $('stepsList').innerHTML = out.steps.map((s) => `<li>${escapeHtml(String(s))}</li>`).join('');
  } catch (err) {
    setStatus(err.error || 'steps_error', 'error');
  }
});

function trimNum(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}

async function boot() {
  $('languagePicker').value = state.lang;
  setUiLanguage();

  if (!state.token) {
    setAppVisible(false);
    showSignupTab();
    return;
  }

  try {
    await loadProfileAndRanking();
    setAppVisible(true);
  } catch (_err) {
    localStorage.removeItem('equacoach_token');
    state.token = '';
    setAppVisible(false);
    showLoginTab();
  }
}

boot();
