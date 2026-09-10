// Helpers de formatage partagés par tous les documents PDF.
import moment from 'moment'

moment.locale('fr')

// Séparateur de milliers avec une espace ASCII simple : Intl.NumberFormat('fr-FR')
// insère une espace fine insécable (U+202F) que la police Roboto de pdfmake
// n'a pas -> elle s'affiche en « tofu ». On groupe donc nous-mêmes.
function grouper (v) {
  const s = String(Math.round(Math.abs(Number(v) || 0)))
  const signe = (Number(v) || 0) < 0 ? '-' : ''
  return signe + s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** 80100 -> "80 100 FCFA" */
export function fcfa (n) {
  return grouper(n) + ' FCFA'
}

/** 80100 -> "80 100" (sans devise, pour les cellules de tableau) */
export function nombre (n) {
  return grouper(n)
}

/** kilos décimaux : 12 -> "12", 12.5 -> "12,5" */
export function kg (n) {
  const v = Number(n) || 0
  return (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, '').replace('.', ','))
}

/** "2026-09-10" -> "10/09/2026" */
export function dateCourte (d) {
  if (!d) return ''
  const m = moment(d, ['YYYY-MM-DD', moment.ISO_8601], true)
  return m.isValid() ? m.format('DD/MM/YYYY') : String(d)
}

/** "2026-09-10" -> "mardi 10 septembre 2026" (reçus + relevés) */
export function dateLongue (d) {
  if (!d) return ''
  const m = moment(d, ['YYYY-MM-DD', moment.ISO_8601], true)
  return m.isValid() ? m.format('dddd D MMMM YYYY') : String(d)
}

/** "10/09/2026 à 14:32" pour l'horodatage d'impression */
export function horodatage () {
  return moment().format('DD/MM/YYYY [à] HH:mm')
}

// --- Montant en toutes lettres (français, entier, "francs CFA") ---

const UNITES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf']
const DIZAINES = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt']

// n : 0..999 ; suivi : vrai si un mot-nombre suit (mille/million) -> "vingt" et
// "cent" restent invariables ("quatre-vingt mille", "deux cent mille").
function centaines (n, suivi) {
  let out = ''
  const c = Math.floor(n / 100)
  const r = n % 100
  if (c > 0) {
    out += (c > 1 ? UNITES[c] + ' ' : '') + 'cent'
    if (c > 1 && r === 0 && !suivi) out += 's'
    if (r > 0) out += ' '
  }
  if (r > 0) {
    if (r < 20) {
      out += UNITES[r]
    } else {
      const d = Math.floor(r / 10)
      const u = r % 10
      let mot = DIZAINES[d]
      if (d === 7 || d === 9) {
        // soixante-dix / quatre-vingt-dix
        mot += (u === 1 && d === 7 ? ' et onze' : '-' + UNITES[10 + u])
      } else {
        if (u === 1 && d !== 8) mot += ' et un'
        else if (u > 0) mot += '-' + UNITES[u]
        else if (d === 8 && !suivi) mot += 's' // quatre-vingts (invariable devant mille)
      }
      out += mot
    }
  }
  return out
}

/** 80100 -> "quatre-vingt mille cent francs CFA" */
export function montantEnLettres (n) {
  const entier = Math.round(Math.abs(Number(n) || 0))
  if (entier === 0) return 'zéro franc CFA'

  const millions = Math.floor(entier / 1000000)
  const milliers = Math.floor((entier % 1000000) / 1000)
  const reste = entier % 1000

  const parts = []
  if (millions > 0) parts.push(millions > 1 ? centaines(millions, true) + ' millions' : 'un million')
  if (milliers > 0) parts.push(milliers > 1 ? centaines(milliers, true) + ' mille' : 'mille')
  if (reste > 0) parts.push(centaines(reste, false))

  const mots = parts.join(' ').trim()
  // "un million DE francs" quand million(s) est immédiatement suivi de la devise.
  const de = (millions > 0 && milliers === 0 && reste === 0) ? ' de' : ''
  const devise = entier === 1 ? ' franc CFA' : ' francs CFA'
  return mots.charAt(0).toUpperCase() + mots.slice(1) + de + devise
}

/** Idem, première lettre en minuscule (pour « … à la somme de … »), CFA conservé. */
export function montantMin (n) {
  const s = montantEnLettres(n)
  return s.charAt(0).toLowerCase() + s.slice(1)
}
