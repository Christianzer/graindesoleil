<template>
  <div class="container-fluid p-3">
    <PageHeader title="Produits" subtitle="Catalogue et stock disponible" crumb="Référentiels">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchdata">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="openModal">
          <i class="fas fa-plus mr-1"></i> Nouveau produit
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        Listes des produits
      </div>
      <div class="card-body">
        <template v-if="isLoading === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-col md="3" align="right">
            <b-form-input type="search" id="filterInput" v-model="filter" placeholder="Rechercher....."></b-form-input>
          </b-col>
          <br>
          <b-table
              head-variant="light"
              bordered
              hover
              responsive="xl"
              :items="all_produits"
              :fields="fields"
              :filter="filter"
            @filtered="onFiltered"
              :current-page="currentPage"
              :per-page="perPage"
          >

            <template v-slot:cell(prix_detail)="row">
              {{new Intl.NumberFormat().format(row.item.prix_detail)}} FCFA
            </template>

            <template v-slot:cell(prix_demi_gros)="row">
              {{new Intl.NumberFormat().format(row.item.prix_demi_gros)}} FCFA
            </template>

            <template v-slot:cell(prix_gros)="row">
              {{new Intl.NumberFormat().format(row.item.prix_gros)}} FCFA
            </template>

            <template v-slot:cell(actions)="row">
              <b-button
                  size="sm"
                  variant="outline-primary"
                  class="mr-1"
                  @click="modifier(row.item)"
              >
                modifier
              </b-button>

              <b-button
                  v-if="estResponsable"
                  size="sm"
                  variant="outline-warning"
                  class="mr-1"
                  @click="ouvrirReajustement(row.item)"
              >
                réajuster
              </b-button>

              <b-button
                  v-if="estResponsable"
                  size="sm"
                  variant="outline-success"
                  class="mr-1"
                  @click="ouvrirAjout(row.item)"
              >
                ajouter du stock
              </b-button>

              <b-button
                  v-if="estResponsable"
                  size="sm"
                  variant="outline-secondary"
                  class="mr-1"
                  @click="ouvrirHistorique(row.item)"
              >
                historique
              </b-button>

              <b-button
                  size="sm"
                  variant="outline-danger"
                  class="mr-1"
                  @click="supprimer(row.item.code_produit)"
              >
                supprimer
              </b-button>
            </template>
          </b-table>
          <b-pagination
              :total-rows="totalRows"
              :per-page="perPage"
              v-model="currentPage"
              class="my-0 pagination-sm"
          />
        </template>
      </div>

    </div>

    <Form ref="modal"></Form>

    <b-modal ref="modalReajustement" title="Bon de réajustement de stock" hide-footer>
      <template v-if="produitAAjuster">
        <p class="mb-1"><strong>{{ produitAAjuster.libelle_produit }}</strong> ({{ produitAAjuster.code_produit }})</p>
        <p class="text-muted small mb-3">Stock actuel : {{ new Intl.NumberFormat().format(produitAAjuster.quantite_produit) }} kg</p>
        <b-form-group label="Nouvelle quantité en stock (kg)">
          <b-form-input type="number" min="0" step="0.01" v-model="nouvelleQuantiteReajustement"></b-form-input>
        </b-form-group>
        <b-form-group label="Motif du réajustement">
          <b-form-textarea v-model="motifReajustement" rows="2" placeholder="Ex : inventaire physique, correction d'écart..."></b-form-textarea>
        </b-form-group>
        <b-button variant="warning" block :disabled="loadingReajustement" @click="confirmerReajustement">
          Valider le réajustement
        </b-button>
      </template>
    </b-modal>

    <b-modal ref="modalAjout" title="Ajout de stock" hide-footer>
      <template v-if="produitAAjuster">
        <p class="mb-1"><strong>{{ produitAAjuster.libelle_produit }}</strong> ({{ produitAAjuster.code_produit }})</p>
        <p class="text-muted small mb-3">Stock actuel : {{ new Intl.NumberFormat().format(produitAAjuster.quantite_produit) }} kg</p>
        <b-form-group label="Quantité à ajouter (kg)">
          <b-form-input type="number" min="0" step="0.01" v-model="quantiteAjout"></b-form-input>
        </b-form-group>
        <b-form-group label="N° de bon (obligatoire)">
          <b-form-input v-model="numeroBonAjout" maxlength="60" placeholder="Ex : BE-0042"></b-form-input>
        </b-form-group>
        <b-form-group label="Note (facultatif)">
          <b-form-textarea v-model="noteAjout" rows="2"></b-form-textarea>
        </b-form-group>
        <b-button variant="success" block :disabled="loadingReajustement || !numeroBonAjout.trim() || !(Number(quantiteAjout) > 0)" @click="confirmerAjout">
          Ajouter au stock
        </b-button>
      </template>
    </b-modal>

    <b-modal ref="modalHistorique" title="Historique des ajouts de stock" size="lg" hide-footer>
      <p v-if="produitAAjuster" class="mb-2"><strong>{{ produitAAjuster.libelle_produit }}</strong> ({{ produitAAjuster.code_produit }})</p>
      <b-table small bordered responsive :items="historique" :fields="champsHistorique" show-empty empty-text="Aucun ajout ni réajustement.">
        <template v-slot:cell(type)="row">{{ row.item.type === 'ajout_manuel' ? 'Ajout' : 'Réajustement' }}</template>
      </b-table>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import Form from "./form";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";
export default {
  name: "index",
  data(){
    return {
      filter :"",
      all_produits : [],
      currentPage: 1,
      isLoading : false,
      perPage: 10,
      totalRows: null,
      selectedCode: null,
      produitAAjuster: null,
      nouvelleQuantiteReajustement: 0,
      motifReajustement: '',
      loadingReajustement: false,
      quantiteAjout: '',
      numeroBonAjout: '',
      noteAjout: '',
      historique: [],
      champsHistorique: [
        { key: 'date_mouvement', label: 'Date' },
        { key: 'type', label: 'Type' },
        { key: 'quantite', label: 'Qté (kg)' },
        { key: 'reference', label: 'N° bon' },
        { key: 'observation', label: 'Détail' },
      ],
      fields : [
        {
          key:'code_produit',
          sortable:true,
        },
        {
          key:'libelle_produit',
          sortable:true,
        },
        {
          key:'prix_detail',
          label: 'Détail',
          sortable:true,
        },
        {
          key:'prix_demi_gros',
          label: 'Demi-gros',
          sortable:true,
        },
        {
          key:'prix_gros',
          label: 'Gros',
          sortable:true,
        },
        {
          key:'quantite_produit',
          label:'Quantité disponible (kg)',
          sortable:true,
        },

        {
          key: 'actions'
        }
      ]
    }
  },
  components: {
    Form,
    PageHeader
  },
  computed: {
    estResponsable() {
      try {
        const user = JSON.parse(localStorage.getItem('LoggedUser') || '{}')
        return [1, 3].includes(user.type_user)
      } catch (e) {
        return false
      }
    }
  },
  created() {
    flow.clearSale()
    this.fetchdata()
    Fire.$on('creationok',()=>{
      this.fetchdata()
    })

  },
  methods: {
    onFiltered(filteredItems) {
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
    openModal() {
      this.$refs.modal.editMode = false
      this.$refs.modal.showModal()
    },
    async modifier(dataPat) {
      this.$refs.modal.selectedTA = dataPat
      this.$refs.modal.editMode = true
      this.$refs.modal.showModal()
    },
    async fetchdata(){
      this.isLoading = false
      let urlapi = `${API_BASE_URL}/api/produits`
      await axios.get(urlapi).then((response) => {
        let statut = response.status
        if (statut === 201) {
          this.all_produits = response.data.element
          this.totalRows = this.all_produits.length
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    async supprimer(code) {
      let urlapi = `${API_BASE_URL}/api/produits/${code}`
      await axios.delete(urlapi).then((response) => {
        let statut = response.status
        if (statut === 201) {
          this.fetchdata()
        }
      }).catch((err) => {
        console.log(err)
      })
    },
    ouvrirReajustement(produit) {
      this.produitAAjuster = produit
      this.nouvelleQuantiteReajustement = produit.quantite_produit
      this.motifReajustement = ''
      this.$refs.modalReajustement.show()
    },
    ouvrirAjout(produit) {
      this.produitAAjuster = produit
      this.quantiteAjout = ''
      this.numeroBonAjout = ''
      this.noteAjout = ''
      this.$refs.modalAjout.show()
    },
    async confirmerAjout() {
      this.loadingReajustement = true
      await axios.post(`${API_BASE_URL}/api/produits/${this.produitAAjuster.code_produit}/ajouter-stock`, {
        quantite: this.quantiteAjout,
        numero_bon: this.numeroBonAjout,
        note: this.noteAjout
      }).then(() => {
        this.$refs.modalAjout.hide()
        this.fetchdata()
      }).catch((err) => {
        alert(err.response && err.response.data && err.response.data.message ? err.response.data.message : "Erreur lors de l'ajout de stock.")
      })
      this.loadingReajustement = false
    },
    async ouvrirHistorique(produit) {
      this.produitAAjuster = produit
      this.historique = []
      this.$refs.modalHistorique.show()
      await axios.get(`${API_BASE_URL}/api/produits/${produit.code_produit}/historique-stock`)
        .then((response) => { this.historique = response.data })
        .catch((err) => { console.log(err) })
    },
    async confirmerReajustement() {
      if (!this.produitAAjuster) return
      this.loadingReajustement = true
      let urlapi = `${API_BASE_URL}/api/produits/${this.produitAAjuster.code_produit}/ajuster-stock`
      await axios.put(urlapi, {
        quantite: this.nouvelleQuantiteReajustement,
        motif: this.motifReajustement
      }).then(() => {
        this.$refs.modalReajustement.hide()
        this.fetchdata()
      }).catch((err) => {
        alert(err.response && err.response.data && err.response.data.message ? err.response.data.message : "Erreur lors du réajustement.")
      })
      this.loadingReajustement = false
    },
  }
}
</script>

<style scoped>

</style>
