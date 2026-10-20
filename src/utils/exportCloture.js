// Export Excel d'une clôture mensuelle (récapitulatif figé). Une feuille par rubrique.
// Les sections ajoutées après coup (liste_bl, journal…) peuvent manquer sur d'anciens
// récapitulatifs : la feuille correspondante est alors simplement omise.
import { enregistrerFichier } from '@/utils/fichier'

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function exporterClotureExcel (c) {
  const XLSX = await import('xlsx')
  const r = c.recap
  const wb = XLSX.utils.book_new()

  // Excel limite les noms de feuille à 31 caractères et interdit certains signes.
  const nomFeuille = (nom) => nom.replace(/[\\/?*[\]:]/g, '-').slice(0, 31)

  const feuille = (nom, lignes, largeurs) => {
    const ws = XLSX.utils.aoa_to_sheet(lignes)
    ws['!cols'] = (largeurs || []).map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, nomFeuille(nom))
  }

  // Feuille « tableau » : en-têtes + une ligne par élément ; omise si la liste est absente.
  const table = (nom, entetes, liste, ligne, largeurs) => {
    if (!Array.isArray(liste)) return
    feuille(nom, [entetes].concat(liste.map(ligne)), largeurs)
  }

  feuille('Résumé', [
    ['Clôture', `${c.date_debut} au ${c.date_fin}${c.anticipee ? ' (anticipée)' : ''}`],
    ['Clôturée par', c.cloture_par || ''],
    [],
    ['Ventes'],
    ['Bons de livraison', r.ventes.nb_bl, r.ventes.total_ttc],
    ['Avoirs', r.ventes.nb_avoirs, r.ventes.total_avoirs],
    ['Ventes nettes TTC', '', r.ventes.net_ttc],
    [],
    ['Encaissements et caisse'],
    ['Encaissé clients', r.encaissement.clients.nb, r.encaissement.clients.total],
    ['Versé par les commerciaux', r.encaissement.commerciaux.nb, r.encaissement.commerciaux.total],
    ['Autres entrées de caisse', r.caisse.entrees.nb, r.caisse.entrees.total],
    ['Décaissements validés', r.caisse.sorties.nb, r.caisse.sorties.total],
    ['Solde de caisse début', '', r.caisse.solde_debut],
    ['Solde de caisse fin', '', r.caisse.solde_fin],
    [],
    ['Créances en fin de période'],
    ['Clients', r.creances.clients.nb, r.creances.clients.total],
    ['Commerciaux', r.creances.commerciaux.nb, r.creances.commerciaux.total],
    [],
    ['Achats fournisseurs'],
    ['Approvisionnements', r.achats.nb, r.achats.total],
    ['Réglé aux fournisseurs', '', r.achats.regle],
    ['Dette fournisseurs fin de période', '', r.achats.dette_fin],
  ], [38, 12, 18])

  // ---- Ventes
  table('Ventes par produit', ['Produit', 'Quantité', 'Montant'], r.ventes.par_produit, x => [x.libelle, x.quantite, x.montant], [34, 12, 16])
  table('Ventes par niveau de prix', ['Niveau', 'BL', 'Quantité', 'Montant'], r.ventes.par_niveau_prix, x => [x.niveau, x.nb_bl, x.quantite, x.montant], [18, 8, 12, 16])
  table('Ventes par utilisateur', ['Saisi par', 'BL', 'Montant net'], r.ventes.par_utilisateur, x => [x.utilisateur, x.nb_bl, x.montant], [24, 8, 16])
  table('Ventes par client', ['Client', 'BL', 'Montant net', 'Versé', 'Reste dû'], r.ventes.par_client, x => [x.client, x.nb_bl, x.montant, x.verse, x.reste], [34, 8, 16, 16, 16])
  table('Liste des BL', ['N°', 'Date', 'Type', 'Client', 'Montant', 'Versé', 'Reste', 'Saisi par'], r.ventes.liste_bl,
    x => [x.numero, x.date, x.type, x.client, x.montant, x.verse, x.reste, x.saisi_par], [20, 12, 8, 30, 14, 14, 14, 16])

  // ---- Caisse
  table('Encaissements par mode', ['Mode', 'Montant'], r.encaissement.par_mode, x => [x.mode, x.montant], [30, 16])
  table('Liste des encaissements', ['Reçu', 'Date', 'Canal', 'Client / commercial', 'BL', 'Mode', 'Montant', 'Saisi par'], r.encaissement.liste,
    x => [x.recu, x.date, x.canal, x.tiers, x.piece || '', x.mode, x.montant, x.saisi_par], [18, 12, 12, 30, 20, 16, 14, 16])
  table('Mouvements de caisse', ['Date', 'Sens', 'Référence', 'Libellé', 'Montant', 'Statut', 'Saisi par'], r.caisse.mouvements,
    x => [x.date, x.sens, x.reference, x.libelle, x.montant, x.statut, x.saisi_par], [12, 8, 18, 34, 14, 12, 16])
  table('Journal de caisse', ['Jour', 'Encaissé', 'Entrées', 'Sorties', 'Solde fin de journée'], r.caisse.journal,
    x => [x.date, x.encaisse, x.entrees, x.sorties, x.solde], [12, 14, 14, 14, 20])
  table('Caisse par utilisateur', ['Utilisateur', 'Encaissé', 'Entrées', 'Sorties validées'], r.caisse.par_utilisateur,
    x => [x.utilisateur, x.encaisse, x.entrees, x.sorties], [24, 14, 14, 18])

  // ---- Créances
  table('Créances clients', ['Client', 'Solde'], r.creances.clients.liste, x => [x.nom, x.solde], [36, 16])
  table('Créances commerciaux', ['Commercial', 'Solde'], r.creances.commerciaux.liste, x => [x.nom, x.solde], [36, 16])
  if (r.creances.anciennete) {
    table('Ancienneté des créances', ['Ancienneté', 'BL', 'Reste dû'], r.creances.anciennete.tranches, x => [x.tranche, x.nb, x.montant], [22, 8, 16])
    table('BL impayés', ['BL', 'Date', 'Client', 'Jours', 'Reste dû', 'Saisi par'], r.creances.anciennete.liste,
      x => [x.numero, x.date, x.client, x.age_jours, x.reste, x.saisi_par], [20, 12, 30, 8, 14, 16])
  }
  table('Dépôt-vente commerciaux', ['Commercial', 'Solde début', 'Cédé (kg)', 'Cédé (montant)', 'Vendu déclaré (kg)', 'Retours (kg)', 'Versé', 'Solde fin'], r.creances.depot_vente,
    x => [x.commercial, x.solde_debut, x.cede_kg, x.cede_montant, x.vendu_kg, x.retour_kg, x.verse, x.solde_fin], [28, 14, 12, 16, 18, 14, 14, 14])

  // ---- Achats
  table('Achats par fournisseur', ['Fournisseur', 'Achats', 'Montant'], r.achats.par_fournisseur, x => [x.nom, x.nb, x.montant], [34, 10, 16])
  table('Dettes fournisseurs', ['Fournisseur', 'Acheté (cumul)', 'Réglé (cumul)', 'Dette'], r.achats.dettes, x => [x.nom, x.achete, x.regle, x.dette], [34, 16, 16, 16])
  if (Array.isArray(r.achats.detail)) {
    const lignes = [['Appro', 'Date', 'Fournisseur', 'Produit', 'Quantité', 'Prix d\'achat', 'Total ligne', 'Montant appro', 'Réglé', 'Reste', 'Saisi par']]
    r.achats.detail.forEach(a => {
      (a.lignes.length ? a.lignes : [{ produit: '', quantite: '', prix: '', total: '' }]).forEach(l => {
        lignes.push([a.code, a.date, a.fournisseur, l.produit, l.quantite, l.prix, l.total, a.montant, a.regle, a.reste, a.saisi_par])
      })
    })
    feuille('Détail des appros', lignes, [18, 12, 26, 26, 10, 12, 14, 14, 14, 14, 16])
  }

  // ---- Stock
  table('Mouvements de stock', ['Produit', 'Entrées (kg)', 'Sorties (kg)', 'Variation (kg)'], r.stock.mouvements, x => [x.libelle, x.entrees, x.sorties, x.net], [34, 14, 14, 16])
  table('Mouvements par type', ['Produit', 'Type', 'Nb', 'Entrées (kg)', 'Sorties (kg)', 'Variation (kg)'], r.stock.mouvements_par_type,
    x => [x.libelle, x.type, x.nb, x.entrees, x.sorties, x.net], [30, 30, 6, 14, 14, 16])
  table('Stock à la clôture', ['Produit', 'Stock (kg)', 'Emballé (kg)'], r.stock.stock_a_la_cloture, x => [x.libelle, x.quantite, x.emballe], [34, 14, 14])
  if (r.stock.valorisation) {
    table('Valorisation du stock', ['Produit', 'Stock (kg)', 'Prix détail', 'Valeur détail', 'Prix gros', 'Valeur gros'], r.stock.valorisation.lignes,
      x => [x.libelle, x.quantite, x.prix_detail, x.valeur_detail, x.prix_gros, x.valeur_gros], [30, 12, 14, 16, 14, 16])
  }

  // ---- Usine et demandes
  if (r.production) {
    table('Production par étape', ['Étape', 'Nb', 'Entrée (kg)', 'Obtenu (kg)', 'Perte (kg)', 'Perte %'], r.production.par_etape,
      x => [x.etape, x.nb, x.entree, x.sortie, x.perte, x.perte_pct], [38, 6, 14, 14, 14, 10])
    table('Lots', ['Lot', 'Produit', 'Statut', 'Début', 'Fin', 'Dernière étape', 'Entrée (kg)', 'Obtenu (kg)', 'Perte (kg)', 'Perte %', 'Saisi par'], r.production.lots,
      x => [x.code, x.produit, x.statut, x.debut || '', x.fin || '', x.derniere_etape, x.entree, x.sortie, x.perte, x.perte_pct, x.saisi_par], [18, 22, 12, 12, 12, 34, 12, 12, 12, 10, 16])
  }
  if (r.demandes) {
    table('Demandes', ['Demande', 'Date', 'Statut', 'Livrée le', 'Demandé (kg)', 'Livré (kg)', 'Saisi par'], r.demandes.liste,
      x => [x.code, x.date, x.statut, x.livraison || '', x.demande, x.livre, x.saisi_par], [18, 12, 22, 12, 14, 12, 16])
    table('Demandes par produit', ['Produit', 'Demandé (kg)', 'Livré (kg)'], r.demandes.par_produit, x => [x.libelle, x.demande, x.livre], [34, 14, 14])
  }

  const octets = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return enregistrerFichier(new Uint8Array(octets), `cloture_${c.date_debut}_${c.date_fin}.xlsx`, MIME_XLSX, 'xlsx', 'Classeur Excel')
}
