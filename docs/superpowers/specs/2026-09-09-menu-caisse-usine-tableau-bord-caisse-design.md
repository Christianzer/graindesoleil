# Menu Caisse/Usine à plat + tableau de bord Caisse — design

Date : 2026-09-09
Statut : approuvé (chat) — implémenté et testé (Playwright/Chrome)

## Décisions (AskUserQuestion)

- **« Suivi & Documents »** : retirée **pour la Caisse uniquement**. L'Admin
  garde Archive / Historiques / Journal d'activité ; le Responsable reste masqué
  comme avant (`MASQUE_RESPONSABLE`).
- **Tableau de bord Caisse** : version **complète** (cartes du jour + « à
  encaisser » + flux des derniers versements).

## 1. Permissions (`src/utils/permissions.js`)

`CAISSE_PERMISSIONS` réduit à une console de trésorerie :

```js
const CAISSE_PERMISSIONS = [
  'dashboard',
  'caisses', 'appro', 'decaissement', 'rapport_caisse',
]
```

Retirés : `historiques*`, `documents_clients`, `historiques_encaissement*`,
`recu`, `historiques_factures`, `historiques_livraisons`. Les écrans restent
dans le routeur (atteignables par lien direct) mais plus au menu, et le garde
`guardMyroute` renvoie la Caisse au dashboard si elle tente une route retirée.

## 2. Menu à plat pour Usine + Caisse (`src/layouts/sidebar.vue`)

Nouveau computed `menuPlat` = `type_user === 4 || type_user === 5`.

- **Trésorerie** : si `menuPlat`, les 4 entrées (Encaissement, Autres entrées,
  Décaissement, Rapport de caisse) sont des `nav-link` directs sous le libellé
  de section — plus de `b-collapse` / chevron. Sinon, menu déroulant inchangé
  (Admin/Responsable).
- **Fournisseurs** : idem — si `menuPlat`, « Liste fournisseurs » et
  « Approvisionnement » deviennent des liens directs sous « Stock & Production ».

Réordonnancement « Stock & Production » selon le flux métier :
Produits → Fournisseurs → Transformations → Demandes à l'usine.

Résultat :
- **Caisse** : Tableau de bord + Encaissement / Autres entrées / Décaissement /
  Rapport de caisse. Rien d'autre.
- **Usine** : Tableau de bord + Liste fournisseurs / Approvisionnement /
  Transformations / Demandes à l'usine.

## 3. Tableau de bord Caisse

### Backend — `CaisseControllers::dashboard()` + `GET /api/caisse/dashboard?date=`

`date` défaut = aujourd'hui. Renvoie :

| champ | calcul |
|---|---|
| `encaisse_bl` | Σ `versement.montant_verser` du jour |
| `encaisse_commerciaux` | Σ `commercial_versements.montant` du jour |
| `encaisse_jour` | `encaisse_bl + encaisse_commerciaux` |
| `autres_entrees` | Σ `entre_caisse.montant_entre_caisse` du jour |
| `decaisse_jour` | Σ `sortie_caisse.montant_sortie_caisse` du jour |
| `solde_jour` | `encaisse_jour + autres_entrees − decaisse_jour` |
| `a_encaisser.bl` | `{ nombre, montant }` — restes de **tous** les BL non soldés (pas seulement du jour) |
| `a_encaisser.commerciaux` | `{ nombre, montant }` — Σ cessions − Σ versements par commercial actif, > 0 |
| `a_encaisser.total` | somme des deux |
| `derniers_versements` | 8 derniers encaissements (clients + commerciaux mêlés) : `{ date, source, nom, montant, reference }` |

### Frontend — `src/components/caisse/dashboard.vue`

Branché dans `admin/index.vue` : `<CaisseDashboard v-else-if="roleCaisse" />`
(computed `roleCaisse` = `type_user === 5`), et `created()` saute le fetch du
dashboard ventes pour la Caisse.

- Sélecteur de date (`b-form-datepicker`, défaut aujourd'hui) + Rafraîchir.
- 4 `StatCard` : Encaissé (jour) [sous-texte BL / Comm.], Autres entrées (jour),
  Décaissé (jour), Solde du jour.
- Carte **À encaisser** : BL clients (n / montant), Commerciaux (n / montant),
  Total, + bouton « Aller à l'encaissement » → route `caisses`.
- Carte **Derniers versements** : `b-table` (date, source [badge], nom, montant).

## Tests (Playwright / Chrome, 37 assertions vertes)

- `/api/caisse/dashboard` : figures exactes sur jeu de données injecté
  (encaissé 20 000, entrées 5 000, décaissé 3 000, solde 22 000, à encaisser
  commerciaux 1/12 000).
- Caisse : sidebar = 5 liens directs, 0 chevron, 0 `v-b-toggle`, section unique
  « Trésorerie » ; dashboard dédié rendu ; navigation directe OK.
- Usine : sidebar = liens directs (Liste fournisseurs / Approvisionnement /
  Transformations / Demandes), plus de parent « Fournisseurs » déroulant.
