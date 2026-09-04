<template>
  <b-modal ref="my-modal" :hide-footer="true" :title="title">
    <form @submit.prevent="save">
      <div class="row" v-if="editMode">
        <div class="col-md-5">
          <b-form-group
              label="Matricule"
          >
            <b-form-input v-model="formData.matricule" disabled></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-5">
          <b-form-group
              label="Nom *">
            <b-form-input v-model="formData.nom"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-7">
          <b-form-group
              label="Prénom *"
          >
            <b-form-input v-model="formData.prenoms"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <b-form-group
              label="Contact 1 *">
            <b-form-input v-model="formData.telephone"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-6">
          <b-form-group
              label="Contact 2 *">
            <b-form-input v-model="formData.contact"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <b-form-group
              label="Mail *">
            <b-form-input v-model="formData.mail"></b-form-input>
          </b-form-group>
        </div>
        <div class="col-md-6">
          <b-form-group
              label="Compte Contribuable">
            <b-form-input v-model="formData.compte_contr"></b-form-input>
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
      apidata : `${API_BASE_URL}/api/clients`,
      selected : null,
      isSubmitting : false,
      title:"Mise à jour clients",
      formData: {
        id:null,
        matricule: "",
        nom: "",
        prenoms:'',
        telephone:'',
        compte_contr: "",
        mail: "",
        contact: "",
      }
    }
  },
  methods: {
    showModal() {
      if (this.editMode === true) {
        this.selected = this.selectedTA.id
        this.formData.matricule = this.selectedTA.matricule
        this.formData.nom = this.selectedTA.nom
        this.formData.prenoms = this.selectedTA.prenoms
        this.formData.telephone = this.selectedTA.telephone
        this.formData.compte_contr = this.selectedTA.compte_contr
        this.formData.mail = this.selectedTA.mail
        this.formData.contact = this.selectedTA.contact
      } else {
        this.formData.matricule = ''
        this.formData.nom = ''
        this.formData.prenoms = ''
        this.formData.telephone = ''
        this.formData.compte_contr = ''
        this.formData.mail = ''
        this.formData.contact = ''
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
        matricule : this.formData.matricule,
        nom : this.formData.nom,
        prenoms : this.formData.prenoms,
        telephone : this.formData.telephone,
        compte_contr: this.formData.compte_contr,
        mail: this.formData.mail,
        contact: this.formData.contact,
      }
      if (this.editMode === true){
        await axios.put(this.apidata+'/'+this.selected,data)
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
  }


}
</script>

<style scoped>

</style>
