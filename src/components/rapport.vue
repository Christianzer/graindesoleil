<template>
  <div class="container-fluid p-3">
    <PageHeader title="Rapport" subtitle="Rapport de ventes journalier" crumb="Suivi">
      <template #actions>
        <b-button variant="primary" @click="openModal">
          <i class="fas fa-calendar-alt mr-1"></i> Sélectionner la date
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3 font-weight-bold text-uppercase">
        Rapport du {{date_com(this.created)}}
      </div>
      <div class="card-body">
        <template v-if="isLoading === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>
          <div class="table-responsive-xl">
            <table id="datatable" class="table table-bordered table-responsive-xl" style="font-size: 12px;">
              <thead>
              <tr class="text-center">
                <th>Informations produits</th>
                <th>Stocks</th>
                <th>Sorties</th>
                <th>Stocks restants</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="produits in all_produits" :key="produits.code_produit">
                <td class="text-left">{{produits.libelle_produit}}</td>
                <td class="text-right">{{ new Intl.NumberFormat().format(produits.quantite_produit)}}</td>
                <td class="text-right">{{ new Intl.NumberFormat().format(produits.quantite_vendu)}}</td>
                <td class="text-right">{{ new Intl.NumberFormat().format(produits.produits_restants)}}</td>
              </tr>
              <tr>
                <th class="text-uppercase text-right">Total</th>
                   <td class="text-right">{{new Intl.NumberFormat().format(all_total.quantite_produit_total)}}</td>
                <td class="text-right">{{new Intl.NumberFormat().format(all_total.quantite_vendu_total)}}</td>
                <td class="text-right">{{new Intl.NumberFormat().format(all_total.produits_restants_total)}}</td>
              </tr>
              </tbody>
            </table>
            <br>
            <div class="text-right" >
              <b-button variant="success" @click="imprimer_rapport()">Imprimer le rapport</b-button>
            </div>
          </div>
        </template>
      </div>

    </div>
    <Date ref="modal"></Date>
  </div>
</template>

<script>
import Date from "./Date";
import moment from "moment";
import axios from "axios";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
export default {
  name: "rapport",
  components: {
    Date,
    PageHeader
  },
  data() {
    return {
      all_produits : [],
      all_total:[],
      isLoading:false,
      dataTable:null,
    }
  },
  methods: {
    async LoadCatalogue(created){
      this.created = created
      this.isLoading = false
      let url_api = `${API_BASE_URL}/api/rapport/${created}`
      await axios.get(url_api).then((response) => {
        let statut = response.status
        if (statut === 201) {
          this.all_produits = response.data.element.element
          this.all_total = response.data.total
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    openModal () {
      this.$refs.modal.showModal()
    },
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },
    async imprimer_rapport(){
      let api_data = "${API_BASE_URL}/api/imprimer_rapport/"+this.created
    }
  },
  created() {
    this.created = moment().format('YYYY-MM-DD')
    this.LoadCatalogue(this.created)
  },
}
</script>

<style scoped>

</style>
