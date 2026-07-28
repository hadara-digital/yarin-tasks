// Minimal service worker: PWA installability + push notifications
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = { title: 'משימות ירין', body: '' }
  try {
    data = event.data.json()
  } catch {
    data.body = event.data ? event.data.text() : ''
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'משימות ירין', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      dir: 'rtl',
      lang: 'he',
      tag: data.tag || 'yarin-task',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    }),
  )
})
