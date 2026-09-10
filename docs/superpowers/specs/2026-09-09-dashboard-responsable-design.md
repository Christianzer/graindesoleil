# Tableau de bord Responsable — design

Date : 2026-09-09
Statut : approuvé (chat)

## Objectif

Le Responsable (`type_user === 3`) a un tableau de bord dédié à la route
`dashboard`, mélange du rapport analytique et du dashboard opérationnel.
L'Admin (1) garde le dashboard ventes actuel ; le Commercial (2) aussi ;
l'Usine (4) garde son dashboard usine.

## Composition (choix chat)

- Filtre de dates + 4 KPI analytiques (Encaissé, Décaissement, Autres entrées,
  Reste à verser commerciaux) — source `/api/rapport-analytique`.
- + KPI opérationnel **Reste à encaisser** (HT + TTC) — source `/api/dash`
  (`ventes_a_realiser − ventes_realiser.montant_total`, idem TTC).
- + les 7 graphiques du rapport analytique (CA/jour, trésorerie, transformations
  /jour, stock par étape, top produits, top clients, soldes commerciaux).
- + tableau **Réconciliation de stock** — source `/api/reconciliation_stock`
  (repris tel quel de `admin/index.vue`, dates du détail formatées via `$dateFr`).

Aucun changement backend : les 3 endpoints existent déjà.

## Implémentation

- Nouveau `src/components/responsable/dashboard.vue` : composition de
  `rapport_analytique/index.vue` (charts, chart.js/vue-chartjs, options) + le
  KPI Reste à encaisser + le bloc réconciliation de `admin/index.vue`.
  3 appels au `created()` (`fetchTout`).
- `admin/index.vue` : aiguillage
  `<UsineDashboard v-if="roleUsine" />`
  `<ResponsableDashboard v-else-if="roleResponsable" />`
  `<div v-else>` (dashboard ventes actuel).
  `roleResponsable` computed = `LoggedUser.type_user === 3`.
  `created()` : `if (this.roleUsine || this.roleResponsable) return`.

## Hors périmètre

- L'écran `rapport-analytique` séparé reste inchangé (toujours au menu).
- Pas de refonte du dashboard ventes ni du dashboard usine.

## Test (QA manuelle)

1. `resp_test` → `/dashboard` = filtre de dates, 5 KPI (dont Reste à encaisser),
   7 graphiques, tableau réconciliation. Changer la période → « Consulter ».
2. `admin_test` → dashboard ventes inchangé. `usine_test` → dashboard usine.
3. `com_test` → dashboard ventes (inchangé).
