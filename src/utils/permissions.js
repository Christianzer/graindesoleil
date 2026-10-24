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
  'journal_activite', 'parametres', 'clotures',
  'demandes', 'demandes_creer', 'commercial_prises', 'commercial_prises_creer',
  'valider_depassement_seuil', 'valider_decaissement', 'supprimer_documents',
  'encaissement_bl_clients', 'compte_client', 'compte_commercial',
]

// Responsable : périmètre de l'admin, sans la section « Suivi & Documents » du
// menu (archive = documents_clients, Historiques, Journal d'activité).
const MASQUE_RESPONSABLE = ['documents_clients', 'historiques', 'historiques_encaissement', 'journal_activite']
// Consultation croisée (lecture seule, appliquée par ConsultationSeule côté serveur) :
// le responsable voit les écrans de l'usine, l'usine voit ceux du responsable
// hors données clients (RestreindreCaisse) et hors paramètres/clôtures/backup.
const RESPONSABLE_CONSULTATION = ['transformations', 'fournisseurs', 'approvisionnement']
const USINE_CONSULTATION = ['stocks', 'decaissement', 'rapport_caisse', 'commercial_prises', 'compte_commercial', 'commercial']
const RESPONSABLE_PERMISSIONS = ADMIN_PERMISSIONS.filter(p => !MASQUE_RESPONSABLE.includes(p)).concat(RESPONSABLE_CONSULTATION)

// Fournisseurs/approvisionnement : l'usine saisit son stock de matière
// première via ses propres réceptions fournisseurs (achat de café grain) et
// règle leurs factures — remis dans son périmètre.
const USINE_PERMISSIONS = [
  'dashboard', 'transformations',
  'demandes', 'demandes_livrer',
  'fournisseurs', 'approvisionnement',
].concat(USINE_CONSULTATION)

// Aucun écran dédié pour le commercial dans ce plan (voir ruling en tête de plan) :
// les cessions/versements/solde sont gérés par le responsable.
const COMMERCIAL_PERMISSIONS = ['dashboard']

// Opérateur de caisse : périmètre restreint aux commerciaux uniquement (plus
// de BL clients, cf. encaissement_bl_clients réservé à Admin/Responsable) —
// dépôts-ventes (cessions, sous contrôle du seuil de solde côté serveur),
// versements/encaissement des commerciaux, vue du stock disponible (onglet
// dédié dans l'écran caisse), décaissement (soumis à validation du
// responsable), rapport de caisse, tableau de bord dédié. Plus d'« Autres
// entrées » (appro) retiré sur demande.
// Aucun accès aux ventes, clients, produits, fournisseurs, paramètres, ni à
// la section « Suivi & Documents » (archive, historiques, journal d'activité).
const CAISSE_PERMISSIONS = [
  'dashboard',
  'caisses', 'decaissement', 'rapport_caisse',
  'commercial_prises', 'commercial_prises_creer',
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

// Écran ouvert en lecture seule pour ce rôle (bandeau « consultation »).
export function enConsultation(typeUser, routeName) {
  if (Number(typeUser) === 3) return RESPONSABLE_CONSULTATION.includes(routeName)
  if (Number(typeUser) === 4) return USINE_CONSULTATION.includes(routeName)
  return false
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
