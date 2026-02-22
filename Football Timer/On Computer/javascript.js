// =============================================
//  FOOTBALL TIMER — MAIN PAGE JS
// =============================================

const DAY_RATE  = 40000 / 3600;   // per second
const NIGHT_RATE = 100000 / 3600;

let selectedMode = 'day';

const dayBtn    = document.getElementById('dayBtn');
const nightBtn  = document.getElementById('nightBtn');
const nightFields = document.querySelectorAll('.night-only');
const amountInput = document.getElementById('amount');
const previewText = document.getElementById('previewText');
const startBtn  = document.getElementById('startBtn');

// ===== MODE TOGGLE =====
dayBtn.addEventListener('click', () => setMode('day'));
nightBtn.addEventListener('click', () => setMode('night'));

function setMode(mode) {
  selectedMode = mode;
  dayBtn.classList.toggle('active', mode === 'day');
  nightBtn.classList.toggle('active', mode === 'night');
  nightFields.forEach(el => el.classList.toggle('hidden', mode === 'day'));
  updatePreview();
}

// ===== AMOUNT PREVIEW =====
amountInput.addEventListener('input', updatePreview);

function getRatePerSecond() {
  return selectedMode === 'day' ? DAY_RATE : NIGHT_RATE;
}

function updatePreview() {
  const full = parseInt(amountInput.value || 0) * 1000;
  if (!full || full <= 0) {
    previewText.textContent = 'Summani kiriting...';
    return;
  }
  const seconds = Math.floor(full / getRatePerSecond());
  previewText.textContent = `≈ ${formatDuration(seconds)} o'yin vaqti`;
}

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h} soat ${m} daqiqa`;
  return `${m} daqiqa`;
}

// ===== STORAGE HELPERS =====
function getActiveGames() {
  return JSON.parse(localStorage.getItem('activeGames') || '[]');
}

function saveActiveGames(games) {
  localStorage.setItem('activeGames', JSON.stringify(games));
}

function getHistory() {
  return JSON.parse(localStorage.getItem('gameHistory') || '[]');
}

// ===== START GAME =====
startBtn.addEventListener('click', () => {
  const amount = parseInt(amountInput.value || 0) * 1000;
  if (!amount || amount <= 0) {
    amountInput.focus();
    amountInput.style.borderColor = 'var(--red)';
    setTimeout(() => amountInput.style.borderColor = '', 1200);
    return;
  }

  const totalSeconds = Math.floor(amount / getRatePerSecond());
  const teamName = document.getElementById('teamName').value.trim();
  const captain  = document.getElementById('captain').value.trim();
  const phone    = document.getElementById('phone').value.trim();

  const game = {
    id:           'g_' + Date.now(),
    mode:         selectedMode,
    teamName:     teamName || (selectedMode === 'night' ? (captain || 'Kechki Jamoa') : 'Kunduzgi Jamoa'),
    captain,
    phone:        phone ? '+998' + phone : '',
    amount,
    totalSeconds,
    startTime:    null,   // set when timer actually starts
    status:       'pending',
    createdAt:    new Date().toISOString(),
  };

  const games = getActiveGames();
  games.push(game);
  saveActiveGames(games);

  window.location.href = `timer/index.html?id=${game.id}`;
});

// ===== NAV BADGE COUNTS =====
function updateCounts() {
  const active  = getActiveGames().filter(g => g.status === 'running').length;
  const hist    = getHistory().length;

  const acBadge = document.getElementById('activeCount');
  const hisBadge = document.getElementById('historyCount');

  acBadge.textContent  = active;
  acBadge.dataset.count = active;
  hisBadge.textContent = hist;
  hisBadge.dataset.count = hist;
}

// ===== QUICK ACTIVE PANEL =====
function renderQuickActive() {
  const games = getActiveGames().filter(g => g.status === 'running');
  const container = document.getElementById('activeGamesQuick');
  const list = document.getElementById('quickActiveList');

  if (games.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  list.innerHTML = '';

  games.forEach(game => {
    const elapsed = Date.now() - game.startTime;
    const remaining = Math.max(0, game.totalSeconds - Math.floor(elapsed / 1000));
    const card = document.createElement('a');
    card.href = `timer/index.html?id=${game.id}`;
    card.className = 'quick-game-card';
    card.innerHTML = `
      <div>
        <div class="quick-game-name">${escHtml(game.teamName)}</div>
        <div class="quick-game-mode">${game.mode === 'day' ? '☀️ Kunduzgi' : '🌙 Kechki'}</div>
      </div>
      <div class="quick-game-time ${remaining <= 300 ? 'urgent' : ''}" data-gid="${game.id}">
        ${formatTime(remaining)}
      </div>
    `;
    list.appendChild(card);
  });
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2,'0');
  const ss = String(s).padStart(2,'0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== INIT =====
updateCounts();
renderQuickActive();

// Live update every second
setInterval(() => {
  renderQuickActive();
  updateCounts();
}, 1000);
