<template>
  <div class="container-fluid p-3">
    <PageHeader title="Journal d'activité" subtitle="Historique des actions effectuées par les utilisateurs" crumb="Suivi">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchJournal">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Filtres
      </div>
      <div class="card-body">
        <b-row>
          <b-col md="2">
            <label>Utilisateur</label>
            <b-form-input v-model="filtres.utilisateur" placeholder="ex: christiane"></b-form-input>
          </b-col>
          <b-col md="2">
            <label>Module</label>
            <b-form-select v-model="filtres.module" :options="modulesOptions"></b-form-select>
          </b-col>
          <b-col md="2">
            <label>Action</label>
            <b-form-select v-model="filtres.action" :options="actionsOptions"></b-form-select>
          </b-col>
          <b-col md="2">
            <label>Date début</label>
            <b-form-input type="date" v-model="filtres.date_debut"></b-form-input>
          </b-col>
          <b-col md="2">
            <label>Date fin</label>
            <b-form-input type="date" v-model="filtres.date_fin"></b-form-input>
          </b-col>
          <b-col md="2" class="d-flex align-items-end">
            <b-button variant="primary" block @click="rechercher">Rechercher</b-button>
          </b-col>
        </b-row>
      </div>
    </div>

    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Journal ({{ totalRows }} entrées)
      </div>
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-table
              head-variant="light"
              bordered
              hover
              responsive="xl"
              :items="lignes"
              :fields="fields"
          >
            <template v-slot:cell(created_at)="row">
              {{ formatDate(row.item.created_at) }}
            </template>
            <template v-slot:cell(action)="row">
              <b-badge :variant="badgeVariant(row.item.action)">{{ row.item.action }}</b-badge>
            </template>
            <template v-slot:cell(actions)="row">
              <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="voirDetail(row.item)"
              >
                Détail
              </b-button>
            </template>
          </b-table>
          <b-pagination
              :total-rows="totalRows"
              :per-page="perPage"
              v-model="currentPage"
              @change="changerPage"
              class="my-0 pagination-sm"
          />
        </template>
      </div>
    </div>

    <b-modal v-model="detailVisible" title="Détail de l'action" size="lg" ok-only>
      <div v-if="detailCourant">
        <p><strong>Description :</strong> {{ detailCourant.description }}</p>
        <p v-if="!detailCourant.donnees_avant && !detailCourant.donnees_apres" class="text-muted mb-0">
          Aucune donnée avant/après enregistrée pour cette action.
        </p>
        <b-row v-else>
          <b-col md="6">
            <h6>Avant</h6>
            <pre class="obf-journal-detail">{{ formatJson(detailCourant.donnees_avant) }}</pre>
          </b-col>
          <b-col md="6">
            <h6>Après</h6>
            <pre class="obf-journal-detail">{{ formatJson(detailCourant.donnees_apres) }}</pre>
          </b-col>
        </b-row>
      </div>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
import axios from 'axios'
import PageHeader from '@/components/ui/PageHeader.vue'

export default {
  name: 'JournalActivite',
  components: { PageHeader },
  data () {
    return {
      loader: false,
      lignes: [],
      totalRows: 0,
      currentPage: 1,
      perPage: 50,
      detailVisible: false,
      detailCourant: null,
      filtres: {
        utilisateur: '',
        module: null,
        action: null,
        date_debut: '',
        date_fin: ''
      },
      modulesOptions: [
        { value: null, text: 'Tous' },
        { value: 'clients', text: 'Clients' },
        { value: 'produits', text: 'Produits' },
        { value: 'commandes', text: 'Commandes' },
        { value: 'proforma', text: 'Proforma' },
        { value: 'factures', text: 'Factures' },
        { value: 'versements', text: 'Versements' },
        { value: 'caisse', text: 'Caisse' },
        { value: 'commerciaux', text: 'Commerciaux' },
        { value: 'connexion', text: 'Connexion' }
      ],
      actionsOptions: [
        { value: null, text: 'Toutes' },
        { value: 'creation', text: 'Création' },
        { value: 'modification', text: 'Modification' },
        { value: 'suppression', text: 'Suppression' },
        { value: 'connexion', text: 'Connexion' }
      ],
      fields: [
        { key: 'created_at', label: 'Date/heure', sortable: true },
        { key: 'utilisateur', sortable: true },
        { key: 'module', sortable: true },
        { key: 'action', sortable: true },
        { key: 'description' },
        { key: 'actions' }
      ]
    }
  },
  created () {
    this.fetchJournal()
  },
  methods: {
    async fetchJournal () {
      this.loader = false
      const params = { par_page: this.perPage, page: this.currentPage }
      if (this.filtres.utilisateur) params.utilisateur = this.filtres.utilisateur
      if (this.filtres.module) params.module = this.filtres.module
      if (this.filtres.action) params.action = this.filtres.action
      if (this.filtres.date_debut) params.date_debut = this.filtres.date_debut
      if (this.filtres.date_fin) params.date_fin = this.filtres.date_fin

      await axios.get(`${API_BASE_URL}/api/journal`, { params }).then(response => {
        this.lignes = response.data.data
        this.totalRows = response.data.total
      }).catch((err) => {
        console.log(err)
      })
      this.loader = true
    },
    rechercher () {
      this.currentPage = 1
      this.fetchJournal()
    },
    changerPage (page) {
      this.currentPage = page
      this.fetchJournal()
    },
    voirDetail (item) {
      this.detailCourant = item
      this.detailVisible = true
    },
    formatJson (value) {
      if (!value) return '—'
      try {
        return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2)
      } catch (e) {
        return value
      }
    },
    formatDate (value) {
      if (!value) return ''
      return new Date(value).toLocaleString('fr-FR')
    },
    badgeVariant (action) {
      switch (action) {
        case 'creation': return 'success'
        case 'modification': return 'warning'
        case 'suppression': return 'danger'
        case 'connexion': return 'info'
        default: return 'secondary'
      }
    }
  }
}
</script>

<style scoped>
.obf-journal-detail {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.8rem;
  max-height: 320px;
  overflow: auto;
}
</style>
