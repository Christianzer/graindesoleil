// Point d'impression unique du frontend.
//
// Sous Electron, ces routes /api/imprimer_* renvoyaient du HTML que
// preload.js chargeait dans une fenêtre cachée puis convertissait en PDF
// via printToPDF() (aucun équivalent sous Tauri). Le backend Laravel génère
// maintenant le PDF lui-même (middleware RenderAsPdf, voir
// gstockgrainsmoulus/app/Http/Middleware/RenderAsPdf.php).
//
// On ne passe PAS l'URL directement à shell.open() : ça la fait ouvrir par le
// navigateur par défaut de Windows, qui refuse de charger quoi que ce soit
// (même http://127.0.0.1) tant que Windows ne signale pas de connexion
// réseau active (ERR_INTERNET_DISCONNECTED côté Chromium/Edge) — alors que le
// PDF est généré 100% localement. On récupère donc le PDF nous-mêmes (requête
// axios interne à l'app, indépendante du navigateur système), on l'écrit sur
// disque, et on ouvre ce fichier local : le visualiseur PDF par défaut n'a
// besoin d'aucune connexion pour un chemin file://.
// Nouveau système : documents rendus par pdfmake côté app bureau.
//   import { imprimerDocument } from '@/utils/print'
//   imprimerDocument('bl', code)
export { imprimerDocument } from '@/documents'

// Ancien système (dompdf serveur) — encore utilisé par le point d'encaissement,
// le récapitulatif client et le rapport de caisse, en attendant leur migration.
export async function ouvrirDocument(url) {
  if (!url) return
  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`
  }
  try {
    const axios = (await import('axios')).default
    const { mkdir, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    const { open } = await import('@tauri-apps/plugin-shell')

    const response = await axios.get(url, { responseType: 'arraybuffer' })

    const disposition = response.headers['content-disposition'] || ''
    const match = disposition.match(/filename="?([^";]+)"?/i)
    const candidate = match ? match[1].replace(/[\\/\x00]/g, '').replace(/^\.+/, '') : ''
    const filename = /^[\w.-]+\.pdf$/i.test(candidate) ? candidate : `document-${Date.now()}.pdf`

    await mkdir('impressions', { baseDir: BaseDirectory.AppCache, recursive: true })
    await writeFile(`impressions/${filename}`, new Uint8Array(response.data), {
      baseDir: BaseDirectory.AppCache
    })

    const { appCacheDir, join } = await import('@tauri-apps/api/path')
    const fullPath = await join(await appCacheDir(), 'impressions', filename)
    await open(fullPath)
  } catch (e) {
    console.log(e)
    // Hors contexte Tauri (dev navigateur) ou erreur fs : repli navigateur classique.
    window.open(url, '_blank')
  }
}
