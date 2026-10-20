<template>
  <div class="container-fluid p-3">
    <PageHeader title="Clôtures mensuelles" subtitle="Figer le récapitulatif d'une période et verrouiller ses pièces — le stock n'est jamais modifié" crumb="Administration" />

    <div v-if="chargement" class="text-center my-5"><b-spinner></b-spinner></div>

    <template v-else>
      <!-- Prochaine période -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <h5 class="mb-1">Période ouverte</h5>
          <p class="text-muted mb-3">
            À partir du <strong>{{ dateFr(prochaine.debut) }}</strong>.
            <span v-if="!prochaine.cloturable">Rien à clôturer pour l'instant : la journée en cours ne peut pas l'être.</span>
          </p>

          <template v-if="prochaine.cloturable">
            <div class="form-inline mb-3">
              <label class="mr-2">Clôturer jusqu'au</label>
              <b-form-input type="date" v-model="finChoisie" :min="prochaine.debut" :max="prochaine.fin_max" class="mr-3" @change="chargerApercu"></b-form-input>
              <b-badge v-if="estAnticipee" variant="warning" class="mr-3">Clôture anticipée (le mois n'est pas terminé)</b-badge>
              <b-badge v-else variant="success" class="mr-3">Fin de mois</b-badge>
              <b-button variant="primary" :disabled="occupe || !finChoisie" @click="confirmerCloture">
                <i class="fas fa-lock mr-1"></i> Clôturer cette période
              </b-button>
            </div>
            <b-alert show variant="info" class="small">
              Une fois clôturée, plus aucun bon de livraison, versement, mouvement de caisse, approvisionnement ou cession daté jusqu'à cette date ne pourra être créé, modifié ni supprimé,
              sauf par l'administrateur (l'action est alors journalisée). Les paiements saisis aujourd'hui sur d'anciens bons restent possibles : ils comptent dans la période en cours.
            </b-alert>

            <div v-if="apercuChargement" class="text-center my-3"><b-spinner small></b-spinner></div>
            <template v-else-if="apercu">
              <h6 class="text-muted">Aperçu — non enregistré</h6>
              <Recap :recap="apercu" />
            </template>
          </template>
        </div>
      </div>

      <!-- Clôtures existantes -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <h5 class="mb-3">Périodes clôturées</h5>
          <b-table small bordered hover responsive :items="clotures" :fields="fields" show-empty empty-text="Aucune période clôturée.">
            <template #cell(periode)="d">
              {{ dateFr(d.item.date_debut) }} → {{ dateFr(d.item.date_fin) }}
              <b-badge v-if="d.item.anticipee == 1" variant="warning" class="ml-1">anticipée</b-badge>
            </template>
            <template #cell(statut)="d">
              <b-badge :variant="d.item.statut == 1 ? 'success' : 'secondary'">{{ d.item.statut == 1 ? 'Clôturée' : 'Rouverte' }}</b-badge>
            </template>
            <template #cell(cloture)="d">
              {{ d.item.cloture_par || '—' }} <span class="text-muted small">le {{ dateHeure(d.item.cloture_le) }}</span>
              <div v-if="d.item.rouvert_le" class="small text-muted">Rouverte par {{ d.item.rouvert_par || '—' }} le {{ dateHeure(d.item.rouvert_le) }}</div>
            </template>
            <template #cell(actions)="d">
              <b-button size="sm" variant="outline-primary" class="mr-1" @click="voir(d.item)">Voir</b-button>
              <b-button size="sm" variant="outline-secondary" class="mr-1" @click="imprimer(d.item)">PDF</b-button>
              <b-button size="sm" variant="outline-success" class="mr-1" @click="excel(d.item)">Excel</b-button>
              <b-button v-if="d.item.rouvrable" size="sm" variant="outline-danger" @click="confirmerReouverture(d.item)">Rouvrir</b-button>
            </template>
          </b-table>
        </div>
      </div>

      <div class="card shadow mb-4" v-if="detail">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Récapitulatif du {{ dateFr(detail.date_debut) }} au {{ dateFr(detail.date_fin) }}</h5>
            <b-button size="sm" variant="light" @click="detail = null">Fermer</b-button>
          </div>
          <Recap :recap="detail.recap" />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import Recap from './Recap.vue'
import { imprimerDocument } from '@/documents'
import { exporterClotureExcel } from '@/utils/exportCloture'
import moment from 'moment'
const axios = require('axios')

export default {
  name: 'clotures',
  components: { PageHeader, Recap },
  data() {
    return {
      chargement: true,
      occupe: false,
      apercuChargement: false,
      clotures: [],
      prochaine: {},
      finChoisie: '',
      apercu: null,
      detail: null,
      fields: [
        { key: 'periode', label: 'Période' },
        { key: 'statut', label: 'Statut' },
        { key: 'cloture', label: 'Clôturée par' },
        { key: 'actions', label: '' },
      ],
    }
  },
  computed: {
    estAnticipee() {
      return !!this.finChoisie && this.finChoisie < this.prochaine.fin_mois
    },
  },
  created() {
    this.charger()
  },
  methods: {
    dateFr(d) { return d ? moment(d).format('DD/MM/YYYY') : '' },
    dateHeure(d) { return d ? moment(d).format('DD/MM/YYYY HH:mm') : '' },
    toast(message, variant = 'success') {
      this.$bvToast.toast(message, { title: 'Clôture', variant, solid: true })
    },
    messageErreur(e, defaut) {
      return (e && e.response && e.response.data && e.response.data.message) || defaut
    },
    async charger() {
      this.chargement = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/clotures`)
        this.clotures = data.clotures
        this.prochaine = data.prochaine
        this.finChoisie = data.prochaine.fin_max
        this.apercu = null
        if (data.prochaine.cloturable) {
          await this.chargerApercu()
        }
      } catch (e) {
        this.toast(this.messageErreur(e, 'Impossible de charger les clôtures.'), 'danger')
      }
      this.chargement = false
    },
    async chargerApercu() {
      if (!this.finChoisie) return
      this.apercuChargement = true
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/clotures/apercu`, { params: { fin: this.finChoisie } })
        this.apercu = data.recap
      } catch (e) {
        this.apercu = null
        this.toast(this.messageErreur(e, "Impossible de calculer l'aperçu."), 'danger')
      }
      this.apercuChargement = false
    },
    async confirmerCloture() {
      const ok = await this.$bvModal.msgBoxConfirm(
        `Clôturer la période du ${this.dateFr(this.prochaine.debut)} au ${this.dateFr(this.finChoisie)} ? `
        + 'Les pièces datées de cette période seront verrouillées. Le stock ne sera pas modifié.',
        { title: 'Confirmer la clôture', okTitle: 'Clôturer', cancelTitle: 'Annuler', okVariant: 'primary', centered: true }
      )
      if (!ok) return
      this.occupe = true
      try {
        await axios.post(`${API_BASE_URL}/api/clotures`, { fin: this.finChoisie })
        this.toast('Période clôturée.')
        this.detail = null
        await this.charger()
      } catch (e) {
        this.toast(this.messageErreur(e, 'La clôture a échoué.'), 'danger')
      }
      this.occupe = false
    },
    async confirmerReouverture(c) {
      const ok = await this.$bvModal.msgBoxConfirm(
        `Rouvrir la période du ${this.dateFr(c.date_debut)} au ${this.dateFr(c.date_fin)} ? Ses pièces redeviendront modifiables ; il faudra la clôturer à nouveau.`,
        { title: 'Rouvrir la période', okTitle: 'Rouvrir', cancelTitle: 'Annuler', okVariant: 'danger', centered: true }
      )
      if (!ok) return
      try {
        await axios.post(`${API_BASE_URL}/api/clotures/${c.id}/rouvrir`)
        this.toast('Période rouverte.')
        this.detail = null
        await this.charger()
      } catch (e) {
        this.toast(this.messageErreur(e, 'La réouverture a échoué.'), 'danger')
      }
    },
    async voir(c) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/clotures/${c.id}`)
        this.detail = data
      } catch (e) {
        this.toast(this.messageErreur(e, 'Impossible de charger la clôture.'), 'danger')
      }
    },
    imprimer(c) {
      imprimerDocument('cloture', c.id)
    },
    async excel(c) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/clotures/${c.id}`)
        const chemin = await exporterClotureExcel(data)
        if (chemin) this.toast('Fichier Excel enregistré.')
      } catch (e) {
        this.toast(this.messageErreur(e, "L'export Excel a échoué."), 'danger')
      }
    },
  },
}
</script>
