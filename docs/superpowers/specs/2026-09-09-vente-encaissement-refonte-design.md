# Refonte Vente & Encaissement — design (3 lots)

Date : 2026-09-09
Statut : approuvé (chat) — implémentation directe demandée

## Principe

Vente et encaissement sont **deux actes séparés** :
- **Responsable / Admin** créent le document de vente (BL client, ou **cession**
  de stock au commercial). Aucun encaissement de leur côté.
- **Caisse** enregistre **tous** les encaissements — versements sur BL et
  versements des commerciaux — et imprime les reçus.

> **Mise à jour (post-approbation)** : la « fiche de vente » du commercial est
> **supprimée**. Le commercial prend du stock via une **cession** (valorisée au
> prix gros) — ce montant devient sa dette — puis rembourse par versements
> successifs à la Caisse. Sa dette = `Σ commercial_prises.montant_total −
> Σ commercial_versements.montant`. Une cession est **bloquée** si le stock
> magasin (`produits.quantite_stock`) est insuffisant (422).

## Lot 1 — Écran Encaissement unifié (Caisse) — PRIORITAIRE

### Backend — `CaisseControllers::encaissementEnAttente()` + `GET /api/encaissement/en-attente`

Retourne `{ bl: [...], commerciaux: [...] }` :
- `bl` : factures (`type_facture` ≠ 'avoir') non soldées —
  `reste = montant_total_factures_ttc − Σ versements − Σ avoirs liés`, `reste > 0`.
  Champs : `code_facture`, `date_facture`, `client_id`, `client_nom`,
  `montant_ttc`, `verse`, `avoir`, `reste`, `monnaie` (monnaie client en attente).
  **Sans** jointure `bon_commande`. LEFT JOIN sur `versement` et `clients`.
- `commerciaux` : `commerciaux` (statut 1) avec
  `reste_a_verser = Σ commercial_prises.montant_total − Σ commercial_versements.montant > 0`.
  Champs : `id`, `nom`, `type`, `total_pris`, `total_verse`, `reste_a_verser`.

`faire_versement` (BL) et `commercial-versements` (commercial) : **inchangés**.

### Frontend — réécriture de `caisse/index.vue`

Un seul écran, 2 onglets :
- **BL clients** : `b-table` paginé (10) + recherche, colonnes client / code /
  date / total / versé / **reste**. Bouton **Encaisser**.
- **Commerciaux** : `b-table` paginé + recherche, colonnes nom / type /
  total dû / versé / **reste à verser**. Bouton **Encaisser**.

Clic **Encaisser** → **modale de versement compacte** (nouvelle, ne réutilise
pas `caisse/encaissement.vue` — 516 l.) :
- lecture seule : nom, total dû, déjà versé, **reste** ;
- `montant reçu` (pré-rempli = reste), `mode de paiement`
  (`search-select` : Espèces / Mobile money / Chèque / Virement) ;
- si Mobile money → `réseau` ; si Chèque → `banque` + `n° chèque` ;
  si Virement → `n° virement` ;
- `monnaie rendue` (défaut 0, espèces) ;
- **Enregistrer le versement** → `POST /api/faire_paiement` (BL) ou
  `POST /api/commercial-versements` (commercial).
- Après : bouton **Imprimer le reçu** (BL → `ouvrirDocument(imprimer_recu/{code})`).

Rafraîchit la liste après chaque versement.

### Permissions
`caisses` — déjà chez Caisse, Responsable, Admin. Rien à changer.

## Lot 2 — Écran Vente client fluide (Responsable)

Route `ventes` → nouveau composant mono-écran, **sans navigation ni `localStorage`** :
- client (recherche + « divers » + création rapide) ;
- niveau de prix (détail / demi-gros / gros) — segmented control ;
- ajout produits (`search-select`) → lignes : produit, prix unitaire (auto
  catalogue × niveau), quantité (+/−, plafonnée au stock), total ligne ;
- total + **Valider le bon de livraison** → `POST /api/facture_directe`
  (`avec_fne=false`) → code BL + **Imprimer** + **Nouveau**.
- Retire du chemin de vente : `factures_users`, `panier_facture`,
  `historiks/ventes` (routes conservées mais plus liées au parcours).

## Lot 3 — Rapprochement du canal commercial

- **Suppression de la « fiche de vente »** : contrôleur `CommercialFichesController`
  et routes `commercial-fiches*` / `imprimer_fiche_commercial` retirés ; tout le
  code fiche de `commercial_prises/index.vue` retiré (bouton, modale, historique
  fiches). La table `commercial_fiches` reste en base (orpheline, inoffensive).
- **Cession** ré-habillée comme l'écran Vente : `search-select`, colonne
  « Dispo (kg) » (= `produits.quantite_stock`), quantité plafonnée au dispo,
  bouton **Céder le stock**. Backend `CommercialPrisesController::store()` :
  garde stock **avant** transaction → 422 si `quantite > quantite_stock`.
- `solde($id)` réécrit : `total = Σ commercial_prises.montant_total`,
  `verse = Σ commercial_versements.montant`, `reste_a_verser = total − verse`.
- Le bouton **Verser** de `commercial_prises` est retiré : les versements
  commerciaux se font **uniquement** via l'écran Encaissement du Lot 1.
- La modale « Historique » du commercial reste (Cessions + Versements).

## Hors périmètre

- Code mort hérité OBF (`commandes`, `proforma`, FNE, régime HT) : non retiré
  ici, juste contourné.
- `caisse/encaissement.vue` (ancienne modale) : laissée orpheline, pas supprimée.
- Table `commercial_fiches` / `commercial_fiche_lignes` : laissée en base
  (migration non annulée), plus aucun code ne l'utilise.
