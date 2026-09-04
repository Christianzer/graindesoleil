<template>
  <div class="container-fluid p-3">
    <PageHeader title="Approvisionnement" subtitle="Entrée de stock depuis un fournisseur" crumb="Fournisseurs" />

    <div class="card shadow mb-4">
      <div class="card-body">
        <b-form-group label="Fournisseur">
          <b-form-select v-model="fournisseurId" :options="fournisseurOptions"></b-form-select>
        </b-form-group>
        <b-form-group label="Date de l'approvisionnement">
          <b-form-datepicker locale="fr-FR" v-model="dateAppro"></b-form-datepicker>
        </b-form-group>

        <table class="table table-bordered">
          <tr>
            <th>Produit</th>
            <th>Quantité livrée</th>
            <th>Prix d'achat unitaire</th>
            <th>Total</th>
            <th></th>
          </tr>
          <tr v-for="(ligne, index) in lignes" :key="index">
            <td style="min-width:220px;">
              <b-form-select v-model="ligne.code_produit" :options="produitOptions"></b-form-select>
            </td>
            <td>
              <b-form-input type="number" min="1" v-model="ligne.quantite"></b-form-input>
            </td>
            <td>
              <b-form-input type="number" min="0" v-model="ligne.prix_achat_unitaire"></b-form-input>
            </td>
            <td class="font-weight-bold text-right align-middle">
              {{ new Intl.NumberFormat().format((ligne.quantite || 0) * (ligne.prix_achat_unitaire || 0)) }} FCFA
            </td>
            <td class="align-middle">
              <b-button size="sm" variant="danger" @click="lignes.splice(index, 1)">
                <i class="fas fa-trash"></i>
              </b-button>
            </td>
          </tr>
        </table>

        <b-button variant="outline-primary" class="mb-3" @click="ajouterLigne">
          <i class="fas fa-plus mr-1"></i> Ajouter une ligne
        </b-button>

        <div class="text-right">
          <h4 class="text-uppercase text-danger font-weight-bolder">TOTAL : {{ new Intl.NumberFormat().format(total) }} FCFA</h4>
        </div>

        <b-button variant="success" :disabled="Loading || !peutValider" @click="valider">
          Valider l'approvisionnement
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";

export default {
  name: "approvisionnement",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      fournisseurs: [],
      produits: [],
      fournisseurId: null,
      dateAppro: moment().format('YYYY-MM-DD'),
      lignes: [{ code_produit: null, quantite: 1, prix_achat_unitaire: 0 }],
    }
  },
  computed: {
    fournisseurOptions() {
      return this.fournisseurs.map(f => ({ value: f.id, text: f.nom }))
    },
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    total() {
      return this.lignes.reduce((t, l) => t + (l.quantite || 0) * (l.prix_achat_unitaire || 0), 0)
    },
    peutValider() {
      return this.fournisseurId && this.lignes.some(l => l.code_produit && l.quantite > 0)
    }
  },
  methods: {
    ajouterLigne() {
      this.lignes.push({ code_produit: null, quantite: 1, prix_achat_unitaire: 0 })
    },
    async valider() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        fournisseur_id: this.fournisseurId,
        date_appro: this.dateAppro,
        lignes: this.lignes.filter(l => l.code_produit && l.quantite > 0),
      }
      await axios.post(`${API_BASE_URL}/api/approvisionnements`, data).then(response => {
        if (response.status === 201) {
          this.$bvToast.toast('Approvisionnement enregistré : ' + response.data.code_appro, { title: 'Approvisionnement', variant: 'success', solid: true })
          this.fournisseurId = null
          this.lignes = [{ code_produit: null, quantite: 1, prix_achat_unitaire: 0 }]
        }
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de l\'enregistrement.', { title: 'Approvisionnement', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchFournisseurs() {
      await axios.get(`${API_BASE_URL}/api/fournisseurs`).then(response => {
        this.fournisseurs = response.data
      }).catch((err) => console.log(err))
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(response => {
        this.produits = response.data.element
      }).catch((err) => console.log(err))
    },
  },
  created() {
    this.fetchFournisseurs()
    this.fetchProduits()
  },
}
</script>

<style scoped>
</style>
