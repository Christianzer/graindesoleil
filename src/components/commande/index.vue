<template>
  <div class="container-fluid p-3">
    <PageHeader title="Listes des ventes" subtitle="Clients et suivi des factures" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchclients">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
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
                  class="mr-1"
                  variant="outline-primary"
                  @click="consultation(row.item.id)"
              >
                Consulter ses opérations
              </b-button>
              <b-button
                  size="sm"
                  class="mr-1"
                  variant="outline-success"
                  @click="factures(row.item.id)"
              >
                Point Livraisons
              </b-button>
              <b-button
                  size="sm"
                  class="mr-1"
                  variant="outline-danger"
                  @click="ventes(row.item.id)"
              >
                Point Ventes
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
import axios from "axios";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
import { ouvrirDocument } from "@/utils/print.js";
export default {
  name: "index",
  components: { PageHeader },
  data(){
    return {
      filter :"",
      currentPage: 1,
      isLoading : false,
      perPage: 10,
      all_clients:[],
      totalRows: null,
      loader:false,
      selectedCode: null,
      fields : [
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
          sortable:true,
        },
        {
          key: 'actions'
        },
      ]
    }
  },
  created() {
    flow.clearSale()
    this.fetchclients()

  },
  methods: {
    async fetchclients(){
      this.loader = false
      let api = `${API_BASE_URL}/api/clients_factures`
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
    async consultation(id) {
      this.$router.push({name:'listes_commandes', params: { id: id }})
    },
    async factures(id) {
      let api_data = `${API_BASE_URL}/api/imprimer_point_type/1/${id}`
      ouvrirDocument(api_data);
    },
    async ventes(id) {
      let api_data = `${API_BASE_URL}/api/imprimer_point_type/2/${id}`
      ouvrirDocument(api_data);
    }
  },

}
</script>
