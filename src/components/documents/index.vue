<template>
  <div class="container-fluid p-3">
    <PageHeader title="Archive" subtitle="Factures et bons de livraison par client" crumb="Suivi" />


    <!-- Sélection -->
    <div class="card shadow mb-4">
      <div class="card-header py-3 text-uppercase font-weight-bold">
        <i class="fas fa-filter mr-2 text-primary"></i> Critères de sélection
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-12 mb-3">
            <label class="obf-field-label"><i class="fas fa-users mr-1"></i> Clients</label>
            <b-form-radio-group v-model="modeClients" buttons button-variant="outline-primary" size="sm" class="d-block mb-2">
              <b-form-radio value="tous">Tous les clients</b-form-radio>
              <b-form-radio value="choisir">Choisir les clients</b-form-radio>
            </b-form-radio-group>
            <v-select
              v-if="modeClients === 'choisir'"
              multiple
              v-model="clients"
              :options="optionClients"
              :reduce="c => c.id"
              label="nom"
              placeholder="Choisir un ou plusieurs clients"/>
            <div v-else class="obf-info-pill">
              <i class="fas fa-info-circle mr-1"></i> {{ optionClients.length }} client(s) seront inclus
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 col-6">
            <label class="obf-field-label"><i class="far fa-calendar-alt mr-1"></i> Date début <span class="text-muted">(option.)</span></label>
            <b-form-datepicker placeholder="Aucune" locale="fr-FR" reset-button v-model="date_debut"/>
          </div>
          <div class="col-md-6 col-6">
            <label class="obf-field-label"><i class="far fa-calendar-alt mr-1"></i> Date fin <span class="text-muted">(option.)</span></label>
            <b-form-datepicker placeholder="Aucune" locale="fr-FR" reset-button v-model="date_fin"/>
          </div>
        </div>

        <hr class="my-3">

        <div class="d-flex flex-wrap align-items-center justify-content-between">
          <b-button variant="primary" class="mb-1" :disabled="clients.length === 0 || loading" @click="tirer">
            <b-spinner small v-if="loading"></b-spinner>
            <i v-else class="fas fa-eye mr-1"></i> Consulter à l'écran
          </b-button>
          <div class="d-flex align-items-center flex-wrap">
            <span class="text-muted small text-uppercase mr-2 mb-1">Impression groupée :</span>
            <b-button variant="outline-info" class="mr-1 mb-1" :disabled="clients.length === 0" @click="imprimerFactures">
              <i class="fas fa-file-invoice mr-1"></i> Factures
            </b-button>
            <b-button variant="outline-warning" class="mr-1 mb-1" :disabled="clients.length === 0" @click="imprimerLivraisons">
              <i class="fas fa-truck mr-1"></i> Bons de livraison
            </b-button>
            <b-button variant="outline-success" class="mb-1" :disabled="clients.length === 0" @click="imprimerTout">
              <i class="fas fa-print mr-1"></i> Tout
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <template v-if="charge">
      <!-- Résumé -->
      <div class="row mb-3">
        <div class="col-md-6 mb-2">
          <StatCard label="Factures trouvées" :value="factures.length + ' document(s)'" icon="fas fa-file-invoice" variant="primary" />
        </div>
        <div class="col-md-6 mb-2">
          <StatCard label="Bons de livraison trouvés" :value="livraisons.length + ' document(s)'" icon="fas fa-truck" variant="accent" />
        </div>
      </div>

      <!-- Résultats en onglets -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <b-tabs content-class="mt-3" active-nav-item-class="font-weight-bold">
            <!-- Factures -->
            <b-tab active>
              <template #title>
                Factures <b-badge pill variant="primary" class="ml-1">{{ factures.length }}</b-badge>
              </template>
              <b-input-group size="sm" class="mb-3 obf-search">
                <b-input-group-prepend is-text><i class="fas fa-search"></i></b-input-group-prepend>
                <b-form-input v-model="filterFactures" placeholder="Rechercher une facture, un client..."/>
              </b-input-group>
              <b-table
                head-variant="light" hover responsive
                :items="factures" :fields="champsFactures" :filter="filterFactures"
                :per-page="perPage" :current-page="pageFactures"
                show-empty empty-text="Aucune facture pour cette sélection"
                empty-filtered-text="Aucun résultat pour cette recherche">
                <template v-slot:cell(client)="row">{{ row.item.nom }} {{ row.item.prenoms }}</template>
                <template v-slot:cell(montant_total_factures)="row">
                  {{ format(row.item.montant_total_factures) }} FCFA
                </template>
                <template v-slot:cell(montant_total_factures_ttc)="row">
                  {{ format(row.item.montant_total_factures_ttc) }} FCFA
                </template>
                <template v-slot:cell(code_facture)="row">
                  {{ row.item.code_facture }}
                  <small v-if="row.item.type_facture === 'avoir' && row.item.facture_origine" class="d-block text-muted">
                    <i class="fas fa-link mr-1"></i>sur {{ row.item.facture_origine }}
                  </small>
                </template>
                <template v-slot:cell(type)="row">
                  <b-badge v-if="row.item.type_facture === 'avoir'" variant="danger">Avoir</b-badge>
                  <b-badge v-else variant="secondary">Facture</b-badge>
                  <b-badge v-if="row.item.fne_certified == 1" variant="success" class="ml-1">FNE</b-badge>
                </template>
                <template v-slot:cell(actions)="row">
                  <b-button size="sm" variant="outline-primary"
                    @click="imprimerFacture(row.item.code_facture)">
                    <i class="fas fa-print mr-1"></i> Imprimer
                  </b-button>
                </template>
              </b-table>
              <b-pagination
                v-if="factures.length > perPage"
                v-model="pageFactures" :total-rows="factures.length" :per-page="perPage"
                align="center" size="sm" class="my-0"/>
            </b-tab>

            <!-- Bons de livraison -->
            <b-tab>
              <template #title>
                Bons de livraison <b-badge pill variant="success" class="ml-1">{{ livraisons.length }}</b-badge>
              </template>
              <b-input-group size="sm" class="mb-3 obf-search">
                <b-input-group-prepend is-text><i class="fas fa-search"></i></b-input-group-prepend>
                <b-form-input v-model="filterLivraisons" placeholder="Rechercher un bon de livraison, un client..."/>
              </b-input-group>
              <b-table
                head-variant="light" hover responsive
                :items="livraisons" :fields="champsLivraisons" :filter="filterLivraisons"
                :per-page="perPage" :current-page="pageLivraisons"
                show-empty empty-text="Aucun bon de livraison pour cette sélection"
                empty-filtered-text="Aucun résultat pour cette recherche">
                <template v-slot:cell(client)="row">{{ row.item.nom }} {{ row.item.prenoms }}</template>
                <template v-slot:cell(montant_total)="row">
                  {{ format(row.item.montant_total) }} FCFA
                </template>
                <template v-slot:cell(montant_total_ttc)="row">
                  {{ format(row.item.montant_total_ttc) }} FCFA
                </template>
                <template v-slot:cell(actions)="row">
                  <b-button size="sm" variant="outline-primary"
                    @click="imprimerLivraison(row.item.code_commande)">
                    <i class="fas fa-print mr-1"></i> Imprimer
                  </b-button>
                </template>
              </b-table>
              <b-pagination
                v-if="livraisons.length > perPage"
                v-model="pageLivraisons" :total-rows="livraisons.length" :per-page="perPage"
                align="center" size="sm" class="my-0"/>
            </b-tab>
          </b-tabs>
        </div>
      </div>
    </template>

    <!-- État vide -->
    <div v-else class="card shadow mb-4">
      <div class="card-body text-center text-muted py-5">
        <i class="fas fa-folder-open fa-2x mb-3 d-block" style="opacity:.35"></i>
        Définissez vos critères ci-dessus puis cliquez sur
        <strong>« Consulter à l'écran »</strong> pour afficher les documents,
        ou utilisez directement l'impression groupée.
      </div>
    </div>

    <b-overlay :show="loading" no-wrap></b-overlay>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatCard from "@/components/ui/StatCard.vue";
import { ouvrirDocument } from "@/utils/print.js";
const axios = require('axios')

export default {
  name: "documents_clients",
  components: { PageHeader, StatCard },
  data() {
    return {
      clients: [],
      optionClients: [],
      modeClients: 'choisir',   // 'tous' = tous les clients | 'choisir' = sélection manuelle
      date_debut: '',
      date_fin: '',
      factures: [],
      livraisons: [],
      filterFactures: '',
      filterLivraisons: '',
      loading: false,
      charge: false,
      perPage: 10,
      pageFactures: 1,
      pageLivraisons: 1,
      champsFactures: [
        { key: 'code_facture', label: 'N° Facture', sortable: true },
        { key: 'client', label: 'Client' },
        { key: 'date_facture', label: 'Date', sortable: true },
        { key: 'montant_total_factures', label: 'Montant HT', sortable: true },
        { key: 'montant_total_factures_ttc', label: 'Montant TTC', sortable: true },
        { key: 'type', label: 'Type' },
        { key: 'actions', label: '' },
      ],
      champsLivraisons: [
        { key: 'code_commande', label: 'N° BL', sortable: true },
        { key: 'client', label: 'Client' },
        { key: 'date_commande', label: 'Date', sortable: true },
        { key: 'montant_total', label: 'Montant HT', sortable: true },
        { key: 'montant_total_ttc', label: 'Montant TTC', sortable: true },
        { key: 'actions', label: '' },
      ],
    }
  },
  created() {
    this.chargerClients()
  },
  watch: {
    // « Tous les clients » → on sélectionne tout le monde ; « Choisir » → on repart d'une sélection vide.
    modeClients(val) {
      this.clients = val === 'tous' ? this.optionClients.map(c => c.id) : []
    },
  },
  methods: {
    format(v) {
      return new Intl.NumberFormat().format(Math.floor(v || 0))
    },
    ouvrir(url) {
      ouvrirDocument(url)
    },
    async chargerClients() {
      await axios.get(`${API_BASE_URL}/api/detail_rapport`).then(response => {
        this.optionClients = response.data.clients
        if (this.modeClients === 'tous') {
          this.clients = this.optionClients.map(c => c.id)
        }
      }).catch(err => console.log(err))
    },
    seg(v) {
      return (v === '' || v === null || v === undefined) ? 'null' : v
    },
    async tirer() {
      if (this.date_debut && this.date_fin && this.date_debut > this.date_fin) {
        this.$bvToast ? this.$bvToast.toast('La date de début doit précéder la date de fin.', { variant: 'warning' })
                      : alert('La date de début doit précéder la date de fin.')
        return
      }
      this.loading = true
      const ids = this.clients.join(',')
      const url = `${API_BASE_URL}/api/documents_clients/${ids}/${this.seg(this.date_debut)}/${this.seg(this.date_fin)}`
      await axios.get(url).then(response => {
        if (response.status === 201) {
          this.factures = response.data.factures
          this.livraisons = response.data.livraisons
          this.charge = true
        }
      }).catch(err => console.log(err))
      this.loading = false
    },
    imprimerFacture(code) {
      this.ouvrir(`${API_BASE_URL}/api/imprimer_factures/${code}`, `facture_${code}`)
    },
    imprimerLivraison(code) {
      this.ouvrir(`${API_BASE_URL}/api/imprimer_livraison/${code}`, `bl_${code}`)
    },
    // Construit l'URL d'impression groupée pour un type donné (factures | livraisons | tous).
    urlImpression(type) {
      const ids = this.clients.join(',')
      return `${API_BASE_URL}/api/imprimer_documents_clients/${ids}/${this.seg(this.date_debut)}/${this.seg(this.date_fin)}/${type}`
    },
    imprimerFactures() {
      this.ouvrir(this.urlImpression('factures'), `factures_clients`)
    },
    imprimerLivraisons() {
      this.ouvrir(this.urlImpression('livraisons'), `livraisons_clients`)
    },
    imprimerTout() {
      this.ouvrir(this.urlImpression('tous'), `documents_clients`)
    },
  }
}
</script>

<style scoped>
.obf-field-label {
  display: block;
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
  color: var(--obf-muted, #64748b);
  margin-bottom: 6px;
}
.obf-info-pill {
  display: inline-block;
  background: var(--obf-accent-50, #e6f5f3);
  color: var(--obf-accent, #0d9488);
  font-weight: 600;
  font-size: .82rem;
  border-radius: 999px;
  padding: 8px 14px;
}
.obf-search { max-width: 340px; }
</style>
