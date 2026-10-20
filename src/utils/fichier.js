// Enregistre un fichier généré côté client (Excel, etc.).
// Application bureau (Tauri) : boîte « Enregistrer sous » (le dossier choisi est autorisé
// automatiquement par le plugin dialog). Navigateur / PWA : téléchargement classique.
// Retourne le chemin / nom enregistré, ou null si l'utilisateur annule.
export async function enregistrerFichier (octets, nom, mime, extension, libelleType) {
  if (window.__TAURI_INTERNALS__) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const chemin = await save({
      title: 'Enregistrer le fichier',
      defaultPath: nom,
      filters: [{ name: libelleType || extension.toUpperCase(), extensions: [extension] }],
    })
    if (!chemin) return null
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    await writeFile(chemin, octets)
    return chemin
  }

  const url = URL.createObjectURL(new Blob([octets], { type: mime }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return nom
}
