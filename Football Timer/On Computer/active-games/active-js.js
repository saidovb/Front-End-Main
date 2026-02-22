// =============================================
//  FOOTBALL TIMER — ACTIVE GAMES PAGE
// =============================================

function getActiveGames() {
  return JSON.parse(localStorage.getItem('activeGames') || '[]');
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatTime(secs) {
  if (secs <= 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const mm = String(m).padStart(2,'0');
  const ss = String(s).padStart(2,'0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatDuration(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} daqiqa`;
}

function escHtml(str) {
  return (str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getRemainingSeconds(game) {
  if (game.status !== 'running' || !game.startTime) return game.totalSeconds;
  const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
  return Math.max(0, game.totalSeconds - elapsed);
}

const gamesGrid    = document.getElementById('gamesGrid');
const pendingSection = document.getElementById('pendingSection');
const pendingGrid  = document.getElementById('pendingGrid');
const emptyState   = document.getElementById('emptyState');
const subtitleText = document.getElementById('subtitleText');
const activeCount  = document.getElementById('activeCount');

function render() {
  const games = getActiveGames();
  const running = games.filter(g => g.status === 'running');
  const pending = games.filter(g => g.status === 'pending');

  // update badge
  activeCount.textContent = running.length;
  activeCount.dataset.count = running.length;

  // subtitle
  const total = running.length;
  subtitleText.textContent = total === 0
    ? "Hozir hech qanday o'yin yo'q"
    : `${total} ta o'yin hozir faol`;

  // Empty state
  if (running.length === 0 && pending.length === 0) {
    emptyState.classList.remove('hidden');
    gamesGrid.innerHTML = '';
    pendingSection.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // RUNNING GAMES
  gamesGrid.innerHTML = '';
  running.forEach((game, i) => {
    const rem = getRemainingSeconds(game);
    const pct = rem / game.totalSeconds;
    const isUrgent  = rem <= 120;
    const isWarning = rem <= 300 && !isUrgent;

    const card = document.createElement('a');
    card.href = `../timer/index.html?id=${game.id}`;
    card.className = `game-card ${isUrgent ? 'urgent' : isWarning ? 'warning' : ''}`;
    card.style.animationDelay = `${i * 0.05}s`;

    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-mode">${game.mode === 'day' ? '☀️ Kunduzgi' : '🌙 Kechki'}</div>
          <div class="card-name">${escHtml(game.teamName)}</div>
        </div>
        <div class="status-dot"></div>
      </div>
      <div class="card-timer ${isUrgent ? 'urgent' : isWarning ? 'warning' : ''}" data-gid="${game.id}">
        ${formatTime(rem)}
      </div>
      <div class="card-footer">
        <div class="card-amount">
          To'langan: <strong>${formatNumber(game.amount)} so'm</strong>
        </div>
        <div class="card-link-hint">Ochish →</div>
      </div>
    `;

    gamesGrid.appendChild(card);
  });

  // PENDING GAMES
  if (pending.length > 0) {
    pendingSection.classList.remove('hidden');
    pendingGrid.innerHTML = '';
    pending.forEach((game, i) => {
      const card = document.createElement('a');
      card.href = `../timer/index.html?id=${game.id}`;
      card.className = 'game-card pending';
      card.style.animationDelay = `${i * 0.05}s`;
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-mode">${game.mode === 'day' ? '☀️ Kunduzgi' : '🌙 Kechki'}</div>
            <div class="card-name">${escHtml(game.teamName)}</div>
          </div>
          <div class="status-dot pending-dot"></div>
        </div>
        <div class="card-timer pending">⏳ Taymer kutilmoqda</div>
        <div class="card-footer">
          <div class="card-amount">
            To'langan: <strong>${formatNumber(game.amount)} so'm</strong>
          </div>
          <div class="card-link-hint">Boshlash →</div>
        </div>
      `;
      pendingGrid.appendChild(card);
    });
  } else {
    pendingSection.classList.add('hidden');
  }
}

// Live tick — update timer displays every second
function tickTimers() {
  const timers = document.querySelectorAll('.card-timer[data-gid]');
  const games = getActiveGames();

  timers.forEach(el => {
    const gid = el.dataset.gid;
    const game = games.find(g => g.id === gid);
    if (!game) return;
    const rem = getRemainingSeconds(game);
    el.textContent = formatTime(rem);

    const isUrgent  = rem <= 120;
    const isWarning = rem <= 300 && !isUrgent;
    el.classList.toggle('urgent', isUrgent);
    el.classList.toggle('warning', isWarning && !isUrgent);

    const card = el.closest('.game-card');
    if (card) {
      card.classList.toggle('urgent', isUrgent);
      card.classList.toggle('warning', isWarning && !isUrgent);
    }
  });
}

// Initial render
render();

// Refresh card structure every 10s (to pick up new games)
// Tick timers every second
setInterval(tickTimers, 1000);
setInterval(render, 10000);
