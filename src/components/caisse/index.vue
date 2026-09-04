<template>
  <div class="container-fluid p-3">
    <PageHeader title="Encaissement" subtitle="Consultez et encaissez les factures" crumb="Caisse">
      <template #actions>
        <b-button variant="outline-primary" @click="reload">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Période de recherche
      </div>
      <div class="card-body">
        <form @submit.prevent="search">
          <div class="row">
            <div class="col-md-4">
              <b-form-group
                  label="Date debut">
                <b-form-datepicker
                    placeholder="selectionner une date"
                    locale="fr-FR"
                    v-model="formData.date_debut"
                >
                </b-form-datepicker>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <b-form-group
                  label="Date fin">
                <b-form-datepicker
                    placeholder="selectionner une date"
                    locale="fr-FR"
                    v-model="formData.date_fin"
                >
                </b-form-datepicker>
              </b-form-group>
            </div>
          </div>
          <div class="row justify-content-end">
            <b-button variant="primary mr-1" type="submit">Consulter</b-button>
            <!--
             <b-button variant="success mr-1" @click="imprimer">Imprimer</b-button>
             -->

          </div>
        </form>
      </div>

    </div>
    <div class="card shadow mb-4">
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


            <template v-slot:cell(montant_total_factures_ttc)="row">
              {{new Intl.NumberFormat().format(row.item.montant_total_factures_ttc)}} FCFA
            </template>



            <template v-slot:cell(actions)="row">

              <b-button
                  size="sm"
                  class="mr-1 mt-1"
                  variant="outline-success"
                  v-on:click="openModal(row.item)"
              >
                Encaisser
              </b-button>

              <b-button
                  v-if="row.item.monnaie > 0"
                  size="sm"
                  class="mr-1 mt-1"
                  variant="outline-primary"
                  :disabled="isSubmitting"
                  v-on:click="payerDeduction(row.item)"
              >
                En deduire la monnaie de {{new Intl.NumberFormat().format(row.item.monnaie)}} FCFA
              </b-button>

            </template>

            <template v-slot:cell(verser)="row">
              {{new Intl.NumberFormat().format(row.item.verser)}} FCFA
            </template>
            <template v-slot:cell(avoir)="row">
              <b-badge v-if="Number(row.item.avoir) > 0" variant="danger" class="p-2">
                {{new Intl.NumberFormat().format(row.item.avoir)}} FCFA
              </b-badge>
              <span v-else>{{new Intl.NumberFormat().format(row.item.avoir || 0)}} FCFA</span>
            </template>
            <template v-slot:cell(restant)="row">
              {{new Intl.NumberFormat().format(row.item.montant_total_factures_ttc - row.item.verser - (row.item.avoir || 0))}} FCFA
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
    <Encaissement ref="modal"></Encaissement>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
import moment from "moment";
import Encaissement from "@/components/caisse/encaissement";
import PageHeader from '@/components/ui/PageHeader.vue'
import flow from "@/store/flow";
import { ouvrirDocument } from "@/utils/print.js";
//const electron = require('electron')
//const BrowserWindow = electron.remote.BrowserWindow;
const axios = require('axios')
export default {
  name: "index",
  data(){
    return {
      filter :"",
      Loading:false,
      isSubmitting:false,
      currentPage: 1,
      isLoading : false,
      formData: {
        date_debut:null,
        date_fin:null,
      },
      perPage: 10,
      totalRows: null,
      selectedCode: null,
      all_commande : [],
      fields : [
        {
          key:'code_facture',
          sortable: true,
        },
        {
          key:'matricule_clients',
          label:'Informations Clients',
          sortable: true,
        },
        {
          key:'montant_total_factures_ttc',
          label:'Montant HT',
          sortable: true,
        },
        {
          key:'verser',
          label:'Montant Versé',
          sortable: true,
        },
        {
          key:'avoir',
          label:'Avoir',
          sortable: true,
        },
        {
          key:'restant',
          label:'Reste à payer',
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
    makeToast(variant = null) {
      this.$bvToast.toast('Deduction monnaie effectué avec succès', {
        title: `${variant || 'default'}`,
        toaster: 'b-toaster-top-center',
        variant: variant,
        autoHideDelay: 5000,
        solid: true
      })
    },
    async search(){
      this.isLoading = false
      let data = {
        date_debut : this.formData.date_debut,
        date_fin:this.formData.date_fin,
      }
      let api_data = `${API_BASE_URL}/api/factures_listes/`+this.formData.date_debut+"/"+this.formData.date_fin;
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
    async imprimer(){
      let api_data = `${API_BASE_URL}/api/imprimerListe/`+this.formData.date_debut+"/"+this.formData.date_fin;
      ouvrirDocument(api_data);
    },
    async payerDeduction(dataElement){
      if (this.isSubmitting) return
      this.isSubmitting = true

      var paiement = {
        type_paiement : "Monnaie client",
        montant : dataElement.monnaie,
        banque : null,
        numero_cheque:null,
        numero_telephone:null,
        reseau:null,

      }

      var dataInfo = {
        montant_verser : dataElement.monnaie,
        code_facture : dataElement.code_facture,
        date_versement : moment().format('YYYY-MM-DD'),
        client_id:dataElement.client_id,
        type_paiment : 4,
        paiement:paiement,
        monnaie:0,
        type:5
      }

      await axios.post(`${API_BASE_URL}/api/faire_paiement`,dataInfo)
          .then(response=>{
            if (response.status === 201){
              this.makeToast('success')
              this.listes()
            }
          }).catch((err) => {
            console.log(err)
          })
      this.isSubmitting = false

    },
    async listes(){
      this.isLoading = false
      let api_data = `${API_BASE_URL}/api/factures_listes/`+this.formData.date_debut+"/"+this.formData.date_fin;
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
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },

    reload(){
      this.listes()
    },
    openModal(dataPat) {
      this.$refs.modal.selectedTA = dataPat
      this.$refs.modal.showModal()
    },

  },

}
</script>
