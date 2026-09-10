<template>
  <b-modal
      ref="my-modal"
      :title="editMode ? 'Modifier le commercial' : 'Nouveau commercial'"
      :ok-title="editMode ? 'Enregistrer' : 'Créer le commercial'"
      cancel-title="Annuler"
      cancel-variant="light"
      :ok-disabled="isSubmitting || !formData.nom.trim()"
      :busy="isSubmitting"
      @ok.prevent="save"
      @shown="focusNom"
      @hidden="reset">

    <b-form-group label="Type de commercial" class="mb-4">
      <search-select v-model="formData.type" :options="typeOptions" :clearable="false"></search-select>
      <b-form-text>
        {{ formData.type === 'equipe'
          ? "Un groupe de vendeurs — indiquez le nom de l'équipe et son responsable."
          : "Un vendeur individuel." }}
      </b-form-text>
    </b-form-group>

    <b-form-group :label="formData.type === 'equipe' ? 'Nom de l\'équipe *' : 'Nom et prénom *'">
      <b-form-input
          ref="nomInput"
          v-model="formData.nom"
          :placeholder="formData.type === 'equipe' ? 'Ex. Équipe Abobo' : 'Ex. Kouassi Jean'"
          :state="formData.nom.trim() ? null : false"
          @keyup.enter="save"
      ></b-form-input>
    </b-form-group>

    <b-form-group v-if="formData.type === 'equipe'" label="Responsable de l'équipe">
      <b-input-group>
        <b-input-group-prepend is-text><i class="fas fa-user-tie"></i></b-input-group-prepend>
        <b-form-input v-model="formData.responsable" placeholder="Nom du référent"></b-form-input>
      </b-input-group>
    </b-form-group>

    <b-row>
      <b-col md="6">
        <b-form-group label="Téléphone">
          <b-input-group>
            <b-input-group-prepend is-text><i class="fas fa-phone"></i></b-input-group-prepend>
            <b-form-input v-model="formData.telephone" type="tel" placeholder="0X XX XX XX XX"></b-form-input>
          </b-input-group>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Autre contact">
          <b-input-group>
            <b-input-group-prepend is-text><i class="fas fa-address-book"></i></b-input-group-prepend>
            <b-form-input v-model="formData.contact" placeholder="Email, 2e numéro…"></b-form-input>
          </b-input-group>
        </b-form-group>
      </b-col>
    </b-row>
  </b-modal>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')

const EMPTY = () => ({ id: null, nom: '', type: 'personne', telephone: '', contact: '', responsable: '' })

export default {
  name: "commerciaux-form",
  props: {
    selectedTA: {},
    editMode: Boolean,
  },
  data() {
    return {
      apidata: `${API_BASE_URL}/api/commerciaux`,
      isSubmitting: false,
      typeOptions: [
        { value: 'personne', text: 'Personne' },
        { value: 'equipe', text: 'Équipe' },
      ],
      formData: EMPTY(),
    }
  },
  methods: {
    showModal() {
      if (this.editMode === true && this.selectedTA) {
        this.formData = {
          id: this.selectedTA.id,
          nom: this.selectedTA.nom || '',
          type: this.selectedTA.type || 'personne',
          telephone: this.selectedTA.telephone || '',
          contact: this.selectedTA.contact || '',
          responsable: this.selectedTA.responsable || '',
        }
      } else {
        this.formData = EMPTY()
      }
      this.$refs['my-modal'].show()
    },
    focusNom() {
      if (this.$refs.nomInput) this.$refs.nomInput.focus()
    },
    reset() {
      this.formData = EMPTY()
      this.isSubmitting = false
    },
    async save() {
      if (this.isSubmitting || !this.formData.nom.trim()) return
      this.isSubmitting = true
      const data = {
        nom: this.formData.nom.trim(),
        type: this.formData.type,
        telephone: this.formData.telephone || null,
        contact: this.formData.contact || null,
        responsable: this.formData.type === 'equipe' ? (this.formData.responsable || null) : null,
      }
      try {
        if (this.editMode === true) {
          await axios.put(`${this.apidata}/${this.formData.id}`, data)
        } else {
          await axios.post(this.apidata, data)
        }
        window.Fire.$emit('commerciaux:refresh')
        this.$bvToast.toast(this.editMode ? 'Commercial modifié.' : 'Commercial créé.', { title: 'Commercial', variant: 'success', solid: true })
        this.$refs['my-modal'].hide()
      } catch (err) {
        console.log(err)
        this.$bvToast.toast("Erreur lors de l'enregistrement.", { title: 'Commercial', variant: 'danger', solid: true })
      }
      this.isSubmitting = false
    },
  },
}
</script>

<style scoped>
</style>
