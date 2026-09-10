// Briques de mise en page pdfmake, partagées par tous les documents.
// Style « bandeau » validé : en-tête logos + coordonnées, bandeau brun,
// tableaux en-tête crème/or, encadré total or, pied de page légal + pagination.
import { LOGO_FORTUNA, LOGO_THERA, ENTREPRISE } from './identite'
import { fcfa } from './format'

export const COULEURS = {
  brun: '#43310F',
  or: '#C9A13B',
  orClair: '#F3EDE1',
  olive: '#5C6B2F',
  filet: '#DDCDB0',
  filetLeger: '#EEEEEE',
  texte: '#22252C',
  gris: '#6B7280',
  rouge: '#B23B2E',
}

export const pageMargins = [40, 38, 40, 58]

export const defaultStyle = { font: 'Roboto', fontSize: 9.5, color: COULEURS.texte, lineHeight: 1.25 }

export const styles = {
  titreBandeau: { fontSize: 14, bold: true, color: '#FFFFFF', characterSpacing: 0.5 },
  metaBandeau: { fontSize: 8.5, color: '#F0E9DD', alignment: 'right' },
  coord: { fontSize: 8, color: '#3A3F4B', lineHeight: 1.35 },
  sousTitre: { fontSize: 8.5, bold: true, color: '#FFFFFF', characterSpacing: 0.5 },
  thTab: { fontSize: 8, bold: true, color: COULEURS.brun, characterSpacing: 0.3 },
  cell: { fontSize: 9 },
  totalBox: { fontSize: 11, bold: true, color: '#3A2C0C' },
  lettres: { italics: true, color: COULEURS.brun, fontSize: 9 },
  labelSign: { fontSize: 7.5, color: COULEURS.gris, characterSpacing: 0.3 },
  pied: { fontSize: 7, color: '#8A8F99' },
}

/** En-tête : logo Fortuna + coordonnées à gauche, visuel Thera à droite. */
export function entete () {
  return {
    columns: [
      {
        width: '*',
        stack: [
          { image: LOGO_FORTUNA, width: 150 },
          {
            margin: [0, 8, 0, 0],
            style: 'coord',
            text: [
              { text: 'Tél : ', bold: true }, ENTREPRISE.telephone,
              { text: '   ·   E-mail : ', bold: true }, ENTREPRISE.email, '\n',
              { text: 'Adresse : ', bold: true }, ENTREPRISE.adresse, '\n',
              { text: 'RCCM : ', bold: true }, ENTREPRISE.rccm,
              { text: '   ·   NCC : ', bold: true }, ENTREPRISE.ncc,
            ],
          },
        ],
      },
      { width: 'auto', image: LOGO_THERA, width: 60, alignment: 'right' },
    ],
    columnGap: 16,
    margin: [0, 0, 0, 10],
  }
}

/** Bandeau pleine largeur brun : titre à gauche, méta (n°/date) à droite. */
export function bandeau (titre, metaLignes) {
  const meta = Array.isArray(metaLignes) ? metaLignes.join('\n') : String(metaLignes || '')
  return {
    table: {
      widths: ['*', 'auto'],
      body: [[
        { text: titre, style: 'titreBandeau', margin: [10, 7, 4, 7] },
        { text: meta, style: 'metaBandeau', margin: [4, 7, 10, 7] },
      ]],
    },
    layout: {
      fillColor: () => COULEURS.brun,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 12],
  }
}

/** Barre de sous-section olive. */
export function sousTitre (texte) {
  return {
    table: { widths: ['*'], body: [[{ text: texte.toUpperCase(), style: 'sousTitre', margin: [8, 3, 8, 3] }]] },
    layout: { fillColor: () => COULEURS.olive, hLineWidth: () => 0, vLineWidth: () => 0 },
    margin: [0, 10, 0, 4],
  }
}

/**
 * Tableau de lignes. colonnes = [{ text, key, width?, align? }].
 * lignes = tableau d'objets. total = { label, montant } optionnel (rendu à part via encadreTotal).
 */
export function tableauLignes (colonnes, lignes) {
  const widths = colonnes.map(c => c.width || (c === colonnes[0] ? '*' : 'auto'))
  const head = colonnes.map(c => ({ text: c.text.toUpperCase(), style: 'thTab', alignment: c.align || 'left', fillColor: COULEURS.orClair, margin: [6, 6, 6, 6] }))
  const body = lignes.map(l => colonnes.map(c => ({
    text: l[c.key] == null ? '' : String(l[c.key]),
    style: 'cell',
    alignment: c.align || 'left',
    margin: [6, 5, 6, 5],
  })))
  return {
    table: { headerRows: 1, widths, body: [head, ...body] },
    layout: {
      hLineWidth: (i) => (i === 1 ? 1 : (i === 0 ? 0 : 0.5)),
      vLineWidth: () => 0,
      hLineColor: (i) => (i === 1 ? COULEURS.filet : COULEURS.filetLeger),
      paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 6],
  }
}

/** Encadré total, fond or, aligné à droite. */
export function encadreTotal (label, montant) {
  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        table: { body: [[{ text: `${label} : ${fcfa(montant)}`, style: 'totalBox', margin: [14, 8, 14, 8] }]] },
        layout: { fillColor: () => COULEURS.or, hLineWidth: () => 0, vLineWidth: () => 0 },
      },
    ],
    margin: [0, 8, 0, 0],
  }
}

/** Ligne « Arrêté à la somme de … ». */
export function enLettres (phrase) {
  return { text: phrase, style: 'lettres', margin: [0, 10, 0, 0] }
}

/** Zones de signature côte à côte. labels = ['Livré par', 'Reçu par']. */
export function blocSignatures (labels) {
  return {
    columns: labels.map(l => ({
      width: '*',
      stack: [
        { text: l.toUpperCase(), style: 'labelSign' },
        { text: '', margin: [0, 30, 0, 0] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.7, lineColor: '#B9BDC6' }] },
      ],
    })),
    columnGap: 28,
    margin: [0, 26, 0, 0],
  }
}

/** Pied de page répété (légal à gauche, pagination à droite). */
export function piedDePage () {
  return (currentPage, pageCount) => ({
    margin: [40, 12, 40, 0],
    columns: [
      { text: `${ENTREPRISE.nom} — RCCM ${ENTREPRISE.rccm} — NCC ${ENTREPRISE.ncc}`, style: 'pied' },
      { text: `Page ${currentPage} / ${pageCount}`, style: 'pied', alignment: 'right' },
    ],
    // filet au-dessus du pied
    canvasBackground: null,
  })
}

/** Bloc « clé : valeur » (reçus). paires = [['Reçu de', 'SARL X'], …]. */
export function blocInfos (paires) {
  return {
    table: {
      widths: [110, '*'],
      body: paires.map(([k, v]) => ([
        { text: k, color: COULEURS.gris, fontSize: 9, margin: [0, 2, 0, 2] },
        { text: v, fontSize: 9, margin: [0, 2, 0, 2] },
      ])),
    },
    layout: 'noBorders',
    margin: [0, 2, 0, 0],
  }
}
