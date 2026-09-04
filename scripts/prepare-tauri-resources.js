// Prépare les ressources embarquées avant un build Tauri (PHP portable +
// backend Laravel), à l'identique de ce que faisait `extraResources` côté
// Electron (vue.config.js). Tauri n'a pas de filtre d'exclusion natif pour
// bundle.resources : on copie donc une version filtrée dans
// src-tauri/resources-staging/, que tauri.conf.json référence ensuite tel quel.
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const stagingDir = path.join(root, 'src-tauri', 'resources-staging')

const PHP_SOURCE = path.join(root, '..', 'php-runtime')
const BACKEND_SOURCE = path.join(root, '..', 'gstockgrainsmoulus')

const BACKEND_EXCLUDES = [
  /^database[\\/]database\.sqlite$/,
  /^storage[\\/]app[\\/]backup([\\/]|$)/,
  /^storage[\\/]logs([\\/]|$)/,
  /^\.idea([\\/]|$)/,
  /^tests([\\/]|$)/,
  /^\.env\.example$/,
  /\.zip$/,
  /^\.git([\\/]|$)/,
]

function copyDir(src, dest, excludes, relBase = '') {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const rel = relBase ? path.join(relBase, entry.name) : entry.name
    if (excludes.some((re) => re.test(rel))) continue
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, excludes, rel)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function main() {
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true })
  }

  if (!fs.existsSync(PHP_SOURCE)) {
    throw new Error(`Runtime PHP introuvable : ${PHP_SOURCE}`)
  }
  if (!fs.existsSync(BACKEND_SOURCE)) {
    throw new Error(`Backend introuvable : ${BACKEND_SOURCE}`)
  }

  console.log(`Copie du runtime PHP : ${PHP_SOURCE} -> ${path.join(stagingDir, 'php')}`)
  copyDir(PHP_SOURCE, path.join(stagingDir, 'php'), [])

  console.log(`Copie du backend : ${BACKEND_SOURCE} -> ${path.join(stagingDir, 'backend')}`)
  copyDir(BACKEND_SOURCE, path.join(stagingDir, 'backend'), BACKEND_EXCLUDES)

  console.log('Ressources Tauri préparées.')
}

main()
