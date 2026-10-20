<template>
  <div class="container-fluid p-3">
    <PageHeader title="Paramètres entreprise" subtitle="Coordonnées légales affichées sur les imprimés (bons de livraison, avoirs, reçus)" crumb="Administration" />

    <div class="card shadow mb-4">
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-alert show variant="warning" v-if="aDesRenseignements">
            Certains champs contiennent encore la valeur par défaut « À renseigner » — pensez à les compléter avant de remettre des documents aux clients.
          </b-alert>

          <div class="row">
            <div class="col-md-6">
              <b-form-group label="Nom de l'entreprise">
                <b-form-input v-model="formData.nom"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-6">
              <b-form-group label="Adresse">
                <b-form-input v-model="formData.adresse"></b-form-input>
              </b-form-group>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4">
              <b-form-group label="Téléphone">
                <b-form-input v-model="formData.telephone"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <b-form-group label="Email">
                <b-form-input v-model="formData.email"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <b-form-group label="Capital">
                <b-form-input v-model="formData.capital"></b-form-input>
              </b-form-group>
            </div>
          </div>
          <div class="row">
            <div class="col-md-4">
              <b-form-group label="RCCM">
                <b-form-input v-model="formData.rccm"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <b-form-group label="NCC">
                <b-form-input v-model="formData.ncc"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-4">
              <b-form-group label="Régime fiscal">
                <b-form-input v-model="formData.regime_fiscal"></b-form-input>
              </b-form-group>
            </div>
          </div>

          <div class="row">
            <div class="col-md-4">
              <b-form-group label="Seuil de solde cumulé commercial (FCFA)" description="Au-delà de ce solde dû, une nouvelle cession à un commercial doit être validée par le responsable.">
                <b-form-input type="number" min="0" v-entier v-model.number="formData.seuil_solde_commercial"></b-form-input>
              </b-form-group>
            </div>
          </div>

          <b-button variant="primary" :disabled="isSubmitting" @click="save">Enregistrer</b-button>
        </template>
      </div>
    </div>

    <div class="card shadow mb-4" v-if="estAdmin">
      <div class="card-body">
        <h5 class="mb-1">Sauvegarde complète</h5>
        <p class="text-muted mb-3">
          Un seul fichier ZIP : base de données, backend, PWA, installeur Windows et code source du frontend.
          Une copie est aussi créée automatiquement sur le serveur tous les 15 jours. Le fichier contient les mots de passe
          de la base (.env) : à conserver en lieu sûr.
        </p>
        <b-button variant="primary" :disabled="backupEnCours" @click="lancerBackup">
          <b-spinner small v-if="backupEnCours" class="mr-1"></b-spinner>
          <i class="fas fa-download mr-1" v-else></i>
          {{ backupEnCours ? 'Préparation du backup… (peut durer une minute)' : 'Télécharger le backup' }}
        </b-button>
        <div v-if="backupChemin" class="mt-3 text-success small">Backup enregistré : {{ backupChemin }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import PageHeader from "@/components/ui/PageHeader.vue";
import { telechargerBackup } from '@/utils/backup'

export default {
  name: "parametres",
  components: { PageHeader },
  data() {
    return {
      loader: false,
      isSubmitting: false,
      backupEnCours: false,
      backupChemin: '',
      formData: {
        nom: '', adresse: '', telephone: '', email: '',
        rccm: '', ncc: '', regime_fiscal: '', capital: '',
        seuil_solde_commercial: 2000000,
      }
    }
  },
  computed: {
    estAdmin() {
      try {
        // Admin (1) et Responsable (3)
        return [1, 3].includes(Number(JSON.parse(localStorage.getItem('LoggedUser')).type_user))
      } catch (e) {
        return false
      }
    },
    aDesRenseignements() {
      return Object.values(this.formData).some(v => v === 'À renseigner')
    }
  },
  methods: {
    async lancerBackup() {
      if (this.backupEnCours) return
      this.backupEnCours = true
      this.backupChemin = ''
      try {
        this.backupChemin = (await telechargerBackup()) || ''
        if (this.backupChemin) {
          this.$bvToast.toast('Backup enregistré.', { title: 'Sauvegarde', variant: 'success', solid: true })
        }
      } catch (err) {
        console.log(err)
        this.$bvToast.toast('Le backup a échoué.', { title: 'Sauvegarde', variant: 'danger', solid: true })
      }
      this.backupEnCours = false
    },
    async fetchParametres() {
      this.loader = false
      await axios.get(`${API_BASE_URL}/api/parametres`).then(response => {
        if (response.data) {
          this.formData = { ...this.formData, ...response.data }
        }
      }).catch((err) => console.log(err))
      this.loader = true
    },
    async save() {
      if (this.isSubmitting) return
      this.isSubmitting = true
      await axios.put(`${API_BASE_URL}/api/parametres`, this.formData).then(response => {
        if (response.data && response.data.success) {
          this.$bvToast.toast('Paramètres enregistrés.', { title: 'Paramètres', variant: 'success', solid: true })
        }
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de l\'enregistrement.', { title: 'Paramètres', variant: 'danger', solid: true })
      })
      this.isSubmitting = false
    }
  },
  created() {
    this.fetchParametres()
  },
}
</script>

<style scoped>
</style>
