#!/usr/bin/env node
// Archive le code source du frontend (sans node_modules, dist, build Rust, .git)
// et le dépose sur le serveur de l'API, où BackupService l'ajoute au ZIP de
// sauvegarde (le serveur n'a pas ce code autrement : il n'héberge que la PWA compilée).
//
//   node scripts/publier-source.js
//
// Variables optionnelles :
//   BACKUP_SSH   cible ssh (défaut : akch8122@109.234.162.71)
//   BACKUP_PORT  port ssh  (défaut : 22)
//   BACKUP_DEST  chemin distant du fichier
//                (défaut : api.cafefortuna.net/storage/app/backup-assets/frontend-source.tgz)

const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const racine = path.resolve(__dirname, '..')
const cible = process.env.BACKUP_SSH || 'akch8122@109.234.162.71'
const port = process.env.BACKUP_PORT || '22'
const dest = process.env.BACKUP_DEST || 'api.cafefortuna.net/storage/app/backup-assets/frontend-source.tgz'
// tar/scp sont lancés depuis le dossier temporaire avec des chemins relatifs : sous Git Bash,
// un chemin « C:... » serait pris pour « machine:chemin ».
const NOM = 'frontend-source.tgz'
const tmpDir = os.tmpdir()
const tmp = path.join(tmpDir, NOM)

function run (cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: tmpDir })
  if (r.status !== 0) {
    console.error(`Échec : ${cmd} ${args.join(' ')}`)
    process.exit(r.status || 1)
  }
}

const exclusions = ['node_modules', 'dist', 'dist_electron', '.git', '.idea', '*.log', 'src-tauri/target', 'src-tauri/gen', 'src-tauri/resources', 'src-tauri/resources-staging']
console.log('Archivage du code source…')
run('tar', ['-czf', NOM, ...exclusions.flatMap(e => ['--exclude', e]), '-C', racine, '.'])
console.log(`Archive : ${(fs.statSync(tmp).size / 1048576).toFixed(1)} Mo`)

const dossier = dest.split('/').slice(0, -1).join('/')
run('ssh', ['-p', port, cible, `mkdir -p ~/${dossier}`])
run('scp', ['-P', port, NOM, `${cible}:~/${dest}`])
fs.unlinkSync(tmp)
console.log('Code source déposé sur le serveur — il sera inclus dans les prochains backups.')
