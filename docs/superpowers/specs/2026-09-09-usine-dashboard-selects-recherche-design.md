# Dashboard usine, correctifs appro/demandes, selects recherchables — design

Date : 2026-09-09
Statut : approuvé (chat)

## 1. Journal d'activité chez Caisse & Usine — aucun changement

`journal_activite` n'est présent que dans `ADMIN_RESPONSABLE_PERMISSIONS`. Caisse
et Usine ne voient déjà pas cet écran (il faut se reconnecter pour rafraîchir la
session). Rien à coder.

## 2. Tableau de bord propre à l'usine

### Backend — `TransformationsController::dashboard()` + `GET /api/usine/dashboard`

Agrège en un appel :
- `stock_stades` : `produits` → `code_produit`, `libelle_produit`,
  `matiere_premiere`, `torrefie`, `broye`, `emballe` (alias des colonnes
  `quantite_*`), triés par libellé.
- `lots_en_cours` : `lots` `statut=1` + `libelle_produit` + `prochaine_etape`
  (via `prochaineEtape()`).
- `demandes_a_livrer` : `count` `demandes` `statut IN (1,2)`.
- `dette_fournisseurs` : `Σ approvisionnements.montant_total − Σ versement_fournisseur.montant_verser`.
- `appro_mois` : `Σ approvisionnements.montant_total` où `date_appro LIKE 'YYYY-MM%'` (mois courant).

Route ajoutée après les routes `lots` :
`Route::get('usine/dashboard', [TransformationsController::class, 'dashboard']);`

### Frontend

- Nouveau `src/components/usine/dashboard.vue` : `PageHeader` + 3 `StatCard`
  (Demandes à livrer, Dette fournisseurs, Appro du mois) + carte « Stock par
  stade » (`b-table` par produit) + carte « Lots en cours » (`b-table`
  code_lot / produit / prochaine étape). Un `GET /api/usine/dashboard` au
  `created()`.
- `admin/index.vue` : aiguillage. Template =
  `<UsineDashboard v-if="roleUsine" />` sinon le contenu actuel (v-else sur la
  `div.container-fluid`). `computed roleUsine` = `LoggedUser.type_user === 4`.
  `created()` : `if (this.roleUsine) return` avant les fetch ventes.

## 3. Approvisionnement : pas deux fois le même produit

`fournisseurs/approvisionnement.vue` : `produitOptions` (computed) remplacé par
`optionsPourLigne(index)` → exclut les `code_produit` déjà choisis sur les
autres lignes (garde la sélection de la ligne courante). Template :
`:options="optionsPourLigne(index)"`.

## 4. Consulter une demande (livrée ou non)

`demandes/index.vue` : bouton **Consulter** sur toutes les lignes → modale
lecture seule (`modalConsultation`) alimentée par
`GET /api/demandes/{code}/lignes` (existe déjà) : produit, demandé (kg),
livré (kg). Le bouton « Traiter / livrer » reste conditionnel (statut ≠ 3).

## 5. Selects recherchables — partout

### `src/components/ui/SearchSelect.vue`

Wrapper autour de `v-select` (vue-select 3.20, déjà global + CSS importée).
Props `value`, `options` (`[{value,text}]` ou primitifs), `disabled`,
`clearable`, `placeholder`. Normalise les options, `:reduce="o => o.value"`,
`label="text"`, `:selectable` respecte `disabled`, `append-to-body` (évite le
rognage dans les modales et tableaux). `@input` → `$emit('input', valeur|null)`.
Petit CSS pour aligner hauteur/bordure sur les inputs Bootstrap.

Enregistré global dans `main.js` : `Vue.component('search-select', SearchSelect)`.

### Remplacement `<b-form-select>` → `<search-select>` (17 occurrences, 8 fichiers)

| Fichier | Selects |
|---|---|
| `fournisseurs/approvisionnement.vue` | fournisseur, produit/ligne |
| `demandes/index.vue` | produit/ligne |
| `usine/transformations.vue` | produit du lot |
| `commercial_prises/index.vue` | commercial ×2, produit/ligne ×2 |
| `caisse/encaissement.vue` | type de paiement, réseau mobile money |
| `commercial/form.vue` | rôle |
| `journal_activite/index.vue` | filtre module, filtre action |
| `rapport/index.vue` | type de rapport, détail, type de paiement |

API identique (`v-model` + `:options`), donc remplacement mécanique. `perPage`
et autres selects à options primitives courtes : convertis aussi (recherche
inoffensive, cohérence demandée).

## Hors périmètre

- Gabarits PDF Blade.
- Refonte visuelle du dashboard ventes existant.

## Test (QA manuelle)

1. `usine_test` → `/dashboard` affiche le tableau de bord usine (stock par
   stade, lots en cours, demandes à livrer, dette + appro du mois).
   `resp_test` / `admin_test` → dashboard ventes inchangé.
2. Approvisionnement : après avoir choisi un produit sur une ligne, il
   n'apparaît plus dans le menu des autres lignes.
3. Demandes : bouton **Consulter** sur une demande livrée → modale avec les
   lignes demandé/livré.
4. Tous les menus déroulants listés se filtrent à la frappe.
5. Se reconnecter en `caisse_test` / `usine_test` → pas de « Journal d'activité »
   au menu.
