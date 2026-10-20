<template>
  <div class="cloture-recap">
    <div class="row">
      <div class="col-md-3 mb-3">
        <StatCard label="Ventes nettes TTC" :value="fcfa(recap.ventes.net_ttc)" :sub="recap.ventes.nb_bl + ' BL · ' + recap.ventes.nb_avoirs + ' avoir(s)'" />
      </div>
      <div class="col-md-3 mb-3">
        <StatCard label="Encaissé" :value="fcfa(recap.encaissement.total)" :sub="'Solde de caisse fin : ' + fcfa(recap.caisse.solde_fin)" />
      </div>
      <div class="col-md-3 mb-3">
        <StatCard label="Créances en fin de période" :value="fcfa(recap.creances.clients.total + recap.creances.commerciaux.total)" :sub="'Clients : ' + fcfa(recap.creances.clients.total)" />
      </div>
      <div class="col-md-3 mb-3">
        <StatCard label="Dette fournisseurs" :value="fcfa(recap.achats.dette_fin)" :sub="recap.achats.nb + ' achat(s) sur la période'" />
      </div>
    </div>

    <b-tabs content-class="pt-3" lazy>
      <!-- ============================== VENTES ============================== -->
      <b-tab title="Ventes" active>
        <h6>Ventes par produit</h6>
        <b-table small bordered responsive :items="L(recap.ventes.par_produit)" :fields="fProduit" show-empty empty-text="Aucune vente sur la période.">
          <template #cell(quantite)="d">{{ nb(d.value) }}</template>
          <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
        </b-table>

        <div class="row" v-if="aSection(recap.ventes.par_niveau_prix) || aSection(recap.ventes.par_utilisateur)">
          <div class="col-lg-6" v-if="aSection(recap.ventes.par_niveau_prix)">
            <h6 class="mt-3">Ventes par niveau de prix</h6>
            <b-table small bordered responsive :items="recap.ventes.par_niveau_prix" :fields="fNiveau">
              <template #cell(quantite)="d">{{ nb(d.value) }}</template>
              <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </div>
          <div class="col-lg-6" v-if="aSection(recap.ventes.par_utilisateur)">
            <h6 class="mt-3">Ventes par utilisateur (saisi par)</h6>
            <b-table small bordered responsive :items="recap.ventes.par_utilisateur" :fields="fUtilisateurVente">
              <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </div>
        </div>

        <template v-if="aSection(recap.ventes.par_client)">
          <h6 class="mt-3">Ventes par client</h6>
          <b-table small bordered responsive :items="recap.ventes.par_client" :fields="fClient">
            <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
            <template #cell(verse)="d">{{ fcfa(d.value) }}</template>
            <template #cell(reste)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>

        <template v-if="aSection(recap.ventes.liste_bl)">
          <h6 class="mt-3">Liste des bons de livraison et avoirs ({{ recap.ventes.liste_bl.length }})</h6>
          <b-table small bordered responsive striped :items="recap.ventes.liste_bl" :fields="fListeBl">
            <template #cell(date)="d">{{ dateFr(d.value) }}</template>
            <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
            <template #cell(verse)="d">{{ fcfa(d.value) }}</template>
            <template #cell(reste)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>
      </b-tab>

      <!-- =============================== CAISSE ============================= -->
      <b-tab title="Caisse">
        <div class="row">
          <div class="col-md-6">
            <h6>Encaissements par mode</h6>
            <b-table small bordered responsive :items="recap.encaissement.par_mode" :fields="fModes" show-empty empty-text="Aucun encaissement.">
              <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </div>
          <div class="col-md-6">
            <h6>Synthèse de caisse</h6>
            <table class="table table-sm table-bordered">
              <tbody>
                <tr><td>Encaissé auprès des clients ({{ recap.encaissement.clients.nb }})</td><td class="text-right">{{ fcfa(recap.encaissement.clients.total) }}</td></tr>
                <tr><td>Versé par les commerciaux ({{ recap.encaissement.commerciaux.nb }})</td><td class="text-right">{{ fcfa(recap.encaissement.commerciaux.total) }}</td></tr>
                <tr><td>Autres entrées de caisse ({{ recap.caisse.entrees.nb }})</td><td class="text-right">{{ fcfa(recap.caisse.entrees.total) }}</td></tr>
                <tr><td>Décaissements validés ({{ recap.caisse.sorties.nb }})</td><td class="text-right">{{ fcfa(recap.caisse.sorties.total) }}</td></tr>
                <tr><td>Solde de caisse en début de période</td><td class="text-right">{{ fcfa(recap.caisse.solde_debut) }}</td></tr>
                <tr class="font-weight-bold"><td>Solde de caisse en fin de période</td><td class="text-right">{{ fcfa(recap.caisse.solde_fin) }}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <template v-if="aSection(recap.caisse.par_utilisateur)">
          <h6 class="mt-3">Totaux par utilisateur</h6>
          <b-table small bordered responsive :items="recap.caisse.par_utilisateur" :fields="fUtilisateurCaisse">
            <template #cell(encaisse)="d">{{ fcfa(d.value) }}</template>
            <template #cell(entrees)="d">{{ fcfa(d.value) }}</template>
            <template #cell(sorties)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>

        <template v-if="aSection(recap.caisse.journal)">
          <h6 class="mt-3">Journal de caisse jour par jour</h6>
          <b-table small bordered responsive striped :items="recap.caisse.journal" :fields="fJournal">
            <template #cell(date)="d">{{ dateFr(d.value) }}</template>
            <template #cell(encaisse)="d">{{ montantOuTiret(d.value) }}</template>
            <template #cell(entrees)="d">{{ montantOuTiret(d.value) }}</template>
            <template #cell(sorties)="d">{{ montantOuTiret(d.value) }}</template>
            <template #cell(solde)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>

        <template v-if="aSection(recap.encaissement.liste)">
          <h6 class="mt-3">Liste des encaissements ({{ recap.encaissement.liste.length }})</h6>
          <b-table small bordered responsive striped :items="recap.encaissement.liste" :fields="fEncaissements">
            <template #cell(date)="d">{{ dateFr(d.value) }}</template>
            <template #cell(piece)="d">{{ d.value || '—' }}</template>
            <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>

        <template v-if="aSection(recap.caisse.mouvements)">
          <h6 class="mt-3">Entrées et sorties de caisse ({{ recap.caisse.mouvements.length }})</h6>
          <b-table small bordered responsive striped :items="recap.caisse.mouvements" :fields="fMouvementsCaisse">
            <template #cell(date)="d">{{ dateFr(d.value) }}</template>
            <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>
      </b-tab>

      <!-- ============================== CRÉANCES ============================ -->
      <b-tab title="Créances">
        <div class="row">
          <div class="col-md-6">
            <div class="small text-muted mb-1">Clients — {{ recap.creances.clients.nb }} débiteur(s), {{ fcfa(recap.creances.clients.total) }}</div>
            <b-table small bordered responsive :items="recap.creances.clients.liste" :fields="fSolde" show-empty empty-text="Aucune créance client.">
              <template #cell(solde)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </div>
          <div class="col-md-6">
            <div class="small text-muted mb-1">Commerciaux — {{ recap.creances.commerciaux.nb }} débiteur(s), {{ fcfa(recap.creances.commerciaux.total) }}</div>
            <b-table small bordered responsive :items="recap.creances.commerciaux.liste" :fields="fSolde" show-empty empty-text="Aucune créance commerciale.">
              <template #cell(solde)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </div>
        </div>

        <template v-if="recap.creances.anciennete">
          <h6 class="mt-3">Ancienneté des créances clients</h6>
          <b-table small bordered responsive :items="recap.creances.anciennete.tranches" :fields="fTranches">
            <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
          </b-table>
          <template v-if="aSection(recap.creances.anciennete.liste)">
            <h6 class="mt-3">BL impayés ({{ recap.creances.anciennete.liste.length }})</h6>
            <b-table small bordered responsive striped :items="recap.creances.anciennete.liste" :fields="fImpayes">
              <template #cell(date)="d">{{ dateFr(d.value) }}</template>
              <template #cell(reste)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </template>
        </template>

        <template v-if="aSection(recap.creances.depot_vente)">
          <h6 class="mt-3">Dépôt-vente par commercial</h6>
          <b-table small bordered responsive :items="recap.creances.depot_vente" :fields="fDepot">
            <template #cell(solde_debut)="d">{{ fcfa(d.value) }}</template>
            <template #cell(cede_kg)="d">{{ nb(d.value) }}</template>
            <template #cell(cede_montant)="d">{{ fcfa(d.value) }}</template>
            <template #cell(vendu_kg)="d">{{ nb(d.value) }}</template>
            <template #cell(retour_kg)="d">{{ nb(d.value) }}</template>
            <template #cell(verse)="d">{{ fcfa(d.value) }}</template>
            <template #cell(solde_fin)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>
      </b-tab>

      <!-- =============================== ACHATS ============================= -->
      <b-tab title="Achats">
        <p class="small text-muted mb-1">
          {{ recap.achats.nb }} approvisionnement(s) : {{ fcfa(recap.achats.total) }} — réglé : {{ fcfa(recap.achats.regle) }} —
          dette en fin de période : {{ fcfa(recap.achats.dette_fin) }}
        </p>
        <b-table small bordered responsive :items="recap.achats.par_fournisseur" :fields="fAchats" show-empty empty-text="Aucun achat sur la période.">
          <template #cell(montant)="d">{{ fcfa(d.value) }}</template>
        </b-table>

        <template v-if="aSection(recap.achats.dettes)">
          <h6 class="mt-3">Dettes par fournisseur en fin de période</h6>
          <b-table small bordered responsive :items="recap.achats.dettes" :fields="fDettes">
            <template #cell(achete)="d">{{ fcfa(d.value) }}</template>
            <template #cell(regle)="d">{{ fcfa(d.value) }}</template>
            <template #cell(dette)="d">{{ fcfa(d.value) }}</template>
          </b-table>
        </template>

        <template v-if="aSection(recap.achats.detail)">
          <h6 class="mt-3">Détail des approvisionnements</h6>
          <div v-for="a in recap.achats.detail" :key="a.code" class="border rounded p-2 mb-2">
            <div class="d-flex flex-wrap justify-content-between">
              <strong>{{ a.code }} — {{ a.fournisseur }}</strong>
              <span class="small text-muted">{{ dateFr(a.date) }} · saisi par {{ a.saisi_par }}</span>
            </div>
            <div class="small mb-1">Montant {{ fcfa(a.montant) }} · réglé {{ fcfa(a.regle) }} · reste {{ fcfa(a.reste) }}</div>
            <b-table small bordered responsive class="mb-0" :items="a.lignes" :fields="fLignesAppro">
              <template #cell(quantite)="d">{{ nb(d.value) }}</template>
              <template #cell(prix)="d">{{ fcfa(d.value) }}</template>
              <template #cell(total)="d">{{ fcfa(d.value) }}</template>
            </b-table>
          </div>
        </template>
      </b-tab>

      <!-- ================================ STOCK ============================= -->
      <b-tab title="Stock">
        <h6>Mouvements de stock de la période (kg)</h6>
        <b-table small bordered responsive :items="recap.stock.mouvements" :fields="fMouvements" show-empty empty-text="Aucun mouvement.">
          <template #cell(entrees)="d">{{ nb(d.value) }}</template>
          <template #cell(sorties)="d">{{ nb(d.value) }}</template>
          <template #cell(net)="d">{{ nb(d.value) }}</template>
        </b-table>

        <template v-if="aSection(recap.stock.mouvements_par_type)">
          <h6 class="mt-3">Mouvements par produit et par type (kg)</h6>
          <b-table small bordered responsive striped :items="recap.stock.mouvements_par_type" :fields="fParType">
            <template #cell(entrees)="d">{{ nb(d.value) }}</template>
            <template #cell(sorties)="d">{{ nb(d.value) }}</template>
            <template #cell(net)="d">{{ nb(d.value) }}</template>
          </b-table>
        </template>

        <h6 class="mt-3">Stock constaté à la clôture <small class="text-muted">(information — la clôture ne le modifie pas)</small></h6>
        <b-table small bordered responsive :items="recap.stock.stock_a_la_cloture" :fields="fStock">
          <template #cell(quantite)="d">{{ nb(d.value) }}</template>
          <template #cell(emballe)="d">{{ nb(d.value) }}</template>
        </b-table>

        <template v-if="recap.stock.valorisation">
          <h6 class="mt-3">Valorisation du stock <small class="text-muted">(quantité en stock × prix de vente)</small></h6>
          <b-table small bordered responsive :items="recap.stock.valorisation.lignes" :fields="fValo">
            <template #cell(quantite)="d">{{ nb(d.value) }}</template>
            <template #cell(prix_detail)="d">{{ fcfa(d.value) }}</template>
            <template #cell(valeur_detail)="d">{{ fcfa(d.value) }}</template>
            <template #cell(prix_gros)="d">{{ fcfa(d.value) }}</template>
            <template #cell(valeur_gros)="d">{{ fcfa(d.value) }}</template>
          </b-table>
          <p class="small mb-0">Total : <strong>{{ fcfa(recap.stock.valorisation.total_detail) }}</strong> au prix détail — <strong>{{ fcfa(recap.stock.valorisation.total_gros) }}</strong> au prix gros.</p>
        </template>
      </b-tab>

      <!-- ================================ USINE ============================= -->
      <b-tab title="Usine et demandes" v-if="recap.production || recap.demandes">
        <template v-if="recap.production">
          <h6>Production de l'usine — {{ recap.production.nb_transformations }} transformation(s)</h6>
          <b-table small bordered responsive :items="recap.production.par_etape" :fields="fEtapes" show-empty empty-text="Aucune transformation sur la période.">
            <template #cell(entree)="d">{{ nb(d.value) }}</template>
            <template #cell(sortie)="d">{{ nb(d.value) }}</template>
            <template #cell(perte)="d">{{ nb(d.value) }}</template>
            <template #cell(perte_pct)="d">{{ nb(d.value) }} %</template>
          </b-table>

          <template v-if="aSection(recap.production.lots)">
            <h6 class="mt-3">Lots de la période</h6>
            <b-table small bordered responsive striped :items="recap.production.lots" :fields="fLots">
              <template #cell(debut)="d">{{ dateFr(d.value) }}</template>
              <template #cell(fin)="d">{{ d.value ? dateFr(d.value) : '—' }}</template>
              <template #cell(entree)="d">{{ nb(d.value) }}</template>
              <template #cell(sortie)="d">{{ nb(d.value) }}</template>
              <template #cell(perte)="d">{{ nb(d.value) }}</template>
              <template #cell(perte_pct)="d">{{ nb(d.value) }} %</template>
            </b-table>
          </template>
        </template>

        <template v-if="recap.demandes">
          <h6 class="mt-3">Demandes de stock usine → magasin — {{ recap.demandes.nb }} demande(s)</h6>
          <b-table small bordered responsive striped :items="recap.demandes.liste" :fields="fDemandes" show-empty empty-text="Aucune demande sur la période.">
            <template #cell(date)="d">{{ dateFr(d.value) }}</template>
            <template #cell(livraison)="d">{{ d.value ? dateFr(d.value) : '—' }}</template>
            <template #cell(demande)="d">{{ nb(d.value) }}</template>
            <template #cell(livre)="d">{{ nb(d.value) }}</template>
          </b-table>
          <b-table v-if="aSection(recap.demandes.par_produit)" small bordered responsive :items="recap.demandes.par_produit" :fields="fDemandesProduit">
            <template #cell(demande)="d">{{ nb(d.value) }}</template>
            <template #cell(livre)="d">{{ nb(d.value) }}</template>
          </b-table>
        </template>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import StatCard from '@/components/ui/StatCard.vue'
import moment from 'moment'

const droite = 'text-right'

export default {
  name: 'ClotureRecap',
  components: { StatCard },
  props: { recap: { type: Object, required: true } },
  data() {
    return {
      fProduit: [
        { key: 'libelle', label: 'Produit' },
        { key: 'quantite', label: 'Quantité', class: droite },
        { key: 'montant', label: 'Montant', class: droite },
      ],
      fNiveau: [
        { key: 'niveau', label: 'Niveau de prix' },
        { key: 'nb_bl', label: 'BL', class: droite },
        { key: 'quantite', label: 'Quantité', class: droite },
        { key: 'montant', label: 'Montant', class: droite },
      ],
      fUtilisateurVente: [
        { key: 'utilisateur', label: 'Saisi par' },
        { key: 'nb_bl', label: 'BL', class: droite },
        { key: 'montant', label: 'Montant net', class: droite },
      ],
      fClient: [
        { key: 'client', label: 'Client' },
        { key: 'nb_bl', label: 'BL', class: droite },
        { key: 'montant', label: 'Montant net', class: droite },
        { key: 'verse', label: 'Versé', class: droite },
        { key: 'reste', label: 'Reste dû', class: droite },
      ],
      fListeBl: [
        { key: 'numero', label: 'N°' },
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'client', label: 'Client' },
        { key: 'montant', label: 'Montant', class: droite },
        { key: 'verse', label: 'Versé', class: droite },
        { key: 'reste', label: 'Reste', class: droite },
        { key: 'saisi_par', label: 'Saisi par' },
      ],
      fModes: [
        { key: 'mode', label: 'Mode de paiement' },
        { key: 'montant', label: 'Montant', class: droite },
      ],
      fUtilisateurCaisse: [
        { key: 'utilisateur', label: 'Utilisateur' },
        { key: 'encaisse', label: 'Encaissé', class: droite },
        { key: 'entrees', label: 'Entrées', class: droite },
        { key: 'sorties', label: 'Sorties validées', class: droite },
      ],
      fJournal: [
        { key: 'date', label: 'Jour' },
        { key: 'encaisse', label: 'Encaissé', class: droite },
        { key: 'entrees', label: 'Entrées', class: droite },
        { key: 'sorties', label: 'Sorties', class: droite },
        { key: 'solde', label: 'Solde fin de journée', class: droite },
      ],
      fEncaissements: [
        { key: 'recu', label: 'Reçu' },
        { key: 'date', label: 'Date' },
        { key: 'canal', label: 'Canal' },
        { key: 'tiers', label: 'Client / commercial' },
        { key: 'piece', label: 'BL' },
        { key: 'mode', label: 'Mode' },
        { key: 'montant', label: 'Montant', class: droite },
        { key: 'saisi_par', label: 'Saisi par' },
      ],
      fMouvementsCaisse: [
        { key: 'date', label: 'Date' },
        { key: 'sens', label: 'Sens' },
        { key: 'reference', label: 'Référence' },
        { key: 'libelle', label: 'Libellé' },
        { key: 'montant', label: 'Montant', class: droite },
        { key: 'statut', label: 'Statut' },
        { key: 'saisi_par', label: 'Saisi par' },
      ],
      fSolde: [
        { key: 'nom', label: 'Nom' },
        { key: 'solde', label: 'Solde', class: droite },
      ],
      fTranches: [
        { key: 'tranche', label: 'Ancienneté' },
        { key: 'nb', label: 'BL', class: droite },
        { key: 'montant', label: 'Reste dû', class: droite },
      ],
      fImpayes: [
        { key: 'numero', label: 'BL' },
        { key: 'date', label: 'Date' },
        { key: 'client', label: 'Client' },
        { key: 'age_jours', label: 'Jours', class: droite },
        { key: 'reste', label: 'Reste dû', class: droite },
        { key: 'saisi_par', label: 'Saisi par' },
      ],
      fDepot: [
        { key: 'commercial', label: 'Commercial' },
        { key: 'solde_debut', label: 'Solde début', class: droite },
        { key: 'cede_kg', label: 'Cédé (kg)', class: droite },
        { key: 'cede_montant', label: 'Cédé (montant)', class: droite },
        { key: 'vendu_kg', label: 'Vendu déclaré (kg)', class: droite },
        { key: 'retour_kg', label: 'Retours (kg)', class: droite },
        { key: 'verse', label: 'Versé', class: droite },
        { key: 'solde_fin', label: 'Solde fin', class: droite },
      ],
      fAchats: [
        { key: 'nom', label: 'Fournisseur' },
        { key: 'nb', label: 'Achats', class: droite },
        { key: 'montant', label: 'Montant', class: droite },
      ],
      fDettes: [
        { key: 'nom', label: 'Fournisseur' },
        { key: 'achete', label: 'Acheté (cumul)', class: droite },
        { key: 'regle', label: 'Réglé (cumul)', class: droite },
        { key: 'dette', label: 'Dette', class: droite },
      ],
      fLignesAppro: [
        { key: 'produit', label: 'Produit' },
        { key: 'quantite', label: 'Quantité', class: droite },
        { key: 'prix', label: 'Prix d\'achat', class: droite },
        { key: 'total', label: 'Total', class: droite },
      ],
      fMouvements: [
        { key: 'libelle', label: 'Produit' },
        { key: 'entrees', label: 'Entrées', class: droite },
        { key: 'sorties', label: 'Sorties', class: droite },
        { key: 'net', label: 'Variation', class: droite },
      ],
      fParType: [
        { key: 'libelle', label: 'Produit' },
        { key: 'type', label: 'Type' },
        { key: 'nb', label: 'Nb', class: droite },
        { key: 'entrees', label: 'Entrées', class: droite },
        { key: 'sorties', label: 'Sorties', class: droite },
        { key: 'net', label: 'Variation', class: droite },
      ],
      fStock: [
        { key: 'libelle', label: 'Produit' },
        { key: 'quantite', label: 'Stock', class: droite },
        { key: 'emballe', label: 'Emballé', class: droite },
      ],
      fValo: [
        { key: 'libelle', label: 'Produit' },
        { key: 'quantite', label: 'Stock (kg)', class: droite },
        { key: 'prix_detail', label: 'Prix détail', class: droite },
        { key: 'valeur_detail', label: 'Valeur détail', class: droite },
        { key: 'prix_gros', label: 'Prix gros', class: droite },
        { key: 'valeur_gros', label: 'Valeur gros', class: droite },
      ],
      fEtapes: [
        { key: 'etape', label: 'Étape' },
        { key: 'nb', label: 'Nb', class: droite },
        { key: 'entree', label: 'Entrée (kg)', class: droite },
        { key: 'sortie', label: 'Obtenu (kg)', class: droite },
        { key: 'perte', label: 'Perte (kg)', class: droite },
        { key: 'perte_pct', label: 'Perte', class: droite },
      ],
      fLots: [
        { key: 'code', label: 'Lot' },
        { key: 'produit', label: 'Produit' },
        { key: 'statut', label: 'Statut' },
        { key: 'debut', label: 'Début' },
        { key: 'fin', label: 'Fin' },
        { key: 'entree', label: 'Entrée (kg)', class: droite },
        { key: 'sortie', label: 'Obtenu (kg)', class: droite },
        { key: 'perte', label: 'Perte (kg)', class: droite },
        { key: 'perte_pct', label: 'Perte', class: droite },
        { key: 'saisi_par', label: 'Saisi par' },
      ],
      fDemandes: [
        { key: 'code', label: 'Demande' },
        { key: 'date', label: 'Date' },
        { key: 'statut', label: 'Statut' },
        { key: 'livraison', label: 'Livrée le' },
        { key: 'demande', label: 'Demandé (kg)', class: droite },
        { key: 'livre', label: 'Livré (kg)', class: droite },
        { key: 'saisi_par', label: 'Saisi par' },
      ],
      fDemandesProduit: [
        { key: 'libelle', label: 'Produit' },
        { key: 'demande', label: 'Demandé (kg)', class: droite },
        { key: 'livre', label: 'Livré (kg)', class: droite },
      ],
    }
  },
  methods: {
    // Les récapitulatifs figés avant l'ajout d'une section n'ont pas cette clé : on tolère.
    L(v) { return Array.isArray(v) ? v : [] },
    aSection(v) { return Array.isArray(v) && v.length > 0 },
    dateFr(d) { return d ? moment(d).format('DD/MM/YYYY') : '' },
    nb(v) { return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) },
    fcfa(v) { return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA' },
    montantOuTiret(v) { return Number(v || 0) === 0 ? '—' : this.fcfa(v) },
  },
}
</script>
