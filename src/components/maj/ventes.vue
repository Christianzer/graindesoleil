<template>
  <div class="container-fluid p-3">
    <PageHeader title="Facture" subtitle="Mise à jour de la facture" crumb="Ventes">
      <template #actions>
        <b-button variant="primary" :to="{name : 'panier_facture'}">
          <i class="fas fa-file-invoice mr-1"></i> Voir la facture
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3 text-uppercase font-weight-bold">
        Produits
      </div>
      <div class="card-body">
        <template v-if="loader === false">
          <div class="text-center">
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner"></b-spinner>
            <b-spinner style="width: 3rem; height: 3rem;" label="Large Spinner" type="grow"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-form-group label="Niveau de prix" class="font-weight-bold text-uppercase" label-cols-sm="2">
            <b-form-radio-group
                v-model="niveauPrix"
                :options="[
                  { text: 'Détail', value: 'detail' },
                  { text: 'Demi-gros', value: 'demi_gros' },
                  { text: 'Gros', value: 'gros' },
                ]"
                buttons
                button-variant="outline-primary"
            />
          </b-form-group>
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
              :current-page="currentPage"
              :per-page="perPage"
              :filter="filter"
          >
            <template v-slot:cell(consulter)="row">
              <b-button
                  size="sm"
                  variant="primary"
                  class="mr-1"
                  v-if="!row.item.consulter"
                  :disabled="row.item.consulter"
                  @click="row.item.consulter = true, ajouterPanier(JSON.parse(JSON.stringify(row.item)))"
              >
                Ajouter à la facture
              </b-button>
              <b-button
                  size="sm"
                  variant="warning"
                  class="mr-1"
                  v-if="row.item.consulter"
                  :disabled="row.item.consulter"
              >
                Deja Ajouté à la facture
              </b-button>
              <b-button
                  size="sm"
                  variant="danger"
                  class="mr-1"
                  v-if="row.item.quantite_produit === 0"
                  :disabled="row.item.quantite_produit === 0"
              >
                Stock Epuisé
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
  </div>
</template>

<script>
import axios from "axios";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import flow from "@/store/flow";

export default {
  components: { PageHeader },
  name: "index",
  data() {
    return {
      nbre_article:0,
      loader:false,
      isLoading: false,
      currentPage: 1,
      perPage: 10,
      totalRows: null,
      selectedCode: null,
      filter :"",
      selected : false,
      data_article : [],
      all_produits:[],
      niveauPrix: flow.getNiveauPrix() || 'detail',
      fields: [
        {
          key: 'code_produit',
          sortable: true
        },
        {
          key: 'libelle_produit',
          sortable: true
        },
        {
          key: 'prix_detail',
          label:'Détail',
          sortable: true
        },
        {
          key: 'prix_demi_gros',
          label: 'Demi-gros',
          sortable: true
        },
        {
          key: 'prix_gros',
          label: 'Gros',
          sortable: true
        },
        {
          key: 'quantite_produit',
          label:'Quantite Disponible',
          sortable: true
        },

        {
          key: 'consulter',
          label: 'Action',
          sortable: true
        }
      ]
    }
  },
  methods: {
    async fetchProduits(){
      this.loader = false
      let api = `${API_BASE_URL}/api/produits`
      await axios.get(api).then(response=>{
      if (response.status === 201){
        flow.setArticlesProd(response.data.element)
        this.all_produits = flow.getArticlesProd()
        this.data_article = flow.getArticlesProd()
        this.totalRows = this.all_produits.length
      }
      }).catch((err) => {
        console.log(err)
      })
      this.loader = true

    },
    async ajouterPanier(dataArticle){
      dataArticle.prix_vente = dataArticle['prix_' + this.niveauPrix]
      let article = flow.getProduits() || []
      article.push(dataArticle)
      flow.setProduits(article)
    }
  },
  watch: {
    niveauPrix(val) {
      flow.setNiveauPrix(val)
    }
  },
  created() {
    flow.setNiveauPrix(this.niveauPrix)
    this.fetchProduits()
    var fruits = flow.getProduits() || []
    for (let index = 0;index < fruits.length;index++){
      for (let index2 = 0;index2 < this.data_article.length;index2++){
        if (fruits[index].id_article === this.data_article[index2].id_article){
          this.data_article[index2].consulter = true
        }
      }
    }
  },
}
</script>

<style scoped>

</style>
