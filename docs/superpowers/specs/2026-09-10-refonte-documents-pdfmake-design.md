# Refonte des documents imprimés + moteur PDF — design

Date : 2026-09-10
Statut : approuvé (chat + maquettes visuelles), implémenté et testé.

## Décisions

| Question | Réponse |
|---|---|
| Moteur PDF | **pdfmake, côté app bureau** (rendu vectoriel, hors-ligne, zéro dépendance serveur). Abandon de `barryvdh/laravel-dompdf` + Blade pour les 9 documents refaits. |
| Style | **« Bandeau coloré »** (direction B des maquettes). |
| Périmètre | Les 9 documents : BL, reçu client, avoir, relevé client, clôture de caisse, **+ nouveaux** : bon de cession commercial, reçu de versement commercial, relevé de compte commercial, bon de transfert usine→magasin. |
| Format | A4 portrait partout. |
| « En lettres » | Fonction maison (`montantEnLettres`), zéro dépendance. |

## Identité (en-tête, tous documents)

Logo **Café Fortuna** (gauche) + coordonnées dessous ; visuel **Thera Café** (droite).
Coordonnées : Tél 07 07 12 30 77 · 17 BP 853 Abidjan 17 – RCI · cafefortuna-ci@gmail.com ·
RCCM CI-ABJ-03-2024-B13-12559 · NCC 2404758 C.
Embarquée dans le frontend (`src/documents/identite.js`, logos en base64) — aucun aller-retour réseau.

## Style « bandeau »

- En-tête logos + coordonnées.
- Bandeau pleine largeur **brun `#43310F`**, titre blanc à gauche, n°/date à droite.
- Tableaux : en-tête **crème `#F3EDE1`** texte brun, filet `#DDCDB0`.
- Encadré total : fond **or `#C9A13B`**, aligné à droite.
- Sous-sections (relevés, clôture) : barre **olive `#5C6B2F`**.
- Montant **en toutes lettres** (BL, reçu, avoir, relevé, cession).
- Zones de signature (BL, cession, transfert : 2 ; reçus : client/caisse).
- Pied de page répété : `Café Fortuna — RCCM … — NCC …` + `Page x / y`.
- Dates : JJ/MM/AAAA ; **format long** (« mardi 10 septembre 2026 ») sur reçus + relevés + bandeau BL.

## Architecture

```
bouton "Imprimer"  →  imprimerDocument(type, ...args)          (src/documents/index.js)
                   →  GET /api/doc/<type>/<id>  (JSON à plat)   (DocumentsController)
                   →  builder pdfmake → docDefinition           (src/documents/builders.js)
                   →  genererDocument() → pdfMake.createPdf()    (src/documents/engine.js)
                   →  blob → AppCache/impressions/*.pdf (Tauri fs) → open()
                      repli navigateur (dev) : window.open(blobURL)
```

### Frontend — `src/documents/`

| Fichier | Rôle |
|---|---|
| `identite.js` | logos base64 + coordonnées `ENTREPRISE` |
| `format.js` | `fcfa`, `nombre` (séparateur espace ASCII — U+202F d'`Intl` absent de Roboto), `kg`, `dateCourte`, `dateLongue`, `montantEnLettres` / `montantMin` |
| `theme.js` | `COULEURS`, `entete`, `bandeau`, `sousTitre`, `tableauLignes`, `encadreTotal`, `enLettres`, `blocSignatures`, `blocInfos`, `piedDePage` |
| `engine.js` | `genererDocument({titre, meta, contenu, filename})` ; crochet de test `window.__PDF_SINK__` |
| `builders.js` | `bl`, `recu`, `avoir`, `releveClient`, `releveCommercial`, `cession`, `transfert`, `clotureCaisse` |
| `index.js` | `imprimerDocument(type, ...args)` — registre type → endpoint + builder |
| `fixtures.js` | données d'exemple pour `/dev/documents` |

`src/utils/print.js` ré-exporte `imprimerDocument` ; `ouvrirDocument` (dompdf) conservé pour les 3 documents non migrés.
`src/components/dev/documents.vue` + route `/dev/documents` (sans auth) : prévisualisation des 9.

### Backend — `DocumentsController` + routes `GET /api/doc/*`

`bl/{code}`, `recu/{code}`, `avoir/{code}`, `releve-client/{id}/{debut}/{fin}`,
`cession/{code}`, `recu-commercial/{id}`, `releve-commercial/{id}/{debut}/{fin}`,
`transfert/{code}`, `cloture-caisse/{date?}`.
Chaque méthode renvoie un JSON à plat prêt à composer (n°, dates, tiers, lignes, totaux, restes, soldes progressifs).

## Points de déclenchement

| Document | Écran / action |
|---|---|
| Bon de livraison | `ventes/index` (après vente), `commande/listes_commandes`, `historiks/ventes`, `documents/index`, `assistant/index`, `ventes/facture`, `ventes/livraison` |
| Reçu client | `caisse/index` (après encaissement BL), `caisse/imprimer` |
| Reçu commercial | `caisse/index` (après versement commercial) |
| Avoir | `commande/listes_commandes` |
| Relevé client | `documents/index` (`imprimerReleveClient`) |
| Bon de cession | `commercial_prises/index` (après cession + par ligne d'historique) |
| Relevé commercial | `commercial_prises/index` (modale Historique, sélecteur de période) |
| Bon de transfert | `demandes/index` (après livraison + bouton par ligne) |
| Clôture de caisse | `caisse/dashboard` (bouton « Imprimer la clôture ») |

## Hors périmètre (restent sur dompdf, migration ultérieure)

- Point d'encaissement (`imprimer_point_type`, `point.blade`) — `caisse/historique`, `commande/index`.
- Récapitulatif client (`imprimer_recapitulatif`) — `commande/listes_commandes`.
- Rapport de caisse (`imprimerPoint`) — `rapport/index`.
- État clients groupé multi-tiers (`imprimer_documents_clients`) — `documents/index` (impression en lot).

Tant que ces 4 subsistent : `barryvdh/laravel-dompdf`, `RenderAsPdf`, leurs routes et leurs Blade sont **conservés**. Les Blade des 9 documents migrés (`facture*`, `livraison`, `recu`, `avoir`, `etat_clients`, `fiche_commercial`) deviennent orphelins mais ne sont pas supprimés ici.

## Dépendances

- `+ pdfmake@0.2.12` (npm, ~2 Mo + polices Roboto).
- Backend : rien ajouté ; `dompdf` retiré seulement après migration des 4 restants.

## Tests

- **Rendu** : les 9 documents générés via `/dev/documents` (données d'exemple) — 0 erreur ; contrôle visuel PDF (BL, relevé, clôture, reçu) : en-tête, bandeau, tableaux, encadré or, signatures, pied de page conformes. Bug corrigé : séparateur de milliers U+202F → tofu (→ espace ASCII) ; « francs CFA » cassé en minuscules (→ `montantMin`).
- **Compilation** : 8 écrans migrés + TB caisse chargent sans `pageerror` (chaîne d'import pdfmake OK).
- **Backend** : `GET /api/doc/bl/{code}` vérifié sur données réelles (`facture_directe` → shape conforme) ; autres endpoints : 404/200 corrects.
