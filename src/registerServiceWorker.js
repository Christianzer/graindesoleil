/* eslint-disable no-console */
// Enregistrement du service worker — uniquement en production, uniquement
// dans un vrai navigateur (jamais dans la fenêtre Tauri, qui n'a pas besoin
// d'installabilité PWA et où register() échouerait silencieusement).
import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production' && !window.__TAURI_INTERNALS__) {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.log('App servie depuis le cache par un service worker.')
    },
    registered (registration) {
      console.log('Service worker enregistré.')
      // Sans ça, le navigateur ne cherche une nouvelle version qu'à l'ouverture
      // : une PWA laissée ouverte (mobile) ne la verrait jamais.
      const verifier = () => registration.update().catch(() => {})
      setInterval(verifier, 30 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') verifier()
      })
    },
    cached () {
      console.log('Contenu mis en cache pour une utilisation hors-ligne.')
    },
    updatefound () {
      console.log('Nouveau contenu en cours de téléchargement.')
    },
    updated (registration) {
      console.log('Nouveau contenu disponible — actualisez la page.')
      // Affiché par UpdateBanner ; mémorisé au cas où le bandeau n'est pas encore monté.
      window.__pwaUpdate = registration
      window.dispatchEvent(new CustomEvent('pwa-update'))
    },
    offline () {
      console.log('Pas de connexion internet — l\'app fonctionne depuis le cache.')
    },
    error (error) {
      console.error('Erreur d\'enregistrement du service worker :', error)
    }
  })
}
