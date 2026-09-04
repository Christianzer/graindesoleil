<template>
  <div class="container-fluid p-3">
    <!-- Page Heading -->
    <PageHeader title="Reçu" subtitle="Reçu de paiement" crumb="Trésorerie" />


    <div class="text-center p-5" v-if="Loading === false">
      <b-spinner variant="primary" style="width: 5rem; height: 5rem;" label="Large Spinner"></b-spinner>
      <b-spinner variant="primary" type="grow" style="width: 5rem; height: 5rem;" label="Spinning"></b-spinner>
    </div>
    <div v-else>
      <div id="essaie">
        <div class="invoice-box table-responsive">
          <table>
            <tr class="top">
              <td colspan="3">
                <table>
                  <tr>
                    <td class="title">

                      <img src="@/assets/logo_obf.png" style="width:100%; max-width:150px;">

                    </td>
                    <td class="font-weight-bold text-uppercase text-primary">
                      N° réçu: {{informationPaiement.code_versement}}
                    </td>
                    <td class="font-weight-bold text-primary text-uppercase">
                      DATE réçu : {{date_com(informationPaiement.date_versement)}}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr class="information">
              <td colspan="3">
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
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">CLIENTS </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.clients}}</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.telephone">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">CONTACT 1 </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.telephone}}</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.contact">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">CONTACT 2 </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.contact}}</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.factures">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">FACTURE </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.factures}}</td>
            </tr>


            <tr class="heading" v-if="informationPaiement.type_paiement === 1">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">MOYEN DE PAIEMENT</td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">ESPèce</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.type_paiement === 2">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">MOYEN DE PAIEMENT</td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">Chèque</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.type_paiement === 3">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">MOYEN DE PAIEMENT</td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">MOBILE MONNEY</td>
            </tr>



            <tr class="heading" v-if="informationPaiement.a_payer">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">à PAYER </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{new Intl.NumberFormat().format(informationPaiement.a_payer)}} FCFA</td>
            </tr>


            <tr class="heading" v-if="informationPaiement.montant_verser">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">payé </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{new Intl.NumberFormat().format(informationPaiement.montant_verser+informationPaiement.monnaie)}} FCFA</td>
            </tr>


            <tr class="heading" v-if="informationPaiement.reste_payer">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">rESTE à PAYé </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{new Intl.NumberFormat().format(informationPaiement.reste_payer)}} FCFA</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.monnaie">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">A rendre</td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{new Intl.NumberFormat().format(informationPaiement.monnaie)}} FCFA</td>
            </tr>


            <tr class="heading" v-if="informationPaiement.paiement.banque">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">BANQUE </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.paiement.banque}}</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.paiement.reseau">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">OPERATEUR </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left" v-if="informationPaiement.paiement.reseau === 1">ORANGE</td>
              <td class="text-uppercase font-weight-bold text-dark text-left" v-if="informationPaiement.paiement.reseau === 2">MOOV</td>
              <td class="text-uppercase font-weight-bold text-dark text-left" v-if="informationPaiement.paiement.reseau === 3">MTN</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.paiement.numero_telephone">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">nUMéro téléphone </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.paiement.numero_telephone}}</td>
            </tr>

            <tr class="heading" v-if="informationPaiement.paiement.numero_cheque">
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 15%">nUMéro chèque </td>
              <td class="text-uppercase font-weight-bold text-danger text-left" style="width: 1%">:</td>
              <td class="text-uppercase font-weight-bold text-dark text-left">{{informationPaiement.paiement.numero_cheque}}</td>
            </tr>



          </table>
        </div>
      </div>
      <br>
      <div align="right">
        <b-button variant="danger" class="mr-1" @click="retour">
          RETOUR
        </b-button>
        <b-button variant="primary" class="mr-1" @click="imprimer(informationPaiement.code_versement)">
          IMPRIMER
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
  data() {
    return {
      isLoading : false,
      Loading : false,
      articlesPayer : [],
      informationPaiement:[],
      code_recu : ''
    }
  },
  computed : {
    tva_commande(){

    }
  },
  methods : {
    async chargerDonne(code_recu){
      this.Loading = false
      let api_data = `${API_BASE_URL}/api/information/${code_recu}`
      await axios.get(api_data).then(response=>{
        let statut = response.status
        if (statut === 201){
          this.informationPaiement = response.data
        }
      }).catch((err) => {
        console.log(err)
      })
      this.Loading = true
    },
    retour(){
      this.$router.push({ name: 'caisses'})
    },
    date_com(value){
      return moment(value).locale('fr').format("dddd D MMMM YYYY")
    },

    async imprimer(code_commande) {
      const api_data = `${API_BASE_URL}/api/imprimer_recu/${code_commande}`
      ouvrirDocument(api_data)
    }

  },

  created() {
    flow.clearSale()
    this.code_recu = this.$route.params.code_recu
    this.chargerDonne(this.code_recu)
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
