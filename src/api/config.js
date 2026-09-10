// API Configuration
// Dev : requêtes relatives, interceptées par le proxy webpack (vue.config.js)
// vers le backend lancé manuellement (Apache ou `php -S`).
// Prod : backend hébergé en ligne, partagé entre plusieurs postes.
const isDev = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDev ? '' : 'https://api.grainsmoulus.succesemaster.com';

export default API_BASE_URL;