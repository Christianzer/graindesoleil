<template>
  <div class="container-fluid p-3">
    <PageHeader title="Historiques" subtitle="Commandes, factures et livraisons par client" crumb="Suivi" />

    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Historiques des clients
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
              :items="all_commande"
              :fields="fields"
              :filter="filter"
              :current-page="currentPage"
              :per-page="perPage"
          >
            <template v-slot:cell(matricule_clients)="row">
              {{row.item.nom}} {{row.item.prenoms}}
            </template>


           <template v-slot:cell(actions)="row">

             <b-button
                 size="sm"
                 class="mr-1 mt-1"
                 variant="outline-success"
                 @click="consulter_bon_livraison(row.item)"
             >
               Consulter ses livraisons
             </b-button>
              <b-button
                  size="sm"
                  class="mr-1 mt-1"
                  variant="outline-secondary"
                  @click="consulter_ventes(row.item)"
              >
                Consulter ses factures
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

  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
import moment from "moment";
//const electron = require('electron')
//const BrowserWindow = electron.remote.BrowserWindow;
const axios = require('axios')
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
export default {
  name: "index",
  components: { PageHeader },
  data(){
    return {
      filter :"",
      Loading:false,
      currentPage: 1,
      isLoading : false,
      perPage: 10,
      totalRows: null,
      selectedCode: null,
      all_commande : [],
      fields : [
        {
          key:'matricule_clients',
          label:'Informations Clients',
          sortable: true,
        },
        {
          key: 'actions'
        },
      ]
    }
  },
  created() {
    flow.clearSale()
    this.listes()
  },
  methods: {
    async listes(){
      this.isLoading = false
      let api_data = `${API_BASE_URL}/api/listes_commandes_effectuer`
      await axios.get(api_data).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.all_commande = response.data
          this.totalRows = this.all_commande.length
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },
    consulter_ventes(data){
      this.$router.push({ name: 'historiques_factures', params: { data: data}})
    },
    consulter_bon_livraison(data){
      this.$router.push({ name: 'historiques_livraisons', params: { data: data}})
    }


  },

}
</script>
