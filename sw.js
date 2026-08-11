// Minimal service worker: PWA installability + push notifications + app updates
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

const SHELL = 'yarin-shell-v1'
/** the whole app is one file, and the service worker sits next to it */
const SHELL_URL = new URL('./index.html', self.registration.scope).href

/**
 * Network-first for the page itself. GitHub Pages serves index.html with a
 * ten-minute max-age, so an installed app kept showing the previous build long
 * after a deploy - and the client has no way to force a refresh. 'no-cache'
 * revalidates against the ETag, so an unchanged build costs a 304 rather than
 * the full 1.4MB. The stored copy is the fallback for a site with no signal,
 * which is also the first offline support this app has had.
 */
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(serveShell(event.request))
})

async function serveShell(request) {
  let fresh
  try {
    fresh = await fetch(
      new Request(request.url, { mode: 'same-origin', cache: 'no-cache', credentials: 'same-origin' }),
    )
  } catch {
    // no signal: the stored copy is the only way the app opens at all
    const cached = await caches.match(SHELL_URL, { cacheName: SHELL })
    return cached || Response.error()
  }

  if (fresh.ok) {
    // awaited rather than fired and forgotten, or the worker can be stopped
    // mid-write and leave no offline copy. Wrapped on its own, because a
    // storage failure must never cost the user the page they asked for.
    const copy = fresh.clone()
    try {
      const cache = await caches.open(SHELL)
      await cache.put(SHELL_URL, copy)
    } catch (err) {
      console.warn('[sw] could not store the app shell for offline use:', err)
    }
  }
  return fresh
}

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
