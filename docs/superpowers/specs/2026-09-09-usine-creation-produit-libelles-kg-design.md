# Usine : création de produit + libellés « kg » — design

Date : 2026-09-09
Statut : approuvé (chat)

## Contexte

- Toute la chaîne (matière première → torréfié → broyé → emballé → stock
  boutique → vente) est en **kg** : la boutique vend au poids. Pas d'unité
  « sachet », pas de conversion (Option 2 initialement envisagée → abandonnée).
- L'usine (`USINE_PERMISSIONS`) a les écrans *Approvisionnement*,
  *Transformations*, *Demandes*, mais **pas** *Produits* (`stocks`). Le menu
  déroulant produit de l'écran Appro ne liste que les produits déjà créés
  → l'usine est bloquée tant qu'un Admin/Responsable n'a pas créé le produit.
- `ApiProduitsControllers::createProduits` génère déjà le code `PRD00001…` et
  accepte un `libelle_produit` seul (prix / quantité par défaut 0). Il retourne
  aujourd'hui un booléen (`DB::table()->insert()`), pas la ligne créée.
- `stocks/form.vue` (écran Produits complet) ne teste que
  `response.status === 201`, il ignore le corps de la réponse.

## Feature 1 — « + nouveau produit » depuis l'écran Approvisionnement

### Backend (`gstockgrainsmoulus`)

`ApiProduitsControllers::createProduits` : remplacer
`return response()->json($clients, 201);` par le retour de la ligne créée :

```php
return response()->json([
    'code_produit'    => $code_produit,
    'libelle_produit' => $libelle_produit,
], 201);
```

Le reste (insert, log `mouvements_stock` si quantité initiale > 0,
`journaliser`) inchangé. Sans risque pour `stocks/form.vue` (n'utilise que le
code HTTP).

### Frontend (`grainsmoulusv2/src/components/fournisseurs/approvisionnement.vue`)

- Bouton **« + Nouveau produit »** à côté de « Ajouter une ligne ».
- `b-modal` (ref `modalNouveauProduit`), un seul champ : **Libellé**.
- `creerProduit()` : `POST ${API_BASE_URL}/api/produits` avec `{ libelle_produit }`.
  Sur 201 :
  - `this.produits.push({ code_produit, libelle_produit })`
  - ajoute une ligne d'appro pré-remplie :
    `this.lignes.push({ code_produit, quantite: 1, prix_achat_unitaire: 0 })`
  - ferme la modale, toast succès.
- Pas de changement de permissions (écran déjà usine, routes API non gardées).

## Feature 2 — libellés « (kg) » (frontend uniquement, texte pur)

| Fichier | Libellé actuel → nouveau |
|---|---|
| `usine/transformations.vue` | résumé stock : `Matière première` / `Torréfié` / `Broyé` / `Emballé` → suffixe ` (kg)` sur les 4 ; form : `Quantité entrée` → `Quantité entrée (kg)`, `Quantité obtenue` → `Quantité obtenue (kg)`, `Perte` → `Perte (kg)` ; table historique : `Entrée`/`Sortie`/`Perte` → `… (kg)` |
| `fournisseurs/approvisionnement.vue` | en-tête colonne `Quantité livrée` → `Quantité livrée (kg)` |
| `demandes/index.vue` | modale création : `Quantité demandée` → `Quantité demandée (kg)` ; modale livraison : `Demandé` / `Déjà livré` / `À livrer maintenant` → `… (kg)` |
| `stocks/index.vue` | champ `quantite_produit` label `Quantite disponible` → `Quantité disponible (kg)` |
| `stocks/form.vue` | `Quantite produit` → `Quantité produit (kg)` |

Aucune logique modifiée, aucun changement backend pour cette feature.

## Hors périmètre

- Option 2 (format de conditionnement / conversion kg↔sachets) : abandonnée.
- Prix de vente d'un produit créé par l'usine : restent à 0, le Responsable les
  renseigne via l'écran Produits.
- Fusion des 3 étapes de transformation en une seule : non retenue.

## Test (QA manuelle — pas de suite de tests JS)

1. Se connecter en `usine_test` / `test1234`.
2. Écran Approvisionnement → « + Nouveau produit » → saisir un libellé →
   enregistrer. Le produit apparaît dans le sélecteur et une ligne d'appro est
   pré-remplie avec.
3. Compléter quantité + prix d'achat + fournisseur → Valider → 201, stock
   `quantite_matiere_premiere` incrémenté.
4. Vérifier que l'écran Produits (Admin/Responsable) affiche toujours ce produit
   et permet d'y mettre les prix.
5. Vérifier les suffixes « (kg) » sur transformations / appro / demandes /
   produits.
