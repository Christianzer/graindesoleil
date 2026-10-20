<template>
  <b-modal v-model="visible" :title="title" size="lg" scrollable hide-footer>
    <div v-if="chargement" class="text-center my-4"><b-spinner></b-spinner></div>

    <template v-else-if="erreur">
      <b-alert show variant="danger" class="mb-0">{{ erreur }}</b-alert>
    </template>

    <template v-else-if="data">
      <p v-if="note" class="small text-muted">{{ note }}</p>

      <b-table small bordered responsive striped :items="data.produits" :fields="champs"
               show-empty empty-text="Aucun produit concerné.">
        <template #cell(quantite)="row">{{ nb(row.value) }}</template>
        <template #cell(montant)="row"><strong>{{ fcfa(row.value) }}</strong></template>
        <template #cell(stock)="row">{{ row.value === null ? '—' : nb(row.value) }}</template>
        <template #cell(en_depot)="row">{{ row.value === null ? '—' : nb(row.value) }}</template>
        <template #custom-foot>
          <b-tr class="font-weight-bold">
            <b-td>Total</b-td>
            <b-td class="text-right">{{ nb(data.total_quantite) }}</b-td>
            <b-td class="text-right">{{ fcfa(data.total_montant) }}</b-td>
            <b-td :colspan="avecDepot ? 2 : 1"></b-td>
          </b-tr>
        </template>
      </b-table>

      <p class="small text-muted mb-0">
        Le montant est réparti sur les produits au prorata de la valeur des lignes de chaque bon ; la quantité est la part
        correspondante. Le total est égal au chiffre de la carte.
      </p>
    </template>
  </b-modal>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')

export default {
  name: 'DetailProduitsModal',
  props: {
    title: { type: String, required: true },
    // Chemin de l'API, ex. '/api/dashboard/detail/reste'
    url: { type: String, required: true },
    // Paramètres de requête (période, etc.), relus à chaque ouverture
    params: { type: Object, default: () => ({}) },
    // Affiche aussi le stock chez les commerciaux (versements commerciaux)
    avecDepot: { type: Boolean, default: false },
    note: { type: String, default: '' },
  },
  data() {
    return { visible: false, chargement: false, erreur: '', data: null }
  },
  computed: {
    champs() {
      const f = [
        { key: 'libelle', label: 'Produit' },
        { key: 'quantite', label: 'Quantité (kg)', class: 'text-right' },
        { key: 'montant', label: 'Montant', class: 'text-right' },
        { key: 'stock', label: 'Stock restant (kg)', class: 'text-right' },
      ]
      if (this.avecDepot) {
        f.push({ key: 'en_depot', label: 'En dépôt chez les commerciaux (kg)', class: 'text-right' })
      }
      return f
    },
  },
  methods: {
    async ouvrir() {
      this.visible = true
      this.chargement = true
      this.erreur = ''
      this.data = null
      try {
        const { data } = await axios.get(`${API_BASE_URL}${this.url}`, { params: this.params })
        this.data = data
      } catch (e) {
        this.erreur = (e.response && e.response.data && e.response.data.message) || 'Impossible de charger le détail.'
      }
      this.chargement = false
    },
    nb(v) { return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) },
    fcfa(v) { return Number(v || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' FCFA' },
  },
}
</script>
