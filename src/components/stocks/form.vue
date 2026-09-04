<template>
  <b-modal ref="my-modal" :hide-footer="true" :title="title">
    <form @submit.prevent="save">
      <div class="row">
        <div class="col-md-5" v-if="editMode">
          <b-form-group
              label="Code produit"
          >
            <b-form-input v-model="formData.code_produit" disabled></b-form-input>
          </b-form-group>
        </div>
        <div :class="editMode ? 'col-md-7' : 'col-md-12'">
          <b-form-group
              label="Libelle Produit">
            <b-form-input v-model="formData.libelle_produit"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <b-form-group
              label="Quantite produit"
          >
            <b-form-input type="number" min="0" v-model="formData.quantite_produit"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <b-form-group label="Prix Détail">
            <b-form-input type="number" v-model="formData.prix_detail"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group label="Prix Demi-gros">
            <b-form-input type="number" v-model="formData.prix_demi_gros"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-4">
          <b-form-group label="Prix Gros">
            <b-form-input type="number" v-model="formData.prix_gros"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row justify-content-end">
        <b-button variant="primary mr-1" type="submit" :disabled="isSubmitting">enregistrer</b-button>
        <b-button variant="danger mr-1" @click="closeModal">fermer</b-button>
      </div>
    </form>
  </b-modal>

</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
export default {
  name: "form",
  props: {
    selectedTA: {},
    editMode: Boolean
  },
  data() {
    return {
      apidata : `${API_BASE_URL}/api/produits`,
      selected : null,
      isSubmitting : false,
      title:"Mise à jour produits",
      formData: {
        id:null,
        code_produit: "",
        libelle_produit: "",
        quantite_produit:0,
        prix_detail:0,
        prix_demi_gros:0,
        prix_gros:0,
      }
    }
  },
  methods: {
    showModal() {
      if (this.editMode === true) {
        this.selected = this.selectedTA.code_produit
        this.formData.code_produit = this.selectedTA.code_produit
        this.formData.libelle_produit = this.selectedTA.libelle_produit
        this.formData.quantite_produit = this.selectedTA.quantite_produit
        this.formData.prix_detail = this.selectedTA.prix_detail
        this.formData.prix_demi_gros = this.selectedTA.prix_demi_gros
        this.formData.prix_gros = this.selectedTA.prix_gros
      } else {
        this.formData.code_produit = ''
        this.formData.libelle_produit = ''
        this.formData.quantite_produit = 0
        this.formData.prix_detail = 0
        this.formData.prix_demi_gros = 0
        this.formData.prix_gros = 0
      }
      this.$refs['my-modal'].show()
    },
    closeModal() {
      this.$refs['my-modal'].hide()
    },
    async save(){
      if (this.isSubmitting) return
      this.isSubmitting = true
      var data = {
        code_produit : this.formData.code_produit,
        libelle_produit : this.formData.libelle_produit,
        quantite_produit : parseInt(this.formData.quantite_produit),
        prix_detail : parseFloat(this.formData.prix_detail),
        prix_demi_gros : parseFloat(this.formData.prix_demi_gros),
        prix_gros : parseFloat(this.formData.prix_gros),
        code_prod : this.selected
      }
      if (this.editMode === true){
        let api_donne = `${API_BASE_URL}/api/produits_update`
        await axios.post(api_donne,data)
            .then(response=>{
              let statut = response.status
              if (statut === 201){
                Fire.$emit('creationok');
                this.closeModal()//custom events
              }
            }).catch((err) => {
              console.log(err)
            })
      }else {
        await axios.post(this.apidata,data)
            .then(response=>{
              let statut = response.status
              if (statut === 201){
                Fire.$emit('creationok');
                this.closeModal()//custom events
              }
            }).catch((err) => {
              console.log(err)
            })

      }
      this.isSubmitting = false
    }
  },

}
</script>

<style scoped>

</style>
