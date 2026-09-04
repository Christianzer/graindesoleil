<template>
  <div class="container-fluid p-3">
    <PageHeader title="Fournisseurs" subtitle="Gestion des fournisseurs" crumb="Fournisseurs">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchFournisseurs">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="openModalCreate">
          <i class="fas fa-plus mr-1"></i> Nouveau fournisseur
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Liste des fournisseurs
      </div>
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-col md="3" align="right">
            <b-form-input type="search" v-model="filter" placeholder="Rechercher....."></b-form-input>
          </b-col>
          <br>
          <b-table
              head-variant="light"
              bordered
              hover
              responsive="xl"
              :items="fournisseurs"
              :fields="fields"
              :filter="filter"
              :current-page="currentPage"
              :per-page="perPage"
          >
            <template v-slot:cell(reste_a_payer)="row">
              <span class="font-weight-bold" :class="row.item.reste_a_payer > 0 ? 'text-danger' : 'text-success'">
                {{ new Intl.NumberFormat().format(row.item.reste_a_payer || 0) }} FCFA
              </span>
            </template>

            <template v-slot:cell(actions)="row">
              <b-button size="sm" variant="outline-primary" class="mr-1" @click="voirApprovisionnements(row.item)">
                Historique
              </b-button>
              <b-button size="sm" variant="outline-secondary" class="mr-1" @click="modifier(row.item)">
                modifier
              </b-button>
            </template>
          </b-table>
          <b-pagination
              :total-rows="totalRows"
              :per-page="perPage"
              v-model="currentPage"
              class="my-0 pagination-sm"
          />
        </template>
      </div>
    </div>

    <b-modal ref="modalHistorique" hide-footer :title="'Historique — ' + (selectedFournisseur ? selectedFournisseur.nom : '')" size="lg">
      <b-table
          bordered
          hover
          :items="approvisionnements"
          :fields="fieldsAppro"
      >
        <template v-slot:cell(montant_total)="row">
          {{ new Intl.NumberFormat().format(row.item.montant_total) }} FCFA
        </template>
        <template v-slot:cell(verse)="row">
          {{ new Intl.NumberFormat().format(row.item.verse || 0) }} FCFA
        </template>
        <template v-slot:cell(actions)="row">
          <b-button size="sm" variant="outline-success" @click="ouvrirReglement(row.item)">Régler</b-button>
        </template>
      </b-table>
    </b-modal>

    <b-modal ref="modalReglement" hide-footer title="Règlement fournisseur">
      <b-form-group label="Montant versé">
        <b-form-input type="number" v-model="montantReglement"></b-form-input>
      </b-form-group>
      <b-button variant="success" block :disabled="Loading" @click="regler">Valider le règlement</b-button>
    </b-modal>

    <Form ref="modal"></Form>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import Form from "@/components/fournisseurs/form";
import PageHeader from "@/components/ui/PageHeader.vue";

export default {
  name: "index",
  components: { Form, PageHeader },
  data() {
    return {
      filter: "",
      currentPage: 1,
      loader: false,
      Loading: false,
      perPage: 20,
      fournisseurs: [],
      totalRows: null,
      selectedFournisseur: null,
      approvisionnements: [],
      selectedAppro: null,
      montantReglement: 0,
      fields: [
        { key: 'nom', sortable: true },
        { key: 'contact', sortable: true },
        { key: 'telephone', sortable: true },
        { key: 'adresse', sortable: true },
        { key: 'reste_a_payer', label: 'Reste à payer', sortable: true },
        { key: 'actions' },
      ],
      fieldsAppro: [
        { key: 'code_appro', label: 'Code' },
        { key: 'date_appro', label: 'Date' },
        { key: 'montant_total', label: 'Montant' },
        { key: 'verse', label: 'Versé' },
        { key: 'actions' },
      ],
    }
  },
  created() {
    this.fetchFournisseurs()
    Fire.$on('fournisseur_creationok', () => {
      this.fetchFournisseurs()
    })
  },
  methods: {
    async fetchFournisseurs() {
      this.loader = false
      const api = `${API_BASE_URL}/api/fournisseurs`
      await axios.get(api).then(async response => {
        const liste = response.data
        for (const f of liste) {
          try {
            const solde = await axios.get(`${API_BASE_URL}/api/fournisseurs/${f.id}/solde`)
            f.reste_a_payer = solde.data.reste_a_payer
          } catch (e) {
            f.reste_a_payer = 0
          }
        }
        this.fournisseurs = liste
        this.totalRows = liste.length
      }).catch((err) => {
        console.log(err)
      })
      this.loader = true
    },
    openModalCreate() {
      this.$refs.modal.editMode = false
      this.$refs.modal.showModal()
    },
    modifier(item) {
      this.$refs.modal.selectedTA = item
      this.$refs.modal.editMode = true
      this.$refs.modal.showModal()
    },
    async voirApprovisionnements(item) {
      this.selectedFournisseur = item
      const api = `${API_BASE_URL}/api/fournisseurs/${item.id}/approvisionnements`
      await axios.get(api).then(response => {
        this.approvisionnements = response.data
      }).catch((err) => console.log(err))
      this.$refs.modalHistorique.show()
    },
    ouvrirReglement(item) {
      this.selectedAppro = item
      this.montantReglement = 0
      this.$refs.modalReglement.show()
    },
    async regler() {
      if (this.Loading) return
      this.Loading = true
      const api = `${API_BASE_URL}/api/approvisionnements/regler`
      await axios.post(api, {
        code_appro: this.selectedAppro.code_appro,
        montant_verser: parseFloat(this.montantReglement),
      }).then(async () => {
        this.$refs.modalReglement.hide()
        await this.voirApprovisionnements(this.selectedFournisseur)
        await this.fetchFournisseurs()
      }).catch((err) => console.log(err))
      this.Loading = false
    },
  },
}
</script>

<style scoped>
</style>
