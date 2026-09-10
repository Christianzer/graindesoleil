// Un builder par document : (data JSON du backend) -> { titre, meta, contenu, filename }
// consommé par genererDocument(). Style « bandeau » via les briques de theme.js.
import { fcfa, nombre, kg, dateCourte, dateLongue, montantMin } from './format'
import {
  COULEURS, styles, sousTitre, tableauLignes, encadreTotal, enLettres, blocSignatures, blocInfos,
} from './theme'

/* ------------------------------------------------------------------ utils */

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
  const head = ['Date', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Solde'].map((t, i) => ({
    text: t.toUpperCase(), style: 'thTab', alignment: i >= 3 ? 'right' : 'left',
    fillColor: COULEURS.orClair, margin: [6, 6, 6, 6],
  }))
  const rows = []
  rows.push([
    { text: dateCourte(data.periode.debut), style: 'cell', margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: 'Solde d’ouverture', style: 'cell', italics: true, margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: nombre(data.solde_ouverture), style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
  ])
  data.mouvements.forEach(m => rows.push([
    { text: dateCourte(m.date), style: 'cell', margin: [6, 5, 6, 5] },
    { text: m.piece || '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: m.libelle || '', style: 'cell', margin: [6, 5, 6, 5] },
    { text: m.debit ? nombre(m.debit) : '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: m.credit ? nombre(m.credit) : '', style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
    { text: nombre(m.solde), style: 'cell', alignment: 'right', margin: [6, 5, 6, 5] },
  ]))
  rows.push([
    { text: 'Totaux période', colSpan: 3, bold: true, fontSize: 9, margin: [6, 6, 6, 6] }, {}, {},
    { text: nombre(data.total_debit), bold: true, fontSize: 9, alignment: 'right', margin: [6, 6, 6, 6] },
    { text: nombre(data.total_credit), bold: true, fontSize: 9, alignment: 'right', margin: [6, 6, 6, 6] },
    { text: '', margin: [6, 6, 6, 6] },
  ])
  return {
    table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'], body: [head, ...rows] },
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
    meta: [`N° ${d.numero}`, dateLongue(d.date)],
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

  return {
    titre: 'REÇU DE VERSEMENT',
    meta: [`N° ${d.numero}`, dateLongue(d.date)],
    contenu: [
      blocInfos(infos.map(([k, v]) => [k, v])),
      blocSignatures([commercial ? 'Le commercial' : 'Le client', 'La caisse']),
    ],
    filename: `RECU_${d.numero}.pdf`,
  }
}

export function avoir (d) {
  return {
    titre: 'AVOIR',
    meta: [`N° ${d.numero}`, `sur ${d.facture_origine || '—'}`, dateLongue(d.date)],
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
    meta: [`N° ${d.numero}`, dateLongue(d.date)],
    contenu: [
      blocTiers(d.commercial.type === 'equipe' ? 'Équipe commerciale' : 'Commercial', d.commercial),
      tableauLignes(
        [
          { text: 'Produit', key: 'libelle' },
          { text: 'Qté (kg)', key: 'q', align: 'right' },
          { text: 'Prix gros (FCFA)', key: 'pu', align: 'right' },
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
  const meta = [`Demande N° ${d.numero}`]
  meta.push(d.statut === 3 ? `Soldée le ${dateCourte(d.date_livraison)}` : (d.statut === 2 ? 'Livraison partielle' : 'En attente'))
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
      ],
      d.encaissements.map(e => ({ ref: e.reference, tiers: e.tiers, canal: e.canal, mode: e.mode, m: nombre(e.montant) })),
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
      [{ text: 'Référence', key: 'ref' }, { text: 'Libellé', key: 'lib' }, { text: 'Montant (FCFA)', key: 'm', align: 'right' }],
      d.entrees.map(x => ({ ref: x.reference, lib: x.libelle, m: nombre(x.montant) })),
    ))
  }
  if (d.sorties && d.sorties.length) {
    contenu.push(sousTitre('Décaissements'))
    contenu.push(tableauLignes(
      [{ text: 'Référence', key: 'ref' }, { text: 'Libellé', key: 'lib' }, { text: 'Montant (FCFA)', key: 'm', align: 'right' }],
      d.sorties.map(x => ({ ref: x.reference, lib: x.libelle, m: nombre(x.montant) })),
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
