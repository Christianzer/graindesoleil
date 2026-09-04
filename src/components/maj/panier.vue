<template>
  <div class="container-fluid p-3">
    <PageHeader title="Bon de livraison" subtitle="Génération du bon de livraison" crumb="Ventes" />

    <div class="card shadow mb-4">
      <div class="card-header py-3 text-uppercase font-weight-bold">
        Produit
      </div>
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>

          <table class="table tftable table-responsive" style="width: auto" align="center">
            <tr>
              <th>Libelle Produit</th>
              <th>Quantité disponible</th>
              <th>Prix unitaire FCFA</th>
              <th>Quantité achété</th>
              <th>Total FCFA</th>
            </tr>
            <tr v-for="selected in produit" :key="selected.id_article">
              <td>
                <b-form-input readonly class="font-weight-bold" style="font-size: small" v-model="selected.libelle_produit"/>
              </td>
              <td>
                <b-form-input readonly class="font-weight-bold" style="font-size: small" :value="selected.quantite_produit - selected.quantite_acheter"/>
              </td>
              <td>
                <b-form-input type="number" class="font-weight-bold" style="font-size: small" v-model="selected.prix_vente"/>
              </td>
              <td class="text-center" width="10%">
                <b-form-input type="number" class="font-weight-bold" style="font-size: small" min="1" :max="selected.quantite_produit"  v-model="selected.quantite_acheter"/>
                <!--
                 -->
                <!--
                 <b-row>
                  <b-col cols="3" class="text-center">
                    <b-button variant="outline-danger" @click="diminuer(selected.id_article)" :disabled="selected.quantite_acheter <= 1">
                      -
                    </b-button>
                  </b-col>
                  <b-col cols="5" class="text-center">
                    <h4>{{selected.quantite_acheter}}</h4>
                  </b-col>
                  <b-col cols="3" class="text-center">
                    <b-button variant="outline-primary" @click="augmenter(selected.id_article)" :disabled="selected.quantite_acheter >= selected.quantite_produit ">
                      +
                    </b-button>
                  </b-col>
                </b-row>
                 -->
              </td>
              <td>
                <b-form-input type="number" readonly class="font-weight-bold" style="font-size: small"  :value="selected.quantite_acheter * selected.prix_vente"/>
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
                    label="A quelle date voulez vous enregistrer le bon de livraison ?"
                    label-for="input-horizontal"
            >
              <b-form-datepicker
                      placeholder="Selectionner une date"
                      locale="fr-FR"
                      v-model="update_at"
                      class="mb-2 col-lg-3">
              </b-form-datepicker>
            </b-form-group>
          </div>
          <div class="text-right">
            <h4 class="text-uppercase text-right text-danger font-weight-bolder" v-if="produit.length > 0"> TOTAL: {{ new Intl.NumberFormat().format(total) }} FCFA</h4>
          </div>
          <b-row class="mt-4 text-left">
            <b-col>
              <b-button variant="success" class="mr-1" :disabled="Loading" @click="inserercommande" v-if="total > 0">
                Valider le bon de livraison
              </b-button>
            </b-col>
            <b-col></b-col>
            <!--
              <b-col cols="3"></b-col>
            <b-col class="text-right">
                <b-button variant="danger" @click="vider" class="mr-1">Vider le panier</b-button>
            </b-col>
             -->

          </b-row>
        </template>
      </div>
    </div>

    <!-- Facture -->
    <!--
      <div class="card shadow mb-4" v-if="afficherPaiement === true">
        <div class="card-header py-3 text-uppercase font-weight-bold">
           Bon de commande
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-8">
                    <b-form-input :value="information" disabled></b-form-input>
                </div>
                <div class="col-md-4">
                    <b-form-input disabled :value="data_clients.telephone"></b-form-input>
                </div>
            </div>
            <br>
            <div class="row">
                <div class="col-md-4">
                    <b-form-group
                        label-cols-sm="4"
                        label-cols-lg="5"
                        content-cols-sm
                        content-cols-lg="7"
                        label="Montant à payer"
                        label-for="input-horizontal"
                    >
                        <b-form-input v-model="total" disabled></b-form-input>
                    </b-form-group>
                </div>
                <div class="col-md-4">
                    <b-form-group
                        label-cols-sm="4"
                        label-cols-lg="5"
                        content-cols-sm
                        content-cols-lg="7"
                        label="Montant versé"
                        label-for="input-horizontal"
                    >
                        <b-form-input type="number" v-model="montant_deposer" min="0"></b-form-input>
                    </b-form-group>
                </div>
                <div class="col-md-4">
                    <b-form-group
                        label-cols-sm="4"
                        label-cols-lg="5"
                        content-cols-sm
                        content-cols-lg="7"
                        label="Montant à rendre"
                        label-for="input-horizontal"
                    >
                        <b-form-input type="number" v-model="monnaie" disabled></b-form-input>
                    </b-form-group>
                </div>
            </div>
            <div class="row justify-content-end">
                <b-button variant="danger mr-3" type="button" disabled v-if="montant_deposer < total">Payer {{new Intl.NumberFormat().format(montant_deposer)}} FCFA</b-button>
                <b-button variant="primary mr-3" type="button" v-else :disabled="Loading" @click="achat()">Payer {{new Intl.NumberFormat().format(montant_deposer)}} FCFA</b-button>
            </div>
        </div>
    </div>
     -->
    <b-overlay :show="Loading" no-wrap>
    </b-overlay>

  </div>
</template>

<script>

import axios from "axios";
import moment from "moment";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";


export default {
  name: "panier",
  components: { PageHeader },
  data() {
    return {
      Loading : false,
      save:false,
      loader:false,
      next:false,
      prec : false,
      tabIndex: 0,
      produit : [],
      created : "",
      information : "",
      data_clients : flow.getClients(),
      montant_deposer:0,
      afficherPaiement : false,
      update_at: '',
    }
  },

  methods: {
    supprimerProduits(id){
      console.log(id)
      for (let index = 0;index < this.produit.length;index++){
        if (this.produit[index].id_article === id){
          this.produit.splice(index,1);
          flow.setProduits(this.produit)
        }
      }
    },
    async achat(){
      if (this.Loading) return
      this.Loading = true
      var data = {
        produits : this.produit,
        bareme : 'standard',
        montant_total : this.total,
        somme_verse:this.montant_deposer,
        somme_rendu:this.monnaie,
        clients:this.data_clients.id,
        update_data : this.update_at
      }
      let api = `${API_BASE_URL}/api/facture_directe`
      await axios.post(api,data).then(response=>{
        let statut = response.status
        if (statut === 201){
          flow.clearSale()
          let code_facture = response.data
          this.$router.push({ name: 'facture', params: { code_facture: code_facture}})
        }
      }).catch((err) => {
        console.log(err)
      })
      this.Loading = false
    },
    augmenter(id){
      for (let index = 0;index < this.produit.length;index++) {
        if (this.produit[index].id_article === id) {
          this.produit[index].quantite_acheter++
          flow.setProduits(this.produit)
        }
      }
    },
    diminuer(id){
      for (let index = 0;index < this.produit.length;index++) {
        if (this.produit[index].id_article === id) {
          this.produit[index].quantite_acheter--
          flow.setProduits(this.produit)
        }
      }
    },
    vider(){
      this.afficherPaiement = false
      this.produit = []
      for (const key in this.produit){
        this.produit[key].consulter = false
      }
      flow.setProduits(this.produit)
    },
    async inserercommande(){
      if (this.Loading) return
      this.Loading = true
      let date_commande = moment().format('YYYY-MM-DD')
      var data = {
        produits : this.produit,
        bareme : 'standard',
        montant_total : this.total,
        montant_total_ttc: this.total,
        niveau_prix: flow.getNiveauPrix() || 'detail',
        clients:this.data_clients.id,
        date_commande:date_commande,
        update_data : this.update_at,
        avec_fne: false,
      }
      let api = `${API_BASE_URL}/api/facture_directe`
      await axios.post(api,data).then(response=>{
        let statut = response.status
        if (statut === 201){
          flow.clearSale()
          let code_facture = response.data
          this.$router.push({ name: 'facture', params: { code_facture: code_facture}})
        }
      }).catch((err) => {
        console.log(err)
      })
      this.Loading = false
    },

  },
  computed : {
    total(){
      let t = 0;
      for (let index = 0; index < this.produit.length ; index ++){
        t += this.produit[index].prix_vente * this.produit[index].quantite_acheter
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
    monnaie(){
      let val = 0;
      val = this.total - this.montant_deposer
      return Math.abs(val)
    },
    tva_pourcent(){
      let val = 0;
      val = (this.total * 18)/100
      return Math.floor(val)
    }
  },
  created() {
    this.loader = false
    this.update_at = moment().format('YYYY-MM-DD')
    const produitsEnCours = flow.getProduits()
    if (produitsEnCours){
      this.produit = produitsEnCours
    }else {
      this.produit = []
    }
    this.information = this.data_clients.nom+" "+this.data_clients.prenoms
    this.loader = true

  }
}
</script>

<style scoped>
.tftable {font-size:12px;color:#333333;width:100%;border-width: 1px;border-color: #729ea5;border-collapse: collapse;}
.tftable th {font-size:12px;background-color:#acc8cc;border-width: 1px;padding: 8px;border-style: solid;border-color: #729ea5;text-align:left;}
.tftable tr {background-color:#ffffff;}
.tftable td {font-size:12px;border-width: 1px;padding: 8px;border-style: solid;border-color: #729ea5;}
</style>
