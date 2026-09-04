// Point d'impression unique du frontend.
//
// Sous Electron, ces routes /api/imprimer_* renvoyaient du HTML que
// preload.js chargeait dans une fenêtre cachée puis convertissait en PDF
// via printToPDF() (aucun équivalent sous Tauri). Le backend Laravel génère
// maintenant le PDF lui-même (middleware RenderAsPdf, voir
// gstockgrainsmoulus/app/Http/Middleware/RenderAsPdf.php) : il suffit
// d'ouvrir l'URL, qui répond directement en application/pdf.
export async function ouvrirDocument(url) {
  if (!url) return
  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`
  }
  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  } catch (e) {
    // Hors contexte Tauri (dev navigateur) : onglet classique.
    window.open(url, '_blank')
  }
}
