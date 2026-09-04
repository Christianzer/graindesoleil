<template>
  <div class="container-fluid p-3">
    <PageHeader title="Établir un avoir" subtitle="Note de crédit sur bon de livraison" crumb="Ventes" />

    <template v-if="isLoading === false">
      <div class="text-center">
        <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
        <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
      </div>
    </template>
    <template v-else>
      <div class="card shadow mb-4">
        <div class="card-header py-3 text-uppercase font-weight-bold">
          Produit
        </div>
        <div class="card-body">
          <table class="tftable table-responsive" style="width: auto" align="center">
            <tr>
              <th>Libelle Produit</th>
              <th>Prix Vente HT FCFA</th>
              <th>Prix Vente TTC FCFA</th>
              <th>Quantité depart</th>
              <th>Quantité revenu</th>
              <th>Quantité final</th>
              <th>Total final HT FCFA</th>
              <th>Total final TTC FCFA</th>
            </tr>
            <tr v-for="selected in produit" :key="selected.id_article">
              <td>
                <b-form-input readonly class="font-weight-bold" style="font-size: small" v-model="selected.libelle_produit"/>
              </td>
              <td>
                <b-form-input type="number" readonly class="font-weight-bold"  style="font-size: small" v-model="selected.prix_vente"/>
              </td>
              <td>
                <b-form-input type="number" readonly class="font-weight-bold" style="font-size: small" :value="Math.floor(selected.prix_vente * 1.18)"/>
              </td>
              <td class="text-center" width="10%">
                <b-form-input readonly type="number" class="font-weight-bold" style="font-size: small" min="1" :max="selected.quantite_produit"  v-model="selected.quantite_acheter"/>
              </td>
              <td class="text-center" width="10%">
                <b-form-input type="number" class="font-weight-bold" style="font-size: small" min="1" :max="selected.quantite_produit"  v-model="selected.quantite_avoir"/>
              </td>

              <td>
                <b-form-input type="number" readonly class="font-weight-bold" style="font-size: small"  :value="selected.quantite_acheter - selected.quantite_avoir"/>
              </td>

              <td>
                <b-form-input type="number" readonly class="font-weight-bold" style="font-size: small"  :value="(selected.quantite_acheter - selected.quantite_avoir) * selected.prix_vente"/>
              </td>


              <td>
                <b-form-input type="number" readonly class="font-weight-bold" style="font-size: small" :value="(selected.quantite_acheter - selected.quantite_avoir) * Math.floor(selected.prix_vente * 1.18)"/>
              </td>

              <!--

              <td style="width: 8%"><button class="btn btn-danger" @click="supprimerProduits(selected.id_article)"><b-icon icon="trash-fill" aria-hidden="true"></b-icon>
              </button></td>
               -->
            </tr>
          </table>
          <div class="text-left">
            <b-form-group
                id="code"
                class="text-uppercase font-weight-bold text-danger"
                label="Date facture ?"
                label-for="input-horizontal"
            >
              <b-form-datepicker
                  placeholder="Selectionner une date"
                  locale="fr-FR"
                  readonly
                  v-model="update_at"
                  class="mb-2 col-lg-3">
              </b-form-datepicker>
            </b-form-group>
          </div>
          <div class="text-left">
            <b-form-group
                id="code"
                class="text-uppercase font-weight-bold text-danger"
                label="A quelle date voulez vous enregistrer l'avoir ?"
                label-for="input-horizontal"
            >
              <b-form-datepicker
                  placeholder="Selectionner une date"
                  locale="fr-FR"
                  v-model="avoir_at"
                  class="mb-2 col-lg-3">
              </b-form-datepicker>
            </b-form-group>
          </div>
          <br>
          <div class="text-right">
            <h4 class="text-uppercase text-right text-success font-weight-bolder" > TOTAL DEPART TTC : {{ new Intl.NumberFormat().format(Math.floor(total_ttc)) }} FCFA</h4>
            <h4 class="text-uppercase text-right text-danger font-weight-bolder" v-if="produit.length > 0"> TOTAL APRES AVOIR HT: {{ new Intl.NumberFormat().format(totalaAvoir) }} FCFA</h4>
            <h4 class="text-uppercase text-right text-danger font-weight-bolder" v-if="produit.length > 0"> TVA 18%: {{ new Intl.NumberFormat().format(Math.floor((totalaAvoir*18)/100)) }} FCFA</h4>
            <h4 class="text-uppercase text-right text-danger font-weight-bolder" v-if="produit.length > 0"> TOTAL APRES AVOIR TTC: {{ new Intl.NumberFormat().format(Math.floor(totalAvoir_ttc)) }} FCFA</h4>

            <h4 class="text-uppercase text-right text-warning font-weight-bolder" > DEJA VERSé : {{ new Intl.NumberFormat().format(Math.floor(versement)) }} FCFA</h4>
            <h4 class="text-uppercase text-right text-success font-weight-bolder" > RESTANT A PAYER : {{ new Intl.NumberFormat().format(Math.floor(totalAvoir_ttc - versement)) }} FCFA</h4>
          </div>


          <b-row class="mt-4 text-left">
            <b-col>
              <b-button variant="success" class="mr-1" :disabled="Loading" @click="achat()">Valider l'avoir</b-button>
              <small class="text-muted ml-2" v-if="totalaAvoir > 0">
                <b-icon icon="shield-check"></b-icon> La facture d'avoir sera soumise à certification FNE (DGI) lors de la validation.
              </small>
            </b-col>
            <b-col></b-col>
            <!--
              <b-col cols="3"></b-col>
            <b-col class="text-right">
                <b-button variant="danger" @click="vider" class="mr-1">Vider le panier</b-button>
            </b-col>
             -->

          </b-row>
        </div>
      </div>


    </template>
    <b-overlay :show="Loading" no-wrap>
    </b-overlay>

  </div>
</template>

<script>
import moment from "moment";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";

const axios = require('axios')
export default {
  components: { PageHeader },
  name: "panier",
  // mode : 'ttc' (avoir sur facture TTC) ou 'ht' (avoir sur facture diverse).
  props: {
    mode: { type: String, default: 'ttc' }
  },
  data() {
    return {
      Loading : false,
      isLoading:false,
      produit : [],
      id_clients:"",
      statut_produit:null,
      created : "",
      telephone: "",
      information : "",
      code_commande:"",
      montant_deposer:0,
      numero_facture:'',
      facture_deal:[],
      afficherPaiement : false,
      update_at: '',
      avoir_at: '',
      calcul_verser:0,
      versement:0,
    }
  },

  methods: {
    async chargerData(code_demande){
      this.isLoading = false
      let api_data = `${API_BASE_URL}/api/remplir_avoir/${code_demande}`
      await axios.get(api_data).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.produit = response.data.element
          this.information =  response.data.factures.nom+' '+response.data.factures.prenoms
          this.id_clients = response.data.factures.matricule_clients
          this.total = response.data.factures.montant_total
          this.statut_produit = response.data.factures.statut_prod
          this.numero_facture = response.data.factures.code_facture
          this.facture_deal = response.data.factures
          this.versement = response.data.factures.montant_verser
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    async achat(){
      if (this.Loading) return
      this.Loading = true
      var data = {
        produits               : this.produit,
        bareme                 : 'standard',
        montant_total          : this.totalRetour,
        montant_total_ttc      : this.totalRetour_ttc,
        clients                : this.id_clients,
        code_commande          : this.code_commande,
        code_facture_origine   : this.numero_facture,
        date_commande          : this.avoir_at || moment().format('YYYY-MM-DD'),
      }
      let api = `${API_BASE_URL}/api/factures_avoir`
      await axios.post(api,data).then(response=>{
        let statut = response.status
        if (statut === 201){
          let code_facture = response.data
          this.$router.push({ name: this.mode === 'ht' ? 'facture_ht' : 'facture', params: { code_facture: code_facture}})
        }
      }).catch((err) => {
        console.log(err)
      })
      this.Loading = false
    },


  },
  computed : {
    monnaie(){
      let val = 0;
      val = this.total - this.facture_deal.montant_verser - this.montant_deposer ;
      if (val>=0){
        return val;
      }else{
        return 0;
      }
    },
    prix_de_ventes_ttc(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t = this.produit[index].prix_vente * 1.18
      }
      return Math.floor(t)
    },
    total(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += this.produit[index].prix_vente * this.produit[index].quantite_acheter
      }
      return Math.floor(t)
    },

    totalaAvoir(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += this.produit[index].prix_vente * (this.produit[index].quantite_acheter - this.produit[index].quantite_avoir)
      }
      return Math.floor(t)
    },

    totalRetour(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += this.produit[index].prix_vente * (this.produit[index].quantite_avoir || 0)
      }
      return Math.floor(t)
    },

    totalRetour_ttc(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += Math.floor(this.produit[index].prix_vente * 1.18) * (this.produit[index].quantite_avoir || 0)
      }
      return Math.floor(t)
    },

    total_ttc(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += this.produit[index].prix_vente * 1.18 * this.produit[index].quantite_acheter
      }
      return Math.floor(t)
    },

    totalAvoir_ttc(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += this.produit[index].prix_vente * 1.18 * (this.produit[index].quantite_acheter - this.produit[index].quantite_avoir)
      }
      return Math.floor(t)
    },

    a_rendre(){
      let val = 0;
      val = this.total_ttc - this.facture_deal.montant_verser - this.montant_deposer
      if (this.montant_deposer < (this.total_ttc - this.facture_deal.montant_verser)){
        return 0
      }else{
        return Math.abs(val)
      }
    },
    a_verser(){
      let val = 0;
      val = this.total_ttc - this.facture_deal.montant_verser - this.montant_deposer
      return Math.abs(val)
    },
  },
  created() {
    flow.clearSale()
    this.code_commande = this.$route.params.code_commande
    this.update_at = moment().format('YYYY-MM-DD')
    this.chargerData(this.code_commande)
  }
}
</script>

<style scoped>
.tftable {font-size:12px;color:#333333;width:100%;border-width: 1px;border-color: #729ea5;border-collapse: collapse;}
.tftable th {font-size:12px;background-color:#acc8cc;border-width: 1px;padding: 8px;border-style: solid;border-color: #729ea5;text-align:left;}
.tftable tr {background-color:#ffffff;}
.tftable td {font-size:12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #729ea5;}
</style>
