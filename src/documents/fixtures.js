// Jeux de données d'exemple pour prévisualiser les documents sans dérouler
// tout le flux métier (page /dev/documents).

export const FIXTURES = {
  bl: {
    numero: 'BL10092026-0007', date: '2026-09-10', niveau_prix: 'Demi-gros',
    client: { nom: 'SARL Le Comptoir', telephone: '07 01 02 03 04' },
    lignes: [
      { libelle: 'Café moulu — Arabica', quantite: 12, prix_unitaire: 3250, montant: 39000 },
      { libelle: 'Café en grains — Robusta', quantite: 8, prix_unitaire: 3200, montant: 25600 },
      { libelle: 'Café moulu — mélange maison', quantite: 5, prix_unitaire: 3100, montant: 15500 },
    ],
    total: 80100, deja_verse: 50000, avoirs: 0, reste: 30100,
  },
  recu: {
    numero: 'REC10092026-0021', date: '2026-09-10', type: 'client',
    de: 'SARL Le Comptoir', telephone: '07 01 02 03 04', reference: 'BL10092026-0007',
    mode_paiement: 'Mobile money — Wave', montant: 50000, monnaie_rendue: 0,
    montant_facture: 80100, reste_du: 30100,
  },
  recu_commercial: {
    numero: 'RCV-000012', date: '2026-09-10', type: 'commercial',
    de: 'Équipe Yopougon', telephone: '05 55 44 33 22', reference: null,
    mode_paiement: 'Espèces', montant: 12000, monnaie_rendue: 0,
    total_pris: 32000, total_verse: 12000, reste_du: 20000,
  },
  avoir: {
    numero: 'AV10092026-0002', date: '2026-09-10', facture_origine: 'BL05092026-0003',
    client: { nom: 'SARL Le Comptoir', telephone: '07 01 02 03 04' },
    lignes: [{ libelle: 'Café en grains — Robusta', quantite: 3, prix_unitaire: 3200, montant: 9600 }],
    total: 9600,
  },
  releve_client: {
    tiers: { nom: 'SARL Le Comptoir', telephone: '07 01 02 03 04' },
    periode: { debut: '2026-09-01', fin: '2026-09-30' }, solde_ouverture: 0,
    mouvements: [
      { date: '2026-09-02', piece: 'BL10092026-0004', libelle: 'Bon de livraison', debit: 120000, credit: 0, solde: 120000 },
      { date: '2026-09-06', piece: 'REC10092026-0012', libelle: 'Versement', debit: 0, credit: 80000, solde: 40000 },
      { date: '2026-09-10', piece: 'BL10092026-0007', libelle: 'Bon de livraison', debit: 80100, credit: 0, solde: 120100 },
      { date: '2026-09-10', piece: 'REC10092026-0021', libelle: 'Versement', debit: 0, credit: 50000, solde: 70100 },
    ],
    total_debit: 200100, total_credit: 130000, solde_cloture: 70100,
  },
  releve_commercial: {
    tiers: { nom: 'Équipe Yopougon', telephone: '05 55 44 33 22', type: 'equipe' },
    periode: { debut: '2026-09-01', fin: '2026-09-30' }, solde_ouverture: 0,
    mouvements: [
      { date: '2026-09-03', piece: 'CP03092026-0001', libelle: 'Cession de stock', debit: 32000, credit: 0, solde: 32000 },
      { date: '2026-09-10', piece: 'RCV-000012', libelle: 'Versement', debit: 0, credit: 12000, solde: 20000 },
    ],
    total_debit: 32000, total_credit: 12000, solde_cloture: 20000,
  },
  cession: {
    numero: 'CP10092026-0001', date: '2026-09-10',
    commercial: { nom: 'Équipe Yopougon', type: 'equipe', telephone: '05 55 44 33 22' },
    lignes: [
      { libelle: 'Café moulu — Arabica', quantite: 6, prix_unitaire: 3200, montant: 19200 },
      { libelle: 'Café en grains — Robusta', quantite: 4, prix_unitaire: 3200, montant: 12800 },
    ],
    total: 32000, solde_avant: 0, solde_actuel: 32000,
  },
  transfert: {
    numero: 'DEM10092026-0005', date_demande: '2026-09-09', date_livraison: '2026-09-10', statut: 3,
    lignes: [
      { libelle: 'Café moulu — Arabica', quantite_demandee: 30, quantite_livree: 30 },
      { libelle: 'Café en grains — Robusta', quantite_demandee: 20, quantite_livree: 15 },
    ],
    total_livre: 45,
  },
  cloture_caisse: {
    date: '2026-09-10',
    encaissements: [
      { reference: 'REC10092026-0019', tiers: 'SARL Le Comptoir', piece: 'BL10092026-0006', mode: 'Espèces', montant: 30000, canal: 'Client' },
      { reference: 'REC10092026-0021', tiers: 'SARL Le Comptoir', piece: 'BL10092026-0007', mode: 'Mobile money — Wave', montant: 50000, canal: 'Client' },
      { reference: 'RCV-000012', tiers: 'Équipe Yopougon', piece: null, mode: 'Espèces', montant: 12000, canal: 'Commercial' },
    ],
    par_mode: [{ mode: 'Espèces', montant: 42000 }, { mode: 'Mobile money', montant: 50000 }],
    entrees: [{ reference: 'ENT10092026-0002', libelle: 'Apport exploitant', montant: 20000 }],
    sorties: [{ reference: 'SOR10092026-0004', libelle: 'Carburant livraison', montant: 8000 }],
    total_encaisse: 92000, total_entrees: 20000, total_sorties: 8000, solde_jour: 104000,
  },
}
