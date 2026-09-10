<template>
  <div class="container-fluid p-3">
    <PageHeader title="Vente" subtitle="Créer un bon de livraison client" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchTout">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>

    <!-- Après validation : récap + actions -->
    <div v-if="blCree" class="card shadow mb-4 border-success">
      <div class="card-body text-center">
        <h4 class="text-success"><i class="fas fa-check-circle mr-2"></i>Bon de livraison créé</h4>
        <p class="mb-1"><strong>{{ blCree }}</strong> — {{ nomClient }}</p>
        <p class="text-muted">Total : {{ nf(totalValide) }} FCFA</p>
        <div class="d-flex justify-content-center" style="gap:.5rem">
          <b-button variant="outline-secondary" @click="imprimer">
            <i class="fas fa-print mr-1"></i> Imprimer le bon
          </b-button>
          <b-button variant="primary" @click="nouvelleVente">
            <i class="fas fa-plus mr-1"></i> Nouvelle vente
          </b-button>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Client + niveau de prix -->
      <div class="card shadow mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <b-form-group label="Client">
                <div class="d-flex" style="gap:.5rem">
                  <search-select v-model="clientId" :options="clientOptions" class="flex-grow-1"></search-select>
                  <b-button variant="outline-secondary" @click="$refs.modalClient.show()" title="Nouveau client">
                    <i class="fas fa-user-plus"></i>
                  </b-button>
                </div>
              </b-form-group>
            </div>
            <div class="col-md-6">
              <b-form-group label="Niveau de prix">
                <b-form-radio-group
                    v-model="niveauPrix"
                    :options="[
                      { value: 'detail', text: 'Détail' },
                      { value: 'demi_gros', text: 'Demi-gros' },
                      { value: 'gros', text: 'Gros' },
                    ]"
                    buttons button-variant="outline-primary" class="d-flex"></b-form-radio-group>
              </b-form-group>
            </div>
          </div>
        </div>
      </div>

      <!-- Produits -->
      <div class="card shadow mb-4">
        <div class="card-header py-3">Produits</div>
        <div class="card-body">
          <div class="d-flex mb-3" style="gap:.5rem">
            <search-select v-model="produitAAjouter" :options="produitOptions" class="flex-grow-1" placeholder="Ajouter un produit…"></search-select>
            <b-button variant="outline-primary" :disabled="!produitAAjouter" @click="ajouterLigne">
              <i class="fas fa-plus mr-1"></i> Ajouter
            </b-button>
          </div>

          <b-table
              v-if="lignes.length"
              bordered hover responsive small
              :items="lignes" :fields="champsLignes">
            <template v-slot:cell(prix)="row">{{ nf(row.item.prix) }} FCFA</template>
            <template v-slot:cell(quantite)="row">
              <b-form-input
                  type="number" min="1" :max="row.item.dispo" size="sm" style="max-width:110px"
                  v-model.number="row.item.quantite"
                  :state="row.item.quantite > 0 && row.item.quantite <= row.item.dispo ? null : false"></b-form-input>
            </template>
            <template v-slot:cell(dispo)="row">
              <span :class="{ 'text-danger': row.item.quantite > row.item.dispo }">{{ nf(row.item.dispo) }}</span>
            </template>
            <template v-slot:cell(sous_total)="row">{{ nf(row.item.prix * (row.item.quantite || 0)) }} FCFA</template>
            <template v-slot:cell(actions)="row">
              <b-button size="sm" variant="outline-danger" @click="lignes.splice(row.index, 1)">
                <i class="fas fa-trash"></i>
              </b-button>
            </template>
          </b-table>
          <p v-else class="text-muted mb-0">Aucun produit. Ajoutez-en au moins un.</p>

          <div class="text-right mt-3">
            <h4 class="text-uppercase text-danger font-weight-bolder">TOTAL : {{ nf(total) }} FCFA</h4>
          </div>

          <b-button variant="success" block :disabled="Loading || !peutValider" @click="valider">
            Valider le bon de livraison
          </b-button>
        </div>
      </div>
    </template>

    <!-- Modale nouveau client -->
    <b-modal ref="modalClient" hide-footer title="Nouveau client">
      <b-form-group label="Nom *"><b-form-input v-model="nouveauClient.nom"></b-form-input></b-form-group>
      <b-form-group label="Prénoms"><b-form-input v-model="nouveauClient.prenoms"></b-form-input></b-form-group>
      <b-form-group label="Téléphone"><b-form-input v-model="nouveauClient.telephone"></b-form-input></b-form-group>
      <b-button variant="success" block :disabled="Loading || !nouveauClient.nom.trim()" @click="creerClient">
        Créer le client
      </b-button>
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
  name: "vente-index",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      clients: [],
      produits: [],
      clientId: null,
      niveauPrix: 'detail',
      lignes: [],
      produitAAjouter: null,
      blCree: null,
      totalValide: 0,
      nomClient: '',
      nouveauClient: { nom: '', prenoms: '', telephone: '' },
      champsLignes: [
        { key: 'libelle', label: 'Produit' },
        { key: 'prix', label: 'Prix unitaire', class: 'text-right' },
        { key: 'dispo', label: 'Dispo', class: 'text-right' },
        { key: 'quantite', label: 'Quantité' },
        { key: 'sous_total', label: 'Sous-total', class: 'text-right' },
        { key: 'actions', label: '' },
      ],
    }
  },
  computed: {
    clientOptions() {
      return this.clients.map(c => ({ value: c.id, text: `${c.nom || ''} ${c.prenoms || ''}`.trim() || ('Client ' + c.id) }))
    },
    produitOptions() {
      const pris = this.lignes.map(l => l.code_produit)
      return this.produits
        .filter(p => !pris.includes(p.code_produit))
        .map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    total() {
      return this.lignes.reduce((t, l) => t + l.prix * (Number(l.quantite) || 0), 0)
    },
    peutValider() {
      return this.clientId
        && this.lignes.length > 0
        && this.lignes.every(l => Number(l.quantite) > 0 && Number(l.quantite) <= l.dispo)
    },
  },
  watch: {
    niveauPrix() {
      this.lignes.forEach(l => {
        const p = this.produits.find(x => x.code_produit === l.code_produit)
        if (p) l.prix = this.prixNiveau(p)
      })
    },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    prixNiveau(p) {
      if (this.niveauPrix === 'gros') return Number(p.prix_gros) || 0
      if (this.niveauPrix === 'demi_gros') return Number(p.prix_demi_gros) || 0
      return Number(p.prix_detail) || 0
    },
    ajouterLigne() {
      const p = this.produits.find(x => x.code_produit === this.produitAAjouter)
      if (!p) return
      this.lignes.push({
        code_produit: p.code_produit,
        libelle: p.libelle_produit,
        prix: this.prixNiveau(p),
        dispo: Number(p.quantite_produit) || 0,
        quantite: 1,
      })
      this.produitAAjouter = null
    },
    async valider() {
      if (this.Loading || !this.peutValider) return
      this.Loading = true
      const total = this.total
      const data = {
        niveau_prix: this.niveauPrix,
        produits: this.lignes.map(l => ({
          code_produit: l.code_produit,
          quantite_acheter: Number(l.quantite),
          prix_vente: l.prix,
        })),
        montant_total: total,
        montant_total_ttc: total,
        clients: this.clientId,
        date_commande: moment().format('YYYY-MM-DD'),
        avec_fne: false,
      }
      await axios.post(`${API_BASE_URL}/api/facture_directe`, data).then(r => {
        this.blCree = r.data
        this.totalValide = total
        const c = this.clients.find(x => x.id === this.clientId)
        this.nomClient = c ? `${c.nom || ''} ${c.prenoms || ''}`.trim() : ''
      }).catch(e => {
        console.log(e)
        this.$bvToast.toast("Erreur lors de la création du bon de livraison.", { title: 'Vente', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    imprimer() {
      if (this.blCree) imprimerDocument('bl', this.blCree)
    },
    nouvelleVente() {
      this.blCree = null
      this.clientId = null
      this.niveauPrix = 'detail'
      this.lignes = []
      this.produitAAjouter = null
      this.fetchProduits()
    },
    async creerClient() {
      const nom = this.nouveauClient.nom.trim()
      if (this.Loading || !nom) return
      this.Loading = true
      await axios.post(`${API_BASE_URL}/api/clients`, {
        nom,
        prenoms: this.nouveauClient.prenoms || null,
        telephone: this.nouveauClient.telephone || null,
      }).then(async r => {
        this.nouveauClient = { nom: '', prenoms: '', telephone: '' }
        this.$refs.modalClient.hide()
        await this.fetchClients()
        if (r.data && r.data.id) this.clientId = r.data.id
        this.$bvToast.toast('Client créé.', { title: 'Client', variant: 'success', solid: true })
      }).catch(e => {
        console.log(e)
        this.$bvToast.toast("Erreur lors de la création du client.", { title: 'Client', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchClients() {
      await axios.get(`${API_BASE_URL}/api/clients`).then(r => { this.clients = r.data }).catch(e => console.log(e))
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(r => { this.produits = r.data.element }).catch(e => console.log(e))
    },
    fetchTout() {
      this.fetchClients()
      this.fetchProduits()
    },
  },
  created() {
    this.fetchTout()
  },
}
</script>

<style scoped>
</style>
