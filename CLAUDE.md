# CLAUDE.md

Ce fichier fournit des instructions à Claude Code (claude.ai/code) pour travailler avec le code de ce dépôt.

## Aperçu du Projet

Café Fortuna Stock (produit Grains Moulus) est une application de bureau Vue 2 + Tauri pour la gestion de stock et les opérations de caisse. L'application gère les clients, produits, ventes (bons de livraison), avoirs, fournisseurs/approvisionnement, caisse/trésorerie, dépôt-vente commercial, transformations de stock, demandes internes et clôtures de période. Elle est aussi distribuée comme **PWA** (installable sur mobile, notifications push).

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

**Backend.** L'app se connecte au **même backend hébergé en ligne** en dev et en prod : `https://api.cafefortuna.net` en dur dans `src/api/config.js`. Il n'y a **plus de proxy webpack** (`vue.config.js` n'en définit aucun) ni de sidecar PHP embarqué — lancer le backend Laravel en local n'est donc plus nécessaire pour utiliser l'app. Pour travailler sur le backend lui-même, voir `gstockgrainsmoulus/CLAUDE.md` (serveur `php -S 127.0.0.1:8000 serve_local.php`).

## Architecture

### Stack Technique
- **Vue 2.6** (Options API) avec Vue Router (mode history)
- **Tauri 2** (Rust + WebView2) pour le packaging desktop — migré depuis Electron. Installeur **NSIS**.
- **BootstrapVue** pour les composants UI, plus `element-plus`, `vue-select` (wrapper local `search-select`)
- **Axios** pour les requêtes HTTP
- **PWA** : service worker custom (`src/service-worker.js`, mode Workbox `InjectManifest`) pour les notifications push (`web-push` côté serveur)

### Points d'Entrée
- `src/main.js` - Initialisation Vue, plugins globaux (BootstrapVue, axios, vue-select)
- `src-tauri/src/lib.rs` - Point d'entrée Rust, cycle de vie de l'app
- `src-tauri/src/backend.rs` - Ancien sidecar embarqué (PHP + Laravel + SQLite), équivalent Rust de l'ancien `background.js` Electron. **Désactivé** depuis le passage au backend en ligne : le module reste dans le dépôt (compilé avec `#[allow(dead_code)]`) mais n'est plus appelé par `lib.rs`, au cas où on revienne un jour à l'embarqué.
- `scripts/prepare-tauri-resources.js` - Ancien script de copie de `php-runtime/` et `gstockgrainsmoulus/` dans `src-tauri/resources-staging/`. **Plus appelé** par `beforeBuildCommand` (`tauri.conf.json`) ni par le bloc `bundle.resources` (retiré) depuis le passage au backend en ligne.
- `src/utils/print.js` - Point d'impression unique du frontend (`ouvrirDocument()`) : ouvre l'URL du document, désormais généré en PDF côté serveur (voir `gstockgrainsmoulus/app/Http/Middleware/RenderAsPdf.php`) — Tauri n'a pas d'équivalent au `printToPDF()` d'Electron

### Build
Depuis le passage au backend en ligne, `beforeBuildCommand` (`tauri.conf.json`) ne fait plus que `yarn build` — `scripts/prepare-tauri-resources.js` et les dossiers frères `../gstockgrainsmoulus/` / `../php-runtime/` ne sont plus requis pour builder. Les builds de release se font en local via `node scripts/release.js <version>` (voir README), qui build, signe et publie sur GitHub Releases (dépôt public `Christianzer/graindesoleil`, utilisé comme point de distribution des mises à jour par `@tauri-apps/plugin-updater`).

La clé privée de signature (`grainsmoulus-updater.key`, générée par `tauri signer generate`) vit hors du dépôt — ne jamais la committer. `TAURI_SIGNING_PRIVATE_KEY_PATH` doit pointer dessus avant de lancer `release.js`.

### Piège chemins Windows (historique, code désactivé)
`app.path().resource_dir()` / `app_data_dir()` de Tauri renvoient des chemins "étendus" préfixés `\\?\` sur Windows. PHP ne comprend pas ce préfixe dans ses propres arguments CLI (`-d extension_dir=...`, `-t ...`) : il échoue silencieusement à charger toutes ses extensions. Pertinent uniquement si `backend.rs` (sidecar PHP embarqué, actuellement désactivé) est un jour réactivé — toujours passer ces chemins par `display_path()` avant de les donner à PHP.

### Structure du Projet
- `src/components/` - Modules fonctionnels organisés par domaine :
  - `clients/` - Gestion des clients
  - `stocks/` - Gestion des produits/inventaire
  - `ventes/` - Ventes / bons de livraison
  - `commande/` - Commandes et factures
  - `caisse/` - Opérations de caisse (encaissement)
  - `comptes/` - Comptes client / relevés
  - `historiques/`, `historiks/` - Vues d'historique
  - `entree/` - Entrée de stock / approvisionnement
  - `sortie/` - Sortie de stock / décaissement
  - `fournisseurs/` - Fournisseurs et approvisionnements
  - `commercial/`, `commercial_prises/`, `commerciaux/` - Dépôt-vente commercial (fiches, prises, versements)
  - `demandes/` - Demandes de stock internes
  - `usine/` - Transformations de stock (conversion matière première → produit fini)
  - `clotures/` - Clôtures de période
  - `parametres/` - Paramètres entreprise
  - `rapport/` - Rapports
  - `admin/` - Tableau de bord
  - `journal_activite/` - Journal d'activité
  - `maj/` - Mise à jour des factures
  - `assistant/` - Assistant de vente
  - `documents/`, `ui/`, `dev/` - Documents, composants UI réutilisables, prévisualisation dev
- `src/layouts/` - Composants de structure (Menu.vue, sidebar.vue, header.vue, footer.vue)
- `src/views/` - Vues de pages (login.vue)
- `src/api/config.js` - Configuration de l'URL API (`API_BASE_URL`)
- `src/store/flow.js` - État inter-vues de la vente en cours (adossé à localStorage, pas Vuex)
- `src/utils/` - Utilitaires (dont `print.js` `ouvrirDocument()` et `entier.js`)

### Configuration API
`src/api/config.js` exporte `API_BASE_URL = 'https://api.cafefortuna.net'` — **en dur, identique en dev et en prod**. Il n'y a plus de proxy webpack ni d'URL de test locale (`http://gstockobf.test` / `192.168.116.3` sont obsolètes).

### Authentification et Routage
- Authentification stockée dans `localStorage` sous `LoggedUser`
- Le guard `guardMyroute` (`src/router/index.js`) vérifie les permissions utilisateur selon les noms de routes ; deux routes sont publiques à tout utilisateur connecté (`documents_clients`, `assistant_vente`)
- Les permissions sont un tableau de noms de routes dans l'objet utilisateur
- Le layout principal utilise `Menu.vue` qui encapsule les routes authentifiées avec la navigation sidebar
- `src/main.js` ajoute un intercepteur de requête axios qui attache `X-User` / `X-User-Role` depuis `LoggedUser`, et un intercepteur de réponse qui affiche un toast « Période clôturée » sur un HTTP **423**

### Patterns des Composants
- Composants en style Options API
- Appels API via axios avec `API_BASE_URL` depuis config (`Vue.prototype.$http`)
- Données souvent passées entre vues via `localStorage`
- Bus d'événements global disponible via `window.Fire` (instance Vue)
- Tables avec `b-table` incluant pagination et filtrage
- Champs de montants en FCFA entiers : directive `v-entier` (`src/utils/entier.js`) ; dates affichées en `JJ/MM/AAAA` via le filtre `dateFr`
