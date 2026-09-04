<template>
  <div class="container-fluid p-3">
    <PageHeader title="Historique des reçus" subtitle="Reçus de paiement du client" crumb="Suivi">
      <template #actions>
        <b-button variant="outline-primary" @click="reload">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">

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


            <template v-slot:cell(montant_verser)="row">
              {{new Intl.NumberFormat().format(row.item.montant_verser)}} FCFA
            </template>



            <template v-slot:cell(actions)="row">

              <b-button
                  size="sm"
                  class="mr-1 mt-1"
                  variant="primary"
                  v-on:click="imprimerRecu(row.item.code_versement)"
              >
                Imprimer le réçu
              </b-button>

            </template>

            <template v-slot:cell(date_versement)="row">
              {{date_com(row.item.date_versement)}}
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
import moment from "moment";
import Encaissement from "@/components/caisse/encaissement";
import API_BASE_URL from "@/api/config.js";
//const electron = require('electron')
//const BrowserWindow = electron.remote.BrowserWindow;
const axios = require('axios')
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
export default {
  name: "index",
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
          key:'code_versement',
          label: 'Code Réçu',
          sortable: true,
        },
        {
          key:'code_facture',
          sortable: true,
        },
        {
          key:'montant_verser',
          label:'Montant Encaissé',
          sortable: true,
        },
        {
          key:'date_versement',
          label: 'Date Encaissement',
          sortable: true,
        },

        {
          key: 'actions'
        },
      ]
    }
  },
  components: {
    Encaissement,
    PageHeader
  },
  created() {
    flow.clearSale()
    this.listes()
    Fire.$on('factureOk',()=>{
      this.listes()
    })
  },
  methods: {
    async listes(){
      this.isLoading = false
      var id = this.$route.params.id
      let api_data = `${API_BASE_URL}/api/ancien/`+id
      await axios.get(api_data).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.all_commande = response.data
          console.log(this.all_commande)
          this.totalRows = this.all_commande.length
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    imprimerRecu(code_recu){
      this.$router.push({ name: 'recu', params: { code_recu: code_recu}})
    },
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },

    reload(){
      this.listes()
    },

  },

}
</script>
