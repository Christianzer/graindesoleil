// API Configuration
// Dev : requêtes relatives, interceptées par le proxy webpack (vue.config.js)
// vers le backend lancé manuellement (Apache ou `php -S`).
// Prod (app Electron packagée) : backend embarqué démarré par background.js
// au lancement de l'app, sur ce port fixe local.
const isDev = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDev ? '' : 'http://127.0.0.1:8899';

export default API_BASE_URL;