const CACHE = 'football-v4';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});

// ── NOTIFICATION SCHEDULING ──────────────────────────────────
// Stores active timers: { gameId: timeoutId }
const scheduled = {};

self.addEventListener('message', e => {
  const { type, gameId, teamName, endsAt, mode } = e.data || {};

  if (type === 'SCHEDULE_NOTIFY') {
    // Cancel any existing timer for this game
    if (scheduled[gameId]) clearTimeout(scheduled[gameId]);

    const msLeft = endsAt - Date.now();
    if (msLeft <= 0) return;

    // 5-minute warning
    const fiveMin = msLeft - 5 * 60 * 1000;
    if (fiveMin > 0) {
      scheduled[gameId + '_warn'] = setTimeout(() => {
        self.registration.showNotification('⚠️ Vaqt tugayapti!', {
          body: `${teamName} — 5 daqiqa qoldi!`,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-96.png',
          tag: gameId + '_warn',
          vibrate: [200, 100, 200],
          silent: false,
          requireInteraction: false,
          data: { gameId }
        });
      }, fiveMin);
    }

    // Final notification
    scheduled[gameId] = setTimeout(() => {
      self.registration.showNotification('🏁 O\'yin Tugadi!', {
        body: `${teamName} — vaqt tugadi! Maydonga chiqing.`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        tag: gameId,
        vibrate: [400, 200, 400, 200, 400, 200, 800],
        silent: false,
        requireInteraction: true,
        data: { gameId },
        actions: [
          { action: 'open', title: '📱 Ochish' },
          { action: 'dismiss', title: 'Yopish' }
        ]
      });
      delete scheduled[gameId];
    }, msLeft);

    console.log(`[SW] Notification scheduled for ${teamName} in ${Math.round(msLeft/1000)}s`);
  }

  if (type === 'CANCEL_NOTIFY') {
    if (scheduled[gameId]) { clearTimeout(scheduled[gameId]); delete scheduled[gameId]; }
    if (scheduled[gameId + '_warn']) { clearTimeout(scheduled[gameId + '_warn']); delete scheduled[gameId + '_warn']; }
  }
});

// Notification click → open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      if (cls.length > 0) { cls[0].focus(); return; }
      return clients.openWindow('/index.html');
    })
  );
});
