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
                  label="Type de rapport">
                <search-select v-model="formData.type_rapport" :options="options"></search-select>
              </b-form-group>
            </div>
          </div>
          <div class="row" v-if="formData.type_rapport === 1">
            <div class="col-md-4" v-if="formData.type_rapport === 1">
              <b-form-group
                  label="Filtrer par">
                <search-select v-model="formData.detail_rapport" :options="options2"></search-select>
              </b-form-group>
            </div>
            <div class="col-md-4" v-if="formData.detail_rapport === 2">
              <b-form-group
                  label="Bons de livraison">
                <search-select multiple v-model="factures" :options="optionFactureSelect" placeholder="Choisir des bons de livraison"></search-select>

              </b-form-group>
            </div>
            <div class="col-md-4" v-if="formData.detail_rapport === 3">
              <b-form-group
                  label="Clients">
                <search-select multiple v-model="clients" :options="optionClientsSelect" placeholder="Choisir clients"></search-select>
              </b-form-group>
            </div>
            <div class="col-md-4" v-if="formData.detail_rapport === 4">
              <b-form-group
                  label="Commerciaux (laisser vide pour tous)">
                <search-select multiple v-model="commerciaux" :options="optionCommerciauxSelect" placeholder="Choisir un ou plusieurs commerciaux"></search-select>
              </b-form-group>
            </div>
            <div class="col-md-4" v-if="formData.detail_rapport !== 4">
              <b-form-group
                  label="Mode de paiement">
                <search-select class="text-uppercase" v-model="type_paiement" :options="optionTypePaiement"></search-select>
              </b-form-group>
            </div>
          </div>
          <div class="row" v-if="formData.type_rapport === 3 || formData.type_rapport === 4">
            <div class="col-md-6" v-if="formData.type_rapport === 3">
              <b-form-group
                  label="Commerciaux (laisser vide pour tous)">
                <search-select multiple v-model="commerciaux" :options="optionCommerciauxSelect" placeholder="Choisir un ou plusieurs commerciaux"></search-select>
              </b-form-group>
            </div>
            <div class="col-md-6" v-if="formData.type_rapport === 4">
              <b-form-group
                  label="Clients (laisser vide pour tous)">
                <search-select multiple v-model="clients" :options="optionClientsSelect" placeholder="Choisir un ou plusieurs clients"></search-select>
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
                          responsive="xl" v-if="rapport_type === 1 && detail_rapport_type !== 4">
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
                          responsive="xl" v-if="rapport_type === 1 && detail_rapport_type === 4">
            <b-thead>
              <b-tr class="text-left font-weight-bold">
                <b-th>Date Versement</b-th>
                <b-th>Commercial</b-th>
                <b-th>Mode de paiement</b-th>
                <b-th>Montant Encaissé FCFA</b-th>
              </b-tr>
            </b-thead>
            <b-tbody>
              <b-tr class="font-weight-bold" v-for="item in element" :key="item.id">
                <b-td>{{changerDate(item.date_versement)}}</b-td>
                <b-td>{{item.nom}}</b-td>
                <b-td>{{modePaiementCommercial(item.mode_paiement)}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(item.montant)}}</b-td>
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
                <b-th>Date</b-th>
                <b-th>Mouvement</b-th>
                <b-th class="text-right">Cédé</b-th>
                <b-th class="text-right">Versé</b-th>
              </b-tr>
            </b-thead>
            <b-tbody v-for="commercial in element" :key="commercial.id">
              <b-tr class="bg-light text-uppercase font-weight-bold">
                <b-td colspan="4">{{commercial.nom}}</b-td>
              </b-tr>
              <b-tr v-for="(m, i) in commercial.mouvements" :key="commercial.id + '-' + i">
                <b-td>{{changerDate(m.date)}}</b-td>
                <b-td>{{m.libelle}}</b-td>
                <b-td class="text-right">{{m.type === 'cession' ? new Intl.NumberFormat().format(m.montant) : ''}}</b-td>
                <b-td class="text-right">{{m.type === 'versement' ? new Intl.NumberFormat().format(m.montant) : ''}}</b-td>
              </b-tr>
              <b-tr class="font-weight-bold">
                <b-td colspan="2" class="text-right text-uppercase">Sous-total</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(commercial.st_cede))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(commercial.st_verse))}}</b-td>
              </b-tr>
              <b-tr class="font-weight-bold" :class="{'text-white bg-danger': commercial.st_reste > 0}">
                <b-td colspan="3" class="text-right text-uppercase">Reste à verser</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(commercial.st_reste))}}</b-td>
              </b-tr>
            </b-tbody>
            <b-tfoot>
              <b-tr class="text-right font-weight-bold text-primary">
                <b-td colspan="2" class="text-right text-uppercase">Total général FCFA</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatCede))}}</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatVerse))}}</b-td>
              </b-tr>
              <b-tr class="text-right font-weight-bold text-danger">
                <b-td colspan="3" class="text-right text-uppercase">Reste à verser général</b-td>
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatResteCommercial))}}</b-td>
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
                <b-td class="text-right">{{new Intl.NumberFormat().format(Math.round(totalEtatResteClient))}}</b-td>
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
      commerciaux:[],
      factures:[],
      element:[],
      detail_rapport_type: null,
      optionsBase: [
        { value: 1, text: "Encaissement" },
        { value: 2, text: "Decaissement" },
        { value: 3, text: "État commercial" },
        { value: 4, text: "État clients" }
      ],
      options2Base: [
        { value: 1, text: "Tous les encaissements" },
        { value: 2, text: "Par bon de livraison" },
        { value: 3, text: "Par Client" },
        { value: 4, text: "Par commercial" }
      ],
      optionFacture:[],
      optionClients:[],
      optionCommerciaux:[],
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
    async fetchCommerciaux(){
      await this.$http.get(`${API_BASE_URL}/api/commerciaux`).then(response=>{
        this.optionCommerciaux = response.data
      }).catch((err) => {
        console.log(err)
      })
    },
    // Le paramètre `client` sert de vecteur générique (clients ou commerciaux
    // selon le rapport) — voir CaisseControllers::recherche() côté backend.
    clientOuCommercial() {
      const parCommercial = this.formData.type_rapport === 3 ||
        (this.formData.type_rapport === 1 && this.formData.detail_rapport === 4)
      return parCommercial ? this.commerciaux : this.clients
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
        client: this.clientOuCommercial(),
        type_paiement:this.type_paiement
      }

      await this.$http.post(`${API_BASE_URL}/api/recherche`,data).then(response=>{
        this.element= response.data.information
        this.total1 = response.data.total
        this.rapport_type = this.formData.type_rapport
        this.detail_rapport_type = this.formData.detail_rapport
      }).catch((err) => {
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la recherche.'
        this.$bvToast.toast(msg, { title: 'Rapport', variant: 'danger', solid: true })
      })
      this.loader = true
    },
    changerDate(value){
      return moment(value).format("DD/MM/YYYY")
    },
    modePaiementCommercial(v){
      const labels = { 1: 'Espèces', 2: 'Mobile money', 3: 'Chèque', 4: 'Virement' }
      return labels[v] || '—'
    },
    async imprimer(){
      // Un segment d'URL vide (//) est supprimé par le routeur Laravel, ce qui
      // décale les paramètres du contrôleur (ArgumentCountError). On envoie donc
      // 'null' comme placeholder quand une valeur est vide ; le backend le filtre.
      var clients = 'null'
      var factures = 'null'
      if (this.formData.detail_rapport === 3 && this.formData.type_rapport === 1 && this.clients.length){
        clients = this.clients.join(',')
      }

      if (this.formData.detail_rapport === 2 && this.formData.type_rapport === 1 && this.factures.length){
        factures = this.factures.join(',')
      }

      if (this.formData.type_rapport === 4 && this.clients.length){
        clients = this.clients.join(',')
      }

      const parCommercial = this.formData.type_rapport === 3 ||
        (this.formData.type_rapport === 1 && this.formData.detail_rapport === 4)
      if (parCommercial && this.commerciaux.length){
        clients = this.commerciaux.join(',')
      }

      let api_data = `${API_BASE_URL}/api/imprimer/point/${this.formData.date_debut}/${this.formData.date_fin}/${this.formData.type_rapport}/${this.formData.detail_rapport}/${factures}/${clients}/${this.type_paiement}`;
      ouvrirDocument(api_data);
    }
  },
  created() {
    this.clientFacture()
    this.fetchCommerciaux()
    // La caisse n'a que "Par commercial" comme filtre d'encaissement : on le
    // pré-sélectionne pour éviter un écran vide au premier chargement.
    if (this.estCaisse) {
      this.formData.detail_rapport = 4
    }
  },
  computed: {
    estResponsable() {
      try {
        const user = JSON.parse(localStorage.getItem('LoggedUser') || '{}')
        return [1, 3].includes(user.type_user)
      } catch (e) {
        return false
      }
    },
    estCaisse() {
      try {
        const user = JSON.parse(localStorage.getItem('LoggedUser') || '{}')
        return user.type_user === 5
      } catch (e) {
        return false
      }
    },
    // État clients (lié aux BL) réservé au responsable/admin.
    options() {
      return this.optionsBase.filter(o => o.value !== 4 || this.estResponsable)
    },
    // La caisse ne gère que l'encaissement des commerciaux (dépôt-vente),
    // pas les BL clients : un seul choix possible pour elle.
    options2() {
      return this.estCaisse ? this.options2Base.filter(o => o.value === 4) : this.options2Base
    },
    optionClientsSelect() {
      return this.optionClients.map(c => ({ value: c.id, text: c.nom }))
    },
    optionFactureSelect() {
      return this.optionFacture.map(f => ({ value: f.code_facture, text: f.code_facture }))
    },
    optionCommerciauxSelect() {
      return this.optionCommerciaux.map(c => ({ value: c.id, text: c.nom }))
    },
    totalMontantVersTTC() {
      return this.element.reduce((sum, item) => sum + item.montant_verser, 0);
    },
    totalEtatCede() {
      return this.element.reduce((sum, c) => sum + c.st_cede, 0);
    },
    totalEtatVerse() {
      return this.element.reduce((sum, c) => sum + c.st_verse, 0);
    },
    totalEtatResteCommercial() {
      return this.element.reduce((sum, c) => sum + c.st_reste, 0);
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
    totalEtatResteClient() {
      return this.element.reduce((sum, c) => sum + c.st_reste, 0);
    },
  }
}
</script>

<style scoped>

</style>