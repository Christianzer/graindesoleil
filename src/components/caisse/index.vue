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
          <b-tab v-if="peutBl" :title="'Bons de livraison (' + bl.length + ')'" :active="peutBl">
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
                <b-button size="sm" variant="success" @click="ouvrirVersement(row.item)">Encaisser</b-button>
              </template>
            </b-table>
            <b-pagination
                v-if="blFiltres.length > perPage"
                v-model="pageBl" :total-rows="blFiltres.length" :per-page="perPage"
                align="right" size="sm" class="mt-2 mb-0"></b-pagination>
          </b-tab>

          <!-- Commerciaux -->
          <b-tab :title="'Commerciaux (' + commerciaux.length + ')'" :active="!peutBl">
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
                <b-button size="sm" variant="success" @click="$refs.modalEncaissementCommercial.ouvrir(row.item)">Encaisser</b-button>
              </template>
            </b-table>
            <b-pagination
                v-if="comFiltres.length > perPage"
                v-model="pageCom" :total-rows="comFiltres.length" :per-page="perPage"
                align="right" size="sm" class="mt-2 mb-0"></b-pagination>
          </b-tab>

          <!-- Stock disponible (lecture seule) -->
          <b-tab title="Stock disponible">
            <b-form-input type="search" v-model="filtreStock" placeholder="Rechercher un produit…" class="mb-2" style="max-width:320px"></b-form-input>
            <b-table
                head-variant="light" bordered hover responsive small
                :items="stockFiltre" :fields="champsStock"
                show-empty empty-text="Aucun produit.">
              <template v-slot:cell(quantite_produit)="row">{{ nf(row.item.quantite_produit) }} kg</template>
            </b-table>
          </b-tab>

        </b-tabs>
      </div>
    </div>

    <!-- Modale de versement -->
    <b-modal ref="modalVersement" hide-footer :title="titreModale" size="lg">
      <div v-if="cible" class="mb-3 p-2 rounded" style="background:#f6f7fb">
        <div class="d-flex justify-content-between"><span class="text-muted">Total dû</span><span class="font-weight-bold">{{ nf(cibleDu) }} FCFA</span></div>
        <div class="d-flex justify-content-between"><span class="text-muted">Déjà versé</span><span>{{ nf(cibleVerse) }} FCFA</span></div>
        <div class="d-flex justify-content-between"><span class="text-muted">Reste à payer</span><span class="font-weight-bold text-danger">{{ nf(cibleReste) }} FCFA</span></div>
        <div v-if="cible.monnaie > 0" class="d-flex justify-content-between small text-success">
          <span>Monnaie du client en attente</span><span>{{ nf(cible.monnaie) }} FCFA</span>
        </div>
      </div>

      <p class="text-muted small mb-1">Produits de ce bon de livraison :</p>
      <div class="table-responsive mb-3">
        <table class="table table-sm table-bordered mb-0">
          <tr><th>Produit</th><th class="text-right">Quantité</th><th class="text-right">Montant</th></tr>
          <tr v-for="(l, i) in lignesBl" :key="i">
            <td>{{ l.libelle }}</td>
            <td class="text-right">{{ nf(l.quantite) }} kg</td>
            <td class="text-right">{{ nf(l.montant) }} FCFA</td>
          </tr>
          <tr v-if="!lignesBl.length"><td colspan="3" class="text-muted text-center">Chargement…</td></tr>
        </table>
      </div>

      <b-row>
        <b-col md="6">
          <b-form-group label="Mode de paiement">
            <search-select v-model="mode" :options="modesPaiement" :clearable="false"></search-select>
          </b-form-group>
        </b-col>
        <b-col md="6">
          <b-form-group label="Montant reçu (FCFA)" :description="'Reste à payer : ' + nf(cibleReste) + ' FCFA'">
            <b-input-group append="FCFA">
              <b-form-input type="number" min="0" step="any" v-model="montant"></b-form-input>
            </b-input-group>
          </b-form-group>
        </b-col>
      </b-row>

      <b-row v-if="mode === 2 || mode === 3 || mode === 4">
        <b-col md="6" v-if="mode === 2">
          <b-form-group label="Réseau">
            <search-select v-model="reseau" :options="reseaux" placeholder="Orange, MTN, Moov, Wave…"></search-select>
          </b-form-group>
        </b-col>
        <template v-if="mode === 3">
          <b-col md="6"><b-form-group label="Banque"><b-form-input v-model="banque"></b-form-input></b-form-group></b-col>
          <b-col md="6"><b-form-group label="N° de chèque"><b-form-input v-model="numeroCheque"></b-form-input></b-form-group></b-col>
        </template>
        <b-col md="6" v-if="mode === 4">
          <b-form-group label="N° de virement">
            <b-form-input v-model="numeroVirement"></b-form-input>
          </b-form-group>
        </b-col>
      </b-row>

      <b-form-group v-if="mode === 1" label="Monnaie à rendre (FCFA)"
                    description="Calculée automatiquement si le montant reçu dépasse le reste à payer ; modifiable si besoin.">
        <b-input-group append="FCFA">
          <b-form-input type="number" min="0" step="any" v-model="monnaieRendue"></b-form-input>
        </b-input-group>
      </b-form-group>

      <p v-if="!montantValide" class="text-danger small">Le montant reçu doit être positif et au moins égal à la monnaie à rendre.</p>

      <div class="d-flex flex-wrap" style="gap:.5rem">
        <b-button variant="success" :disabled="Loading || !montantValide" @click="enregistrer">
          Enregistrer le versement
        </b-button>
        <b-button v-if="dernierRecu" variant="outline-secondary" @click="imprimerRecu">
          <i class="fas fa-print mr-1"></i> Imprimer le reçu
        </b-button>
      </div>
    </b-modal>

    <!-- Encaissement commercial détaillé (produit/quantité), même flux que Dépôt-vente -->
    <EncaissementModal ref="modalEncaissementCommercial" @success="fetchData" />
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import moment from 'moment'
import PageHeader from '@/components/ui/PageHeader.vue'
import EncaissementModal from '@/components/commerciaux/EncaissementModal.vue'
import { imprimerDocument } from '@/utils/print.js'
import { hasPermission } from '@/utils/permissions'

export default {
  name: "encaissement-index",
  components: { PageHeader, EncaissementModal },
  data() {
    return {
      Loading: false,
      bl: [],
      commerciaux: [],
      produits: [],
      filtreBl: '',
      filtreCom: '',
      filtreStock: '',
      pageBl: 1,
      pageCom: 1,
      perPage: 10,
      champsStock: [
        { key: 'code_produit', label: 'Code' },
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'quantite_produit', label: 'Stock disponible', class: 'text-right' },
      ],
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
      // Modale de versement — BL clients uniquement (les commerciaux passent
      // par EncaissementModal, avec déclaration produit/quantité).
      cible: null,
      montant: 0,
      mode: 1,
      reseau: null,
      banque: '',
      numeroCheque: '',
      numeroVirement: '',
      monnaieRendue: 0,
      dernierRecu: null,
      lignesBl: [],
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
    peutBl() {
      return hasPermission('encaissement_bl_clients')
    },
    stockFiltre() {
      const q = this.filtreStock.toLowerCase().trim()
      const vendables = this.produits.filter(p => !p.est_matiere_premiere)
      if (!q) return vendables
      return vendables.filter(p =>
        String(p.libelle_produit || '').toLowerCase().includes(q) ||
        String(p.code_produit || '').toLowerCase().includes(q))
    },
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
      return 'Encaisser — ' + this.cible.code_facture + ' · ' + this.cible.client_nom
    },
    cibleDu() {
      return this.cible ? this.cible.montant_ttc : 0
    },
    cibleVerse() {
      return this.cible ? this.cible.verse : 0
    },
    cibleReste() {
      return this.cible ? this.cible.reste : 0
    },
    montantValide() {
      const m = Number(this.montant)
      return m > 0 && (Number(this.monnaieRendue) || 0) <= m
    },
  },
  watch: {
    filtreBl() { this.pageBl = 1 },
    filtreCom() { this.pageCom = 1 },
    // Calcule automatiquement la monnaie à rendre dès que le montant reçu
    // dépasse le reste à payer (paiement espèces), pour éviter les erreurs
    // de calcul manuel ; l'utilisateur peut toujours l'ajuster ensuite.
    montant(v) {
      if (this.mode === 1) {
        this.monnaieRendue = Math.max(0, (Number(v) || 0) - this.cibleReste)
      }
    },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    async fetchData() {
      await axios.get(`${API_BASE_URL}/api/encaissement/en-attente`).then(r => {
        // Caisse : périmètre restreint aux commerciaux uniquement (pas de BL clients).
        this.bl = this.peutBl ? (r.data.bl || []) : []
        this.commerciaux = r.data.commerciaux || []
      }).catch(e => console.log(e))
      await axios.get(`${API_BASE_URL}/api/produits`).then(r => {
        this.produits = r.data.element || []
      }).catch(e => console.log(e))
    },
    ouvrirVersement(row) {
      this.cible = row
      this.mode = 1
      this.reseau = null
      this.banque = ''
      this.numeroCheque = ''
      this.numeroVirement = ''
      this.monnaieRendue = 0
      this.dernierRecu = null
      this.montant = this.cibleReste
      this.lignesBl = []
      axios.get(`${API_BASE_URL}/api/doc/bl/${row.code_facture}`).then(r => {
        this.lignesBl = r.data.lignes || []
      }).catch(e => console.log(e))
      this.$refs.modalVersement.show()
    },
    async enregistrer() {
      if (this.Loading || !this.montantValide) return
      this.Loading = true
      const today = moment().format('YYYY-MM-DD')
      const modeLabel = (this.modesPaiement.find(m => m.value === this.mode) || {}).text
      try {
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
        this.$bvToast.toast('Versement enregistré — reçu ' + r.data, { title: 'Encaissement', variant: 'success', solid: true })
        await this.fetchData()
      } catch (e) {
        console.log(e)
        const msg = (e.response && e.response.data && e.response.data.message) || "Erreur lors de l'enregistrement."
        this.$bvToast.toast(msg, { title: 'Encaissement', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    imprimerRecu() {
      if (this.dernierRecu) {
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
