<template>
  <div class="container-fluid p-3">
    <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de l'activité" crumb="Grains Moulus">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchdata">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>

    <!-- Chargement -->
    <div v-if="isLoading === false" class="text-center text-muted py-5">
      <b-spinner style="width: 2.5rem; height: 2.5rem;" class="text-primary"></b-spinner>
      <div class="mt-2">Chargement des données…</div>
    </div>

    <template v-else>
      <!-- Indicateurs clés -->
      <div class="row">
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Encaissé"
                    :value="fmt(ventes_realiser)"
                    :sub="'TTC : ' + fmt(ventes_realiser_ttc)"
                    icon="fas fa-check-circle" variant="accent" />
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Reste à encaisser"
                    :value="fmt(ventes_a_realiser - ventes_realiser)"
                    :sub="'TTC : ' + fmt(ventes_a_realiser_ttc - ventes_realiser_ttc)"
                    icon="fas fa-hourglass-half" variant="primary" />
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Approvisionnement" :value="fmt(appro)"
                    icon="fas fa-truck-loading" variant="warning" />
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Décaissement" :value="fmt(decaissement)"
                    icon="fas fa-arrow-down" variant="danger" />
        </div>
      </div>

      <!-- Réconciliation de stock : départ, réappros par date (+ total), sortie, reste -->
      <div class="row">
        <div class="col-12">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-balance-scale mr-2"></i> Réconciliation de stock
              <small class="text-muted font-weight-normal">— Départ + Réappros − Sortie = Reste</small>
            </div>
            <div class="card-body">
              <div v-if="reconLoading" class="text-center py-3"><b-spinner variant="primary"></b-spinner></div>
              <b-table
                v-else
                head-variant="light" hover responsive small
                :items="reconRows" :fields="champsRecon"
                show-empty empty-text="Aucun produit">
                <template #cell(total_reappro)="row">
                  <b-button
                    v-if="row.item.total_reappro > 0"
                    variant="link" class="p-0 font-weight-bold"
                    @click="ouvrirDetailReappro(row.item)"
                  >
                    {{ nf(row.item.total_reappro) }} <i class="fas fa-eye ml-1 text-muted"></i>
                  </b-button>
                  <span v-else class="text-muted">0</span>
                </template>
                <template #cell(sortie)="row"><span class="text-danger">{{ nf(row.item.sortie) }}</span></template>
                <template #cell(reste)="row">
                  <b-badge :variant="row.item.reste > 0 ? 'success' : 'danger'">{{ nf(row.item.reste) }}</b-badge>
                </template>
                <template #custom-foot="{ fields }">
                  <b-tr class="font-weight-bold" style="background-color:#eef0fe;">
                    <b-td v-for="f in fields" :key="f.key" :class="f.class">
                      <template v-if="f.key === 'libelle'">TOTAL</template>
                      <template v-else>{{ nf(reconTotalRow[f.key]) }}</template>
                    </b-td>
                  </b-tr>
                </template>
              </b-table>

              <!-- Modal : détail des réappros du produit -->
              <b-modal
                v-model="showDetailReappro"
                :title="'Réapprovisionnements — ' + (detailProduit ? detailProduit.libelle : '')"
                ok-only ok-title="Fermer"
              >
                <b-table
                  small bordered head-variant="light"
                  :items="detailReapproRows"
                  :fields="[{ key:'date', label:'Date' }, { key:'quantite', label:'Réappro', class:'text-right' }]"
                  show-empty empty-text="Aucun réapprovisionnement">
                  <template #cell(quantite)="row"><span class="text-success font-weight-bold">+ {{ nf(row.item.quantite) }}</span></template>
                </b-table>
                <div v-if="detailProduit" class="text-right font-weight-bold mt-2">
                  Total : {{ nf(detailProduit.total_reappro) }}
                </div>
              </b-modal>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- Top produits -->
        <div class="col-xl-3 col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-trophy mr-2"></i> Top produits <span class="text-muted small">/ {{ total_produits }}</span>
            </div>
            <div class="card-body">
              <ul class="obf-rank">
                <li v-for="(item, i) in top_fives_produits" :key="item.code_produit">
                  <span class="obf-rank__num">{{ i + 1 }}</span>
                  <span class="obf-rank__label">{{ item.libelle_produit }}</span>
                </li>
                <li v-if="top_fives_produits.length === 0" class="text-muted small">Aucune donnée</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Top clients -->
        <div class="col-xl-3 col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-user-friends mr-2"></i> Top clients <span class="text-muted small">/ {{ total_clients }}</span>
            </div>
            <div class="card-body">
              <ul class="obf-rank">
                <li v-for="(item, i) in top_five_clients" :key="i">
                  <span class="obf-rank__num">{{ i + 1 }}</span>
                  <span class="obf-rank__label">
                    {{ item.nom }} {{ item.prenoms }}
                    <small class="text-muted d-block">{{ item.telephone }}</small>
                  </span>
                </li>
                <li v-if="top_five_clients.length === 0" class="text-muted small">Aucune donnée</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import flow from "@/store/flow";
import StatCard from '@/components/ui/StatCard.vue'
const axios = require('axios')
//import moment from "moment";
export default {
  name: "index",
  components: { PageHeader, StatCard },
  data(){
    return {
      isLoading : false,
      total_clients : 0,
      total_produits : 0,
      ventes_realiser:0,
      ventes_a_realiser:0,
      ventes_realiser_ttc:0,
      ventes_a_realiser_ttc:0,
      decaissement:0,
      appro:0,
      chiffres_affaire:[],
      top_five_clients:[],
      top_fives_produits:[],
      // Réconciliation de stock
      reconLoading:false,
      reconDates:[],
      reconProduits:[],
      showDetailReappro:false,
      detailProduit:null,
      date_donner:false,
      //created_at : moment().format('YYYY-MM-DD'),
      elementTest:1,
      elementType:[
        {
          code:1,
          libelle:'Global',
        },
        {
          code: 2,
          libelle: 'A une date donnée'
        }
      ]
    }
  },
  methods:{
    async fetchdata(){
      this.isLoading = false
      let api_data = API_BASE_URL + '/api/dash'
      
      // Get logged user from localStorage
      const userString = localStorage.getItem('LoggedUser');
      let headers = {};
      if (userString) {
        const user = JSON.parse(userString);
        headers = {
          'Authorization': `Bearer ${user.username}`,
          'Content-Type': 'application/json'
        };
      }
      
      await axios.get(api_data, { headers }).then((response) => {
        let statut = response.status
        console.log('API Response:', response.data);
        console.log('API Status:', statut);
        if (statut === 200 || statut === 201) {
          let donne = response.data
          console.log(response.data)
          this.total_clients = donne['clients']['nbre_clients']
          this.total_produits = donne['produits']['id_produit']
          this.ventes_realiser = Math.floor(donne['ventes_realiser']['montant_total'])
          this.ventes_a_realiser = Math.floor(donne['ventes_a_realiser'])
          this.ventes_realiser_ttc = Math.floor(donne['ventes_realiser_ttc']['montant_total'])
          this.ventes_a_realiser_ttc = Math.floor(donne['ventes_a_realiser_ttc'])
          this.chiffres_affaire = donne['chiffres_affaire']
          this.top_five_clients = donne['top_five_clients']
          this.top_fives_produits = donne['top_fives_produits']
          this.decaissement = donne['decaissement']
          this.appro = donne['appro']
        }
      }).catch((err) => {
        console.log(err)
      })
      this.isLoading = true
    },
    async fetchRecon(){
      this.reconLoading = true
      try {
        const res = await axios.get(API_BASE_URL + '/api/reconciliation_stock')
        if (res.status === 200) {
          this.reconDates = res.data.dates || []
          this.reconProduits = res.data.produits || []
        }
      } catch (err) {
        console.log(err)
      } finally {
        this.reconLoading = false
      }
    },
    formatDate(d){
      // 'YYYY-MM-DD' -> 'DD/MM/YYYY'
      if (!d) return ''
      const parts = d.split('-')
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d
    },
    ouvrirDetailReappro(item){
      this.detailProduit = item
      this.showDetailReappro = true
    },
    vendue(value){
      if (value === null){
        return 0
      }else{
        return value
      }
    },
    fmt(value){
      return new Intl.NumberFormat('fr-FR').format(Math.floor(value || 0)) + ' FCFA'
    },
    nf(value){
      return new Intl.NumberFormat('fr-FR').format(value || 0)
    }
  },
  computed: {
    // Colonnes : Produit, Départ, Total réappro (cliquable), Sortie, Reste.
    champsRecon(){
      const money = v => new Intl.NumberFormat('fr-FR').format(Math.floor(Number(v) || 0))
      return [
        { key: 'libelle', label: 'Produit' },
        { key: 'depart', label: 'Départ', class: 'text-right', formatter: money },
        { key: 'total_reappro', label: 'Total réappro', class: 'text-right' },
        { key: 'entrees', label: 'Stock', class: 'text-right font-weight-bold', formatter: money },
        { key: 'sortie', label: 'Sortie', class: 'text-right' },
        { key: 'reste', label: 'Reste', class: 'text-right' },
      ]
    },
    // Lignes : on conserve le détail des réappros pour le modal.
    reconRows(){
      return this.reconProduits.map(p => ({
        libelle: p.libelle,
        depart: p.depart,
        total_reappro: p.total_reappro,
        entrees: p.depart + p.total_reappro,
        sortie: p.sortie,
        reste: p.reste,
        reappros: p.reappros || [],
      }))
    },
    // Sommes de chaque colonne pour la ligne TOTAL.
    reconTotalRow(){
      const keys = ['depart', 'total_reappro', 'entrees', 'sortie', 'reste']
      const totals = {}
      keys.forEach(k => {
        totals[k] = this.reconRows.reduce((s, row) => s + (Number(row[k]) || 0), 0)
      })
      return totals
    },
    // Détail des réappros du produit sélectionné (dates avec réappro > 0).
    detailReapproRows(){
      if (!this.detailProduit) return []
      const out = []
      this.reconDates.forEach((d, i) => {
        const q = (this.detailProduit.reappros || [])[i] || 0
        if (q > 0) out.push({ date: this.formatDate(d), quantite: q })
      })
      return out
    },
  },
  watch: {
    'elementTest': {
      handler (value) {
        this.date_donner = value === 2;
      },
      deep: true,
      immediate: true
    },

  },
  created() {
    flow.clearSale()
    this.fetchdata()
    this.fetchRecon()
  },

}
</script>

<style scoped>
/* Listes de classement (Top produits / Top clients) */
.obf-rank {
  list-style: none;
  margin: 0;
  padding: 0;
}
.obf-rank li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--obf-border, #e8ebf2);
  font-size: .85rem;
}
.obf-rank li:last-child { border-bottom: none; }
.obf-rank__num {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--obf-primary-50, #eef0fe);
  color: var(--obf-primary, #4f46e5);
  font-weight: 800;
  font-size: .75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.obf-rank li:first-child .obf-rank__num {
  background: var(--obf-primary, #4f46e5);
  color: #fff;
}
.obf-rank__label { line-height: 1.2; }
</style>
