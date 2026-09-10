<template>
  <div class="container-fluid p-3">
    <PageHeader title="Dépôt-vente" subtitle="Cessions de stock au commercial — remboursement par versements à la Caisse" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchCommerciaux">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" v-if="peutCeder" @click="ouvrirCession">
          <i class="fas fa-plus mr-1"></i> Nouvelle cession
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-header py-3">Soldes des commerciaux</div>
      <div class="card-body">
        <b-form-input type="search" v-model="filtre" placeholder="Rechercher un commercial…" class="mb-2" style="max-width:320px"></b-form-input>
        <b-table
            bordered hover responsive="xl"
            :items="commerciauxFiltres" :fields="fields"
            :per-page="perPage" :current-page="currentPage"
            show-empty empty-text="Aucun commercial.">
          <template v-slot:cell(type)="row">
            <b-badge :variant="row.item.type === 'equipe' ? 'info' : 'secondary'">
              {{ row.item.type === 'equipe' ? 'Équipe' : 'Personne' }}
            </b-badge>
          </template>
          <template v-slot:cell(reste_a_verser)="row">
            <span class="font-weight-bold" :class="row.item.reste_a_verser > 0 ? 'text-danger' : 'text-success'">
              {{ nf(row.item.reste_a_verser || 0) }} FCFA
            </span>
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-primary" @click="voirHistorique(row.item)">Historique</b-button>
          </template>
        </b-table>
        <b-pagination
            v-if="commerciauxFiltres.length > perPage"
            v-model="currentPage" :total-rows="commerciauxFiltres.length" :per-page="perPage"
            align="right" size="sm" class="mt-2 mb-0"></b-pagination>
      </div>
    </div>

    <!-- Nouvelle cession -->
    <b-modal ref="modalCession" hide-footer title="Nouvelle cession de stock" size="lg">
      <b-form-group label="Commercial">
        <search-select v-model="commercialIdCession" :options="commercialOptions"></search-select>
      </b-form-group>
      <b-form-group label="Date">
        <b-form-datepicker locale="fr-FR" v-model="dateCession"></b-form-datepicker>
      </b-form-group>

      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Dispo (kg)</th>
          <th>Quantité</th>
          <th>Prix gros</th>
          <th>Total</th>
          <th></th>
        </tr>
        <tr v-for="(ligne, index) in lignesCession" :key="index">
          <td style="min-width:220px;">
            <search-select v-model="ligne.code_produit" :options="produitOptions"></search-select>
          </td>
          <td class="align-middle">
            <span v-if="ligne.code_produit" :class="{ 'text-danger': Number(ligne.quantite) > dispo(ligne.code_produit) }">
              {{ nf(dispo(ligne.code_produit)) }}
            </span>
            <span v-else class="text-muted">—</span>
          </td>
          <td>
            <b-form-input type="number" min="1" :max="dispo(ligne.code_produit)" v-model="ligne.quantite"></b-form-input>
          </td>
          <td class="align-middle">{{ nf(prixGros(ligne.code_produit)) }} FCFA</td>
          <td class="font-weight-bold text-right align-middle">
            {{ nf((ligne.quantite || 0) * prixGros(ligne.code_produit)) }} FCFA
          </td>
          <td class="align-middle">
            <b-button size="sm" variant="danger" @click="lignesCession.splice(index, 1)">
              <i class="fas fa-trash"></i>
            </b-button>
          </td>
        </tr>
      </table>

      <b-button variant="outline-primary" class="mb-3" @click="lignesCession.push({ code_produit: null, quantite: 1 })">
        <i class="fas fa-plus mr-1"></i> Ajouter une ligne
      </b-button>

      <div class="text-right mb-3">
        <h5 class="text-uppercase text-danger font-weight-bolder">TOTAL : {{ nf(totalCession) }} FCFA</h5>
      </div>
      <p class="text-muted small">Ce montant devient la dette du commercial ; il la rembourse par versements à la Caisse au fur et à mesure qu'il vend.</p>

      <b-button variant="success" block :disabled="Loading || !peutValiderCession" @click="validerCession">Céder le stock</b-button>
    </b-modal>

    <!-- Historique -->
    <b-modal ref="modalHistorique" hide-footer :title="'Historique — ' + nomCommercialSelectionne" size="lg">
      <b-row class="align-items-end mb-3">
        <b-col cols="4"><label class="small mb-1">Du</label>
          <b-form-datepicker size="sm" locale="fr-FR" v-model="releveDebut"></b-form-datepicker></b-col>
        <b-col cols="4"><label class="small mb-1">Au</label>
          <b-form-datepicker size="sm" locale="fr-FR" v-model="releveFin"></b-form-datepicker></b-col>
        <b-col cols="4">
          <b-button size="sm" variant="primary" block @click="imprimerReleve">
            <i class="fas fa-print mr-1"></i> Relevé de compte
          </b-button>
        </b-col>
      </b-row>

      <h6>Cessions de stock</h6>
      <b-table bordered hover small :items="prisesHistorique" :fields="fieldsPrises">
        <template v-slot:cell(montant_total)="row">{{ nf(row.item.montant_total) }} FCFA</template>
        <template v-slot:cell(actions)="row">
          <b-button size="sm" variant="outline-primary" class="mr-1" @click="consulterLignes(row.item)">Consulter</b-button>
          <b-button size="sm" variant="outline-secondary" @click="imprimerCession(row.item)" title="Bon de cession">
            <i class="fas fa-print"></i>
          </b-button>
        </template>
      </b-table>

      <h6 class="mt-4">Versements</h6>
      <b-table bordered hover small :items="versementsHistorique" :fields="fieldsVersements" show-empty empty-text="Aucun versement.">
        <template v-slot:cell(mode_paiement)="row">{{ modePaiementLabel(row.item.mode_paiement) }}</template>
        <template v-slot:cell(montant)="row">{{ nf(row.item.montant) }} FCFA</template>
      </b-table>
    </b-modal>

    <!-- Lignes d'une cession -->
    <b-modal ref="modalLignes" hide-footer ok-only :title="lignesTitre" size="lg">
      <b-table bordered hover small :items="lignesConsultees" :fields="fieldsLignes" show-empty empty-text="Aucune ligne.">
        <template v-slot:cell(prix_unitaire)="row">{{ nf(row.item.prix_unitaire) }} FCFA</template>
        <template v-slot:cell(montant_ligne)="row">{{ nf(row.item.montant_ligne) }} FCFA</template>
      </b-table>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";
import { hasPermission } from "@/utils/permissions";
import { imprimerDocument } from "@/utils/print.js";

const MODE_PAIEMENT = { 1: 'Espèces', 2: 'Mobile money', 3: 'Chèque', 4: 'Virement' }

export default {
  name: "commercial-prises-index",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      commerciauxBruts: [],
      commerciaux: [],
      currentPage: 1,
      perPage: 10,
      filtre: '',
      produits: [],
      commercialIdCession: null,
      dateCession: moment().format('YYYY-MM-DD'),
      lignesCession: [{ code_produit: null, quantite: 1 }],
      commercialSelectionne: null,
      releveDebut: moment().startOf('year').format('YYYY-MM-DD'),
      releveFin: moment().format('YYYY-MM-DD'),
      prisesHistorique: [],
      versementsHistorique: [],
      lignesConsultees: [],
      lignesTitre: '',
      fields: [
        { key: 'nom', label: 'Nom / libellé', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'reste_a_verser', label: 'Reste à verser', sortable: true },
        { key: 'actions' },
      ],
      fieldsPrises: [
        { key: 'code_prise', label: 'Code' },
        { key: 'date_prise', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'montant_total', label: 'Montant' },
        { key: 'actions', label: '' },
      ],
      fieldsVersements: [
        { key: 'date_versement', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'mode_paiement', label: 'Mode' },
        { key: 'montant', label: 'Montant' },
      ],
      fieldsLignes: [
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'quantite', label: 'Quantité' },
        { key: 'prix_unitaire', label: 'Prix gros' },
        { key: 'montant_ligne', label: 'Total' },
      ],
    }
  },
  computed: {
    commerciauxFiltres() {
      const q = (this.filtre || '').toLowerCase().trim()
      if (!q) return this.commerciaux
      return this.commerciaux.filter(c => String(c.nom || '').toLowerCase().includes(q))
    },
    peutCeder() {
      return hasPermission('commercial_prises_creer')
    },
    commercialOptions() {
      return this.commerciauxBruts.map(c => ({ value: c.id, text: c.nom }))
    },
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    totalCession() {
      return this.lignesCession.reduce((t, l) => t + (l.quantite || 0) * this.prixGros(l.code_produit), 0)
    },
    peutValiderCession() {
      return this.commercialIdCession && this.lignesCession.some(l =>
        l.code_produit && Number(l.quantite) > 0 && Number(l.quantite) <= this.dispo(l.code_produit))
    },
    nomCommercialSelectionne() {
      return this.commercialSelectionne ? (this.commercialSelectionne.nom || '') : ''
    },
  },
  watch: {
    filtre() { this.currentPage = 1 },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    modePaiementLabel(v) {
      return MODE_PAIEMENT[v] || '—'
    },
    prixGros(code) {
      const p = this.produits.find(x => x.code_produit === code)
      return p ? Number(p.prix_gros) || 0 : 0
    },
    dispo(code) {
      const p = this.produits.find(x => x.code_produit === code)
      return p ? Number(p.quantite_produit) || 0 : 0
    },
    ouvrirCession() {
      this.commercialIdCession = null
      this.dateCession = moment().format('YYYY-MM-DD')
      this.lignesCession = [{ code_produit: null, quantite: 1 }]
      this.$refs.modalCession.show()
    },
    async validerCession() {
      if (this.Loading || !this.peutValiderCession) return
      this.Loading = true
      const data = {
        commercial_id: this.commercialIdCession,
        date_prise: this.dateCession,
        lignes: this.lignesCession.filter(l => l.code_produit && l.quantite > 0),
      }
      await axios.post(`${API_BASE_URL}/api/commercial-prises`, data).then(response => {
        this.$bvToast.toast('Cession enregistrée : ' + response.data.code_prise, { title: 'Cession', variant: 'success', solid: true })
        this.$refs.modalCession.hide()
        this.fetchCommerciaux()
        this.fetchProduits()
        imprimerDocument('cession', response.data.code_prise)
      }).catch((err) => {
        console.log(err)
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la cession.'
        this.$bvToast.toast(msg, { title: 'Cession', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    imprimerCession(prise) {
      imprimerDocument('cession', prise.code_prise)
    },
    imprimerReleve() {
      if (!this.commercialSelectionne) return
      imprimerDocument('releve_commercial', this.commercialSelectionne.id, this.releveDebut, this.releveFin)
    },
    async voirHistorique(commercial) {
      this.commercialSelectionne = commercial
      await axios.get(`${API_BASE_URL}/api/commercial-prises`, { params: { commercial_id: commercial.id } }).then(r => {
        this.prisesHistorique = r.data
      }).catch(e => console.log(e))
      await axios.get(`${API_BASE_URL}/api/commercial-versements`, { params: { commercial_id: commercial.id } }).then(r => {
        this.versementsHistorique = r.data
      }).catch(e => console.log(e))
      this.$refs.modalHistorique.show()
    },
    async consulterLignes(prise) {
      this.lignesTitre = 'Cession ' + prise.code_prise
      this.lignesConsultees = []
      await axios.get(`${API_BASE_URL}/api/commercial-prises/${prise.code_prise}/lignes`).then(r => {
        this.lignesConsultees = r.data
      }).catch(e => console.log(e))
      this.$refs.modalLignes.show()
    },
    async fetchCommerciaux() {
      await axios.get(`${API_BASE_URL}/api/commerciaux`).then(async response => {
        const liste = response.data
        this.commerciauxBruts = liste
        for (const c of liste) {
          try {
            const solde = await axios.get(`${API_BASE_URL}/api/commercial/${c.id}/solde`)
            c.reste_a_verser = solde.data.reste_a_verser
          } catch (e) {
            c.reste_a_verser = 0
          }
        }
        this.commerciaux = liste
      }).catch((err) => console.log(err))
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(response => {
        this.produits = response.data.element
      }).catch((err) => console.log(err))
    },
  },
  created() {
    this.fetchCommerciaux()
    this.fetchProduits()
  },
}
</script>

<style scoped>
</style>
