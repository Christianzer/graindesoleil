<template>
  <b-modal ref="my-modal" size="xl" no-close-on-backdrop :hide-footer="true" :title="title">
    <form @submit.prevent="save">
      <div class="row">
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Code facture"
          >
            <b-form-input class="text-uppercase font-weight-bold" readonly v-model="formData.code_facture"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Montant à payer">
            <b-form-input class="text-uppercase font-weight-bold" readonly v-model="formData.montant_facture"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Type de paiement"
          >
            <b-form-select class="text-uppercase font-weight-bold" v-model="selected" :options="options"></b-form-select>
          </b-form-group>
        </div>
      </div>
      <div class="row" v-if="selected === 1">
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Versement"
          >
            <b-form-input type="number" min="2000" class="text-uppercase font-weight-bold" required v-model="formData.versement"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Reste à payer"
          >
            <b-form-input type="number" v-model="reste_payer" class="text-uppercase font-weight-bold" readonly ></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Date versement"
          >
            <b-form-datepicker
                placeholder="Selectionner une date"
                class="text-uppercase font-weight-bold"
                locale="fr-FR"
                v-model="formData.date_versement">
            </b-form-datepicker>
          </b-form-group>
        </div>
      </div>
      <div class="row" v-if="selected === 2">
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Banque"
          >
            <b-form-input required class="text-uppercase font-weight-bold" v-model="formData.banque"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Numéro de chèque"
          >
            <b-form-input required class="text-uppercase font-weight-bold" v-model="formData.numero_cheque"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Montant"
          >
            <b-form-input type="number" class="text-uppercase font-weight-bold" min="2000" required v-model="formData.versement"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Reste à payer"
          >
            <b-form-input type="number" v-model="reste_payer" class="text-uppercase font-weight-bold" readonly ></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Date versement"
          >
            <b-form-datepicker
                placeholder="Selectionner une date"
                class="text-uppercase font-weight-bold"
                locale="fr-FR"
                v-model="formData.date_versement">
            </b-form-datepicker>
          </b-form-group>
        </div>
      </div>
      <div class="row" v-if="selected === 3">
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Type de reseau"
          >
            <b-form-select v-model="selectedReseau" class="text-uppercase font-weight-bold" :options="optionsReseau"></b-form-select>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Numéro téléphone"
          >
            <b-form-input minlength="10" maxlength="10" class="text-uppercase font-weight-bold"  required v-model="formData.numero_telephone"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Montant"
          >
            <b-form-input type="number" class="text-uppercase font-weight-bold" required  min="2000" v-model="formData.versement"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Reste à payer"
          >
            <b-form-input type="number" v-model="reste_payer" class="text-uppercase font-weight-bold" readonly ></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Date versement"
          >
            <b-form-datepicker
                placeholder="Selectionner une date"
                class="text-uppercase font-weight-bold"
                locale="fr-FR"
                v-model="formData.date_versement">
            </b-form-datepicker>
          </b-form-group>
        </div>
      </div>
      <div class="row" v-if="selected === 4">
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Banque"
          >
            <b-form-input required class="text-uppercase font-weight-bold" v-model="formData.banque"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Numéro de virement"
          >
            <b-form-input class="text-uppercase font-weight-bold" v-model="formData.numero_virement"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Montant"
          >
            <b-form-input type="number" class="text-uppercase font-weight-bold" min="2000" required v-model="formData.versement"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Reste à payer"
          >
            <b-form-input type="number" v-model="reste_payer" class="text-uppercase font-weight-bold" readonly ></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Date versement"
          >
            <b-form-datepicker
                placeholder="Selectionner une date"
                class="text-uppercase font-weight-bold"
                locale="fr-FR"
                v-model="formData.date_versement">
            </b-form-datepicker>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <b-form-group
              class="text-uppercase font-weight-bold text-danger"
              label="Monnaie"
          >
            <b-form-input type="number" disabled class="text-uppercase font-weight-bold" required v-model="a_rendre"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row justify-content-end">
        <b-button variant="success mr-1" type="submit" :disabled="isSubmitting" v-if="formData.versement > 0">Valider</b-button>
        <b-button variant="primary mr-1" :disabled="isSubmitting" @click="autreValidation" v-if="a_rendre > 0">Valider et déduire la monnaie sur un autre paiement</b-button>
        <b-button variant="danger mr-1" @click="closeModal">fermer</b-button>
      </div>
    </form>
  </b-modal>

</template>

<script>
import API_BASE_URL from '@/api/config.js'
import moment from "moment/moment";

const axios = require('axios')
export default {
  name: "encaissement",
  props: {
    selectedTA: {}
  },
  data() {
    return {
      apidata :  + '/api/produits',
      selected : 1,
      selectedReseau:1,
      validattion : 1,
      title:"ENCAISSEMENT FACTURE",
      code_recu:null,
      isSubmitting:false,
      formData: {
        code_facture : "",
        montant_facture:0,
        versement:0,
        banque:"",
        numero_cheque:"",
        numero_telephone:"",
        numero_virement:"",
        date_versement:moment().format('YYYY-MM-DD')
      },
      options: [
        { value: 1, text: 'En Espèce' },
        { value: 2, text: 'Par chèque' },
        { value: 3, text: 'Par Mobile Monney' },
        { value: 4, text: 'Par Virement' },
      ],
      optionsReseau: [
        { value: 1, text: 'ORANGE' },
        { value: 2, text: 'MOOV' },
        { value: 3, text: 'MTN' },
      ]
    }
  },
  methods: {
    showModal() {
      this.formData.code_facture = this.selectedTA.code_facture
      this.formData.montant_facture = this.selectedTA.montant_total_factures_ttc - this.selectedTA.verser - (this.selectedTA.avoir || 0)
      this.$refs['my-modal'].show()
    },
    makeToast(variant = null) {
      this.$bvToast.toast('Encaissement effectué avec succès', {
        title: `${variant || 'default'}`,
        toaster: 'b-toaster-top-center',
        variant: variant,
        autoHideDelay: 5000,
        solid: true
      })
    },
    closeModal() {
      this.$refs['my-modal'].hide()
    },
    async save(){
      if (this.isSubmitting) return
      this.isSubmitting = true
      var paiementtype
      var reseau
      var paiement


      if (this.selectedReseau === 1){
        reseau = 'ORANGE'
      }
      if (this.selectedReseau === 2){
        reseau = 'MOOV'
      }
      if (this.selectedReseau === 3){
        reseau = 'MTN'
      }

      if (this.selected === 1){
        paiementtype = 'Espèce'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : null,
          numero_cheque:null,
          numero_telephone:null,
          reseau:null,

        }

      }
      if (this.selected === 2){
        paiementtype = 'Chèque'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : this.formData.banque,
          numero_cheque:this.formData.numero_cheque,
          numero_telephone:null,
          reseau:null,

        }

      }
      if (this.selected === 3){
        paiementtype = 'Mobile Monney'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : null,
          numero_cheque:null,
          numero_telephone:this.formData.numero_telephone,
          reseau:this.selectedReseau,

        }

      }
      if (this.selected === 4){
        paiementtype = 'Virement'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : this.formData.banque,
          numero_cheque:null,
          numero_telephone:null,
          reseau:null,
          numero_virement: this.formData.numero_virement
        }

      }



      var dataInfo = {
        montant_verser : this.formData.versement,
        code_facture : this.formData.code_facture,
        date_versement : this.formData.date_versement,
        type_paiment : this.selected,
        monnaie:this.a_rendre,
        paiement:paiement,
        type:1
      }



      await axios.post(API_BASE_URL + "/api/faire_paiement",dataInfo)
          .then(response=>{
            if (response.status === 201){
              this.code_recu = response.data
              this.validattion = 2
              Fire.$emit('factureOk');
              this.makeToast('success')
              this.$router.push({ name: 'recu', params: { code_recu: this.code_recu}})
            }
          }).catch((err) => {
            console.log(err)
          })
      this.isSubmitting = false

    },
    async autreValidation(){
      if (this.isSubmitting) return
      this.isSubmitting = true
      var paiementtype
      var reseau
      var paiement


      if (this.selectedReseau === 1){
        reseau = 'ORANGE'
      }
      if (this.selectedReseau === 2){
        reseau = 'MOOV'
      }
      if (this.selectedReseau === 3){
        reseau = 'MTN'
      }

      if (this.selected === 1){
        paiementtype = 'Espèce'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : null,
          numero_cheque:null,
          numero_telephone:null,
          reseau:null,

        }

      }
      if (this.selected === 2){
        paiementtype = 'Chèque'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : this.formData.banque,
          numero_cheque:this.formData.numero_cheque,
          numero_telephone:null,
          reseau:null,

        }

      }
      if (this.selected === 3){
        paiementtype = 'Mobile Monney'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : null,
          numero_cheque:null,
          numero_telephone:this.formData.numero_telephone,
          reseau:this.selectedReseau,

        }

      }
      if (this.selected === 4){
        paiementtype = 'Virement'
        paiement = {
          type_paiement : paiementtype,
          montant : this.formData.versement,
          banque : this.formData.banque,
          numero_cheque:null,
          numero_telephone:null,
          reseau:null,
          numero_virement: this.formData.numero_virement
        }

      }



      var dataInfo = {
        montant_verser : this.formData.versement,
        code_facture : this.formData.code_facture,
        date_versement : this.formData.date_versement,
        type_paiment : this.selected,
        monnaie:this.a_rendre,
        paiement:paiement,
        type:2
      }



      await axios.post(API_BASE_URL + "/api/faire_paiement",dataInfo)
          .then(response=>{
            if (response.status === 201){
              this.makeToast('success')
              this.code_recu = response.data
              this.validattion = 2
              Fire.$emit('factureOk');
              this.makeToast('success')
              this.$router.push({ name: 'recu', params: { code_recu: this.code_recu}})
            }
          }).catch((err) => {
            console.log(err)
          })
      this.isSubmitting = false

    },

  },
  watch: {
    selected () {
      console.log("selected "+this.selected)
    }
  },
  computed : {
    reste_payer(){
      let val = 0;
      val = this.formData.montant_facture - this.formData.versement ;
      if (val>=0){
        return val;
      }else{
        return 0;
      }
    },
    a_rendre(){
      let val = 0;
      val = this.formData.montant_facture - this.formData.versement
      if (this.formData.versement < this.formData.montant_facture){
        return 0
      }else{
        return Math.abs(val)
      }
    },
  },


}
</script>

<style scoped>

</style>
