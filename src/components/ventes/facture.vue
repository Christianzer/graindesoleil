<template>
  <div class="container-fluid p-3">
    <!-- Page Heading -->
    <PageHeader title="Bon de livraison" subtitle="Détail et impression du bon de livraison" crumb="Ventes" />

    <b-alert
      show variant="danger" class="d-flex align-items-center"
      v-if="informationPaiement && informationPaiement.type_facture === 'avoir' && informationPaiement.facture_origine">
      <i class="fas fa-link mr-2"></i>
      Avoir établi sur le bon de livraison <strong class="ml-1">{{ informationPaiement.facture_origine }}</strong>
    </b-alert>

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
                      BON DE LIVRAISON N°: {{informationPaiement.code_facture}}
                    </td>
                    <td class="font-weight-bold text-primary text-uppercase" v-if="informationPaiement.date_facture_update != null">
                      DATE : {{ date_com(informationPaiement.date_facture_update)}}
                    </td>

                    <td class="font-weight-bold text-primary text-uppercase" v-else>
                      DATE : {{ date_com(informationPaiement.date_facture)}}
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
              <td>PRIX UNITAIRE</td>
              <td class="text-uppercase">Quantité</td>
              <td>TOTAL</td>
            </tr>

            <tr class="item" v-for="articles in articlesPayer" :key="articles.id">
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{articles.libelle_produit}}</td>
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{articles.prix_vente}}</td>
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{articles.quantite_acheter}}</td>
              <td style="font-size: 16px" class="text-primary font-weight-bold">{{new Intl.NumberFormat().format(articles.total_payer)}}</td>
            </tr>


            <tr class="total">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">Total: {{new Intl.NumberFormat().format(informationPaiement.montant_total_factures)}} FCFA</td>
            </tr>

            <tr class="total" v-for="(item, index) in versement_data">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">Versement {{index + 1}}  : {{new Intl.NumberFormat().format(Math.floor(item.montant_verser))}} FCFA</td>
            </tr>

            <tr class="total">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">Total Versement: {{new Intl.NumberFormat().format(Math.floor(versement))}} FCFA</td>
            </tr>

            <tr class="total">
              <td colspan="3"></td>
              <td style="font-size: 16px" class="text-success font-weight-bold text-uppercase">Reste à payer: {{new Intl.NumberFormat().format(Math.floor(informationPaiement.montant_total_factures_ttc-versement))}} FCFA</td>
            </tr>




          </table>
        </div>
      </div>

      <!-- Avoirs liés à ce bon de livraison -->
      <div class="mt-3 p-3 border border-danger rounded" v-if="avoirsLies.count > 0">
        <div class="font-weight-bold text-danger mb-2">
          &#8617; Ce bon de livraison a fait l'objet d'avoir(s) — Total crédité :
          {{ new Intl.NumberFormat().format(Math.floor(avoirsLies.total_ttc || 0)) }} FCFA
        </div>
        <ul class="list-unstyled mb-0">
          <li v-for="av in avoirsLies.liste" :key="av.code_facture" style="font-size:13px;">
            <b-badge variant="danger" class="mr-2">{{ av.code_facture }}</b-badge>
            {{ new Intl.NumberFormat().format(Math.floor(av.montant_total_factures_ttc || 0)) }} FCFA
            <span class="text-muted">— {{ date_com(av.date_facture) }}</span>
          </li>
        </ul>
      </div>

      <br>
      <div align="right">
        <b-button variant="danger" class="mr-1" @click="retour">
          RETOUR
        </b-button>
        <b-button variant="primary" class="mr-1" @click="imprimer(informationPaiement.code_facture)">
          IMPRIMER LA FACTURE
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
export default {
  name: "facture",
  components: { PageHeader },
  data() {
    return {
      isLoading :false,
      Loading : false,
      articlesPayer : [],
      informationPaiement:[],
      code_article : '',
      versement:0,
      versement_data:[],
      avoirsLies: { liste: [], total_ht: 0, total_ttc: 0, count: 0 },
    }
  },
  methods : {
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },
    async chargerDonne(code_facture){
      this.Loading = false
      let api_data = `${API_BASE_URL}/api/factures/${code_facture}`
      await axios.get(api_data).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.informationPaiement = response.data.factures
          this.articlesPayer = response.data.element
          this.versement = response.data.versement
          this.versement_data = response.data.versements_data
          this.avoirsLies = response.data.avoirs_lies || { liste: [], total_ht: 0, total_ttc: 0, count: 0 }
        }
      }).catch((err) => {
        console.log(err)
      })
      this.Loading = true
    },
    retour(){
      this.$router.push({ name: 'dashboard'})
    },

    async imprimer(code_facture){
      let api_data = `${API_BASE_URL}/api/imprimer_factures_perso/${code_facture}`
      ouvrirDocument(api_data);
    },
  },

  created() {
    flow.clearSale()
    this.code_facture = this.$route.params.code_facture
    this.chargerDonne(this.code_facture)

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
