<template>
  <div class="container-fluid p-3">
    <PageHeader title="Commerciaux" subtitle="Personnes ou équipes de dépôt-vente" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchData">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="ouvrirCreation">
          <i class="fas fa-plus mr-1"></i> Nouveau commercial
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-header py-3">Liste des commerciaux</div>
      <div class="card-body">
        <b-col md="3" align="right" class="p-0 mb-2">
          <b-form-input type="search" v-model="filter" placeholder="Rechercher…"></b-form-input>
        </b-col>
        <b-table
            head-variant="light"
            bordered
            hover
            responsive="xl"
            :items="commerciaux"
            :fields="fields"
            :filter="filter"
            @filtered="onFiltered"
            :per-page="perPage"
            :current-page="currentPage"
            show-empty
            empty-text="Aucun commercial">
          <template v-slot:cell(type)="row">
            <b-badge :variant="row.item.type === 'equipe' ? 'info' : 'secondary'">
              {{ row.item.type === 'equipe' ? 'Équipe' : 'Personne' }}
            </b-badge>
          </template>
          <template v-slot:cell(responsable)="row">{{ row.item.responsable || '—' }}</template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-primary" class="mr-1" @click="modifier(row.item)">modifier</b-button>
            <b-button size="sm" variant="outline-danger" @click="supprimer(row.item)">supprimer</b-button>
          </template>
        </b-table>
        <b-pagination
            v-if="totalRows > perPage"
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            align="right" size="sm" class="mt-2 mb-0"></b-pagination>
      </div>
    </div>

    <Form ref="modal"></Form>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import PageHeader from '@/components/ui/PageHeader.vue'
import Form from './form'

export default {
  name: "commerciaux-index",
  components: { PageHeader, Form },
  data() {
    return {
      filter: '',
      commerciaux: [],
      currentPage: 1,
      perPage: 10,
      totalRows: 0,
      fields: [
        { key: 'nom', label: 'Nom / libellé', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'contact', label: 'Contact' },
        { key: 'responsable', label: 'Responsable' },
        { key: 'actions', label: '' },
      ],
    }
  },
  methods: {
    onFiltered(filteredItems) {
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
    async fetchData() {
      await axios.get(`${API_BASE_URL}/api/commerciaux`).then(r => {
        this.commerciaux = r.data
        this.totalRows = this.commerciaux.length
      }).catch(e => console.log(e))
    },
    ouvrirCreation() {
      this.$refs.modal.editMode = false
      this.$refs.modal.selectedTA = null
      this.$refs.modal.showModal()
    },
    modifier(item) {
      this.$refs.modal.editMode = true
      this.$refs.modal.selectedTA = item
      this.$refs.modal.showModal()
    },
    async supprimer(item) {
      if (!confirm(`Désactiver le commercial « ${item.nom} » ?`)) return
      await axios.delete(`${API_BASE_URL}/api/commerciaux/${item.id}`).then(() => {
        this.$bvToast.toast('Commercial désactivé.', { title: 'Commercial', variant: 'success', solid: true })
        this.fetchData()
      }).catch(e => {
        console.log(e)
        this.$bvToast.toast('Erreur lors de la suppression.', { title: 'Commercial', variant: 'danger', solid: true })
      })
    },
  },
  created() {
    this.fetchData()
    window.Fire.$on('commerciaux:refresh', () => this.fetchData())
  },
  beforeDestroy() {
    window.Fire.$off('commerciaux:refresh')
  },
}
</script>

<style scoped>
</style>
