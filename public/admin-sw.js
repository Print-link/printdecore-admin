/* Admin dashboard service worker: shows order alerts sent by the server (web push). */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Printdecore', body: event.data ? event.data.text() : '' };
  }
  const url = payload.url || (payload.data && payload.data.url) || '/';
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Printdecore', {
      body: payload.body || '',
      tag: payload.tag,
      renotify: !!payload.tag,
      icon: '/vite.svg',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) {
        open.navigate(target);
        return open.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
