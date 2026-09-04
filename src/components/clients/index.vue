<template>
  <div class="container-fluid p-3">
    <PageHeader title="Clients" subtitle="Gérez votre fichier clients" crumb="Référentiels">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchclients">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="openModal">
          <i class="fas fa-plus mr-1"></i> Nouveau client
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Listes des clients
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
            <b-form-input type="search" id="filterInput" v-model="filter" placeholder="Rechercher....."></b-form-input>
          </b-col>
          <br>
          <b-table
              head-variant="light"
              bordered
              hover
              responsive="xl"
              :items="all_clients"
              :fields="fields"
              :filter="filter"
              :current-page="currentPage"
              :per-page="perPage"
          >
            <template v-slot:cell(actions)="row">
              <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="modifier(row.item)"
                  class="mr-1"
              >
                modifier
              </b-button>

              <b-button
                  size="sm"
                  variant="outline-danger"
                  class="mr-1"
                  @click="supprimer(row.item.id)"
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
      all_clients:[],
      currentPage: 1,
      loader : false,
      perPage: 10,
      totalRows: null,
      selectedCode: null,
      fields : [
        {
          key:'matricule',
          sortable:true,
        },
        {
          key:'nom',
          sortable:true,
        },
        {
          key:'prenoms',
          sortable:true,
        },
        {
          key:'telephone',
          label:'Contact 1',
          sortable:true,
        },
        {
          key:'contact',
          label:'Contact 2',
          sortable:true,
        },
        {
          key:'mail',
          sortable:true,
        },
        {
          key:'compte_contr',
          label:'Compte Contribuable',
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
    this.fetchclients()
    Fire.$on('creationok',()=>{
      this.fetchclients();
    })

  },
  methods: {
    async fetchclients(){
      this.loader = false
      let api = API_BASE_URL + '/api/clients'
      await axios.get(api).then(response=>{
        let statut = response.status
        if (statut === 200){
          this.all_clients = response.data
          this.totalRows = this.all_clients.length
        }
      }).catch((err) => {
        console.log(err)
      })
      this.loader = true
    },
    openModal() {
      this.$refs.modal.editMode = false
      this.$refs.modal.showModal()
    },
    async modifier(dataPat) {
      this.$refs.modal.selectedTA = dataPat
      this.$refs.modal.editMode = true
      this.$refs.modal.showModal()
    },
    async supprimer(code) {
      let urlapi = `${API_BASE_URL}/api/clients/${code}`
      await axios.delete(urlapi).then((response) => {
        let statut = response.status
        if (statut === 201) {
          this.fetchclients()
        }
      }).catch((err) => {
        console.log(err)
      })
    },
  },

}
</script>

<style scoped>

</style>
