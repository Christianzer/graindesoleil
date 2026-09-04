<template>
  <div class="container-fluid p-3">
    <PageHeader title="Produits" subtitle="Catalogue et stock disponible" crumb="Référentiels">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchdata">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="openModal">
          <i class="fas fa-plus mr-1"></i> Nouveau produit
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Listes des produits
      </div>
      <div class="card-body">
        <template v-if="isLoading === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-col md="3" align="right">
            <b-form-input type="search" id="filterInput" v-model="filter" placeholder="Rechercher....."></b-form-input>
          </b-col>
          <br>
          <b-table
              head-variant="light"
              bordered
              hover
              responsive="xl"
              :items="all_produits"
              :fields="fields"
              :filter="filter"
              :current-page="currentPage"
              :per-page="perPage"
          >

            <template v-slot:cell(prix_detail)="row">
              {{new Intl.NumberFormat().format(row.item.prix_detail)}} FCFA
            </template>

            <template v-slot:cell(prix_demi_gros)="row">
              {{new Intl.NumberFormat().format(row.item.prix_demi_gros)}} FCFA
            </template>

            <template v-slot:cell(prix_gros)="row">
              {{new Intl.NumberFormat().format(row.item.prix_gros)}} FCFA
            </template>

            <template v-slot:cell(actions)="row">
              <b-button
                  size="sm"
                  variant="outline-primary"
                  class="mr-1"
                  @click="modifier(row.item)"
              >
                modifier
              </b-button>

              <b-button
                  size="sm"
                  variant="outline-danger"
                  class="mr-1"
                  @click="supprimer(row.item.code_produit)"
              >
                supprimer
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

    <Form ref="modal"></Form>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import Form from "./form";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
export default {
  name: "index",
  data(){
    return {
      filter :"",
      all_produits : [],
      currentPage: 1,
      isLoading : false,
      perPage: 10,
      totalRows: null,
      selectedCode: null,
      fields : [
        {
          key:'code_produit',
          sortable:true,
        },
        {
          key:'libelle_produit',
          sortable:true,
        },
        {
          key:'prix_detail',
          label: 'Détail',
          sortable:true,
        },
        {
          key:'prix_demi_gros',
          label: 'Demi-gros',
          sortable:true,
        },
        {
          key:'prix_gros',
          label: 'Gros',
          sortable:true,
        },
        {
          key:'quantite_produit',
          label:'Quantite disponible',
          sortable:true,
        },

        {
          key: 'actions'
        }
      ]
    }
  },
  components: {
    Form,
    PageHeader
  },
  created() {
    flow.clearSale()
    this.fetchdata()
    Fire.$on('creationok',()=>{
      this.fetchdata()
    })

  },
  methods: {
    openModal() {
      this.$refs.modal.editMode = false
      this.$refs.modal.showModal()
    },
    async modifier(dataPat) {
      this.$refs.modal.selectedTA = dataPat
      this.$refs.modal.editMode = true
      this.$refs.modal.showModal()
    },
    async fetchdata(){
      this.isLoading = false
      let urlapi = `${API_BASE_URL}/api/produits`
      await axios.get(urlapi).then((response) => {
        let statut = response.status
        if (statut === 201) {
          this.all_produits = response.data.element
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    async supprimer(code) {
      let urlapi = `${API_BASE_URL}/api/produits/${code}`
      await axios.delete(urlapi).then((response) => {
        let statut = response.status
        if (statut === 201) {
          this.fetchdata()
        }
      }).catch((err) => {
        console.log(err)
      })
    },
  }
}
</script>

<style scoped>

</style>
