# Grains Moulus — Stock et Caisse

Application de bureau (Vue 2 + Tauri) pour la gestion de stock, bons de livraison et caisse.

## Développement

```
yarn install
yarn tauri:dev
```

En dev, le backend Laravel (`gstockgrainsmoulus/`, dépôt séparé) doit être lancé séparément — voir `CLAUDE.md`.

## Build

`createUpdaterArtifacts: true` étant activé, **tout** build (local ou release) signe l'installeur et demande donc la clé de signature — sans elle, `tauri build` échoue avec `no private key`. Avant de builder, dans le même terminal PowerShell :

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "chemin\vers\grainsmoulus-updater.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
yarn tauri:build
```

## Publier une mise à jour

Mêmes variables d'environnement que ci-dessus, puis :

```
node scripts/release.js <version> [--notes "..."]
```

Voir `CLAUDE.md` pour les autres prérequis (`gh auth status`).
