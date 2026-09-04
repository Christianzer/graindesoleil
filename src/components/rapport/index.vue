<template>
  <div class="container-fluid p-3">
    <PageHeader title="Caisse" subtitle="État et point de trésorerie" crumb="Trésorerie" />

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
            <div class="col-md-4">
              <b-form-group
                  label="Option 1">
                <b-form-select v-model="formData.type_rapport" :options="options"></b-form-select>
              </b-form-group>
            </div>
          </div>
          <div class="row" v-if="formData.type_rapport === 1">
            <div class="col-md-4" v-if="formData.type_rapport === 1">
              <b-form-group
                  label="Option 2">
                <b-form-select v-model="formData.detail_rapport" :options="options2"></b-form-select>
              </b-form-group>
            </div>
            <div class="col-md-4" v-if="formData.detail_rapport === 2">
              <b-form-group
                  label="Factures">
                <v-select multiple v-model="factures" :options="optionFacture" :reduce="factures => factures.code_facture" label="code_facture"  placeholder="Choisir factures"/>

              </b-form-group>
            </div>
            <div class="col-md-4" v-if="formData.detail_rapport === 3">
              <b-form-group
                  label="Clients">
                <v-select multiple v-model="clients" :options="optionClients" :reduce="clients => clients.id" label="nom"  placeholder="Choisir clients"/>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <b-form-group
                  label="Mode de paiement">
                <b-form-select class="text-uppercase" v-model="type_paiement" :options="optionTypePaiement"/>
              </b-form-group>
            </div>
          </div>
          <div class="row" v-if="formData.type_rapport === 5">
            <div class="col-md-6">
              <b-form-group
                  label="Clients (laisser vide pour tous)">
                <v-select multiple v-model="clients" :options="optionClients" :reduce="clients => clients.id" label="nom"  placeholder="Choisir un ou plusieurs clients"/>
              </b-form-group>
            </div>
          </div>
          <div class="row justify-content-end">
            <b-button variant="primary mr-1" type="submit">Consulter</b-button>
            <b-button variant="success mr-1" @click="imprimer">Imprimer</b-button>

          </div>
        </form>
      </div>

    </div>
    <div class="card shadow mb-4" v-if="open === true">
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>


          <b-table-simple bordered
                          hover
                          responsive="xl" v-if="rapport_type === 1">
            <b-thead>
              <b-tr class="text-left font-weight-bold">
                <b-th>Date Versement</b-th>
                <b-th>Code Versement</b-th>
                <b-th>Code facture</b-th>
                <b-th>Client</b-th>
                <b-th>Moyen Paiement</b-th>
                <b-th>Montant Encaissé FCFA</b-th>

              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr class="font-weight-bold" v-for="item in element" :key="item.code_facture">
                <b-td>{{changerDate(item.date_versement)}}</b-td>
                <b-td>{{item.code_versement}}</b-td>
                <b-td>{{item.code_facture}}</b-td>
                <b-td>{{item.nom}} {{item.prenoms}}</b-td>
                <b-td v-if="item.type_paiement === 1">
                  Espèce
                </b-td>
                <b-td v-if="item.type_paiement === 2">
                  Chèque
                </b-td>
                <b-td v-if="item.type_paiement === 3">
                  Mobile Monney
                </b-td>
                <b-td v-if="item.type_paiement === 4">
                  Monnaie Client
                </b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.montant_verser)}}</b-td>

              </b-tr>
            </b-tbody>
            <b-tfoot>
              <b-tr class="text-right font-weight-bold text-danger">
                <b-td colspan="5" class="text-right">TOTAL FCFA</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalMontantVersTTC))}}</b-td>
              </b-tr>
            </b-tfoot>
          </b-table-simple>
          <b-table-simple bordered
                          hover
                          responsive="xl" v-if="rapport_type === 4">
            <b-thead>
              <b-tr class="text-left font-weight-bold">
                <b-th>Date facture</b-th>
                <b-th>Code facture</b-th>
                <b-th>Client</b-th>
                <b-th>Montant facture</b-th>
                <b-th>Montant versé</b-th>
                <b-th>Restant</b-th>

              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr class="font-weight-bold" v-for="item in element" :key="item.code_facture" :class="{'text-white bg-danger': (item.montant_total_factures - item.total_versement) > 1500}">
                <b-td>{{changerDate(item.date_facture)}}</b-td>
                <b-td>{{item.code_facture}}<span v-if="item.type_facture === 'avoir'" class="text-primary"> (Avoir<template v-if="item.facture_origine"> sur {{ item.facture_origine }}</template>)</span></b-td>
                <b-td>{{item.nom}} {{item.prenoms}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.montant_total_factures)}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.total_versement)}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.montant_total_factures - item.total_versement)}}</b-td>
              </b-tr>
            </b-tbody>
            <b-tfoot>
              <b-tr class="text-right font-weight-bold text-danger">
                <b-td colspan="3" class="text-right">TOTAL FCFA</b-td>
                <b-td class="text-right">{{ new Intl.NumberFormat().format(Math.round(totalMontantTTC)) }}</b-td>
                <b-td class="text-right">{{ new Intl.NumberFormat().format(Math.round(totalVersement)) }}</b-td>
                <b-td class="text-right">{{ new Intl.NumberFormat().format(Math.round(totalResteAPayer)) }}</b-td>
              </b-tr>
            </b-tfoot>
          </b-table-simple>
          <b-table-simple bordered
                          hover
                          responsive="xl" v-if="rapport_type === 2">
            <b-thead>
              <b-tr class="text-left font-weight-bold">
                <b-th>Date Decaissement</b-th>
                <b-th>Code Decaissement</b-th>
                <b-th>Libelle Decaissement</b-th>
                <b-th>Montant Decaissement FCFA</b-th>

              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr class="font-weight-bold" v-for="item in element" :key="item.code_facture">
                <b-td>{{changerDate(item.date_sortie_caisse)}}</b-td>
                <b-td>{{item.code_sortie}}</b-td>
                <b-td>{{item.libelle_sortie_caisse}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.montant_sortie_caisse)}}</b-td>

              </b-tr>
            </b-tbody>
            <b-tfoot>
              <b-tr class="text-right font-weight-bold text-danger">
                <b-td colspan="2" class="text-right">TOTAL FCFA</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(total1))}}</b-td>
              </b-tr>
            </b-tfoot>
          </b-table-simple>
          <b-table-simple bordered
                          hover
                          responsive="xl" v-if="rapport_type === 3">
            <b-thead>
              <b-tr class="text-left font-weight-bold">
                <b-th>Date Approvisionnement</b-th>
                <b-th>Code Approvisionnement</b-th>
                <b-th>Libelle Approvisionnement</b-th>
                <b-th>Montant Approvisionnement FCFA</b-th>

              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr class="font-weight-bold" v-for="item in element" :key="item.code_facture">
                <b-td>{{changerDate(item.date_entre_caisse)}}</b-td>
                <b-td>{{item.code_entre}}</b-td>
                <b-td>{{item.libelle_entre_caisse}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.montant_entre_caisse)}}</b-td>

              </b-tr>
            </b-tbody>
            <b-tfoot>
              <b-tr class="text-right font-weight-bold text-danger">
                <b-td colspan="3" class="text-right">TOTAL FCFA</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(total1))}}</b-td>
              </b-tr>
            </b-tfoot>
          </b-table-simple>
          <b-table-simple bordered
                          hover
                          responsive="xl" v-if="rapport_type === 5">
            <b-thead>
              <b-tr class="text-left font-weight-bold">
                <b-th>Date facture</b-th>
                <b-th>Code facture</b-th>
                <b-th class="text-right">Montant HT</b-th>
                <b-th class="text-right">Montant TTC</b-th>
                <b-th class="text-right">Encaissé</b-th>
                <b-th class="text-right">Reste</b-th>
              </b-tr>
            </b-thead>
            <b-tbody v-for="client in element" :key="client.id">
              <b-tr class="bg-light text-uppercase font-weight-bold">
                <b-td colspan="6">{{client.nom}} {{client.prenoms}}</b-td>
              </b-tr>
              <b-tr v-for="f in client.factures" :key="f.code_facture" :class="{'text-white bg-danger': f.reste > 1500}">
                <b-td>{{changerDate(f.date_facture)}}</b-td>
                <b-td>{{f.code_facture}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(f.montant_ht)}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(f.montant_ttc)}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(f.encaisse)}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(f.reste)}}</b-td>
              </b-tr>
              <b-tr class="font-weight-bold">
                <b-td colspan="2" class="text-right text-uppercase">Sous-total</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(client.st_ht))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(client.st_ttc))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(client.st_encaisse))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(client.st_reste))}}</b-td>
              </b-tr>
            </b-tbody>
            <b-tfoot>
              <b-tr class="text-right font-weight-bold text-primary">
                <b-td colspan="2" class="text-right text-uppercase">Total général FCFA</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatHT))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatTTC))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatEncaisse))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatReste))}}</b-td>
              </b-tr>
            </b-tfoot>
          </b-table-simple>





        </template>
      </div>
    </div>

  </div>
</template>

<script>
import moment from "moment/moment";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import { ouvrirDocument } from "@/utils/print.js";

export default {
  name: "index",
  components: { PageHeader },
  data() {
    return {
      apidata : `${API_BASE_URL}/api/recherche`,
      formData: {
        date_debut:moment().format('YYYY-MM-DD'),
        date_fin:moment().format('YYYY-MM-DD'),
        type_rapport : 1,
        detail_rapport:1,
      },
      type_paiement : 1,
      clients:[],
      factures:[],
      element:[],
      options: [
        { value: 1, text: "Encaissement" },
        { value: 2, text: "Decaissement" },
        { value: 3, text: "Approvisionnement" },
        { value: 4, text: "Vente" },
        { value: 5, text: "État clients" }
      ],
      options2: [
        { value: 1, text: "Tous les encaissements" },
        { value: 2, text: "Par facture" },
        { value: 3, text: "Par Client" }
      ],
      optionFacture:[],
      optionClients:[],
      optionTypePaiement:[
        {
          value:1,
          text:"Tous",
        },
        {
          value:2,
          text:"Espèces",
        },
        {
          value:3,
          text:"Chèques",
        },
        {
          value:4,
          text:"Mobile Monney",
        },
      ],
      total1:0,
      open:false,
      loader:false,
      rapport_type : null
    }
  },
  methods: {
    async clientFacture(){
      await this.$http.get(`${API_BASE_URL}/api/detail_rapport`).then(response=>{
        this.optionClients= response.data.clients
        this.optionFacture = response.data.factures
      }).catch((err) => {
        console.log(err)
      })
    },
    async search(){
      this.open = true
      this.loader = false

      let data = {
        date_debut : this.formData.date_debut,
        date_fin:this.formData.date_fin,
        type_rapport: this.formData.type_rapport,
        detail_rapport: this.formData.detail_rapport,
        facture:this.factures,
        client:this.clients,
        type_paiement:this.type_paiement
      }

      await this.$http.post(`${API_BASE_URL}/api/recherche`,data).then(response=>{
        this.element= response.data.information
        this.total1 = response.data.total
        this.rapport_type = this.formData.type_rapport
      }).catch((err) => {
        console.log(err)
      })
      this.loader = true
    },
    changerDate(value){
      return moment(value).format("DD-MM-YYYY")
    },
    async imprimer(){
      // Un segment d'URL vide (//) est supprimé par le routeur Laravel, ce qui
      // décale les paramètres du contrôleur (ArgumentCountError). On envoie donc
      // 'null' comme placeholder quand une valeur est vide ; le backend le filtre.
      var clients = 'null'
      var factures = 'null'
      if (this.formData.detail_rapport === 3 && this.clients.length){
        clients = this.clients.join(',')
      }

      if (this.formData.detail_rapport === 2 && this.factures.length){
        factures = this.factures.join(',')
      }

      if (this.formData.type_rapport === 5 && this.clients.length){
        clients = this.clients.join(',')
      }

      let api_data = `${API_BASE_URL}/api/imprimer/point/${this.formData.date_debut}/${this.formData.date_fin}/${this.formData.type_rapport}/${this.formData.detail_rapport}/${factures}/${clients}/${this.type_paiement}`;
      ouvrirDocument(api_data);
    }
  },
  created() {
    this.clientFacture()
  },
  computed: {
    totalMontantTTC() {
      return this.element.reduce((sum, item) => sum + item.montant_total_factures, 0);
    },
    totalVersement() {
      return this.element.reduce((sum, item) => sum + item.total_versement, 0);
    },
    totalResteAPayer() {
      return this.totalMontantTTC - this.totalVersement;
    },
    totalMontantVersTTC() {
      return this.element.reduce((sum, item) => sum + item.montant_verser, 0);
    },
    totalEtatHT() {
      return this.element.reduce((sum, c) => sum + c.st_ht, 0);
    },
    totalEtatTTC() {
      return this.element.reduce((sum, c) => sum + c.st_ttc, 0);
    },
    totalEtatEncaisse() {
      return this.element.reduce((sum, c) => sum + c.st_encaisse, 0);
    },
    totalEtatReste() {
      return this.element.reduce((sum, c) => sum + c.st_reste, 0);
    },
  }
}
</script>

<style scoped>

</style>