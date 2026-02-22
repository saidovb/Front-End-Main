// =============================================
//  FOOTBALL TIMER — HISTORY PAGE
// =============================================

function getHistory() {
  return JSON.parse(localStorage.getItem('gameHistory') || '[]');
}

function getActiveGames() {
  return JSON.parse(localStorage.getItem('activeGames') || '[]');
}

function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatDuration(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h} soat ${m} daqiqa`;
  return `${m} daqiqa`;
}

function escHtml(str) {
  return (str||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== UPDATE ACTIVE BADGE =====
const activeBadge = document.getElementById('activeCount');
const activeRunning = getActiveGames().filter(g => g.status === 'running').length;
activeBadge.textContent = activeRunning;
activeBadge.dataset.count = activeRunning;

// ===== FILTER STATE =====
let currentFilter = 'all';

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    currentFilter = tab.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderHistory();
  });
});

// ===== CLEAR =====
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm("Barcha tarixni o'chirasizmi? Bu amalni qaytarib bo'lmaydi.")) {
    localStorage.removeItem('gameHistory');
    renderAll();
  }
});

// ===== STATS =====
function renderStats(records) {
  const statsRow = document.getElementById('statsRow');
  if (records.length === 0) { statsRow.innerHTML = ''; return; }

  const totalAmount = records.reduce((s, r) => s + (r.amount || 0), 0);
  const totalSecs   = records.reduce((s, r) => s + (r.totalSeconds || 0), 0);
  const dayCount    = records.filter(r => r.mode === 'day').length;
  const nightCount  = records.filter(r => r.mode === 'night').length;

  const totalH = Math.floor(totalSecs / 3600);
  const totalM = Math.floor((totalSecs % 3600) / 60);
  const timeText = totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM} daqiqa`;

  statsRow.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Jami O'yinlar</div>
      <div class="stat-value">${records.length}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Jami Daromad</div>
      <div class="stat-value yellow">${formatNumber(totalAmount)} <small style="font-size:0.7em;color:var(--text-muted)">so'm</small></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Jami Vaqt</div>
      <div class="stat-value">${timeText}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Kunduzgi / Kechki</div>
      <div class="stat-value">${dayCount} / ${nightCount}</div>
    </div>
  `;
}

// ===== RENDER HISTORY =====
function renderHistory() {
  const historyList = document.getElementById('historyList');
  const emptyState  = document.getElementById('emptyState');
  const subtitleText = document.getElementById('subtitleText');

  let records = getHistory().slice().reverse(); // newest first

  // Filter
  if (currentFilter !== 'all') {
    records = records.filter(r => r.mode === currentFilter);
  }

  renderStats(getHistory()); // always show stats for all

  if (records.length === 0) {
    emptyState.classList.remove('hidden');
    historyList.innerHTML = '';
    subtitleText.textContent = currentFilter === 'all'
      ? "Hali o'yin tugallanmagan"
      : `${currentFilter === 'day' ? 'Kunduzgi' : 'Kechki'} o'yinlar yo'q`;
    return;
  }

  emptyState.classList.add('hidden');
  subtitleText.textContent = `${records.length} ta o'yin topildi`;

  historyList.innerHTML = '';

  records.forEach((r, i) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.style.animationDelay = `${i * 0.04}s`;

    const modeLabel = r.mode === 'day' ? '☀️ Kunduzgi' : '🌙 Kechki';
    const modeCls   = r.mode === 'day' ? 'day' : 'night';

    // Duration actually played
    const actualSecs = r.endTime && r.startTime
      ? Math.floor((r.endTime - r.startTime) / 1000)
      : r.totalSeconds;

    const captainInfo = r.captain ? `<div class="item-detail">👤 <span>${escHtml(r.captain)}</span></div>` : '';
    const phoneInfo   = r.phone   ? `<div class="item-detail">📞 <span>${escHtml(r.phone)}</span></div>` : '';

    item.innerHTML = `
      <div class="item-left">
        <div class="item-header">
          <span class="item-mode-badge ${modeCls}">${modeLabel}</span>
          <span class="item-name">${escHtml(r.teamName || 'Jamoa')}</span>
        </div>
        <div class="item-details">
          <div class="item-detail">⏱ O'ynaldi: <span>${formatDuration(actualSecs)}</span></div>
          <div class="item-detail">🎯 Rejalashtirilgan: <span>${formatDuration(r.totalSeconds)}</span></div>
          ${captainInfo}
          ${phoneInfo}
        </div>
        <div class="item-reason">${escHtml(r.reason || '')}</div>
      </div>
      <div class="item-right">
        <div class="item-amount">${formatNumber(r.amount || 0)}<small style="font-size:0.5em;margin-left:3px;color:var(--text-muted)">so'm</small></div>
        <div class="item-date">${r.date || ''}</div>
      </div>
    `;

    historyList.appendChild(item);
  });
}

function renderAll() {
  renderHistory();
}

renderAll();
