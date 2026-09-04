<template>
  <b-modal ref="my-modal" size="lg" :hide-footer="true" :title="title">
    <form @submit.prevent="save">
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
              label="Login *">
            <b-form-input v-model="formData.login"></b-form-input>
          </b-form-group>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <b-form-group
              label="Mot de passe">
            <b-form-input type="password" v-model="formData.mdp"></b-form-input>
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
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
export default {
  name: "form",
  props: {
    selectedTA: {},
    editMode: Boolean
  },
  data() {
    return {
      apidata : `${API_BASE_URL}/api/commercial`,
      selected : null,
      isSubmitting : false,
      title:"Mise à jour commercial",
      formData: {
        id:null,
        nom: "",
        prenoms:'',
        telephone:'',
        mail: "",
        login: "",
        mdp: "",
        contact: "",
      }
    }
  },
  methods: {
    showModal() {
      if (this.editMode === true) {
        this.selected = this.selectedTA.id
        this.formData.nom = this.selectedTA.nom
        this.formData.prenoms = this.selectedTA.prenoms
        this.formData.telephone = this.selectedTA.telephone
        this.formData.mail = this.selectedTA.mail
        this.formData.login = this.selectedTA.login
        this.formData.mdp = ''
        this.formData.contact = this.selectedTA.contact
      } else {
        this.formData.nom = ''
        this.formData.prenoms = ''
        this.formData.telephone = ''
        this.formData.mail = ''
        this.formData.login =
        this.formData.mdp =
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
        nom : this.formData.nom,
        prenoms : this.formData.prenoms,
        telephone : this.formData.telephone,
        mail: this.formData.mail,
        login: this.formData.login,
        mdp: this.formData.mdp,
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
