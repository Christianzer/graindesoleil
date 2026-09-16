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
    registered () {
      console.log('Service worker enregistré.')
    },
    cached () {
      console.log('Contenu mis en cache pour une utilisation hors-ligne.')
    },
    updatefound () {
      console.log('Nouveau contenu en cours de téléchargement.')
    },
    updated () {
      console.log('Nouveau contenu disponible — actualisez la page.')
    },
    offline () {
      console.log('Pas de connexion internet — l\'app fonctionne depuis le cache.')
    },
    error (error) {
      console.error('Erreur d\'enregistrement du service worker :', error)
    }
  })
}
