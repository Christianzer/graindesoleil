# Transformation par lot, avec reprise — design

Date : 2026-09-09
Statut : approuvé (chat)

## Objectif

Sur l'écran Transformation de l'usine, permettre d'enchaîner les 3 étapes
(torréfaction → broyage → emballage) **en une fois** ou de **reprendre là où on
s'est arrêté**, via un assistant guidé par **lot**. Un lot peut être terminé à
n'importe quelle étape (café vendu torréfié ou broyé).

Le calcul de stock ne change pas : chaque étape fait toujours le même mouvement
(stade source − entrée, stade destination + obtenu). Le lot est une couche
d'organisation et de reprise par-dessus le mécanisme par étape existant.

## Base de données (greenfield → aucune migration de données)

Migration `2026_09_09_000001_create_lots_table` :

- Table `lots` :
  - `id`
  - `code_lot` — string, unique, format `LOT{dmY}{001}` (compteur du jour, style `AP…` / `FA…`)
  - `code_produit` — string, indexé
  - `statut` — integer, défaut `1` (1 = en cours, 2 = terminé)
  - `derniere_etape` — string(40), nullable (`matiere_vers_torrefaction` | `torrefaction_vers_broyage` | `broyage_vers_emballage`), null = rien encore
  - `date_debut` — string
  - `date_fin` — string, nullable
  - `created_at` / `updated_at`
- `transformations` : ajouter `lot_id` — `unsignedBigInteger` nullable, indexé.

## Backend — `TransformationsController` (extension)

Constante `ETAPES` déjà présente ; ajouter l'ordre :
`ORDRE = ['matiere_vers_torrefaction', 'torrefaction_vers_broyage', 'broyage_vers_emballage']`.

Helper `prochaineEtape(?string $derniere): ?string` — renvoie l'étape suivante
selon `ORDRE`, ou `null` si `broyage_vers_emballage`.

Helper `genererCodeLot()` — calqué sur `genererCodeAppro()` (`LOT` + `dmY` +
`str_pad(count+1, 3)`), `lockForUpdate`, boucle anti-collision.

Helper `prefillEntree(string $codeLot, string $codeProduit, ?string $derniere): float` :
- `null` → `produits.quantite_matiere_premiere`
- sinon → `quantite_sortie` de la ligne `transformations` du lot dont `etape` = `derniere`

| Méthode | Route | Comportement |
|---|---|---|
| `lots(Request)` | `GET /api/lots?statut=` | liste `lots` (join `produits` pour `libelle_produit`), + `prochaine_etape` calculée par ligne. Filtre `statut` si fourni. Tri `id` desc. |
| `creerLot(Request)` | `POST /api/lots` | `{code_produit}` requis. `code_lot = genererCodeLot()`. Insert `statut=1, derniere_etape=null, date_debut=today`. `journaliser('creation','lots',…)`. Retourne `{id, code_lot, code_produit}`. |
| `lot(string $codeLot)` | `GET /api/lots/{code_lot}` | le lot + `lignes` (ses `transformations` triées par `id`) + `prochaine_etape` + `prefill_entree`. 404 si absent. |
| `enregistrerEtape(Request, string $codeLot)` | `POST /api/lots/{code_lot}/etape` | `{etape, quantite_entree, quantite_sortie, observation?}`. Garde-fous : lot existe, `statut == 1` (sinon 422), `etape === prochaineEtape(lot.derniere_etape)` (sinon 422), `etape ∈ ETAPES`, `quantite_entree > 0`, `quantite_sortie >= 0`. Puis **logique de `store()`** : `perte = entree - sortie`, `DB::transaction` { insert `transformations` avec `lot_id`, `mouvementStock(-entree, source)`, `mouvementStock(+sortie, dest)` }. Update `lots` : `derniere_etape = etape`, `updated_at = now`. Si `etape === 'broyage_vers_emballage'` → `statut = 2`, `date_fin = today`. `journaliser`. Retourne `{perte, derniere_etape, statut, prochaine_etape}`. |
| `terminerLot(Request, string $codeLot)` | `POST /api/lots/{code_lot}/terminer` | fin anticipée : `statut = 2`, `date_fin = today`. 422 si déjà terminé. `journaliser`. Retourne `{statut}`. |

`index()` / `store()` (`GET|POST /api/transformations`) inchangés (compat, colonne
`lot` affichée dans l'historique via `lot_id`).

Routes ajoutées dans `routes/api.php` après la ligne `transformations` (POST) :
```php
Route::get('lots', [TransformationsController::class, 'lots']);
Route::post('lots', [TransformationsController::class, 'creerLot']);
Route::get('lots/{code_lot}', [TransformationsController::class, 'lot']);
Route::post('lots/{code_lot}/etape', [TransformationsController::class, 'enregistrerEtape']);
Route::post('lots/{code_lot}/terminer', [TransformationsController::class, 'terminerLot']);
```

## Frontend — `grainsmoulusv2/src/components/usine/transformations.vue` (réécriture)

Libellés d'étape (déjà dans le fichier) réutilisés. `data` :
`produits`, `lotsEnCours`, `lotActif` (`{ ...lot, lignes, prochaine_etape, prefill_entree }`),
`form { quantite_sortie, observation }`, `quantiteEntree`, `historique`,
`nouveauLotProduit`, `Loading`.

- **Zone 1 — Lots en cours** : `b-table` (code_lot, produit, dernière étape lisible, date_debut) + bouton **Reprendre** → `ouvrirLot(code_lot)`.
- **Bouton « Nouveau lot »** → `b-modal` sélecteur produit → `POST /api/lots` → `ouvrirLot(code_lot)`.
- **Assistant** (carte visible si `lotActif`) :
  - Barre de progression : 3 pastilles d'après `lotActif.lignes` (faites) et `prochaine_etape` (courante).
  - Étapes déjà faites : lignes en lecture seule (étape, entrée, obtenu, perte).
  - Si `prochaine_etape` non null : form étape courante — `quantiteEntree` initialisé à `lotActif.prefill_entree` (modifiable), `quantiteSortie`, `perte` en `computed` (`entree - sortie`), `observation`. Boutons :
    - **Enregistrer et continuer** → `enregistrerEtape()` puis recharge le lot (`ouvrirLot`) ; si le lot devient `statut=2`, ferme.
    - **Enregistrer et fermer** → `enregistrerEtape()` puis ferme l'assistant, rafraîchit les listes.
    - **Enregistrer et terminer le lot** → `enregistrerEtape()` puis `POST …/terminer` (si pas déjà terminé par l'emballage), ferme.
  - Si `prochaine_etape` null (lot complet) : message « Lot terminé », bouton Fermer.
  - Bouton **Terminer le lot maintenant** (sans saisir d'étape) → `POST …/terminer`.
- **Zone 3 — Historique** : `b-table` alimentée par `GET /api/transformations` (inchangé) + colonne « Lot » (`lot_id`).

`created()` : `fetchProduits()`, `fetchLotsEnCours()`, `fetchHistorique()`.

## Périmètre

- Permissions : aucune nouvelle (écran déjà `USINE_PERMISSIONS`, routes API non gardées).
- Doc client (artifact `parcours-grains-moulus.html`) : mettre à jour l'étape
  « Transformation » après implémentation (mention lot + reprise).
- Hors périmètre : traçabilité du lot jusqu'à la vente, lots multi-produits,
  quantité cible planifiée.

## Test (QA manuelle — pas de suite JS)

1. `usine_test` → **Nouveau lot** sur un produit ayant du stock matière première.
2. Étape 1 : entrée pré-remplie = dispo ; saisir obtenu → **Enregistrer et fermer**.
3. Le lot est dans « Lots en cours », dernière étape = torréfaction.
4. **Reprendre** → assistant à l'étape 2, entrée pré-remplie = obtenu de l'étape 1.
5. Étape 2 → **Enregistrer et continuer** → étape 3 → **Enregistrer et continuer**
   → lot « terminé », `produits.quantite_emballe` mis à jour.
6. Nouveau lot : après l'étape 1, **Terminer le lot** → lot terminé au stade
   torréfié, `quantite_torrefie` conservé.
7. Soumettre une étape hors séquence (ex. broyage direct) → **422**.
8. Vérifier les mouvements (`produits`, `mouvements_stock`) et le journal d'activité.
