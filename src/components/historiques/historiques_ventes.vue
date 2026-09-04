<template>
  <div class="container-fluid p-3">
    <PageHeader title="Historiques factures" subtitle="Factures du client" crumb="Suivi" />

    <div class="card shadow mb-4">
      <div class="card-header py-3 text-uppercase">
        Historiques DE {{this.$route.params.data.nom}} {{this.$route.params.data.prenoms}}
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

            <template v-slot:cell(montant_total_factures)="row">
              {{new Intl.NumberFormat().format(row.item.montant_total_factures)}} FCFA
            </template>

            <template v-slot:cell(montant_total_factures_ttc)="row">
              {{new Intl.NumberFormat().format(row.item.montant_total_factures_ttc)}} FCFA
            </template>

            <template v-slot:cell(fne_certified)="row">
              <span v-if="row.item.fne_certified == 1" class="badge badge-success">&#10003; Certifiée FNE</span>
              <span v-else class="badge badge-danger">&#9888; Non certifiée</span>
            </template>

            <template v-slot:cell(actions)="row">
              <b-button
                  size="sm"
                  variant="outline-primary"
                  @click="consulter_ventes(row.item.code_facture)"
              >
                Consulter
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
import axios from "axios";
import moment from "moment";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
export default {
  name: "historiques_commande",
  components: { PageHeader },
  created() {
    this.listes(this.$route.params.data.matricule_clients)
  },
  data(){
    return {
      filter :"",
      Loading:false,
      currentPage: 1,
      isLoading : false,
      perPage: 10,
      information:"",
      totalRows: null,
      fneLoadingCode: null,
      all_commande : [],
      fields : [
        {
          key:'code_facture',
          sortable: true,
        },
        {
          key:'montant_total_factures',
          label: 'Montant Total HT',
          sortable:true,
        },
        {
          key:'montant_total_factures_ttc',
          label: 'Montant Total TTC',
          sortable:true,
        },
        {
          key: 'fne_certified',
          label: 'Statut FNE',
        },
        {
          key: 'actions'
        },
      ]
    }
  },
  methods: {
    async listes(matricule){
      this.isLoading = false
      let api_data = `${API_BASE_URL}/api/listes_factures_data_perso/${matricule}`
      await axios.get(api_data).then(response=>{
        console.log(response)
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
    async consulter_ventes(code_facture){
      this.$router.push({ name: 'facture', params: { code_facture: code_facture}})
    },
    async certifierFne(code_facture) {
      this.fneLoadingCode = code_facture
      try {
        const res = await axios.post(`${API_BASE_URL}/api/certifier_facture/${code_facture}`)
        if (res.data && res.data.success) {
          await this.listes(this.$route.params.data.matricule_clients)
          this.$bvToast.toast('Facture certifiée FNE avec succès.', { title: 'FNE', variant: 'success', solid: true })
        } else {
          this.$bvToast.toast('API FNE indisponible.', { title: 'FNE', variant: 'danger', solid: true })
        }
      } catch (err) {
        this.$bvToast.toast('Impossible de contacter le serveur FNE.', { title: 'FNE', variant: 'danger', solid: true })
      } finally {
        this.fneLoadingCode = null
      }
    },
  }
}
</script>

<style scoped>

</style>
