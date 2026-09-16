<template>
  <b-modal ref="modal" hide-footer :title="'Encaisser — ' + nomCommercial" size="xl">
    <b-row class="align-items-end mb-3">
      <b-col md="4">
        <label class="small mb-1">Date</label>
        <b-form-datepicker locale="fr-FR" v-model="dateFiche"></b-form-datepicker>
      </b-col>
    </b-row>

    <p class="text-muted small mb-2">Produits cédés à ce commercial — renseignez uniquement la quantité effectivement vendue :</p>
    <div class="table-responsive" v-if="lignesFiche.length">
    <table class="table table-bordered align-middle">
      <tr>
        <th>Produit</th>
        <th class="text-center">Cédé</th>
        <th class="text-center">Déjà vendu</th>
        <th class="text-center">Reste à vendre</th>
        <th style="width:150px;">Quantité vendue</th>
        <th class="text-right">Prix cession</th>
        <th class="text-right">Total</th>
      </tr>
      <tr v-for="(ligne, index) in lignesFiche" :key="ligne.code_produit"
          :class="{ 'text-muted': resteProduit(ligne.code_produit) === 0 }">
        <td class="align-middle">{{ ligne.libelle_produit }}</td>
        <td class="align-middle text-center">{{ nf(cedeProduit(ligne.code_produit)) }} kg</td>
        <td class="align-middle text-center">{{ nf(venduProduit(ligne.code_produit)) }} kg</td>
        <td class="align-middle text-center">
          <span v-if="resteProduit(ligne.code_produit) === 0" class="badge badge-secondary">Épuisé</span>
          <span v-else :class="{ 'text-danger font-weight-bold': Number(ligne.quantite) > resteProduit(ligne.code_produit) }">
            {{ nf(resteProduit(ligne.code_produit)) }} kg
          </span>
        </td>
        <td>
          <b-input-group append="kg" size="sm">
            <b-form-input type="number" min="0" :max="resteProduit(ligne.code_produit)"
                          :disabled="resteProduit(ligne.code_produit) === 0" v-model="ligne.quantite"></b-form-input>
          </b-input-group>
          <small v-if="Number(ligne.quantite) > resteProduit(ligne.code_produit)" class="text-danger">
            Dépasse le reste disponible
          </small>
        </td>
        <td class="align-middle text-right">{{ nf(prixUnitaire(ligne.code_produit)) }} FCFA</td>
        <td class="font-weight-bold text-right align-middle">
          {{ nf(montantLigne(ligne.code_produit, ligne.quantite)) }} FCFA
        </td>
      </tr>
    </table>
    </div>
    <p v-else class="text-muted">Aucun produit cédé à ce commercial pour l'instant.</p>

    <div class="text-right mb-3">
      <h5 class="text-uppercase text-danger font-weight-bolder">Total déclaré : {{ nf(totalFiche) }} FCFA</h5>
    </div>

    <b-row>
      <b-col md="6">
        <b-form-group label="Montant effectivement versé (FCFA)" description="Obligatoire — peut être inférieur au total déclaré (paiement partiel), mais pas nul.">
          <b-form-input type="number" min="0" v-model="montantVerse"
                        :state="montantVerse !== null && montantVerse !== '' && Number(montantVerse) <= 0 ? false : null"></b-form-input>
          <small v-if="montantVerse !== null && montantVerse !== '' && Number(montantVerse) <= 0" class="text-danger">
            Le montant versé est obligatoire pour enregistrer l'encaissement.
          </small>
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Mode de paiement">
          <b-form-select v-model="modePaiement" :options="modePaiementOptions"></b-form-select>
        </b-form-group>
      </b-col>
    </b-row>
    <b-form-group label="Observation">
      <b-form-textarea v-model="observation" rows="2"></b-form-textarea>
    </b-form-group>

    <b-button variant="success" block :disabled="loading || !peutValider" @click="valider">Enregistrer l'encaissement</b-button>
  </b-modal>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import { imprimerDocument } from "@/utils/print.js";

export default {
  name: "encaissement-commercial-modal",
  data() {
    return {
      loading: false,
      commercial: null,
      dateFiche: moment().format('YYYY-MM-DD'),
      lignesFiche: [],
      stockCommercial: [],
      montantVerse: 0,
      modePaiement: 1,
      observation: '',
      modePaiementOptions: [
        { value: 1, text: 'Espèces' },
        { value: 2, text: 'Mobile money' },
        { value: 3, text: 'Chèque' },
        { value: 4, text: 'Virement' },
      ],
    }
  },
  computed: {
    nomCommercial() {
      return this.commercial ? (this.commercial.nom || '') : ''
    },
    totalFiche() {
      return this.lignesFiche.reduce((t, l) => t + this.montantLigne(l.code_produit, l.quantite), 0)
    },
    peutValider() {
      return this.commercial
        && this.lignesFiche.some(l => l.code_produit && Number(l.quantite) > 0)
        && Number(this.montantVerse) > 0
    },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    // Tranches FIFO renvoyées par /api/commercial/{id}/stock : une par
    // cession non encore épuisée, chacune à son propre prix (niveau_prix
    // choisi lors de cette cession) — voir Controller::lotsCommercialFifo
    // côté backend, seule source de vérité pour le calcul réellement
    // appliqué à l'encaissement.
    tranchesProduit(code) {
      const s = this.stockCommercial.find(x => x.code_produit === code)
      return (s && s.tranches) || []
    },
    prixUnitaire(code) {
      const tranches = this.tranchesProduit(code)
      return tranches.length ? Number(tranches[0].prix_unitaire) || 0 : 0
    },
    montantLigne(code, quantite) {
      const tranches = this.tranchesProduit(code)
      let restant = Number(quantite) || 0
      let montant = 0
      for (const t of tranches) {
        if (restant <= 0) break
        const pris = Math.min(restant, Number(t.disponible) || 0)
        montant += pris * (Number(t.prix_unitaire) || 0)
        restant -= pris
      }
      if (restant > 0 && tranches.length) {
        montant += restant * (Number(tranches[tranches.length - 1].prix_unitaire) || 0)
      }
      return montant
    },
    cedeProduit(code) {
      const s = this.stockCommercial.find(x => x.code_produit === code)
      return s ? s.cede : 0
    },
    venduProduit(code) {
      const s = this.stockCommercial.find(x => x.code_produit === code)
      return s ? s.vendu : 0
    },
    resteProduit(code) {
      const s = this.stockCommercial.find(x => x.code_produit === code)
      return s ? s.reste : 0
    },
    async ouvrir(commercial) {
      this.commercial = commercial
      this.dateFiche = moment().format('YYYY-MM-DD')
      this.lignesFiche = []
      this.montantVerse = 0
      this.modePaiement = 1
      this.observation = ''
      this.stockCommercial = []
      await axios.get(`${API_BASE_URL}/api/commercial/${commercial.id}/stock`).then(r => {
        this.stockCommercial = r.data
        this.lignesFiche = r.data.map(s => ({
          code_produit: s.code_produit,
          libelle_produit: s.libelle_produit,
          quantite: 0,
        }))
      }).catch(e => console.log(e))
      this.$refs.modal.show()
    },
    async valider() {
      if (this.loading || !this.peutValider) return
      this.loading = true
      const data = {
        commercial_id: this.commercial.id,
        date_fiche: this.dateFiche,
        lignes: this.lignesFiche.filter(l => l.code_produit && Number(l.quantite) > 0),
        montant_verse: Number(this.montantVerse) || 0,
        mode_paiement: this.modePaiement,
        observation: this.observation,
      }
      await axios.post(`${API_BASE_URL}/api/commercial-fiches`, data).then(response => {
        this.$bvToast.toast(
          `Déclaration ${response.data.code_fiche} enregistrée (${this.nf(response.data.montant_total)} FCFA déclarés, ${this.nf(response.data.montant_verse)} FCFA versés).`,
          { title: 'Encaissement', variant: 'success', solid: true }
        )
        this.$refs.modal.hide()
        this.$emit('success')
        if (response.data.versement_id) {
          imprimerDocument('recu_commercial', response.data.versement_id)
        }
      }).catch((err) => {
        console.log(err)
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de l\'encaissement.'
        this.$bvToast.toast(msg, { title: 'Encaissement', variant: 'danger', solid: true })
      })
      this.loading = false
    },
  },
}
</script>
