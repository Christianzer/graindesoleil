/* eslint-disable no-restricted-globals */
// Service worker personnalisé (mode InjectManifest) : le précaching standard
// (installabilité PWA) est injecté par Workbox au build, complété par la
// gestion des notifications push — impossible à faire en mode GenerateSW.
import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  if (!event.data) return
  let payload
  try {
    payload = event.data.json()
  } catch (e) {
    payload = { title: 'Café Fortuna', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Café Fortuna', {
      body: payload.body || '',
      icon: '/img/icons/android-chrome-192x192.png',
      badge: '/img/icons/android-chrome-192x192.png',
      data: payload.data || {},
    })
  )
})

// Clic sur la notification : ramène au premier onglet ouvert de l'app (ou en
// ouvre un nouveau), sur le tableau de bord — les écrans concernés (cessions
// en attente, décaissements, demandes) sont visibles depuis là pour les rôles
// qui reçoivent ces notifications.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
