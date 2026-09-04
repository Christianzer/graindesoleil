// Source de vérité unique pour les prix HT forcés à la vente.
// Voir docs/superpowers/specs/2026-06-09-prix-ht-bloque-vente-design.md
//
// Pour modifier un montant ou ajouter un code de la catégorie 3814,
// éditer uniquement ce fichier.

export const PRIX_HT_SPECIAL = 3814
export const PRIX_HT_DEFAUT = 700

// Produits dont le prix HT est bloqué à 3814 FCFA.
export const CODES_PRIX_SPECIAL = [
  '6186000944033',
  '6186000944019',
  '6186000944026'
]

// Renvoie le prix HT imposé pour un code produit donné.
// Les 3 codes ci-dessus -> 3814 ; tous les autres produits -> 700.
export function prixHtPourCode (code) {
  return CODES_PRIX_SPECIAL.includes(String(code)) ? PRIX_HT_SPECIAL : PRIX_HT_DEFAUT
}

// Barème spécifique à l'écran "Ventes commerciale".
// Même prix spécial (3814) que les autres écrans, mais défaut différent (1000).
export const PRIX_HT_COMMERCIAL_DEFAUT = 1000

export function prixHtCommercialPourCode (code) {
  return CODES_PRIX_SPECIAL.includes(String(code)) ? PRIX_HT_SPECIAL : PRIX_HT_COMMERCIAL_DEFAUT
}
