<template>
  <b-modal ref="my-modal" title="Changer mon mot de passe" hide-footer @hidden="reset">
    <form @submit.prevent="save">
      <div class="alert alert-danger" v-if="error">{{ error }}</div>
      <div class="alert alert-success" v-if="success">{{ success }}</div>

      <div class="form-group">
        <label>Nouveau mot de passe</label>
        <b-form-input type="password" v-model="nouveauMdp" required></b-form-input>
      </div>
      <div class="form-group">
        <label>Confirmation</label>
        <b-form-input type="password" v-model="confirmationMdp" required></b-form-input>
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
  name: "ChangerMotDePasseModal",
  data() {
    return {
      nouveauMdp: '',
      confirmationMdp: '',
      isSubmitting: false,
      error: null,
      success: null,
    }
  },
  methods: {
    showModal() {
      this.$refs['my-modal'].show()
    },
    closeModal() {
      this.$refs['my-modal'].hide()
    },
    reset() {
      this.nouveauMdp = ''
      this.confirmationMdp = ''
      this.error = null
      this.success = null
    },
    async save() {
      this.error = null
      this.success = null

      if (this.nouveauMdp.length < 4) {
        this.error = 'Le mot de passe doit contenir au moins 4 caractères'
        return
      }
      if (this.nouveauMdp !== this.confirmationMdp) {
        this.error = 'Les mots de passe ne correspondent pas'
        return
      }

      const user = JSON.parse(localStorage.getItem('LoggedUser') || '{}')
      if (!user.id_com) {
        this.error = 'Session invalide, reconnectez-vous'
        return
      }

      this.isSubmitting = true
      try {
        await axios.put(`${API_BASE_URL}/api/commercial/${user.id_com}/mot-de-passe`, {
          mdp: this.nouveauMdp,
        })
        this.success = 'Mot de passe mis à jour'
        this.nouveauMdp = ''
        this.confirmationMdp = ''
      } catch (e) {
        this.error = (e.response && e.response.data && e.response.data.message) || 'Erreur lors de la mise à jour'
      }
      this.isSubmitting = false
    },
  },
}
</script>
