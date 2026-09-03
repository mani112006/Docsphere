/* DocSphere service worker — caches only same-origin app shell assets.
   Never caches document files, signed URLs, or Supabase Storage responses. */

const SHELL_CACHE = 'docsphere-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

function shouldBypass(url) {
  if (url.hostname.includes('supabase.co')) return true
  if (url.pathname.includes('/storage/v1/object')) return true
  if (url.searchParams.has('token')) return true
  return false
}

function isShellAsset(url) {
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/assets/')) return true
  if (url.pathname === '/' || url.pathname === '/index.html') return true
  if (url.pathname === '/manifest.json') return true
  if (url.pathname.endsWith('.svg') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    return true
  }
  return false
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (shouldBypass(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const cache = await caches.open(SHELL_CACHE)
          return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error()
        }
      })(),
    )
    return
  }

  if (!isShellAsset(url)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      try {
        const fresh = await fetch(request)
        if (fresh.ok) {
          await cache.put(request, fresh.clone())
        }
        return fresh
      } catch {
        const cached = await cache.match(request)
        if (cached) return cached
        throw new Error('offline')
      }
    })(),
  )
})
