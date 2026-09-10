// Point d'entrée des documents imprimables (rendu pdfmake côté app bureau).
//
//   import { imprimerDocument } from '@/documents'
//   imprimerDocument('bl', 'BL10092026-0007')
//   imprimerDocument('releve_client', clientId, '2026-09-01', '2026-09-30')
//
import API_BASE_URL from '@/api/config'
import { genererDocument } from './engine'
import * as B from './builders'
const axios = require('axios')

const REGISTRE = {
  bl: { url: (code) => `/api/doc/bl/${code}`, build: B.bl },
  recu: { url: (code) => `/api/doc/recu/${code}`, build: B.recu },
  recu_commercial: { url: (id) => `/api/doc/recu-commercial/${id}`, build: B.recu },
  avoir: { url: (code) => `/api/doc/avoir/${code}`, build: B.avoir },
  releve_client: { url: (id, debut, fin) => `/api/doc/releve-client/${id}/${debut}/${fin}`, build: B.releveClient },
  releve_commercial: { url: (id, debut, fin) => `/api/doc/releve-commercial/${id}/${debut}/${fin}`, build: B.releveCommercial },
  cession: { url: (code) => `/api/doc/cession/${code}`, build: B.cession },
  transfert: { url: (code) => `/api/doc/transfert/${code}`, build: B.transfert },
  cloture_caisse: { url: (date) => `/api/doc/cloture-caisse/${date || ''}`, build: B.clotureCaisse },
}

/**
 * Récupère les données du document et déclenche le rendu PDF.
 * @param {string} type  clé du REGISTRE
 * @param {...any} args   paramètres d'URL (code, id, dates…)
 */
export async function imprimerDocument (type, ...args) {
  const entry = REGISTRE[type]
  if (!entry) {
    console.error('[documents] type inconnu :', type)
    return
  }
  try {
    const { data } = await axios.get(`${API_BASE_URL}${entry.url(...args)}`)
    await genererDocument(entry.build(data))
  } catch (e) {
    console.error('[documents] échec impression', type, e && (e.response ? e.response.status : e.message))
    if (typeof window !== 'undefined' && window.Fire) {
      window.Fire.$emit('toast', { message: "Impossible de générer le document.", variant: 'danger' })
    }
  }
}

export { genererDocument } from './engine'
