<template>
  <div class="container-fluid p-3">
    <PageHeader title="Approvisionnement" subtitle="Entrée de stock depuis un fournisseur" crumb="Fournisseurs" />

    <div class="card shadow mb-4">
      <div class="card-body">
        <b-form-group label="Fournisseur">
          <search-select v-model="fournisseurId" :options="fournisseurOptions"></search-select>
        </b-form-group>
        <b-form-group label="Date de l'approvisionnement">
          <b-form-datepicker locale="fr-FR" v-model="dateAppro"></b-form-datepicker>
        </b-form-group>

        <table class="table table-bordered">
          <tr>
            <th>Produit</th>
            <th>Quantité livrée (kg)</th>
            <th>Prix d'achat unitaire</th>
            <th>Total</th>
            <th></th>
          </tr>
          <tr v-for="(ligne, index) in lignes" :key="index">
            <td style="min-width:220px;">
              <search-select v-model="ligne.code_produit" :options="optionsPourLigne(index)"></search-select>
            </td>
            <td>
              <b-form-input type="number" min="0" step="any" v-model="ligne.quantite"></b-form-input>
            </td>
            <td>
              <b-form-input type="text" inputmode="numeric" :formatter="entier" v-model="ligne.prix_achat_unitaire"></b-form-input>
            </td>
            <td class="font-weight-bold text-right align-middle">
              {{ new Intl.NumberFormat().format(totalLigne(ligne)) }} FCFA
            </td>
            <td class="align-middle">
              <b-button size="sm" variant="danger" @click="lignes.splice(index, 1)">
                <i class="fas fa-trash"></i>
              </b-button>
            </td>
          </tr>
        </table>

        <b-button variant="outline-primary" class="mb-3 mr-2" @click="ajouterLigne">
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
    // Les fournisseurs livrent la matière première (café grain) : seul le
    // produit dédié à ce stock partagé (voir est_matiere_premiere) apparaît
    // ici, jamais un produit fini vendable.
    produitOptions() {
      return this.produits.filter(p => p.est_matiere_premiere).map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    total() {
      return this.lignes.reduce((t, l) => t + this.totalLigne(l), 0)
    },
    peutValider() {
      return this.fournisseurId && this.lignes.some(l => l.code_produit && l.quantite > 0)
    }
  },
  methods: {
    // Les montants sont en FCFA : entiers, sans virgule ni centimes.
    entier(valeur) {
      return String(valeur).replace(/[^0-9]/g, '')
    },
    totalLigne(ligne) {
      return Math.round((Number(ligne.quantite) || 0) * (parseInt(ligne.prix_achat_unitaire, 10) || 0))
    },
    // Options produit d'une ligne : on retire les produits déjà choisis sur
    // les autres lignes (on garde la sélection de la ligne courante).
    optionsPourLigne(index) {
      const prisAilleurs = this.lignes
        .filter((_, i) => i !== index)
        .map(l => l.code_produit)
        .filter(Boolean)
      return this.produitOptions.filter(o => !prisAilleurs.includes(o.value))
    },
    ajouterLigne() {
      this.lignes.push({ code_produit: null, quantite: 1, prix_achat_unitaire: 0 })
    },
    async valider() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        fournisseur_id: this.fournisseurId,
        date_appro: this.dateAppro,
        lignes: this.lignes
          .filter(l => l.code_produit && l.quantite > 0)
          .map(l => ({ ...l, quantite: Number(l.quantite), prix_achat_unitaire: parseInt(l.prix_achat_unitaire, 10) || 0 })),
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
