# Commerciaux comme entité (personne ou équipe) — design

Date : 2026-09-09
Statut : approuvé (chat)

## Objectif

Le commercial (dépôt-vente) n'est plus un compte de connexion (`commercial`
`type_user = 2`) mais une entité à part entière, comme un client : une
**personne** ou une **équipe**, sans login.

## Base de données

Migration `2026_09_09_000002_create_commerciaux_table` :

- Table `commerciaux` : `id`, `nom`, `type` (`personne` | `equipe`, défaut
  `personne`), `telephone`, `contact`, `responsable` (référent d'équipe),
  `statut` (défaut 1), timestamps.
- Migration de données (PHP, dans la migration) : chaque `commercial` avec
  `type_user = 2` → inséré dans `commerciaux` en **conservant l'id**
  (`commerciaux.id = commercial.id_com`), `nom = "nom prenoms"`,
  `type = 'personne'`. Les `commercial_id` de `commercial_prises` /
  `commercial_fiches` / `commercial_versements` (pas de contrainte SQL) restent
  donc valides sans remappage.

## Backend

- `ApiCommerciauxControllers` (nouveau) : `GET/POST /api/commerciaux`,
  `PUT/DELETE /api/commerciaux/{id}`. Suppression = `statut = 0`.
- `routes/api.php` : 4 routes + `use ApiCommerciauxControllers`.
- `RapportAnalytiqueController::index` — soldes commerciaux : lit `commerciaux`
  (`statut = 1`) au lieu de `commercial where type_user = 2` ; `id` / `nom` au
  lieu de `id_com` / `nom + prenoms` (`prenoms` renvoyé vide pour compat front).
- `GET /api/commercial/{id}/solde` (`CommercialVersementsController`) inchangé —
  le param est un id, et les `commercial_id` pointent toujours vers le même
  entier.

## Frontend

- Nouveaux `src/components/commerciaux/index.vue` + `form.vue` : CRUD (nom, type,
  téléphone, contact, responsable — ce dernier visible si type = équipe).
  Rafraîchissement via l'event bus `window.Fire` (`commerciaux:refresh`).
- `router/index.js` : route `commerciaux` (`/commerciaux`).
- `permissions.js` : `'commerciaux'` ajouté à `ADMIN_RESPONSABLE_PERMISSIONS`.
- `sidebar.vue` : entrée **Commerciaux** (→ `commerciaux`) ; l'ancienne entrée
  `commercial_prises` renommée **Dépôt-vente**. Section « Ventes » : `canAny`
  inclut `commerciaux`.
- `commercial_prises/index.vue` : `fetchCommerciaux()` → `GET /api/commerciaux` ;
  `commercialOptions` = `{ value: c.id, text: c.nom }` ; tous les `.id_com` →
  `.id` ; `nomCommercialSelectionne` = `nom` ; colonnes tableau nom / type /
  téléphone / reste à verser (badge type).
- `commercial/form.vue` : « Commercial » retiré des rôles de compte ;
  `type_user` par défaut `null` (choix obligatoire).

## Hors périmètre

- Rôle de connexion `type_user = 2` : plus utilisé, laissé dans `permissions.js`.
- L'écran des comptes `/commercials` reste sans lien de menu (autre sujet).

## Test (QA manuelle)

1. `resp_test` → menu **Ventes → Commerciaux** : liste (dont l'ancien
   `com_test` migré). Créer une personne et une équipe (avec responsable).
2. **Dépôt-vente** : le sélecteur de commercial liste les nouvelles entités ;
   créer une cession, une fiche, un versement → OK ; Historique et soldes OK.
3. `admin_test` → écran des comptes : plus de rôle « Commercial ».
4. Dashboard Responsable : graphe « Soldes commerciaux » alimenté par la
   nouvelle table.
