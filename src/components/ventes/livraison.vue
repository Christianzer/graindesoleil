<template>
  <div class="container-fluid p-3">
    <!-- Page Heading -->
    <PageHeader :title="mode === 'ht' ? 'Bon de livraison HT' : (informationPaiement.type === 2 ? 'Pro forma' : 'Bon de livraison')" :subtitle="mode === 'ht' ? 'Document de la vente diverse' : 'Document de la vente'" :crumb="mode === 'ht' ? 'Ventes diverses' : 'Ventes'" />


    <div class="text-center p-5" v-if="Loading === false">
      <b-spinner variant="primary" style="width: 5rem; height: 5rem;" label="Large Spinner"></b-spinner>
      <b-spinner variant="primary" type="grow" style="width: 5rem; height: 5rem;" label="Spinning"></b-spinner>
    </div>
    <div v-else>
      <div id="essaie">
        <div class="invoice-box">
          <table>
            <tr class="top">
              <td colspan="4">
                <table>
                  <tr>
                    <td class="title">
                      <img src="@/assets/logo_obf.png" style="width:100%; max-width:150px;">
                    </td>
                    <td class="font-weight-bold text-primary">
                      {{ informationPaiement.type === 2 ? 'PRO FORMA N°:' : 'BON DE LIVRAISON N°:' }} {{informationPaiement.code_commande}}
                    </td>
                    <td class="font-weight-bold text-primary text-uppercase" v-if="informationPaiement.date_commande_update != null">
                      {{ informationPaiement.type === 2 ? 'DATE PRO FORMA :' : 'DATE BON DE LIVRAISON :' }} : {{ date_com(informationPaiement.date_commande_update)}}
                    </td>
                    <td class="font-weight-bold text-primary text-uppercase" v-else>
                      {{ informationPaiement.type === 2 ? 'DATE PRO FORMA :' : 'DATE BON DE LIVRAISON :' }} : {{ date_com(informationPaiement.date_commande)}}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr class="information">
              <td colspan="4">
                <table>
                  <tr>
                    <td class="font-weight-bold text-primary text-uppercase">
                      Grains Moulus
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr class="heading">
              <td colspan="4" class="text-uppercase text-danger font-weight-bold">Information Client</td>
            </tr>

            <tr class="details">
              <td>{{informationPaiement.nom}} {{informationPaiement.prenoms}}</td>
              <td>CC: {{informationPaiement.compte_contr}}</td>
              <td>Mail: {{informationPaiement.mail}}</td>
              <td>Contact 1: {{informationPaiement.telephone}} Contact 2: {{informationPaiement.contact}}</td>
            </tr>

            <tr class="heading">
              <td>LIBELLE PRODUIT</td>
              <td>PRIX LIVRAISON HT</td>
              <td class="text-uppercase">Quantité</td>
              <td>TOTAL HT</td>
            </tr>

            <tr class="item" v-for="articles in articlesPayer" :key="articles.id">
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{articles.libelle_produit}}</td>
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{Math.floor(articles.prix_vente)}}</td>
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{articles.quantite_acheter}}</td>
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{new Intl.NumberFormat().format(Math.floor(articles.total_payer))}}</td>
            </tr>
            <tr class="total">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">Total HT : {{new Intl.NumberFormat().format(Math.floor(informationPaiement.montant_total))}} FCFA</td>
            </tr>
            <tr class="total" v-if="mode !== 'ht'">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">TVA 18% : {{new Intl.NumberFormat().format(Math.floor((informationPaiement.montant_total * 18)/100))}} FCFA</td>
            </tr>
            <tr class="total" v-if="mode !== 'ht'">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">Total TTC : {{new Intl.NumberFormat().format(Math.floor(informationPaiement.montant_total_ttc))}} FCFA</td>
            </tr>
          </table>
        </div>
      </div>
      <br>
      <div align="right">
        <b-button variant="danger" class="mr-1" @click="retour">
          RETOUR
        </b-button>
        <b-button variant="primary" class="mr-1" @click="imprimer(informationPaiement.code_commande)">
          IMPRIMER {{ informationPaiement.type === 2 ? 'LA PRO FORMA' : 'LE BON DE LIVRAISON:' }}
        </b-button>
      </div>
    </div>

  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
import { ouvrirDocument } from "@/utils/print.js";
//const electron = require('electron')
//const BrowserWindow = electron.remote.BrowserWindow;
export default {
  components: { PageHeader },
  name: "facture",
  // mode : 'ttc' ou 'ht' (vente diverse — titre BL HT, masque TVA/TTC).
  props: {
    mode: { type: String, default: 'ttc' }
  },
  data() {
    return {
      isLoading : false,
      Loading : false,
      articlesPayer : [],
      informationPaiement:[],
      type: null, // sera 'proforma' ou 'bon_livraison'
      code_article : ''
    }
  },
  computed : {

  },
  methods : {
    async chargerDonne(code_commande){
      this.Loading = false
      let api_data = `${API_BASE_URL}/api/commandes/${code_commande}`
      await axios.get(api_data).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.informationPaiement = response.data.factures
          this.articlesPayer = response.data.element
          this.type = this.informationPaiement.type === 2 ? 'proforma' : 'bon_livraison'
        }
      }).catch((err) => {
        console.log(err)
      })
      this.Loading = true
    },
    retour(){
      this.$router.push({ name: 'dashboard'})
    },
    async imprimer(code_commande){
      let api_data = `${API_BASE_URL}/api/imprimer_livraison/${code_commande}`
      ouvrirDocument(api_data);
    },
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },
  },

  created() {
    flow.clearSale()
    this.code_commande = this.$route.params.code_commande
    this.chargerDonne(this.code_commande)
  }
}
</script>

<style scoped lang="scss">

.invoice-box table {
  width: 100%;
}


.invoice-box table tr td:nth-child(n + 2) {
  text-align: right;
}

.invoice-box table tr.top table td {
  padding-bottom: 10px;
}

.invoice-box table tr.top table td.title {
  font-size: 45px;
  line-height: 45px;
  color: #333;
}

.invoice-box table tr.information table td {
  padding-bottom: 10px;
}

.invoice-box table tr.heading td {
  background: #eee;
  border-bottom: 1px solid #ddd;
  font-weight: bold;
}

.invoice-box table tr.details td {
  padding-bottom: 10px;
}

.invoice-box table tr.item td {
  border-bottom: 1px solid #eee;
}

.invoice-box table tr.item.last td {
  border-bottom: none;
}

.invoice-box table tr.item input {
  padding-left: 5px;
}

.invoice-box table tr.item td:first-child input {
  margin-left: -5px;
  width: 100%;
}

.invoice-box table tr.total td:nth-child(2) {
  border-top: 2px solid #eee;
  font-weight: bold;
}

.invoice-box input[type="number"] {
  width: 60px;
}

@media only screen and (max-width: 600px) {
  .invoice-box table tr.top table td {
    width: 100%;
    text-align: center;
  }

  .invoice-box table tr.information table td {
    width: 100%;
    text-align: center;
  }
}

/** RTL **/
.rtl {
  direction: rtl;
  font-family: Tahoma, "Helvetica Neue", "Helvetica", Helvetica, Arial,
  sans-serif;
}

.rtl table {
  text-align: right;
}

.rtl table tr td:nth-child(2) {
  text-align: left;
}

</style>
