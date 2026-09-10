// Rôles (commercial.type_user, côté backend) : 1=admin, 2=commercial, 3=responsable, 4=usine, 5=caisse.
// L'admin a le périmètre le plus large. Le responsable a le même, moins la
// section « Suivi & Documents » du menu (archive, historiques, journal
// d'activité) — masquée sur demande (voir RESPONSABLE_PERMISSIONS).
const ADMIN_PERMISSIONS = [
  'dashboard', 'clients', 'stocks', 'ventes', 'factures_users', 'panier_facture',
  'listes_commandes', 'factures_avoir', 'facture', 'livraison', 'historiques',
  'caisses', 'historiques_factures', 'historiques_livraisons', 'recu', 'rapport_caisse',
  'documents_clients', 'ventes_historiques', 'commande_clients', 'appro', 'decaissement',
  'historiques_encaissement', 'historiques_encaissement_clients', 'commercial', 'commerciaux',
  'journal_activite', 'parametres',
  'demandes', 'demandes_creer', 'commercial_prises', 'commercial_prises_creer',
]

// Responsable : périmètre de l'admin, sans la section « Suivi & Documents » du
// menu (archive = documents_clients, Historiques, Journal d'activité).
const MASQUE_RESPONSABLE = ['documents_clients', 'historiques', 'historiques_encaissement', 'journal_activite']
const RESPONSABLE_PERMISSIONS = ADMIN_PERMISSIONS.filter(p => !MASQUE_RESPONSABLE.includes(p))

// L'usine ne vend rien : pas de fournisseurs/appro pour le responsable (c'est elle
// qui lui donne les produits, cf. spec) — fournisseurs/approvisionnement passent ici.
const USINE_PERMISSIONS = [
  'dashboard', 'fournisseurs', 'approvisionnement', 'transformations',
  'demandes', 'demandes_livrer',
]

// Aucun écran dédié pour le commercial dans ce plan (voir ruling en tête de plan) :
// les cessions/versements/solde sont gérés par le responsable.
const COMMERCIAL_PERMISSIONS = ['dashboard']

// Opérateur de caisse : console de trésorerie uniquement — encaissement (BL
// clients + commerciaux), autres entrées de caisse, décaissement, rapport de
// caisse, plus son tableau de bord dédié. Aucun accès aux ventes, clients,
// produits, fournisseurs, comptes, paramètres, ni à la section
// « Suivi & Documents » (archive, historiques, journal d'activité) — retirée
// du périmètre caisse sur demande.
const CAISSE_PERMISSIONS = [
  'dashboard',
  'caisses', 'appro', 'decaissement', 'rapport_caisse',
]

const PERMISSIONS_BY_ROLE = {
  1: ADMIN_PERMISSIONS,        // admin
  2: COMMERCIAL_PERMISSIONS,   // commercial
  3: RESPONSABLE_PERMISSIONS,  // responsable
  4: USINE_PERMISSIONS,        // usine
  5: CAISSE_PERMISSIONS,       // caisse
}

export function getPermissionsForRole(typeUser) {
  return PERMISSIONS_BY_ROLE[typeUser] || []
}

export function hasPermission(routeName) {
  try {
    const raw = localStorage.getItem('LoggedUser')
    if (!raw) return false
    const user = JSON.parse(raw)
    return !!(user.permissions && user.permissions.includes(routeName))
  } catch (e) {
    return false
  }
}

export const ROLE_LABELS = {
  1: 'Admin',
  2: 'Commercial',
  3: 'Responsable',
  4: 'Usine',
  5: 'Caisse',
}
