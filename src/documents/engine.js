// Moteur PDF : compose un docDefinition pdfmake standardisé et le rend
// (écriture dans le cache Tauri + ouverture ; repli navigateur en dev).
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import { pageMargins, defaultStyle, styles, entete, bandeau, piedDePage } from './theme'

pdfMake.vfs = (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) || (pdfFonts && pdfFonts.vfs) || pdfMake.vfs

/**
 * @param {object} doc  { titre, meta:[], contenu:[...noeuds pdfmake], filename }
 */
export async function genererDocument (doc) {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins,
    defaultStyle,
    styles,
    footer: piedDePage(),
    content: [
      entete(),
      ...(doc.titre ? [bandeau(doc.titre, doc.meta || [])] : []),
      ...doc.contenu,
    ],
  }
  return rendre(docDefinition, doc.filename || 'document.pdf')
}

/** Rendu bas niveau : blob -> cache Tauri -> ouverture ; repli navigateur. */
export function rendre (docDefinition, filename) {
  const pdf = pdfMake.createPdf(docDefinition)

  return new Promise((resolve) => {
    pdf.getBlob(async (blob) => {
      // Crochet de test : si présent, reçoit le blob et court-circuite l'ouverture.
      if (typeof window !== 'undefined' && typeof window.__PDF_SINK__ === 'function') {
        try { await window.__PDF_SINK__(blob, filename) } catch (e) { console.log(e) }
        resolve()
        return
      }
      try {
        const { mkdir, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs')
        const { open } = await import('@tauri-apps/plugin-shell')
        const { appCacheDir, join } = await import('@tauri-apps/api/path')

        const safe = /^[\w.-]+\.pdf$/i.test(filename) ? filename : `document-${Date.now()}.pdf`
        const buf = new Uint8Array(await blob.arrayBuffer())

        await mkdir('impressions', { baseDir: BaseDirectory.AppCache, recursive: true })
        await writeFile(`impressions/${safe}`, buf, { baseDir: BaseDirectory.AppCache })

        const full = await join(await appCacheDir(), 'impressions', safe)
        await open(full)
      } catch (e) {
        // Hors Tauri (dev navigateur) : ouvrir dans un onglet.
        console.log('[pdf] repli navigateur :', e && e.message)
        try {
          const url = URL.createObjectURL(blob)
          window.open(url, '_blank')
        } catch (e2) {
          pdf.download(filename)
        }
      }
      resolve()
    })
  })
}
