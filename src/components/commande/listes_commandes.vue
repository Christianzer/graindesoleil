<template>
  <div class="container-fluid p-3">
    <PageHeader title="Bons de livraison" subtitle="Documents du client" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-secondary" @click="retour">
          <i class="fas fa-arrow-left mr-1"></i> Retour
        </b-button>
      </template>
    </PageHeader>
    <div class="card shadow mb-4">
      <div class="card-header py-3">
        <b-button variant="danger" @click="listes">Raffraichir</b-button>
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
                  :tbody-tr-class="rowClass"
                  responsive="xl"
                  :items="displayRows"
                  :fields="fields"
                  :filter="filter"
                  :current-page="currentPage"
                  :per-page="perPage"
          >
            <template v-slot:cell(code_affiche)="row">
              <template v-if="row.item.is_avoir">
                <b-badge variant="danger" class="mr-1">Avoir</b-badge>
                {{ row.item.code_facture }}
                <small class="d-block text-muted">
                  <i class="fas fa-link mr-1"></i>sur {{ row.item.facture_origine }}
                </small>
              </template>
              <template v-else>{{ row.item.code_affiche }}</template>
            </template>

            <template v-slot:cell(information)="row">
              {{row.item.nom}} {{row.item.prenoms}}
            </template>

            <template v-slot:cell(montant_total_ttc)="row">
              <span v-if="row.item.is_avoir" class="text-danger">- {{new Intl.NumberFormat().format(Math.floor(row.item.montant_total_ttc))}} FCFA</span>
              <span v-else>{{new Intl.NumberFormat().format(Math.floor(row.item.montant_total_ttc))}} FCFA</span>
            </template>

            <template v-slot:cell(montant_verser)="row">
              <span v-if="row.item.is_avoir">—</span>
              <span v-else>{{new Intl.NumberFormat().format(Math.floor(row.item.verser))}} FCFA</span>
            </template>

            <template v-slot:cell(reste_payer)="row">
              <span v-if="row.item.is_avoir">—</span>
              <span v-else>{{new Intl.NumberFormat().format(Math.floor(row.item.montant_total - row.item.verser))}} FCFA</span>
            </template>

            <template v-slot:cell(actions)="row">

              <!-- Ligne d'avoir : impression directe -->
              <template v-if="row.item.is_avoir">
                <b-button
                    size="sm"
                    class="mr-1 mt-1"
                    variant="danger"
                    @click="imprimer_facture(row.item.code_facture)"
                >
                  <i class="fas fa-print mr-1"></i>Imprimer l'avoir
                </b-button>
              </template>

              <!-- Ligne de bon de livraison -->
              <template v-else>

              <b-button
                      size="sm"
                      class="mr-1 mt-1"
                      variant="outline-primary"
                      @click="imprimer_facture(row.item.code_facture)"
              >
                Imprimer
              </b-button>

              <!-- Aucun avoir : proposer d'en créer un -->
              <b-button
                  v-if="Number(row.item.avoir_count) === 0"
                  size="sm"
                  class="mr-1 mt-1"
                  variant="outline-dark"
                  @click="faire_avoir(row.item.code_commande, row.item.verser)"
              >
                Faire un avoir
              </b-button>

              <!-- Avoir(s) déjà émis : impression directe -->
              <b-button
                  v-if="Number(row.item.avoir_count) > 0"
                  size="sm"
                  class="mr-1 mt-1"
                  variant="danger"
                  @click="imprimer_avoirs(row.item)"
              >
                <i class="fas fa-print mr-1"></i>Avoir(s) émis
              </b-button>

              <b-badge
                  v-if="Number(row.item.avoir_count) > 0"
                  variant="danger"
                  class="mr-1 mt-1 p-2"
              >
                Avoir émis : {{ new Intl.NumberFormat().format(Math.floor(row.item.avoir_total || 0)) }} FCFA
              </b-badge>

              </template>

            </template>
          </b-table>
          <!-- SECTION TOTAUX EN DESSOUS -->
          <div class="mt-3 p-3 mb-2 border rounded bg-light">
            <ul class="list-unstyled mb-3">
              <li><strong>Total :</strong> {{ new Intl.NumberFormat().format(totalMontantTTC) }} FCFA</li>
              <li><strong>Total versé :</strong> {{ new Intl.NumberFormat().format(totalVerse) }} FCFA</li>
              <li><strong>Total reste à payer :</strong> {{ new Intl.NumberFormat().format(totalReste) }} FCFA</li>
            </ul>

            <b-button
                size="sm"
                variant="primary"
                @click="imprimer_recapitulatif()"
            >
              Imprimer le recap
            </b-button>
          </div>
          <b-pagination
                  :total-rows="displayRows.length"
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
  import API_BASE_URL from '@/api/config.js'
  import flow from "@/store/flow";
  import PageHeader from "@/components/ui/PageHeader.vue";
  import { ouvrirDocument } from "@/utils/print.js";
  const axios = require('axios')
  export default {
    name: "index",
    components: { PageHeader },
    data(){
      return {
        filter :"",
        Loading:false,
        currentPage: 1,
        isLoading : false,
        perPage: 10,
        totalRows: null,
        selectedCode: null,
        all_commande : [],
        fields: [
          { key: 'code_affiche', label: 'N° document', sortable: true },
          { key: 'information', label: 'Clients' },
          { key: 'montant_total_ttc', label: 'Montant Total', sortable: true },
          { key: 'montant_verser', label: 'Montant Versé', sortable: true },
          { key: 'reste_payer', label: 'Reste à payer', sortable: true },
          { key: 'actions' },
        ],
      }
    },
    created() {
      flow.clearSale()
      this.listes()
    },
    methods: {
      retour(){
        this.$router.push({ name: 'commande_clients' })
      },
      async listes(){
        this.isLoading = false
        var id = this.$route.params.id
        let api_data = `${API_BASE_URL}/api/listes_commandes/`+id
        await axios.get(api_data).then(response=>{
          let statut = response.status
          if (statut === 201){
            this.all_commande = (response.data || []).map(item => {
              let avoirs = item.avoirs_json
              if (typeof avoirs === 'string') {
                try { avoirs = JSON.parse(avoirs) } catch (e) { avoirs = [] }
              }
              return { ...item, avoirs: Array.isArray(avoirs) ? avoirs : [] }
            })
            this.totalRows = this.all_commande.length
          }
        }).catch((err) => {
          console.log(err)
        })
        this.isLoading = true
      },
      date_com(value){
        return value
      },
      async faire_avoir(code_commande,montant){
        this.$router.push({ name: 'factures_avoir', params: { code_commande: code_commande , montant : montant}})
      },
      rowClass(item, type) {
        if (!item || type !== 'row') return
        if (item.is_avoir) return 'table-danger'
        if (item.statut_prod === 2) return 'table-success'
      },
      async imprimer_facture(code_facture){
        let api_data = `${API_BASE_URL}/api/imprimer_factures/`+code_facture
        ouvrirDocument(api_data);
      },

      // Imprime directement le(s) document(s) d'avoir liés à un bon de livraison.
      imprimer_avoirs(item){
        const list = Array.isArray(item.avoirs) ? item.avoirs : []
        if (list.length === 0) return
        list.forEach(av => this.imprimer_facture(av.code_facture))
      },

      async imprimer_recapitulatif(){
        var id = this.$route.params.id
        let api_data = `${API_BASE_URL}/api/imprimer_recapitulatif/`+id
        ouvrirDocument(api_data);
      }
    },

    computed: {
      // Aplatit la liste : chaque bon de livraison suivi de ses avoirs en lignes distinctes.
      displayRows() {
        const out = []
        for (const c of this.all_commande) {
          const code_affiche = (c.statut_prod === 2 && c.code_facture) ? c.code_facture : c.code_commande
          out.push({ ...c, is_avoir: false, code_affiche })
          const avoirs = Array.isArray(c.avoirs) ? c.avoirs : []
          for (const av of avoirs) {
            out.push({
              is_avoir: true,
              code_commande: av.code_facture,
              code_facture: av.code_facture,
              code_affiche: av.code_facture,
              facture_origine: c.code_facture,
              nom: c.nom,
              prenoms: c.prenoms,
              date_commande: av.date_facture,
              montant_total: Number(av.montant_ht || 0),
              montant_total_ttc: Number(av.montant_ttc || 0),
              verser: 0,
            })
          }
        }
        return out
      },
      totalMontantTTC() {
        return this.all_commande.reduce((acc, item) => acc + Number(item.montant_total_ttc || 0), 0);
      },
      totalVerse() {
        return this.all_commande.reduce((acc, item) => acc + Number(item.verser || 0), 0);
      },
      totalReste() {
        return this.totalMontantTTC - this.totalVerse;
      }
    },

  }
</script>
