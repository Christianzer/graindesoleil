//const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const webpack = require('webpack')
const { version: appVersion } = require('./package.json')
module.exports = {
  transpileDependencies: true,
  // Version affichée dans l'app (écran de connexion) : lue depuis package.json
  // au build, donc toujours synchronisée avec scripts/release.js qui bump
  // cette même valeur — pas besoin de la mettre à jour à la main ailleurs.
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PACKAGE_VERSION': JSON.stringify(appVersion),
      }),
    ],
  },
  pwa: {
    name: 'Café Fortuna',
    themeColor: '#4F46E5',
    msTileColor: '#4F46E5',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'default',
    manifestOptions: {
      short_name: 'Café Fortuna',
      description: 'Gestion de stock, bons de livraison et trésorerie — Café Fortuna.',
      start_url: '.',
      display: 'standalone',
      background_color: '#F4F6FB',
      lang: 'fr',
    },
    // InjectManifest (plutôt que GenerateSW) : on a besoin d'un service worker
    // écrit à la main pour gérer les évènements push/notificationclick — voir
    // src/service-worker.js.
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: path.resolve(__dirname, 'src/service-worker.js'),
      // .htaccess : copié depuis public/ comme le reste, mais Apache le
      // bloque en accès direct (403) — le précacher ferait échouer
      // l'installation entière du service worker.
      exclude: [/\.map$/, /_redirects/, /\.htaccess$/],
    },
  },
}
