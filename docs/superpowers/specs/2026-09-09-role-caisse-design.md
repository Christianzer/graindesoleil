# Rôle « Caisse » — design

Date : 2026-09-09
Statut : approuvé (chat)

## 1. Contexte

Les rôles utilisateur de `grainsmoulusv2` sont définis **entièrement côté
frontend** dans `src/utils/permissions.js` :

- `commercial.type_user` (int, table `commercial`) : `1`=admin, `2`=commercial,
  `3`=responsable, `4`=usine.
- `PERMISSIONS_BY_ROLE` mappe `type_user` → tableau de noms de routes.
- `src/views/login.vue` appelle `getPermissionsForRole(compte.type_user)` à la
  connexion et stocke le résultat dans `localStorage.LoggedUser.permissions`.
- Contrôle d'accès : `guardMyroute` (`src/router/index.js`) redirige vers
  `/dashboard` toute route dont le nom n'est pas dans `permissions` ; la sidebar
  (`src/layouts/sidebar.vue`) masque les entrées via `v-if="hasPermission(...)"`.

Le backend ne valide pas `type_user` (insertion via `(int) $request->input`,
`ApiClientsControllers::createCommercial`). Les seuls usages backend de
`type_user` sont deux `where('type_user', 2)` spécifiques au rôle Commercial
(`ApiClientsControllers.php:653`, `RapportAnalytiqueController.php:108`) —
insensibles à l'ajout d'un rôle `5`. Les routes API métier n'ont pas de
middleware d'autorisation : un écran affiché peut charger les données dont il a
besoin quel que soit le rôle.

## 2. Objectif

Ajouter un rôle **Caisse** (`type_user = 5`) pour un opérateur de caisse :
encaissement / décaissement / entrées de caisse + consultation en lecture des
historiques de caisse et de ventes. Pas de création ni de modification de bons
de livraison, pas d'accès clients / produits / fournisseurs / comptes /
paramètres.

## 3. Changements

Frontend uniquement (`grainsmoulusv2`). Aucun changement backend, aucune
migration (`type_user` est déjà `integer`, toute valeur convient).

### 3.1 `src/utils/permissions.js`

- Mettre à jour le commentaire d'en-tête pour lister `5=caisse`.
- Nouveau tableau :

  ```js
  const CAISSE_PERMISSIONS = [
    'dashboard',
    'caisses', 'decaissement', 'appro', 'rapport_caisse',
    'historiques_encaissement', 'historiques_encaissement_clients', 'recu',
    'historiques', 'historiques_factures', 'historiques_livraisons',
    'documents_clients',
  ]
  ```

- `PERMISSIONS_BY_ROLE` : ajouter `5: CAISSE_PERMISSIONS`.
- `ROLE_LABELS` : ajouter `5: 'Caisse'`.

### 3.2 `src/components/commercial/form.vue`

- `roleOptions` : ajouter `{ value: 5, text: 'Caisse' }`.

## 4. Justification de la liste des permissions

| Permission | Raison |
|---|---|
| `dashboard` | Page d'atterrissage de tout rôle connecté. |
| `caisses`, `decaissement`, `appro`, `rapport_caisse` | Cœur du métier caisse (section Trésorerie de la sidebar). |
| `historiques_encaissement` | Entrée sidebar « Historiques → Encaissement ». |
| `historiques_encaissement_clients`, `recu` | Drill-down + impression reçu depuis l'historique d'encaissement (routes à paramètres, non listées en sidebar mais atteintes par navigation). |
| `historiques` | Entrée sidebar « Historiques → Clients ». |
| `historiques_factures`, `historiques_livraisons` | Drill-down BL / livraisons en lecture depuis l'historique clients. |
| `documents_clients` | Déjà route publique + entrée sidebar sans `v-if` ; listée pour cohérence avec `ADMIN_RESPONSABLE_PERMISSIONS`. |

Exclus (YAGNI, ajoutables en une ligne si besoin) :

- `ventes_historiques` — vue orientée commerciaux, non atteignable depuis la
  sidebar de ce rôle.
- `clients`, `ventes`, `commande_clients`, `factures_users`, `panier_facture`,
  `factures_avoir`, `facture`, `livraison`, `listes_commandes` — création /
  modification de documents, hors périmètre.
- `stocks`, `fournisseurs`, `approvisionnement`, `transformations`, `demandes*`,
  `commercial*`, `rapport_analytique`, `journal_activite`, `parametres`.

## 5. Test

Pas d'infrastructure de test JS dans `grainsmoulusv2` (aucun script `test`, pas
de jest/vitest). QA manuelle :

1. Créer un compte via l'écran *Commerciaux*, rôle **Caisse**.
2. Se connecter avec ce compte.
3. Sidebar attendue : Tableau de bord, section Trésorerie complète, Historiques
   (Clients + Encaissement), archive. Aucune autre section.
4. Naviguer manuellement vers `/clients`, `/ventes`, `/stocks`, `/parametres` →
   redirection vers `/dashboard`.
5. Depuis « Historiques → Encaissement », ouvrir le détail d'un client puis
   imprimer un reçu → OK.
6. Effectuer un encaissement et un décaissement → OK.

## 6. Hors périmètre

- Protection des routes API côté backend (inchangée, déjà ouverte).
- Toute validation de `type_user` côté backend.
- Migration ou modification de schéma.
