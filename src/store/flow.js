// Store centralisé de l'état de « parcours de vente » (client sélectionné +
// produits du panier en cours). Adossé à localStorage pour survivre à un
// rafraîchissement (F5) et rester interopérable avec les composants non encore
// migrés (mêmes clés, même convention JSON).
//
// N.B. : l'authentification (LoggedUser) n'est volontairement PAS gérée ici —
// elle reste dans localStorage, c'est une persistance de session légitime.

const KEYS = {
  clients: 'clients',
  produits: 'produits',
  articlesProd: 'articles_prod',
  matricule: 'matricule',
  niveauPrix: 'niveau_prix',
}

function read(key) {
  const raw = localStorage.getItem(key)
  if (raw === null || raw === undefined) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    // Valeur historique non-JSON : on la renvoie telle quelle.
    return raw
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default {
  // --- Client sélectionné pour la vente en cours ---
  getClients() { return read(KEYS.clients) },
  setClients(value) { write(KEYS.clients, value) },

  // --- Produits du panier en cours ---
  getProduits() { return read(KEYS.produits) },
  setProduits(value) { write(KEYS.produits, value) },

  // --- Articles / sélection de produits ---
  getArticlesProd() { return read(KEYS.articlesProd) },
  setArticlesProd(value) { write(KEYS.articlesProd, value) },

  // --- Matricule (contexte ponctuel : stock, caisse…) ---
  getMatricule() { return read(KEYS.matricule) },
  setMatricule(value) { write(KEYS.matricule, value) },
  clearMatricule() { localStorage.removeItem(KEYS.matricule) },

  // --- Niveau de prix choisi pour le bon de livraison en cours (detail/demi_gros/gros) ---
  getNiveauPrix() { return read(KEYS.niveauPrix) },
  setNiveauPrix(value) { write(KEYS.niveauPrix, value) },

  // Réinitialise le parcours de vente (client + produits + articles).
  // Remplace le triptyque removeItem('produits'/'clients'/'articles_prod')
  // dispersé dans de nombreux composants.
  clearSale() {
    localStorage.removeItem(KEYS.produits)
    localStorage.removeItem(KEYS.clients)
    localStorage.removeItem(KEYS.articlesProd)
  },
}
