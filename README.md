# Grains Moulus — Stock et Caisse

Application de bureau (Vue 2 + Tauri) pour la gestion de stock, bons de livraison et caisse.

## Développement

```
yarn install
yarn tauri:dev
```

En dev, le backend Laravel (`gstockgrainsmoulus/`, dépôt séparé) doit être lancé séparément — voir `CLAUDE.md`.

## Build

```
yarn tauri:build
```

## Publier une mise à jour

```
node scripts/release.js <version> [--notes "..."]
```

Voir `CLAUDE.md` pour les prérequis (clé de signature updater, `gh auth status`).
