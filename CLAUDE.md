# CLAUDE.md

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler avec le code de ce dépôt.

## Aperçu du Projet

Grains Moulus Stock est une application de bureau Vue 2 + Tauri pour la gestion de stock et les opérations de caisse. L'application gère les clients, produits, ventes (bons de livraison), avoirs, fournisseurs/approvisionnement et opérations de trésorerie.

## Commandes de Build et Développement

```bash
# Installer les dépendances
yarn install

# Développement - Navigateur web
yarn serve

# Développement - Application Tauri (lance yarn serve puis la fenêtre native)
yarn tauri:dev

# Build production - Web
yarn build

# Build production - Tauri (installeur NSIS)
yarn tauri:build
```

En dev, le backend Laravel n'est PAS géré par Tauri : lancez-le vous-même (`php -S 127.0.0.1:8000 -t . index.php` depuis `gstockgrainsmoulus/`, ou Apache/Laragon) — le proxy webpack (`vue.config.js`) pointe dessus. En production, `src-tauri/` embarque et démarre lui-même PHP + Laravel + SQLite (voir plus bas).

## Architecture

### Stack Technique
- **Vue 2.6** avec Vue Router (mode history)
- **Tauri 2** (Rust + WebView2) pour le packaging desktop — migré depuis Electron
- **BootstrapVue** pour les composants UI
- **Axios** pour les requêtes HTTP

### Points d'Entrée
- `src/main.js` - Initialisation Vue, plugins globaux (BootstrapVue, axios, vue-select)
- `src-tauri/src/lib.rs` - Point d'entrée Rust, cycle de vie de l'app
- `src-tauri/src/backend.rs` - Démarrage/arrêt du backend embarqué (sidecar PHP + Laravel + SQLite), équivalent Rust de l'ancien `background.js` Electron
- `scripts/prepare-tauri-resources.js` - Copie filtrée de `php-runtime/` et `gstockgrainsmoulus/` dans `src-tauri/resources-staging/` avant chaque build (référencé par `bundle.resources` dans `tauri.conf.json`)
- `src/utils/print.js` - Point d'impression unique du frontend (`ouvrirDocument()`) : ouvre l'URL du document, désormais généré en PDF côté serveur (voir `gstockgrainsmoulus/app/Http/Middleware/RenderAsPdf.php`) — Tauri n'a pas d'équivalent au `printToPDF()` d'Electron

### Build : dépendances externes au dépôt
Ce dépôt seul ne suffit pas à builder : `scripts/prepare-tauri-resources.js` attend deux dossiers **frères** de `grainsmoulusv2/` sur la machine de build (non versionnés ici) :
- `../gstockgrainsmoulus/` — le backend Laravel (dépôt séparé)
- `../php-runtime/` — copie portable de PHP 8.2.28 avec extensions (sqlite, curl, mbstring...)

C'est pourquoi il n'y a pas de CI GitHub Actions : reproduire ces deux dépendances sur un runner demanderait de fusionner les dépôts ou d'héberger le runtime PHP séparément. Les builds de release se font en local via `node scripts/release.js <version>` (voir README), qui build, signe et publie sur GitHub Releases (dépôt public `Christianzer/graindesoleil`, utilisé comme point de distribution des mises à jour par `@tauri-apps/plugin-updater`).

La clé privée de signature (`grainsmoulus-updater.key`, générée par `tauri signer generate`) vit hors du dépôt — ne jamais la committer. `TAURI_SIGNING_PRIVATE_KEY_PATH` doit pointer dessus avant de lancer `release.js`.

### Piège chemins Windows (important)
`app.path().resource_dir()` / `app_data_dir()` de Tauri renvoient des chemins "étendus" préfixés `\\?\` sur Windows. PHP ne comprend pas ce préfixe dans ses propres arguments CLI (`-d extension_dir=...`, `-t ...`) : il échoue silencieusement à charger toutes ses extensions. Toujours passer ces chemins par `display_path()` (dans `backend.rs`) avant de les donner à PHP.

### Structure du Projet
- `src/components/` - Modules fonctionnels organisés par domaine :
  - `clients/` - Gestion des clients
  - `stocks/` - Gestion des produits/inventaire
  - `ventes/` - Ventes TTC
  - `ventes_ht/` - Ventes HT (hors taxes)
  - `commande/` - Commandes et factures TTC
  - `commande_ht/` - Commandes et factures HT
  - `caisse/` - Opérations de caisse (encaissement)
  - `historiques/`, `historiks/`, `historiks_ht/` - Vues d'historique
  - `entree/` - Entrée de stock / approvisionnement
  - `sortie/` - Sortie de stock / décaissement
  - `rapport/` - Rapports
  - `admin/` - Tableau de bord
  - `commercial/` - Gestion des commerciaux
  - `maj/`, `maj_ht/` - Mise à jour des factures
- `src/layouts/` - Composants de structure (Menu.vue, sidebar.vue, header.vue, footer.vue)
- `src/views/` - Vues de pages (login.vue)
- `src/api/config.js` - Configuration de l'URL API

### Configuration API
L'application se connecte à une API backend. En développement, les requêtes vers `/gstockobf` sont proxifiées vers `http://192.168.116.3`. En production, l'URL `http://gstockobf.test` est utilisée.

### Authentification et Routage
- Authentification stockée dans `localStorage` sous `LoggedUser`
- Le guard `guardMyroute` vérifie les permissions utilisateur selon les noms de routes
- Les permissions sont un tableau de noms de routes dans l'objet utilisateur
- Le layout principal utilise `Menu.vue` qui encapsule les routes authentifiées avec la navigation sidebar

### Patterns des Composants
- Composants en style Options API
- Appels API via axios avec `API_BASE_URL` depuis config
- Données souvent passées entre vues via `localStorage`
- Bus d'événements global disponible via `window.Fire` (instance Vue)
- Tables avec `b-table` incluant pagination et filtrage
