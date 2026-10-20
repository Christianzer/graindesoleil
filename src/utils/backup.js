// Télécharge la sauvegarde complète générée par le serveur (GET /api/backup/telecharger).
// Application bureau (Tauri) : l'utilisateur choisit où enregistrer le ZIP (clé USB, disque…)
// via la boîte « Enregistrer sous » ; le dernier dossier utilisé est proposé la fois suivante.
// Navigateur / PWA : téléchargement classique du navigateur.
// Retourne le chemin / nom du fichier enregistré, ou null si l'utilisateur annule.
import API_BASE_URL from '@/api/config.js'

const CLE_DERNIER_DOSSIER = 'backup_dernier_dossier'
const SEP = String.fromCharCode(92) // antislash Windows

// Dossier parent d'un chemin Windows ou POSIX.
function dossierDe (chemin) {
  const i = Math.max(chemin.lastIndexOf('/'), chemin.lastIndexOf(SEP))
  return i >= 0 ? chemin.slice(0, i) : ''
}

function lire (cle) {
  try { return localStorage.getItem(cle) || '' } catch (e) { return '' }
}

function ecrire (cle, valeur) {
  try { localStorage.setItem(cle, valeur) } catch (e) { /* stockage indisponible : sans conséquence */ }
}

export async function telechargerBackup (onProgress) {
  const nomParDefaut = `grainsmoulus-backup-${new Date().toISOString().slice(0, 10)}.zip`
  const enTauri = !!window.__TAURI_INTERNALS__

  let chemin = null
  if (enTauri) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const dossier = lire(CLE_DERNIER_DOSSIER)
    chemin = await save({
      title: 'Enregistrer la sauvegarde',
      defaultPath: dossier ? dossier + SEP + nomParDefaut : nomParDefaut,
      filters: [{ name: 'Archive ZIP', extensions: ['zip'] }],
    })
    if (!chemin) return null
  }

  const axios = (await import('axios')).default
  const response = await axios.get(`${API_BASE_URL}/api/backup/telecharger`, {
    responseType: 'arraybuffer',
    timeout: 0,
    onDownloadProgress: onProgress,
  })

  if (enTauri) {
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    await writeFile(chemin, new Uint8Array(response.data))
    ecrire(CLE_DERNIER_DOSSIER, dossierDe(chemin))
    return chemin
  }

  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const nom = match && /^[\w.-]+\.zip$/i.test(match[1]) ? match[1] : nomParDefaut
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.appendChild(lien)
  lien.click()
  document.body.removeChild(lien)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return nom
}
