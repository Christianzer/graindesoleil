<template>
  <div class="container-fluid p-3">
    <PageHeader title="Encaissement" subtitle="Enregistrer les versements des clients et des commerciaux" crumb="Caisse">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchData">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-body">
        <b-tabs content-class="pt-3">

          <!-- BL clients -->
          <b-tab :title="'Bons de livraison (' + bl.length + ')'" active>
            <b-form-input type="search" v-model="filtreBl" placeholder="Rechercher (client, code)…" class="mb-2" style="max-width:320px"></b-form-input>
            <b-table
                head-variant="light" bordered hover responsive small
                :items="blFiltres" :fields="champsBl"
                :per-page="perPage" :current-page="pageBl"
                show-empty empty-text="Aucun bon de livraison à encaisser.">
              <template v-slot:cell(date_facture)="row">{{ row.item.date_facture | dateFr }}</template>
              <template v-slot:cell(montant_ttc)="row">{{ nf(row.item.montant_ttc) }} FCFA</template>
              <template v-slot:cell(verse)="row">{{ nf(row.item.verse) }} FCFA</template>
              <template v-slot:cell(reste)="row">
                <span class="font-weight-bold text-danger">{{ nf(row.item.reste) }} FCFA</span>
              </template>
              <template v-slot:cell(actions)="row">
                <b-button size="sm" variant="success" @click="ouvrirVersement('bl', row.item)">Encaisser</b-button>
              </template>
            </b-table>
            <b-pagination
                v-if="blFiltres.length > perPage"
                v-model="pageBl" :total-rows="blFiltres.length" :per-page="perPage"
                align="right" size="sm" class="mt-2 mb-0"></b-pagination>
          </b-tab>

          <!-- Commerciaux -->
          <b-tab :title="'Commerciaux (' + commerciaux.length + ')'">
            <b-form-input type="search" v-model="filtreCom" placeholder="Rechercher un commercial…" class="mb-2" style="max-width:320px"></b-form-input>
            <b-table
                head-variant="light" bordered hover responsive small
                :items="comFiltres" :fields="champsCom"
                :per-page="perPage" :current-page="pageCom"
                show-empty empty-text="Aucun commercial à encaisser.">
              <template v-slot:cell(type)="row">
                <b-badge :variant="row.item.type === 'equipe' ? 'info' : 'secondary'">
                  {{ row.item.type === 'equipe' ? 'Équipe' : 'Personne' }}
                </b-badge>
              </template>
              <template v-slot:cell(total_pris)="row">{{ nf(row.item.total_pris) }} FCFA</template>
              <template v-slot:cell(total_verse)="row">{{ nf(row.item.total_verse) }} FCFA</template>
              <template v-slot:cell(reste_a_verser)="row">
                <span class="font-weight-bold text-danger">{{ nf(row.item.reste_a_verser) }} FCFA</span>
              </template>
              <template v-slot:cell(actions)="row">
                <b-button size="sm" variant="success" @click="ouvrirVersement('commercial', row.item)">Encaisser</b-button>
              </template>
            </b-table>
            <b-pagination
                v-if="comFiltres.length > perPage"
                v-model="pageCom" :total-rows="comFiltres.length" :per-page="perPage"
                align="right" size="sm" class="mt-2 mb-0"></b-pagination>
          </b-tab>

        </b-tabs>
      </div>
    </div>

    <!-- Modale de versement -->
    <b-modal ref="modalVersement" hide-footer :title="titreModale">
      <div v-if="cible" class="mb-3 p-2 rounded" style="background:#f6f7fb">
        <div class="d-flex justify-content-between"><span class="text-muted">Total dû</span><span class="font-weight-bold">{{ nf(cibleDu) }} FCFA</span></div>
        <div class="d-flex justify-content-between"><span class="text-muted">Déjà versé</span><span>{{ nf(cibleVerse) }} FCFA</span></div>
        <div class="d-flex justify-content-between"><span class="text-muted">Reste</span><span class="font-weight-bold text-danger">{{ nf(cibleReste) }} FCFA</span></div>
        <div v-if="type === 'bl' && cible.monnaie > 0" class="d-flex justify-content-between small text-success">
          <span>Monnaie du client en attente</span><span>{{ nf(cible.monnaie) }} FCFA</span>
        </div>
      </div>

      <b-form-group label="Montant reçu">
        <b-form-input type="number" min="0" step="any" v-model="montant"></b-form-input>
      </b-form-group>

      <b-form-group label="Mode de paiement">
        <search-select v-model="mode" :options="modesPaiement" :clearable="false"></search-select>
      </b-form-group>

      <b-form-group v-if="mode === 2" label="Réseau">
        <search-select v-model="reseau" :options="reseaux" placeholder="Orange, MTN, Moov, Wave…"></search-select>
      </b-form-group>
      <template v-if="mode === 3">
        <b-form-group label="Banque"><b-form-input v-model="banque"></b-form-input></b-form-group>
        <b-form-group label="N° de chèque"><b-form-input v-model="numeroCheque"></b-form-input></b-form-group>
      </template>
      <b-form-group v-if="mode === 4" label="N° de virement">
        <b-form-input v-model="numeroVirement"></b-form-input>
      </b-form-group>

      <b-form-group v-if="type === 'bl' && mode === 1" label="Monnaie rendue">
        <b-form-input type="number" min="0" step="any" v-model="monnaieRendue"></b-form-input>
      </b-form-group>

      <div class="d-flex" style="gap:.5rem">
        <b-button variant="success" :disabled="Loading || !montantValide" @click="enregistrer">
          Enregistrer le versement
        </b-button>
        <b-button v-if="dernierRecu || dernierRecuCommercial" variant="outline-secondary" @click="imprimerRecu">
          <i class="fas fa-print mr-1"></i> Imprimer le reçu
        </b-button>
      </div>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import moment from 'moment'
import PageHeader from '@/components/ui/PageHeader.vue'
import { imprimerDocument } from '@/utils/print.js'

export default {
  name: "encaissement-index",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      bl: [],
      commerciaux: [],
      filtreBl: '',
      filtreCom: '',
      pageBl: 1,
      pageCom: 1,
      perPage: 10,
      champsBl: [
        { key: 'client_nom', label: 'Client' },
        { key: 'code_facture', label: 'BL' },
        { key: 'date_facture', label: 'Date' },
        { key: 'montant_ttc', label: 'Total', class: 'text-right' },
        { key: 'verse', label: 'Versé', class: 'text-right' },
        { key: 'reste', label: 'Reste', class: 'text-right' },
        { key: 'actions', label: '' },
      ],
      champsCom: [
        { key: 'nom', label: 'Commercial' },
        { key: 'type', label: 'Type' },
        { key: 'total_pris', label: 'Total dû', class: 'text-right' },
        { key: 'total_verse', label: 'Versé', class: 'text-right' },
        { key: 'reste_a_verser', label: 'Reste à verser', class: 'text-right' },
        { key: 'actions', label: '' },
      ],
      // Modale
      type: 'bl',        // 'bl' | 'commercial'
      cible: null,
      montant: 0,
      mode: 1,
      reseau: null,
      banque: '',
      numeroCheque: '',
      numeroVirement: '',
      monnaieRendue: 0,
      dernierRecu: null,
      dernierRecuCommercial: null,
      modesPaiement: [
        { value: 1, text: 'Espèces' },
        { value: 2, text: 'Mobile money' },
        { value: 3, text: 'Chèque' },
        { value: 4, text: 'Virement' },
      ],
      reseaux: [
        { value: 'Orange', text: 'Orange Money' },
        { value: 'MTN', text: 'MTN MoMo' },
        { value: 'Moov', text: 'Moov Money' },
        { value: 'Wave', text: 'Wave' },
      ],
    }
  },
  computed: {
    blFiltres() {
      const q = this.filtreBl.toLowerCase().trim()
      if (!q) return this.bl
      return this.bl.filter(b =>
        String(b.client_nom || '').toLowerCase().includes(q) ||
        String(b.code_facture || '').toLowerCase().includes(q))
    },
    comFiltres() {
      const q = this.filtreCom.toLowerCase().trim()
      if (!q) return this.commerciaux
      return this.commerciaux.filter(c => String(c.nom || '').toLowerCase().includes(q))
    },
    titreModale() {
      if (!this.cible) return 'Versement'
      return this.type === 'bl'
        ? 'Encaisser — ' + this.cible.code_facture + ' · ' + this.cible.client_nom
        : 'Encaisser — ' + this.cible.nom
    },
    cibleDu() {
      if (!this.cible) return 0
      return this.type === 'bl' ? this.cible.montant_ttc : this.cible.total_pris
    },
    cibleVerse() {
      if (!this.cible) return 0
      return this.type === 'bl' ? this.cible.verse : this.cible.total_verse
    },
    cibleReste() {
      if (!this.cible) return 0
      return this.type === 'bl' ? this.cible.reste : this.cible.reste_a_verser
    },
    montantValide() {
      const m = Number(this.montant)
      return m > 0 && (Number(this.monnaieRendue) || 0) <= m
    },
  },
  watch: {
    filtreBl() { this.pageBl = 1 },
    filtreCom() { this.pageCom = 1 },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    async fetchData() {
      await axios.get(`${API_BASE_URL}/api/encaissement/en-attente`).then(r => {
        this.bl = r.data.bl || []
        this.commerciaux = r.data.commerciaux || []
      }).catch(e => console.log(e))
    },
    ouvrirVersement(type, row) {
      this.type = type
      this.cible = row
      this.mode = 1
      this.reseau = null
      this.banque = ''
      this.numeroCheque = ''
      this.numeroVirement = ''
      this.monnaieRendue = 0
      this.dernierRecu = null
      this.dernierRecuCommercial = null
      this.montant = this.cibleReste
      this.$refs.modalVersement.show()
    },
    async enregistrer() {
      if (this.Loading || !this.montantValide) return
      this.Loading = true
      const today = moment().format('YYYY-MM-DD')
      const modeLabel = (this.modesPaiement.find(m => m.value === this.mode) || {}).text
      try {
        if (this.type === 'bl') {
          const data = {
            code_facture: this.cible.code_facture,
            client_id: this.cible.client_id,
            montant_verser: Number(this.montant),
            monnaie: this.mode === 1 ? (Number(this.monnaieRendue) || 0) : 0,
            date_versement: today,
            type: this.mode === 1 ? 2 : 1,
            type_paiment: this.mode,
            paiement: {
              type_paiement: modeLabel,
              montant: Number(this.montant),
              banque: this.banque || null,
              numero_cheque: this.numeroCheque || null,
              numero_virement: this.numeroVirement || null,
              numero_telephone: null,
              reseau: this.reseau || null,
            },
          }
          const r = await axios.post(`${API_BASE_URL}/api/faire_paiement`, data)
          this.dernierRecu = r.data
          this.dernierRecuCommercial = null
          this.$bvToast.toast('Versement enregistré — reçu ' + r.data, { title: 'Encaissement', variant: 'success', solid: true })
        } else {
          const r = await axios.post(`${API_BASE_URL}/api/commercial-versements`, {
            commercial_id: this.cible.id,
            montant: Number(this.montant),
            date_versement: today,
            mode_paiement: this.mode,
          })
          this.dernierRecu = null
          this.dernierRecuCommercial = (r.data && r.data.id) || null
          this.$bvToast.toast('Versement du commercial enregistré.', { title: 'Encaissement', variant: 'success', solid: true })
        }
        await this.fetchData()
      } catch (e) {
        console.log(e)
        const msg = (e.response && e.response.data && e.response.data.message) || "Erreur lors de l'enregistrement."
        this.$bvToast.toast(msg, { title: 'Encaissement', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    imprimerRecu() {
      if (this.dernierRecuCommercial) {
        imprimerDocument('recu_commercial', this.dernierRecuCommercial)
      } else if (this.dernierRecu) {
        imprimerDocument('recu', this.dernierRecu)
      }
    },
  },
  created() {
    this.fetchData()
  },
}
</script>

<style scoped>
</style>
