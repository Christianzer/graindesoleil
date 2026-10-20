// Un builder par document : (data JSON du backend) -> { titre, meta, contenu, filename }
// consommé par genererDocument(). Style « bandeau » via les briques de theme.js.
import { fcfa, nombre, kg, dateCourte, dateLongue, montantMin } from './format'
import {
  COULEURS, styles, sousTitre, tableauLignes, encadreTotal, enLettres, blocSignatures, blocInfos,
} from './theme'

/* ------------------------------------------------------------------ utils */

// Ligne « Saisi par » ajoutée au bandeau quand le backend fournit l'auteur.
const saisiPar = (d) => (d.saisi_par ? [`Saisi par : ${d.saisi_par}`] : [])

function blocTiers (titre, tiers, droite) {
  return {
    columns: [
      { width: '*', stack: [
        { text: titre.toUpperCase(), style: 'labelSign' },
        { text: tiers.nom || '—', bold: true, margin: [0, 2, 0, 0] },
        tiers.telephone ? { text: tiers.telephone, color: COULEURS.gris, fontSize: 8.5 } : {},
      ] },
      droite ? { width: 'auto', stack: droite, alignment: 'right' } : {},
    ],
    columnGap: 16,
    margin: [0, 0, 0, 8],
  }
}

// Tableau Débit / Crédit / Solde avec ligne d'ouverture + totaux (relevés).
function tableauSolde (data) {
  const head = ['Date', 'Pièce', 'Libellé', 'Variation de stock', 'Débit', 'Crédit', 'Solde'].map((t, i) => ({
    text: t.toUpperCase(), style: 'thTab', alignment: i >= 4 ? 'right' : 'left',
    fillColor: COULEURS.orClair, margin: [6, 6, 6, 6],
  }))
  const rows = []
  rows.push([
    { text: dateCourte(data.periode.debut), style: 'cell', margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: 'Solde d’ouverture', style: 'cell', italics: true, margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: nombre(data.solde_ouverture), style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
  ])
  data.mouvements.forEach(m => rows.push([
    { text: dateCourte(m.date), style: 'cell', margin: [6, 5, 6, 5] },
    { text: m.piece || '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: m.libelle || '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: m.produits || '', style: 'cell', fontSize: 7.5, margin: [6, 5, 6, 5] },
    { text: m.debit ? nombre(m.debit) : '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: m.credit ? nombre(m.credit) : '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: nombre(m.solde), style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
  ]))
  rows.push([
    { text: 'Totaux période', colSpan: 4, bold: true, fontSize: 9, margin: [6, 6, 6, 6] }, {}, {}, {},
    { text: nombre(data.total_debit), bold: true, fontSize: 9, alignment: 'right', margin: [6, 6, 6, 6] },
    { text: nombre(data.total_credit), bold: true, fontSize: 9, alignment: 'right', margin: [6, 6, 6, 6] },
    { text: '', margin: [6, 6, 6, 6] },
  ])
  return {
    table: { headerRows: 1, widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto', 'auto'], body: [head, ...rows] },
    layout: {
      hLineWidth: (i, node) => (i === 1 || i === node.table.body.length - 1 ? 1 : (i === 0 ? 0 : 0.5)),
      vLineWidth: () => 0,
      hLineColor: (i, node) => (i === node.table.body.length - 1 ? COULEURS.brun : COULEURS.filet),
      paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 6],
  }
}

function recap (paires) {
  return {
    columns: [
      { width: '*', text: '' },
      { width: 'auto', table: {
        body: paires.map(([k, v, fort]) => ([
          { text: k, alignment: 'right', color: COULEURS.gris, fontSize: 9, bold: !!fort, margin: [8, 3, 8, 3] },
          { text: fcfa(v), alignment: 'right', fontSize: fort ? 10.5 : 9, bold: !!fort, margin: [8, 3, 8, 3] },
        ])),
      }, layout: 'noBorders' },
    ],
    margin: [0, 6, 0, 0],
  }
}

/* --------------------------------------------------------------- builders */

export function bl (d) {
  const contenu = [
    blocTiers('Client', d.client, [
      { text: [{ text: 'Tarif : ', color: COULEURS.gris }, d.niveau_prix] },
    ]),
    tableauLignes(
      [
        { text: 'Produit', key: 'libelle' },
        { text: 'Qté (kg)', key: 'q', align: 'right' },
        { text: 'P.U. (FCFA)', key: 'pu', align: 'right' },
        { text: 'Montant (FCFA)', key: 'm', align: 'right' },
      ],
      d.lignes.map(l => ({ libelle: l.libelle, q: kg(l.quantite), pu: nombre(l.prix_unitaire), m: nombre(l.montant) })),
    ),
    encadreTotal('TOTAL', d.total),
  ]
  if (d.deja_verse > 0 || d.avoirs > 0) {
    contenu.push(recap([
      ['Déjà versé', d.deja_verse],
      d.avoirs > 0 ? ['Avoirs', d.avoirs] : null,
      ['Reste à payer', d.reste, true],
    ].filter(Boolean)))
  }
  contenu.push(enLettres(`Arrêté le présent bon à la somme de ${montantMin(d.total)}.`))
  contenu.push(blocSignatures(['Livré par', 'Reçu par (nom + signature)']))
  return {
    titre: 'BON DE LIVRAISON',
    meta: [`N° ${d.numero}`, dateLongue(d.date), ...saisiPar(d)],
    contenu,
    filename: `BL_${d.numero}.pdf`,
  }
}

export function recu (d) {
  const commercial = d.type === 'commercial'
  const infos = [
    ['Reçu de', d.de],
    ['Au titre de', commercial ? 'Cessions de stock (dépôt-vente)' : (d.reference || '—')],
    ['Mode de paiement', d.mode_paiement],
    ['Montant versé', { text: fcfa(d.montant), bold: true }],
    ['En lettres', { text: montantMin(d.montant), italics: true, color: COULEURS.brun }],
  ]
  if (d.monnaie_rendue > 0) infos.push(['Monnaie rendue', fcfa(d.monnaie_rendue)])
  if (commercial) {
    infos.push(['Total cédé (cumul)', fcfa(d.total_pris)])
    infos.push(['Total versé (cumul)', fcfa(d.total_verse)])
  }
  infos.push(['Reste dû', { text: fcfa(d.reste_du), bold: true, color: COULEURS.rouge }])

  const contenu = [blocInfos(infos.map(([k, v]) => [k, v]))]
  // Versement issu d'une déclaration de vente (voir CommercialFichesController::
  // store) : lister les quantités vendues ayant donné lieu à ce paiement,
  // sinon le reçu ne montre que des montants sans le détail produit/quantité.
  if (d.lignes && d.lignes.length) {
    contenu.push(sousTitre('Quantités vendues déclarées'))
    contenu.push(tableauLignes(
      [
        { text: 'Produit', key: 'libelle' },
        { text: 'Qté (kg)', key: 'q', align: 'right' },
        { text: 'P.U. (FCFA)', key: 'pu', align: 'right' },
        { text: 'Montant (FCFA)', key: 'm', align: 'right' },
      ],
      d.lignes.map(l => ({ libelle: l.libelle, q: kg(l.quantite), pu: nombre(l.prix_unitaire), m: nombre(l.montant) })),
    ))
  }
  contenu.push(blocSignatures([commercial ? 'Le commercial' : 'Le client', 'La caisse']))

  return {
    titre: 'REÇU DE VERSEMENT',
    meta: [`N° ${d.numero}`, dateLongue(d.date), ...saisiPar(d)],
    contenu,
    filename: `RECU_${d.numero}.pdf`,
  }
}

export function avoir (d) {
  return {
    titre: 'AVOIR',
    meta: [`N° ${d.numero}`, `sur ${d.facture_origine || '—'}`, dateLongue(d.date), ...saisiPar(d)],
    contenu: [
      blocTiers('Client', d.client),
      tableauLignes(
        [
          { text: 'Produit', key: 'libelle' },
          { text: 'Qté (kg)', key: 'q', align: 'right' },
          { text: 'P.U. (FCFA)', key: 'pu', align: 'right' },
          { text: 'Montant (FCFA)', key: 'm', align: 'right' },
        ],
        d.lignes.map(l => ({ libelle: l.libelle, q: kg(l.quantite), pu: nombre(l.prix_unitaire), m: nombre(l.montant) })),
      ),
      encadreTotal("MONTANT DE L'AVOIR", d.total),
      enLettres(`Avoir arrêté à la somme de ${montantMin(d.total)}.`),
    ],
    filename: `AVOIR_${d.numero}.pdf`,
  }
}

function releve (d, libelleTiers, prefixe) {
  const contenu = [
    sousTitre('Mouvements'),
    tableauSolde(d),
    encadreTotal(`SOLDE AU ${dateCourte(d.periode.fin)}`, d.solde_cloture),
  ]
  if (d.solde_cloture > 0) {
    contenu.push(enLettres(`Solde restant dû : ${montantMin(d.solde_cloture)}.`))
  }
  return {
    titre: `RELEVÉ DE COMPTE — ${libelleTiers}`,
    meta: [d.tiers.nom, `du ${dateCourte(d.periode.debut)} au ${dateCourte(d.periode.fin)}`],
    contenu,
    filename: `RELEVE_${prefixe}_${(d.tiers.nom || '').replace(/[^\w]+/g, '_')}.pdf`,
  }
}
export const releveClient = (d) => releve(d, 'CLIENT', 'CLIENT')
export const releveCommercial = (d) => releve(d, 'COMMERCIAL', 'COM')

export function cession (d) {
  return {
    titre: 'BON DE CESSION — COMMERCIAL',
    meta: [`N° ${d.numero}`, dateLongue(d.date), ...saisiPar(d)],
    contenu: [
      blocTiers(d.commercial.type === 'equipe' ? 'Équipe commerciale' : 'Commercial', d.commercial),
      { text: [{ text: 'Tarif : ', color: COULEURS.gris }, d.niveau_prix] },
      tableauLignes(
        [
          { text: 'Produit', key: 'libelle' },
          { text: 'Qté (kg)', key: 'q', align: 'right' },
          { text: 'P.U. (FCFA)', key: 'pu', align: 'right' },
          { text: 'Montant (FCFA)', key: 'm', align: 'right' },
        ],
        d.lignes.map(l => ({ libelle: l.libelle, q: kg(l.quantite), pu: nombre(l.prix_unitaire), m: nombre(l.montant) })),
      ),
      encadreTotal('DETTE AJOUTÉE', d.total),
      recap([
        ['Solde avant cession', d.solde_avant],
        ['Solde après cession', d.solde_actuel, true],
      ]),
      { text: 'Ce montant est à rembourser à la caisse par versements successifs, au fur et à mesure des ventes.', color: COULEURS.gris, fontSize: 8.5, margin: [0, 8, 0, 0] },
      enLettres(`Cession arrêtée à la somme de ${montantMin(d.total)}.`),
      blocSignatures(['Remis par (magasin)', 'Reçu par (commercial)']),
    ],
    filename: `CESSION_${d.numero}.pdf`,
  }
}

export function transfert (d) {
  const meta = [`Demande N° ${d.numero}`, ...saisiPar(d)]
  meta.push(d.statut === 3 ? `Soldée le ${dateCourte(d.date_livraison)}` : (d.statut === 2 ? 'Livraison partielle' : (d.statut === 4 ? 'Annulée' : 'En attente')))
  return {
    titre: 'BON DE TRANSFERT — USINE → MAGASIN',
    meta,
    contenu: [
      tableauLignes(
        [
          { text: 'Produit', key: 'libelle' },
          { text: 'Demandé (kg)', key: 'd', align: 'right' },
          { text: 'Livré (kg)', key: 'l', align: 'right' },
        ],
        d.lignes.map(l => ({ libelle: l.libelle, d: kg(l.quantite_demandee), l: kg(l.quantite_livree) })),
      ),
      { text: `Total livré : ${kg(d.total_livre)} kg`, bold: true, margin: [0, 6, 0, 0] },
      blocSignatures(['Sortie usine (nom + signature)', 'Entrée magasin (nom + signature)']),
    ],
    filename: `TRANSFERT_${d.numero}.pdf`,
  }
}

export function clotureCaisse (d) {
  const contenu = [
    sousTitre('Encaissements'),
    tableauLignes(
      [
        { text: 'Référence', key: 'ref' },
        { text: 'Tiers', key: 'tiers' },
        { text: 'Canal', key: 'canal' },
        { text: 'Mode', key: 'mode' },
        { text: 'Montant (FCFA)', key: 'm', align: 'right' },
        { text: 'Saisi par', key: 'par' },
      ],
      d.encaissements.map(e => ({ ref: e.reference, tiers: e.tiers, canal: e.canal, mode: e.mode, m: nombre(e.montant), par: e.saisi_par || '—' })),
    ),
  ]
  if (d.par_mode && d.par_mode.length) {
    contenu.push(sousTitre('Ventilation par mode'))
    contenu.push(tableauLignes(
      [{ text: 'Mode de paiement', key: 'mode' }, { text: 'Montant (FCFA)', key: 'm', align: 'right' }],
      d.par_mode.map(x => ({ mode: x.mode, m: nombre(x.montant) })),
    ))
  }
  if (d.entrees && d.entrees.length) {
    contenu.push(sousTitre('Autres entrées'))
    contenu.push(tableauLignes(
      [{ text: 'Référence', key: 'ref' }, { text: 'Libellé', key: 'lib' }, { text: 'Montant (FCFA)', key: 'm', align: 'right' }, { text: 'Saisi par', key: 'par' }],
      d.entrees.map(x => ({ ref: x.reference, lib: x.libelle, m: nombre(x.montant), par: x.saisi_par || '—' })),
    ))
  }
  if (d.sorties && d.sorties.length) {
    contenu.push(sousTitre('Décaissements'))
    contenu.push(tableauLignes(
      [{ text: 'Référence', key: 'ref' }, { text: 'Libellé', key: 'lib' }, { text: 'Montant (FCFA)', key: 'm', align: 'right' }, { text: 'Saisi par', key: 'par' }],
      d.sorties.map(x => ({ ref: x.reference, lib: x.libelle, m: nombre(x.montant), par: x.saisi_par || '—' })),
    ))
  }
  contenu.push(recap([
    ['Total encaissé', d.total_encaisse],
    ['Total autres entrées', d.total_entrees],
    ['Total décaissements', d.total_sorties],
  ]))
  contenu.push(encadreTotal('SOLDE DU JOUR', d.solde_jour))
  return {
    titre: 'CLÔTURE DE CAISSE',
    meta: [`Journée du ${dateLongue(d.date)}`],
    contenu,
    filename: `CLOTURE_CAISSE_${d.date}.pdf`,
  }
}

/**
 * Impression du tableau de bord Responsable/Admin — construit directement à
 * partir des données déjà affichées à l'écran (pas d'aller-retour serveur
 * supplémentaire, pour rester garanti cohérent avec ce qui est visible).
 * d = { encaisse_ttc, reste_ttc, appro_kg, decaissement, reconRows, reconTotal }
 */
export function dashboardResponsable (d) {
  const contenu = [
    tableauLignes(
      [{ text: 'Indicateur', key: 'libelle' }, { text: 'Valeur', key: 'valeur', align: 'right' }],
      [
        { libelle: 'Encaissé (TTC)', valeur: fcfa(d.encaisse_ttc) },
        { libelle: 'Reste à encaisser (TTC)', valeur: fcfa(d.reste_ttc) },
        { libelle: 'Approvisionnement', valeur: `${kg(d.appro_kg)} kg` },
        { libelle: 'Décaissement', valeur: fcfa(d.decaissement) },
      ],
    ),
  ]
  if (d.reconRows && d.reconRows.length) {
    contenu.push(sousTitre('Réconciliation de stock'))
    contenu.push(tableauLignes(
      [
        { text: 'Produit', key: 'libelle' },
        { text: 'Départ', key: 'depart', align: 'right' },
        { text: 'Réappro', key: 'reappro', align: 'right' },
        { text: 'Stock', key: 'entrees', align: 'right' },
        { text: 'Sortie', key: 'sortie', align: 'right' },
        { text: 'Reste', key: 'reste', align: 'right' },
      ],
      d.reconRows.map(r => ({
        libelle: r.libelle, depart: nombre(r.depart), reappro: nombre(r.total_reappro),
        entrees: nombre(r.entrees), sortie: nombre(r.sortie), reste: nombre(r.reste),
      })),
    ))
  }
  // Graphiques du dashboard, capturés en PNG côté client (Chart.js
  // toBase64Image) — deux par ligne, laissés s'enchaîner naturellement
  // (pas de saut de page forcé par graphique) pour tenir sur peu de pages.
  if (d.graphiques && d.graphiques.length) {
    contenu.push(sousTitre('Graphiques'))
    for (let i = 0; i < d.graphiques.length; i += 2) {
      const paire = d.graphiques.slice(i, i + 2)
      contenu.push({
        columns: paire.map(g => ({
          width: 240,
          stack: [
            { text: g.titre, bold: true, fontSize: 8, color: COULEURS.brun, margin: [0, 0, 0, 3] },
            { image: g.image, width: 240 },
          ],
        })),
        columnGap: 16,
        margin: [0, 0, 0, 12],
      })
    }
  }
  return {
    titre: 'TABLEAU DE BORD',
    meta: [`Édité le ${dateLongue(d.date)}`],
    contenu,
    filename: `TABLEAU_DE_BORD_${d.date}.pdf`,
  }
}

/**
 * Impression du tableau de bord Usine — d = { stades, lots, demandes_a_livrer,
 * dette_fournisseurs, appro_mois }, mêmes données que GET /api/usine/dashboard.
 */
export function dashboardUsine (d) {
  const contenu = [
    tableauLignes(
      [{ text: 'Indicateur', key: 'libelle' }, { text: 'Valeur', key: 'valeur', align: 'right' }],
      [
        { libelle: 'Demandes à livrer', valeur: String(d.demandes_a_livrer) },
        { libelle: 'Dette fournisseurs', valeur: fcfa(d.dette_fournisseurs) },
        { libelle: 'Approvisionnement du mois', valeur: fcfa(d.appro_mois) },
      ],
    ),
    sousTitre('Stock par stade (kg)'),
    tableauLignes(
      [
        { text: 'Produit', key: 'libelle' },
        { text: 'Matière première', key: 'mp', align: 'right' },
        { text: 'Torréfié', key: 't', align: 'right' },
        { text: 'Broyé', key: 'b', align: 'right' },
        { text: 'Emballé', key: 'e', align: 'right' },
      ],
      (d.stades || []).map(s => ({
        libelle: s.libelle_produit, mp: kg(s.matiere_premiere), t: kg(s.torrefie), b: kg(s.broye), e: kg(s.emballe),
      })),
    ),
  ]
  if (d.lots && d.lots.length) {
    contenu.push(sousTitre('Lots en cours'))
    contenu.push(tableauLignes(
      [
        { text: 'Lot', key: 'lot' },
        { text: 'Produit', key: 'produit' },
        { text: 'Dernière étape', key: 'etape' },
      ],
      d.lots.map(l => ({ lot: l.code_lot, produit: l.libelle_produit, etape: l.derniere_etape || 'Aucune' })),
    ))
  }
  return {
    titre: 'TABLEAU DE BORD — USINE',
    meta: [`Édité le ${dateLongue(d.date)}`],
    contenu,
    filename: `TABLEAU_DE_BORD_USINE_${d.date}.pdf`,
  }
}

/**
 * Récapitulatif de clôture mensuelle. d = ligne `clotures` du backend :
 * { date_debut, date_fin, anticipee, cloture_par, recap: {...figé à la clôture} }.
 * Les sections ajoutées après coup (liste_bl, journal…) peuvent manquer sur d'anciens
 * récapitulatifs : chaque tableau est simplement omis dans ce cas.
 */
export function cloture (d) {
  const r = d.recap
  const contenu = []
  const num = (v) => nombre(v)
  const droite = (text, key, width) => ({ text, key, align: 'right', width })

  // Titre + tableau, omis quand il n'y a aucune ligne.
  const tab = (titre, colonnes, lignes, tousAffichages) => {
    if (!lignes || !lignes.length) {
      if (tousAffichages) {
        contenu.push(sousTitre(titre))
        contenu.push({ text: 'Aucune donnée sur la période.', color: COULEURS.gris, fontSize: 9, margin: [0, 2, 0, 6] })
      }
      return
    }
    contenu.push(sousTitre(titre))
    contenu.push(tableauLignes(colonnes, lignes))
  }

  /* ------------------------------------------------------------- Ventes */
  contenu.push(sousTitre('Ventes'))
  contenu.push(blocInfos([
    ['Bons de livraison', `${r.ventes.nb_bl} — ${fcfa(r.ventes.total_ttc)}`],
    ['Avoirs', `${r.ventes.nb_avoirs} — ${fcfa(r.ventes.total_avoirs)}`],
    ['Ventes nettes TTC', fcfa(r.ventes.net_ttc)],
  ]))
  if (r.ventes.par_produit.length) {
    contenu.push(tableauLignes(
      [{ text: 'Produit', key: 'p' }, droite('Quantité', 'q'), droite('Montant (FCFA)', 'm')],
      r.ventes.par_produit.map(x => ({ p: x.libelle, q: kg(x.quantite), m: num(x.montant) })),
    ))
  }
  tab('Ventes par niveau de prix',
    [{ text: 'Niveau', key: 'n' }, droite('BL', 'b'), droite('Quantité', 'q'), droite('Montant (FCFA)', 'm')],
    (r.ventes.par_niveau_prix || []).map(x => ({ n: x.niveau, b: x.nb_bl, q: kg(x.quantite), m: num(x.montant) })))
  tab('Ventes par utilisateur (saisi par)',
    [{ text: 'Utilisateur', key: 'u' }, droite('BL', 'b'), droite('Montant net (FCFA)', 'm')],
    (r.ventes.par_utilisateur || []).map(x => ({ u: x.utilisateur, b: x.nb_bl, m: num(x.montant) })))
  tab('Ventes par client',
    [{ text: 'Client', key: 'c' }, droite('BL', 'b'), droite('Montant net', 'm'), droite('Versé', 'v'), droite('Reste dû', 'r')],
    (r.ventes.par_client || []).map(x => ({ c: x.client, b: x.nb_bl, m: num(x.montant), v: num(x.verse), r: num(x.reste) })))
  tab('Liste des bons de livraison et avoirs',
    [{ text: 'N°', key: 'n' }, { text: 'Date', key: 'd' }, { text: 'Client', key: 'c' }, droite('Montant', 'm'), droite('Versé', 'v'), droite('Reste', 'r'), { text: 'Par', key: 'p' }],
    (r.ventes.liste_bl || []).map(x => ({ n: x.numero, d: dateCourte(x.date), c: x.client, m: num(x.montant), v: num(x.verse), r: num(x.reste), p: x.saisi_par })))

  /* ------------------------------------------------- Encaissements & caisse */
  contenu.push(sousTitre('Encaissements et caisse'))
  contenu.push(tableauLignes(
    [{ text: 'Mode de paiement', key: 'mode' }, droite('Montant (FCFA)', 'm')],
    r.encaissement.par_mode.map(x => ({ mode: x.mode, m: num(x.montant) })),
  ))
  contenu.push(recap([
    ['Encaissé auprès des clients', r.encaissement.clients.total],
    ['Versé par les commerciaux', r.encaissement.commerciaux.total],
    ['Autres entrées de caisse', r.caisse.entrees.total],
    ['Décaissements validés', r.caisse.sorties.total],
    ['Solde de caisse en début de période', r.caisse.solde_debut],
    ['Solde de caisse en fin de période', r.caisse.solde_fin, true],
  ]))
  tab('Caisse — totaux par utilisateur',
    [{ text: 'Utilisateur', key: 'u' }, droite('Encaissé', 'e'), droite('Entrées', 'n'), droite('Sorties validées', 's')],
    (r.caisse.par_utilisateur || []).map(x => ({ u: x.utilisateur, e: num(x.encaisse), n: num(x.entrees), s: num(x.sorties) })))
  tab('Journal de caisse jour par jour',
    [{ text: 'Jour', key: 'd' }, droite('Encaissé', 'e'), droite('Entrées', 'n'), droite('Sorties', 's'), droite('Solde fin de journée', 'x')],
    (r.caisse.journal || []).map(x => ({ d: dateCourte(x.date), e: x.encaisse ? num(x.encaisse) : '—', n: x.entrees ? num(x.entrees) : '—', s: x.sorties ? num(x.sorties) : '—', x: num(x.solde) })))
  tab('Liste des encaissements',
    [{ text: 'Reçu', key: 'r' }, { text: 'Date', key: 'd' }, { text: 'Client / commercial', key: 't' }, { text: 'BL', key: 'b' }, { text: 'Mode', key: 'o' }, droite('Montant', 'm'), { text: 'Par', key: 'p' }],
    (r.encaissement.liste || []).map(x => ({ r: x.recu, d: dateCourte(x.date), t: x.tiers, b: x.piece || '—', o: x.mode, m: num(x.montant), p: x.saisi_par })))
  tab('Entrées et sorties de caisse',
    [{ text: 'Date', key: 'd' }, { text: 'Sens', key: 's' }, { text: 'Référence', key: 'r' }, { text: 'Libellé', key: 'l' }, droite('Montant', 'm'), { text: 'Statut', key: 't' }, { text: 'Par', key: 'p' }],
    (r.caisse.mouvements || []).map(x => ({ d: dateCourte(x.date), s: x.sens, r: x.reference, l: x.libelle, m: num(x.montant), t: x.statut, p: x.saisi_par })))

  /* ------------------------------------------------------------- Créances */
  contenu.push(sousTitre('Créances à la fin de la période'))
  contenu.push(recap([
    [`Clients (${r.creances.clients.nb})`, r.creances.clients.total],
    [`Commerciaux (${r.creances.commerciaux.nb})`, r.creances.commerciaux.total],
  ]))
  tab('Clients débiteurs', [{ text: 'Client', key: 'n' }, droite('Solde (FCFA)', 's')],
    r.creances.clients.liste.map(x => ({ n: x.nom, s: num(x.solde) })))
  tab('Commerciaux débiteurs', [{ text: 'Commercial', key: 'n' }, droite('Solde (FCFA)', 's')],
    r.creances.commerciaux.liste.map(x => ({ n: x.nom, s: num(x.solde) })))
  if (r.creances.anciennete) {
    tab('Ancienneté des créances clients',
      [{ text: 'Ancienneté', key: 't' }, droite('BL', 'b'), droite('Reste dû (FCFA)', 'm')],
      r.creances.anciennete.tranches.map(x => ({ t: x.tranche, b: x.nb, m: num(x.montant) })))
    tab('BL impayés',
      [{ text: 'BL', key: 'n' }, { text: 'Date', key: 'd' }, { text: 'Client', key: 'c' }, droite('Jours', 'j'), droite('Reste dû', 'r'), { text: 'Par', key: 'p' }],
      (r.creances.anciennete.liste || []).map(x => ({ n: x.numero, d: dateCourte(x.date), c: x.client, j: x.age_jours, r: num(x.reste), p: x.saisi_par })))
  }
  tab('Dépôt-vente par commercial',
    [{ text: 'Commercial', key: 'c' }, droite('Solde début', 'a'), droite('Cédé (kg)', 'k'), droite('Cédé', 'm'), droite('Vendu (kg)', 'v'), droite('Retours (kg)', 'r'), droite('Versé', 'e'), droite('Solde fin', 'f')],
    (r.creances.depot_vente || []).map(x => ({ c: x.commercial, a: num(x.solde_debut), k: kg(x.cede_kg), m: num(x.cede_montant), v: kg(x.vendu_kg), r: kg(x.retour_kg), e: num(x.verse), f: num(x.solde_fin) })))

  /* --------------------------------------------------------------- Achats */
  contenu.push(sousTitre('Achats fournisseurs'))
  contenu.push(recap([
    [`Approvisionnements (${r.achats.nb})`, r.achats.total],
    ['Réglé aux fournisseurs', r.achats.regle],
    ['Dette fournisseurs en fin de période', r.achats.dette_fin, true],
  ]))
  tab('Achats par fournisseur',
    [{ text: 'Fournisseur', key: 'n' }, droite('Achats', 'b'), droite('Montant (FCFA)', 'm')],
    r.achats.par_fournisseur.map(x => ({ n: x.nom, b: x.nb, m: num(x.montant) })))
  tab('Dettes par fournisseur',
    [{ text: 'Fournisseur', key: 'n' }, droite('Acheté (cumul)', 'a'), droite('Réglé (cumul)', 'r'), droite('Dette', 'd')],
    (r.achats.dettes || []).map(x => ({ n: x.nom, a: num(x.achete), r: num(x.regle), d: num(x.dette) })))
  tab('Détail des approvisionnements',
    [{ text: 'Appro', key: 'c' }, { text: 'Date', key: 'd' }, { text: 'Fournisseur', key: 'f' }, { text: 'Produits', key: 'l' }, droite('Montant', 'm'), droite('Reste', 'r'), { text: 'Par', key: 'p' }],
    (r.achats.detail || []).map(x => ({
      c: x.code, d: dateCourte(x.date), f: x.fournisseur,
      l: x.lignes.map(l => `${l.produit} ${kg(l.quantite)} kg × ${num(l.prix)}`).join(' ; '),
      m: num(x.montant), r: num(x.reste), p: x.saisi_par,
    })))

  /* ---------------------------------------------------------------- Stock */
  tab('Mouvements de stock de la période (kg)',
    [{ text: 'Produit', key: 'p' }, droite('Entrées', 'e'), droite('Sorties', 's'), droite('Variation', 'n')],
    r.stock.mouvements.map(x => ({ p: x.libelle, e: kg(x.entrees), s: kg(x.sorties), n: kg(x.net) })), true)
  tab('Mouvements par produit et par type (kg)',
    [{ text: 'Produit', key: 'p' }, { text: 'Type', key: 't' }, droite('Nb', 'b'), droite('Entrées', 'e'), droite('Sorties', 's'), droite('Variation', 'n')],
    (r.stock.mouvements_par_type || []).map(x => ({ p: x.libelle, t: x.type, b: x.nb, e: kg(x.entrees), s: kg(x.sorties), n: kg(x.net) })))
  tab('Stock constaté à la clôture (information)',
    [{ text: 'Produit', key: 'p' }, droite('Stock (kg)', 'q'), droite('Emballé (kg)', 'e')],
    r.stock.stock_a_la_cloture.map(x => ({ p: x.libelle, q: kg(x.quantite), e: kg(x.emballe) })))
  if (r.stock.valorisation) {
    tab('Valorisation du stock (quantité × prix de vente)',
      [{ text: 'Produit', key: 'p' }, droite('Stock (kg)', 'q'), droite('Valeur détail', 'd'), droite('Valeur gros', 'g')],
      r.stock.valorisation.lignes.map(x => ({ p: x.libelle, q: kg(x.quantite), d: num(x.valeur_detail), g: num(x.valeur_gros) })))
    contenu.push(recap([
      ['Total au prix détail', r.stock.valorisation.total_detail],
      ['Total au prix gros', r.stock.valorisation.total_gros],
    ]))
  }

  /* ------------------------------------------------------ Usine & demandes */
  if (r.production) {
    tab(`Production de l'usine (${r.production.nb_transformations} transformation(s))`,
      [{ text: 'Étape', key: 'e' }, droite('Nb', 'n'), droite('Entrée (kg)', 'i'), droite('Obtenu (kg)', 'o'), droite('Perte (kg)', 'p'), droite('Perte %', 'x')],
      r.production.par_etape.map(x => ({ e: x.etape, n: x.nb, i: kg(x.entree), o: kg(x.sortie), p: kg(x.perte), x: `${kg(x.perte_pct)} %` })))
    tab('Lots de la période',
      [{ text: 'Lot', key: 'c' }, { text: 'Produit', key: 'p' }, { text: 'Statut', key: 's' }, { text: 'Début', key: 'd' }, droite('Entrée', 'i'), droite('Obtenu', 'o'), droite('Perte %', 'x')],
      (r.production.lots || []).map(x => ({ c: x.code, p: x.produit, s: x.statut, d: dateCourte(x.debut), i: kg(x.entree), o: kg(x.sortie), x: `${kg(x.perte_pct)} %` })))
  }
  if (r.demandes) {
    tab(`Demandes de stock usine → magasin (${r.demandes.nb})`,
      [{ text: 'Demande', key: 'c' }, { text: 'Date', key: 'd' }, { text: 'Statut', key: 's' }, droite('Demandé (kg)', 'q'), droite('Livré (kg)', 'l'), { text: 'Par', key: 'p' }],
      r.demandes.liste.map(x => ({ c: x.code, d: dateCourte(x.date), s: x.statut, q: kg(x.demande), l: kg(x.livre), p: x.saisi_par })))
  }

  return {
    titre: 'CLÔTURE MENSUELLE',
    meta: [
      `Du ${dateCourte(d.date_debut)} au ${dateCourte(d.date_fin)}${d.anticipee ? ' (anticipée)' : ''}`,
      d.cloture_par ? `Clôturée par : ${d.cloture_par}` : '',
    ].filter(Boolean),
    contenu,
    filename: `CLOTURE_${d.date_debut}_${d.date_fin}.pdf`,
  }
}
