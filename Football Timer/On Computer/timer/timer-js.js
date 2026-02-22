// =============================================
//  FOOTBALL TIMER — TIMER PAGE JS (v2 fixed)
// =============================================

// Ring circumference: 2 * π * 136 = 854.5
const CIRCUMFERENCE = 2 * Math.PI * 136;

// ===== HELPERS =====
function getParams() {
  return new URLSearchParams(window.location.search);
}

function getActiveGames() {
  try { return JSON.parse(localStorage.getItem('activeGames') || '[]'); }
  catch(e) { return []; }
}

function saveActiveGames(games) {
  localStorage.setItem('activeGames', JSON.stringify(games));
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('gameHistory') || '[]'); }
  catch(e) { return []; }
}

function saveHistory(hist) {
  localStorage.setItem('gameHistory', JSON.stringify(hist));
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h} soat ${m} daqiqa`;
  return `${m} daqiqa`;
}

function formatTime(secs) {
  if (secs <= 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatClockTime(ts) {
  const d = new Date(Number(ts));
  return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(ts) {
  const d = new Date(Number(ts));
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function calcRemaining(g) {
  // Always cast to Number to guard against JSON string edge case
  const startTime = Number(g.startTime);
  const total     = Number(g.totalSeconds);
  const elapsed   = Math.floor((Date.now() - startTime) / 1000);
  return Math.max(0, total - elapsed);
}

// ===== LOAD GAME =====
const gameId = getParams().get('id');
if (!gameId) { window.location.href = '../index.html'; throw ''; }

function loadGame() {
  return getActiveGames().find(g => g.id === gameId) || null;
}

let game = loadGame();
if (!game) { window.location.href = '../index.html'; throw ''; }

// ===== ELEMENTS =====
const setupSection    = document.getElementById('setupSection');
const runningSection  = document.getElementById('runningSection');
const finishedSection = document.getElementById('finishedSection');

const modeBadge       = document.getElementById('modeBadge');
const runBadge        = document.getElementById('runBadge');
const setupTeamName   = document.getElementById('setupTeamName');
const runTeamName     = document.getElementById('runTeamName');
const displayAmount   = document.getElementById('displayAmount');
const displayBaseTime = document.getElementById('displayBaseTime');

const extraInput  = document.getElementById('extraMinutes');
const extraMinus  = document.getElementById('extraMinus');
const extraPlus   = document.getElementById('extraPlus');
const confirmBtn  = document.getElementById('confirmStartBtn');

const timeDisplay = document.getElementById('timeDisplay');
const timerSub    = document.getElementById('timerSub');
const ringFill    = document.getElementById('ringFill');
const startedAtDisplay = document.getElementById('startedAtDisplay');
const endsAtDisplay    = document.getElementById('endsAtDisplay');

const stopBtn    = document.getElementById('stopBtn');
const extendBtn  = document.getElementById('extendBtn');

const extendModal  = document.getElementById('extendModal');
const modalMinutes = document.getElementById('modalMinutes');
const modalMinus   = document.getElementById('modalMinus');
const modalPlus    = document.getElementById('modalPlus');
const modalPreview = document.getElementById('modalPreview');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel  = document.getElementById('modalCancel');

// ===== POPULATE =====
const badgeText = game.mode === 'day' ? '☀️ Kunduzgi' : '🌙 Kechki';
modeBadge.textContent = badgeText;
runBadge.textContent  = badgeText;
setupTeamName.textContent = game.teamName;
runTeamName.textContent   = game.teamName;
displayAmount.textContent  = formatNumber(Number(game.amount)) + " so'm";
displayBaseTime.textContent = formatDuration(Number(game.totalSeconds));

const captainRow     = document.getElementById('captainRow');
const captainDisplay = document.getElementById('captainDisplay');
const phoneDisplay   = document.getElementById('phoneDisplay');
if (game.captain || game.phone) {
  captainRow.style.display = 'flex';
  if (game.captain) captainDisplay.textContent = '👤 ' + game.captain;
  if (game.phone)   phoneDisplay.textContent   = '📞 ' + game.phone;
}

function updateActiveCount() {
  const count = getActiveGames().filter(g => g.status === 'running').length;
  const badge = document.getElementById('activeCount');
  if (badge) { badge.textContent = count; badge.dataset.count = count; }
}
updateActiveCount();

// ===== EXTRA TIME CONTROLS =====
extraMinus.onclick = () => { extraInput.value = Math.max(0, parseInt(extraInput.value || 0) - 5); };
extraPlus.onclick  = () => { extraInput.value = parseInt(extraInput.value || 0) + 5; };

// ===== TIMER STATE =====
let timerInterval = null;

// ===== AUTO-RESUME IF ALREADY RUNNING =====
if (game.status === 'running' && game.startTime) {
  const remaining = calcRemaining(game);
  showRunning();
  updateDisplay(remaining);
  if (remaining > 0) {
    startTick();
  } else {
    finishGame('Vaqt tugadi!');
  }
}

// ===== START =====
confirmBtn.onclick = () => {
  const extra    = parseInt(extraInput.value || 0) * 60;
  const newTotal = Number(game.totalSeconds) + extra;

  if (newTotal <= 0) {
    alert("Vaqt 0 bo'lishi mumkin emas!");
    return;
  }

  const games = getActiveGames();
  const idx   = games.findIndex(g => g.id === game.id);
  if (idx === -1) { alert("O'yin topilmadi!"); return; }

  games[idx].totalSeconds = newTotal;
  games[idx].startTime    = Date.now();
  games[idx].status       = 'running';
  saveActiveGames(games);

  // Re-sync local ref from storage
  game = loadGame();

  showRunning();
  startTick();
};

function showRunning() {
  setupSection.classList.add('hidden');
  runningSection.classList.remove('hidden');

  if (game.startTime) {
    const startTs = Number(game.startTime);
    const endTs   = startTs + Number(game.totalSeconds) * 1000;
    startedAtDisplay.textContent = formatClockTime(startTs);
    endsAtDisplay.textContent    = formatClockTime(endTs);
  }
}

// ===== TICK =====
function startTick() {
  if (timerInterval) clearInterval(timerInterval);

  // Immediate render
  updateDisplay(calcRemaining(game));

  timerInterval = setInterval(() => {
    // Re-read from storage each tick so extend changes are picked up
    const fresh = loadGame();
    if (fresh) game = fresh;

    const rem = calcRemaining(game);
    updateDisplay(rem);
    updateActiveCount();

    if (rem <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      finishGame('Vaqt tugadi!');
    }
  }, 500);
}

function updateDisplay(remaining) {
  const total = Number(game.totalSeconds);
  timeDisplay.textContent = formatTime(remaining);
  updateRing(remaining, total);

  const isUrgent  = remaining <= 120;
  const isWarning = remaining <= 300 && !isUrgent;

  ringFill.classList.toggle('urgent', isUrgent);
  ringFill.classList.toggle('warning', isWarning);
  timeDisplay.classList.toggle('urgent', isUrgent);
  document.body.classList.toggle('urgent-mode', isUrgent);
}

function updateRing(remaining, total) {
  const pct    = total > 0 ? Math.min(1, remaining / total) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);
  ringFill.style.strokeDashoffset = offset;
}

// ===== STOP =====
stopBtn.onclick = () => {
  const rem    = calcRemaining(game);
  const answer = confirm(`Rostan to'xtatasizmi? (${formatTime(rem)} qoldi)`);
  if (!answer) return;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  finishGame(`To'xtatildi (${formatTime(rem)} qoldi)`);
};

// ===== EXTEND =====
extendBtn.onclick = () => {
  extendModal.classList.remove('hidden');
  updateModalPreview();
};

modalMinus.onclick   = () => { modalMinutes.value = Math.max(1, parseInt(modalMinutes.value || 1) - 5); updateModalPreview(); };
modalPlus.onclick    = () => { modalMinutes.value = parseInt(modalMinutes.value || 1) + 5; updateModalPreview(); };
modalMinutes.oninput = updateModalPreview;

function updateModalPreview() {
  const mins = parseInt(modalMinutes.value || 0);
  if (!mins) { modalPreview.textContent = ''; return; }
  const rate = game.mode === 'day' ? 40000 / 60 : 100000 / 60;
  const cost = Math.round(mins * rate);
  modalPreview.textContent = `≈ +${formatNumber(cost)} so'm qo'shimcha`;
}

modalConfirm.onclick = () => {
  const extraMins = parseInt(modalMinutes.value || 0);
  if (extraMins <= 0) return;

  const games = getActiveGames();
  const idx   = games.findIndex(g => g.id === game.id);
  if (idx !== -1) {
    games[idx].totalSeconds = Number(games[idx].totalSeconds) + extraMins * 60;
    saveActiveGames(games);
    game = loadGame();
  }

  if (game && game.startTime) {
    const newEndTs = Number(game.startTime) + Number(game.totalSeconds) * 1000;
    endsAtDisplay.textContent = formatClockTime(newEndTs);
  }

  extendModal.classList.add('hidden');
};

modalCancel.onclick = () => extendModal.classList.add('hidden');
extendModal.addEventListener('click', (e) => {
  if (e.target === extendModal) extendModal.classList.add('hidden');
});

// ===== FINISH =====
function finishGame(reason) {
  const historyRecord = {
    id:           game.id,
    mode:         game.mode,
    teamName:     game.teamName,
    captain:      game.captain || '',
    phone:        game.phone   || '',
    amount:       game.amount,
    totalSeconds: game.totalSeconds,
    startTime:    game.startTime,
    endTime:      Date.now(),
    reason,
    date: formatDateTime(Date.now()),
  };

  const hist = getHistory();
  hist.push(historyRecord);
  saveHistory(hist);

  const remaining = getActiveGames().filter(g => g.id !== game.id);
  saveActiveGames(remaining);

  runningSection.classList.add('hidden');
  finishedSection.classList.remove('hidden');
  document.getElementById('finishSub').textContent = reason;
}
