<template>
  <div class="container-fluid p-3">
    <PageHeader title="Bons de livraison" subtitle="Bons de livraison du client" crumb="Ventes">
      <template #actions>
        <b-button class="text-uppercase" variant="primary" @click="factures()">
          <i class="fas fa-plus mr-1"></i> Faire un nouveau bon de livraison
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <b-button variant="danger mr-1" @click="this.listes">Raffraichir</b-button>
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
            <template v-slot:cell(information)="row">
              {{row.item.nom}} {{row.item.prenoms}}
            </template>

            <template v-slot:cell(montant_total_ttc)="row">
              {{new Intl.NumberFormat().format(Math.floor(row.item.montant_total_ttc))}} FCFA
            </template>

            <template v-slot:cell(actions)="row">
              <b-button size="sm" variant="outline-primary" class="mr-1" @click="imprimer_facture(row.item.code_facture)">
                Imprimer
              </b-button>
              <b-button size="sm" variant="outline-danger" @click="fairUnAvoir(row.item)">
                Faire un avoir
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
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
import { ouvrirDocument } from "@/utils/print.js";
const axios = require('axios')
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
          key:'code_facture',
          label:'Code Bon de Livraison',
          sortable: true,
        },
        {
          key:'information',
          label:'Clients',
        },
        {
          key:'montant_total_ttc',
          label: 'Montant Total',
          sortable:true,
        },
        {
          key: 'actions',
          label: '',
        },
      ]
    }
  },
  created() {
    this.listes()
  },
  methods: {
    async listes(){
      var id = flow.getClients().id
      this.isLoading = false
      let api_data = `${API_BASE_URL}/api/listes_commandes_ventes/${id}`
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
      return value
    },
    async factures() {
      this.$router.push({name:'factures_users'})
    },
    fairUnAvoir(item) {
      this.$router.push({ name: 'factures_avoir', params: { code_commande: item.code_commande, montant: item.montant_total_ttc } })
    },
    async imprimer_facture(code_facture){
      let api_data = `${API_BASE_URL}/api/imprimer_factures/${code_facture}`
      ouvrirDocument(api_data);
    }
  },

}
</script>
