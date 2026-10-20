/* eslint-disable no-restricted-globals */
// Service worker personnalisé (mode InjectManifest) : le précaching standard
// (installabilité PWA) est injecté par Workbox au build, complété par la
// gestion des notifications push — impossible à faire en mode GenerateSW.
import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

// Mise à jour forcée : un nouveau service worker prend la main tout de suite
// (sans attendre la fermeture de tous les onglets) et recharge les fenêtres
// ouvertes pour qu'elles passent sur la nouvelle version. Pas de rechargement
// à la toute première installation (aucun service worker actif avant celui-ci).
let estUneMiseAJour = false

self.addEventListener('install', () => {
  estUneMiseAJour = !!self.registration.active
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
      .then(() => (estUneMiseAJour ? self.clients.matchAll({ type: 'window' }) : []))
      .then((fenetres) => Promise.all(fenetres.map((c) => c.navigate(c.url).catch(() => {}))))
  )
})

// Le bandeau « Nouvelle version » (UpdateBanner) demande l'activation immédiate
// du nouveau service worker en attente, puis recharge la page.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})

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
