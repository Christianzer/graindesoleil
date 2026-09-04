<template>
  <b-modal ref="my-modal" :hide-footer="true" :title="title">
    <form @submit.prevent="save">
      <b-form-group label="Nom du fournisseur">
        <b-form-input v-model="formData.nom"></b-form-input>
      </b-form-group>
      <b-form-group label="Contact (personne à contacter)">
        <b-form-input v-model="formData.contact"></b-form-input>
      </b-form-group>
      <b-form-group label="Téléphone">
        <b-form-input v-model="formData.telephone"></b-form-input>
      </b-form-group>
      <b-form-group label="Adresse">
        <b-form-input v-model="formData.adresse"></b-form-input>
      </b-form-group>
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
      isSubmitting: false,
      title: "Fournisseur",
      formData: {
        id: null,
        nom: "",
        contact: "",
        telephone: "",
        adresse: "",
      }
    }
  },
  methods: {
    showModal() {
      if (this.editMode === true) {
        this.formData.id = this.selectedTA.id
        this.formData.nom = this.selectedTA.nom
        this.formData.contact = this.selectedTA.contact
        this.formData.telephone = this.selectedTA.telephone
        this.formData.adresse = this.selectedTA.adresse
      } else {
        this.formData = { id: null, nom: "", contact: "", telephone: "", adresse: "" }
      }
      this.$refs['my-modal'].show()
    },
    closeModal() {
      this.$refs['my-modal'].hide()
    },
    async save() {
      if (this.isSubmitting) return
      this.isSubmitting = true
      const data = {
        nom: this.formData.nom,
        contact: this.formData.contact,
        telephone: this.formData.telephone,
        adresse: this.formData.adresse,
      }
      const api = this.editMode
        ? `${API_BASE_URL}/api/fournisseurs/${this.formData.id}`
        : `${API_BASE_URL}/api/fournisseurs`
      const call = this.editMode ? axios.put(api, data) : axios.post(api, data)
      await call.then(response => {
        if (response.status === 200 || response.status === 201) {
          Fire.$emit('fournisseur_creationok')
          this.closeModal()
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isSubmitting = false
    }
  },
}
</script>

<style scoped>
</style>
