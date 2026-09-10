<template>
  <div class="container-fluid p-3">
    <PageHeader title="Demandes" subtitle="Transfert de produit fini usine → responsable" crumb="Production">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchDemandes">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" v-if="peutCreer" @click="ouvrirCreation">
          <i class="fas fa-plus mr-1"></i> Nouvelle demande
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4" v-if="apercuStock.length">
      <div class="card-header py-3">
        Stock emballé à l'usine &amp; demandes en cours
        <small class="text-muted font-weight-normal">— ce qui est disponible pour transfert vers le responsable</small>
      </div>
      <div class="card-body">
        <b-table
            head-variant="light" bordered hover responsive small
            :items="apercuStock" :fields="champsApercu"
            show-empty empty-text="Aucun produit">
          <template v-slot:cell(emballe_dispo)="row">{{ nf(row.item.emballe_dispo) }}</template>
          <template v-slot:cell(demande)="row">{{ nf(row.item.demande) }}</template>
          <template v-slot:cell(livre)="row">{{ nf(row.item.livre) }}</template>
          <template v-slot:cell(reste_a_livrer)="row">{{ nf(row.item.reste_a_livrer) }}</template>
          <template v-slot:cell(etat)="row">
            <b-badge v-if="row.item.reste_a_livrer === 0" variant="secondary">rien à livrer</b-badge>
            <b-badge v-else-if="row.item.manque === 0" variant="success">suffisant</b-badge>
            <b-badge v-else variant="danger">manque {{ nf(row.item.manque) }} kg</b-badge>
          </template>
        </b-table>
      </div>
    </div>

    <div class="card shadow mb-4">
      <div class="card-header py-3">Liste des demandes</div>
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center mb-2" style="gap:.5rem">
          <b-form-input type="search" v-model="filtre" placeholder="Rechercher (code)…" style="max-width:260px"></b-form-input>
          <search-select v-model="filtreStatut" :options="statutFiltreOptions" placeholder="Tous les statuts" clearable style="min-width:200px"></search-select>
        </div>
        <b-table
            bordered
            hover
            responsive="xl"
            :items="demandesFiltrees"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
          <template v-slot:cell(statut)="row">
            <span class="badge" :class="statutClasse(row.item.statut)">{{ statutLabel(row.item.statut) }}</span>
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-secondary" class="mr-1" @click="ouvrirConsultation(row.item)">
              Consulter
            </b-button>
            <b-button size="sm" variant="outline-primary" class="mr-1" @click="ouvrirLivraison(row.item)" v-if="peutLivrer && row.item.statut !== 3">
              Traiter / livrer
            </b-button>
            <b-button size="sm" variant="outline-secondary" @click="imprimerTransfert(row.item)" v-if="row.item.statut !== 1" title="Bon de transfert">
              <i class="fas fa-print"></i>
            </b-button>
          </template>
        </b-table>
        <b-pagination
            v-if="demandesFiltrees.length > perPage"
            v-model="currentPage"
            :total-rows="demandesFiltrees.length"
            :per-page="perPage"
            align="right" size="sm" class="mt-2 mb-0"></b-pagination>
      </div>
    </div>

    <b-modal ref="modalCreation" hide-footer title="Nouvelle demande" size="lg">
      <b-form-group label="Date de la demande">
        <b-form-datepicker locale="fr-FR" v-model="dateDemande"></b-form-datepicker>
      </b-form-group>

      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Emballé dispo à l'usine (kg)</th>
          <th>Quantité demandée (kg)</th>
          <th></th>
        </tr>
        <tr v-for="(ligne, index) in lignesCreation" :key="index">
          <td style="min-width:220px;">
            <search-select v-model="ligne.code_produit" :options="produitOptions"></search-select>
          </td>
          <td class="align-middle">
            <span v-if="ligne.code_produit">{{ nf(emballeDispo(ligne.code_produit)) }}</span>
            <span v-else class="text-muted">—</span>
          </td>
          <td>
            <b-form-input type="number" min="1" v-model="ligne.quantite_demandee"></b-form-input>
          </td>
          <td>
            <b-button size="sm" variant="danger" @click="lignesCreation.splice(index, 1)">
              <i class="fas fa-trash"></i>
            </b-button>
          </td>
        </tr>
      </table>

      <b-button variant="outline-primary" class="mb-3" @click="lignesCreation.push({ code_produit: null, quantite_demandee: 1 })">
        <i class="fas fa-plus mr-1"></i> Ajouter une ligne
      </b-button>

      <b-button variant="success" block :disabled="Loading" @click="creerDemande">Envoyer la demande</b-button>
    </b-modal>

    <b-modal ref="modalLivraison" hide-footer :title="'Livraison — ' + (demandeSelectionnee ? demandeSelectionnee.code_demande : '')" size="lg">
      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Demandé (kg)</th>
          <th>Déjà livré (kg)</th>
          <th>Emballé dispo (kg)</th>
          <th>À livrer maintenant (kg)</th>
        </tr>
        <tr v-for="(ligne, index) in lignesLivraison" :key="index">
          <td>{{ ligne.libelle_produit }}</td>
          <td>{{ ligne.quantite_demandee }}</td>
          <td>{{ ligne.quantite_livree }}</td>
          <td :class="{ 'text-danger font-weight-bold': Number(ligne.emballe_dispo) < (ligne.quantite_demandee - ligne.quantite_livree) }">
            {{ ligne.emballe_dispo }}
          </td>
          <td>
            <b-form-input
                type="number" min="0"
                :max="Math.min(ligne.quantite_demandee - ligne.quantite_livree, Number(ligne.emballe_dispo))"
                v-model="ligne.a_livrer"></b-form-input>
          </td>
        </tr>
      </table>

      <b-button variant="success" block :disabled="Loading" @click="confirmerLivraison">Confirmer la livraison</b-button>
    </b-modal>

    <b-modal ref="modalConsultation" hide-footer ok-only :title="'Demande — ' + (demandeConsultee ? demandeConsultee.code_demande : '')" size="lg">
      <p v-if="demandeConsultee" class="text-muted">
        Statut : <strong>{{ statutLabel(demandeConsultee.statut) }}</strong>
        &nbsp;·&nbsp; Date : {{ demandeConsultee.date_demande | dateFr }}
      </p>
      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Demandé (kg)</th>
          <th>Livré (kg)</th>
        </tr>
        <tr v-for="(ligne, index) in lignesConsultation" :key="index">
          <td>{{ ligne.libelle_produit }}</td>
          <td>{{ ligne.quantite_demandee }}</td>
          <td>{{ ligne.quantite_livree }}</td>
        </tr>
        <tr v-if="!lignesConsultation.length">
          <td colspan="3" class="text-muted text-center">Aucune ligne.</td>
        </tr>
      </table>
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

const STATUTS = {
  1: { label: 'En attente', classe: 'badge-secondary' },
  2: { label: 'En préparation', classe: 'badge-warning' },
  3: { label: 'Livrée', classe: 'badge-success' },
  4: { label: 'Annulée', classe: 'badge-danger' },
}

export default {
  name: "demandes-index",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      demandes: [],
      produits: [],
      dateDemande: moment().format('YYYY-MM-DD'),
      lignesCreation: [{ code_produit: null, quantite_demandee: 1 }],
      demandeSelectionnee: null,
      lignesLivraison: [],
      demandeConsultee: null,
      lignesConsultation: [],
      apercuStock: [],
      currentPage: 1,
      perPage: 10,
      filtre: '',
      filtreStatut: null,
      statutFiltreOptions: [
        { value: 1, text: 'En attente' },
        { value: 2, text: 'En préparation' },
        { value: 3, text: 'Livrée' },
        { value: 4, text: 'Annulée' },
      ],
      fields: [
        { key: 'code_demande', label: 'Code' },
        { key: 'date_demande', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'statut', label: 'Statut' },
        { key: 'actions' },
      ],
      champsApercu: [
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'emballe_dispo', label: 'Emballé dispo', class: 'text-right' },
        { key: 'demande', label: 'Demandé (en cours)', class: 'text-right' },
        { key: 'livre', label: 'Déjà livré', class: 'text-right' },
        { key: 'reste_a_livrer', label: 'Reste à livrer', class: 'text-right' },
        { key: 'etat', label: 'État' },
      ],
    }
  },
  computed: {
    demandesFiltrees() {
      const q = (this.filtre || '').toLowerCase().trim()
      return this.demandes.filter(d => {
        if (this.filtreStatut && Number(d.statut) !== Number(this.filtreStatut)) return false
        if (q && !String(d.code_demande || '').toLowerCase().includes(q)) return false
        return true
      })
    },
    peutCreer() {
      return hasPermission('demandes_creer')
    },
    peutLivrer() {
      return hasPermission('demandes_livrer')
    },
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Number(v) || 0)
    },
    emballeDispo(code) {
      const r = this.apercuStock.find(x => x.code_produit === code)
      return r ? r.emballe_dispo : 0
    },
    statutLabel(statut) {
      return (STATUTS[statut] || {}).label || 'Inconnu'
    },
    statutClasse(statut) {
      return (STATUTS[statut] || {}).classe || 'badge-secondary'
    },
    ouvrirCreation() {
      this.dateDemande = moment().format('YYYY-MM-DD')
      this.lignesCreation = [{ code_produit: null, quantite_demandee: 1 }]
      this.fetchApercuStock()
      this.$refs.modalCreation.show()
    },
    async creerDemande() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        date_demande: this.dateDemande,
        lignes: this.lignesCreation.filter(l => l.code_produit && l.quantite_demandee > 0),
      }
      await axios.post(`${API_BASE_URL}/api/demandes`, data).then(response => {
        this.$bvToast.toast('Demande envoyée : ' + response.data.code_demande, { title: 'Demande', variant: 'success', solid: true })
        this.$refs.modalCreation.hide()
        this.fetchDemandes()
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de l\'envoi.', { title: 'Demande', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async ouvrirConsultation(demande) {
      this.demandeConsultee = demande
      this.lignesConsultation = []
      await axios.get(`${API_BASE_URL}/api/demandes/${demande.code_demande}/lignes`).then(response => {
        this.lignesConsultation = response.data
      }).catch((err) => console.log(err))
      this.$refs.modalConsultation.show()
    },
    imprimerTransfert(demande) {
      imprimerDocument('transfert', demande.code_demande)
    },
    async ouvrirLivraison(demande) {
      this.demandeSelectionnee = demande
      await axios.get(`${API_BASE_URL}/api/demandes/${demande.code_demande}/lignes`).then(response => {
        this.lignesLivraison = response.data.map(l => ({ ...l, a_livrer: 0 }))
      }).catch((err) => console.log(err))
      this.$refs.modalLivraison.show()
    },
    async confirmerLivraison() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        lignes: this.lignesLivraison
          .filter(l => Number(l.a_livrer) > 0)
          .map(l => ({ code_produit: l.code_produit, quantite_livree: Number(l.a_livrer) })),
      }
      const code = this.demandeSelectionnee.code_demande
      await axios.post(`${API_BASE_URL}/api/demandes/${code}/livrer`, data).then(() => {
        this.$bvToast.toast('Livraison enregistrée.', { title: 'Demande', variant: 'success', solid: true })
        this.$refs.modalLivraison.hide()
        this.fetchDemandes()
        this.fetchApercuStock()
        imprimerDocument('transfert', code)
      }).catch((err) => {
        console.log(err)
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la livraison.'
        this.$bvToast.toast(msg, { title: 'Demande', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchDemandes() {
      await axios.get(`${API_BASE_URL}/api/demandes`).then(response => {
        this.demandes = response.data
      }).catch((err) => console.log(err))
    },
    async fetchApercuStock() {
      await axios.get(`${API_BASE_URL}/api/demandes-apercu-stock`).then(response => {
        this.apercuStock = response.data
      }).catch((err) => console.log(err))
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(response => {
        this.produits = response.data.element
      }).catch((err) => console.log(err))
    },
  },
  watch: {
    filtre() { this.currentPage = 1 },
    filtreStatut() { this.currentPage = 1 },
  },
  created() {
    this.fetchDemandes()
    this.fetchProduits()
    this.fetchApercuStock()
  },
}
</script>

<style scoped>
</style>
