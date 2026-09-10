# Format des dates JJ/MM/AAAA — design

Date : 2026-09-09
Statut : approuvé (chat)

## Objectif

Afficher les dates au format **`JJ/MM/AAAA`** (ex. `09/09/2026`) partout dans
l'application Vue, **sauf** sur les reçus et relevés (aperçus de documents) qui
gardent le format long en toutes lettres (« mardi 9 septembre 2026 »).

## Constat

- Dates stockées en base comme texte, format `YYYY-MM-DD` (ou `YYYY-MM-DD HH:mm:ss`).
- Beaucoup de colonnes `b-table` affichent la date brute (`2026-09-09`).
- Trois helpers locaux hétérogènes :
  - `date_com(v)` → `moment(v).locale('fr').format('dddd D MMMM YYYY')` — dans
    `caisse/imprimer.vue`, `caisse/index.vue`, `caisse/historique_recu.vue`,
    `historiques/index.vue`, `ventes/facture.vue`, `ventes/livraison.vue`,
    `rapport.vue`. **Contexte reçu / relevé / document → conservé tel quel.**
  - `changerDate(v)` → `moment(v).format('DD-MM-YYYY')` — `rapport/index.vue`.
  - `formatDate(v)` → date + heure — `journal_activite/index.vue`.

## Changements

### 1. Helper global — `src/main.js`

```js
import moment from 'moment'

function formatDateFr(value) {
  if (value === null || value === undefined || value === '') return ''
  const m = moment(String(value).replace(' ', 'T'))
  return m.isValid() ? m.format('DD/MM/YYYY') : String(value)
}

Vue.filter('dateFr', formatDateFr)
Vue.prototype.$dateFr = formatDateFr
```

### 2. Colonnes `b-table` en date brute → `formatter`

Ajouter `formatter: (v) => this.$dateFr(v)` (défini dans `data()`, `this` = instance)
sur ces champs :

| Fichier | Champ(s) |
|---|---|
| `usine/transformations.vue` | `date_debut`, `date_transformation` |
| `demandes/index.vue` | `date_demande` |
| `commercial_prises/index.vue` | `date_prise`, `date_versement`, `date_fiche` |
| `fournisseurs/index.vue` | `date_appro` |
| `entree/index.vue` | `date_entre` |
| `sortie/index.vue` | `date_sortie` |
| `documents/index.vue` | `date_facture`, `date_commande` |
| `admin/index.vue` | champ inline `{ key:'date' }` (ligne ~90) → `formatter: dateFr`, méthode `dateFr(v){ return this.$dateFr(v) }` |

### 3. Helpers locaux hors reçus/relevés

- `rapport/index.vue` → `changerDate` : `DD-MM-YYYY` → `DD/MM/YYYY`.
- `journal_activite/index.vue` → `formatDate` : sortie `DD/MM/YYYY HH:mm`
  (la colonne s'appelle « Date/heure », on garde l'heure).

### 4. Inchangé (format long — reçus & relevés)

Tous les `date_com` : `caisse/imprimer.vue`, `caisse/index.vue`,
`caisse/historique_recu.vue`, `historiques/index.vue`, `ventes/facture.vue`,
`ventes/livraison.vue`, `rapport.vue`.

## Hors périmètre

- Gabarits PDF Blade (backend) — non retenus.
- Format de saisie (les `b-form-datepicker` sont déjà en `fr-FR`).
- Format de stockage en base — inchangé.

## Test (QA manuelle)

1. Écrans Transformations / Lots / Demandes / Fournisseurs / Entrées / Sorties /
   Documents / Cessions / dashboard : les dates s'affichent `09/09/2026`.
2. Journal d'activité : `09/09/2026 15:32`.
3. Rapport de caisse : dates en `09/09/2026`.
4. Aperçu d'un reçu et d'un relevé de compte client : toujours « mardi 9
   septembre 2026 ».
