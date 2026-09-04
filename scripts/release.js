// Publie une nouvelle version sur GitHub Releases pour l'updater Tauri.
//
// Pas de CI : le backend (gstockgrainsmoulus/) et le runtime PHP portable
// (php-runtime/) vivent hors de ce dépôt, sur la machine de build —
// les reproduire dans une pipeline GitHub Actions demanderait de fusionner
// les dépôts ou d'héberger le runtime PHP séparément, disproportionné pour
// une appli mono-développeur. On build donc en local (comme d'habitude) et
// ce script se charge de signer, générer latest.json et publier la release.
//
// Prérequis :
//   - `gh auth status` OK (déjà le cas sur cette machine)
//   - TAURI_SIGNING_PRIVATE_KEY_PATH exporté vers la clé privée générée par
//     `tauri signer generate`
//
// Usage : node scripts/release.js 1.0.1 [--notes "Correctifs impression"]
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO = 'Christianzer/graindesoleil'
const root = path.join(__dirname, '..')
const bundleDir = path.join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis')

function run(cmd, args) {
  console.log(`$ ${cmd} ${args.join(' ')}`)
  execFileSync(cmd, args, { cwd: root, stdio: 'inherit' })
}

function main() {
  const version = process.argv[2]
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('Usage : node scripts/release.js <version, ex: 1.0.1> [--notes "..."]')
    process.exit(1)
  }
  const notesIdx = process.argv.indexOf('--notes')
  const notes = notesIdx !== -1 ? process.argv[notesIdx + 1] : `Version ${version}`

  if (!process.env.TAURI_SIGNING_PRIVATE_KEY && !process.env.TAURI_SIGNING_PRIVATE_KEY_PATH) {
    console.error(
      "TAURI_SIGNING_PRIVATE_KEY(_PATH) n'est pas défini — la mise à jour ne pourra pas être signée.\n" +
      'Exemple (PowerShell) : $env:TAURI_SIGNING_PRIVATE_KEY_PATH = "C:\\chemin\\vers\\grainsmoulus-updater.key"'
    )
    process.exit(1)
  }

  // 1. Bump de version dans tauri.conf.json + package.json
  const confPath = path.join(root, 'src-tauri', 'tauri.conf.json')
  const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'))
  conf.version = version
  fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n')

  const pkgPath = path.join(root, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.version = version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  // 2. Build signé (createUpdaterArtifacts: true génère le .nsis.zip + .sig)
  run('node', ['scripts/prepare-tauri-resources.js'])
  run('yarn', ['build'])
  run('./node_modules/.bin/tauri', ['build'])

  // 3. Repérer les artefacts produits (noms exacts dépendants de la version/arch)
  const files = fs.readdirSync(bundleDir)
  const setupExe = files.find((f) => f.endsWith('-setup.exe'))
  const updaterZip = files.find((f) => f.endsWith('.nsis.zip'))
  const sigFile = files.find((f) => f.endsWith('.nsis.zip.sig'))
  if (!setupExe || !updaterZip || !sigFile) {
    console.error(`Artefacts introuvables dans ${bundleDir}. Contenu :`, files)
    process.exit(1)
  }
  const signature = fs.readFileSync(path.join(bundleDir, sigFile), 'utf8').trim()

  // 4. latest.json — manifeste lu par le plugin updater au lancement de l'app
  const latest = {
    version,
    notes,
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature,
        url: `https://github.com/${REPO}/releases/download/v${version}/${updaterZip}`,
      },
    },
  }
  const latestPath = path.join(bundleDir, 'latest.json')
  fs.writeFileSync(latestPath, JSON.stringify(latest, null, 2))

  // 5. Tag + release GitHub (crée aussi le tag distant si absent)
  run('git', ['add', 'src-tauri/tauri.conf.json', 'package.json'])
  run('git', ['commit', '-m', `chore: release v${version}`])
  run('git', ['tag', `v${version}`])
  run('git', ['push'])
  run('git', ['push', 'origin', `v${version}`])

  run('gh', [
    'release', 'create', `v${version}`,
    path.join(bundleDir, setupExe),
    path.join(bundleDir, updaterZip),
    path.join(bundleDir, sigFile),
    latestPath,
    '--repo', REPO,
    '--title', `v${version}`,
    '--notes', notes,
  ])

  console.log(`\nRelease v${version} publiée : https://github.com/${REPO}/releases/tag/v${version}`)
}

main()
