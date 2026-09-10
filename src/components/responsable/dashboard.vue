<template>
  <div class="container-fluid p-3">
    <PageHeader title="Tableau de bord" subtitle="Pilotage et analyse de l'activité" crumb="Responsable">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchTout">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-body">
        <div class="row align-items-end">
          <div class="col-md-4">
            <b-form-group label="Date début">
              <b-form-datepicker locale="fr-FR" v-model="dateDebut"></b-form-datepicker>
            </b-form-group>
          </div>
          <div class="col-md-4">
            <b-form-group label="Date fin">
              <b-form-datepicker locale="fr-FR" v-model="dateFin"></b-form-datepicker>
            </b-form-group>
          </div>
          <div class="col-md-4 mb-3">
            <b-button variant="primary" block @click="fetchRapport">Consulter la période</b-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loaded" class="text-center text-muted py-5">
      <b-spinner style="width: 2.5rem; height: 2.5rem;" class="text-primary"></b-spinner>
      <div class="mt-2">Chargement…</div>
    </div>

    <template v-else>
      <div class="row">
        <div class="col-xl col-md-6 mb-4">
          <StatCard label="Encaissé" :value="fmt(kpis.encaisse)" icon="fas fa-check-circle" variant="accent" />
        </div>
        <div class="col-xl col-md-6 mb-4">
          <StatCard label="Reste à encaisser" :value="fmt(resteAEncaisser)"
                    :sub="'TTC : ' + fmt(resteAEncaisserTtc)" icon="fas fa-hourglass-half" variant="primary" />
        </div>
        <div class="col-xl col-md-6 mb-4">
          <StatCard label="Décaissement" :value="fmt(kpis.decaissement)" icon="fas fa-arrow-down" variant="danger" />
        </div>
        <div class="col-xl col-md-6 mb-4">
          <StatCard label="Autres entrées" :value="fmt(kpis.autres_entrees)" icon="fas fa-coins" variant="warning" />
        </div>
        <div class="col-xl col-md-6 mb-4">
          <StatCard label="Reste à verser (commerciaux)" :value="fmt(kpis.reste_a_verser_commerciaux)"
                    icon="fas fa-people-carry" variant="primary" />
        </div>
      </div>

      <div class="row">
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-chart-line mr-2"></i> Chiffre d'affaires encaissé par jour
            </div>
            <div class="card-body" style="height: 300px;">
              <LineChart :chart-data="caChartData" :chart-options="lineOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-balance-scale mr-2"></i> Trésorerie — encaissements vs décaissements
            </div>
            <div class="card-body" style="height: 300px;">
              <BarChart :chart-data="tresorerieChartData" :chart-options="barOptions" />
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-industry mr-2"></i> Production — quantité transformée par jour
            </div>
            <div class="card-body" style="height: 300px;">
              <LineChart :chart-data="transformationsChartData" :chart-options="lineOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-warehouse mr-2"></i> Stock par étape de production
            </div>
            <div class="card-body" style="height: 300px;">
              <BarChart :chart-data="stockChartData" :chart-options="barOptions" />
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-trophy mr-2"></i> Top produits vendus
            </div>
            <div class="card-body" style="height: 280px;">
              <BarChart :chart-data="topProduitsChartData" :chart-options="horizontalBarOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-user-friends mr-2"></i> Top clients
            </div>
            <div class="card-body" style="height: 280px;">
              <BarChart :chart-data="topClientsChartData" :chart-options="horizontalBarOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-people-carry mr-2"></i> Soldes commerciaux
            </div>
            <div class="card-body" style="height: 280px;">
              <BarChart :chart-data="soldesChartData" :chart-options="horizontalBarOptions" />
            </div>
          </div>
        </div>
      </div>

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
                  @click="ouvrirDetailReappro(row.item)">
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

          <b-modal
              v-model="showDetailReappro"
              :title="'Réapprovisionnements — ' + (detailProduit ? detailProduit.libelle : '')"
              ok-only ok-title="Fermer">
            <b-table
                small bordered head-variant="light"
                :items="detailReapproRows"
                :fields="[{ key:'date', label:'Date' }, { key:'quantite', label:'Réappro', class:'text-right' }]"
                show-empty empty-text="Aucun réapprovisionnement">
              <template #cell(date)="row">{{ row.value }}</template>
              <template #cell(quantite)="row"><span class="text-success font-weight-bold">+ {{ nf(row.item.quantite) }}</span></template>
            </b-table>
            <div v-if="detailProduit" class="text-right font-weight-bold mt-2">
              Total : {{ nf(detailProduit.total_reappro) }}
            </div>
          </b-modal>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import API_BASE_URL from '@/api/config.js'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatCard from '@/components/ui/StatCard.vue'
import moment from 'moment'
const axios = require('axios')

import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, BarElement)

const COULEUR_ENCAISSE = '#4F46E5'
const COULEUR_DECAISSE = '#DC2626'
const COULEURS_ETAPES = ['#94A3B8', '#D97706', '#7C3AED', '#16A34A']

export default {
  name: 'responsable-dashboard',
  components: { PageHeader, StatCard, LineChart: Line, BarChart: Bar },
  data() {
    return {
      loaded: false,
      dateDebut: moment().subtract(29, 'days').format('YYYY-MM-DD'),
      dateFin: moment().format('YYYY-MM-DD'),
      kpis: { encaisse: 0, decaissement: 0, autres_entrees: 0, reste_a_verser_commerciaux: 0 },
      caParJour: [],
      tresorerieParJour: [],
      transformationsParJour: [],
      stockParEtape: [],
      topProduits: [],
      topClients: [],
      soldesCommerciaux: [],
      // KPI opérationnel (/api/dash)
      ventesRealiser: 0,
      ventesARealiser: 0,
      ventesRealiserTtc: 0,
      ventesARealiserTtc: 0,
      // Réconciliation de stock (/api/reconciliation_stock)
      reconLoading: false,
      reconDates: [],
      reconProduits: [],
      showDetailReappro: false,
      detailProduit: null,
      lineOptions: { responsive: true, maintainAspectRatio: false },
      barOptions: { responsive: true, maintainAspectRatio: false },
      horizontalBarOptions: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' },
    }
  },
  computed: {
    resteAEncaisser() {
      return this.ventesARealiser - this.ventesRealiser
    },
    resteAEncaisserTtc() {
      return this.ventesARealiserTtc - this.ventesRealiserTtc
    },
    caChartData() {
      return {
        labels: this.caParJour.map(l => this.formatJour(l.date)),
        datasets: [{ label: 'CA encaissé (FCFA)', backgroundColor: COULEUR_ENCAISSE, borderColor: COULEUR_ENCAISSE, data: this.caParJour.map(l => l.montant), tension: 0.3 }],
      }
    },
    tresorerieChartData() {
      return {
        labels: this.tresorerieParJour.map(l => this.formatJour(l.date)),
        datasets: [
          { label: 'Encaissé', backgroundColor: COULEUR_ENCAISSE, data: this.tresorerieParJour.map(l => l.encaisse) },
          { label: 'Décaissé', backgroundColor: COULEUR_DECAISSE, data: this.tresorerieParJour.map(l => l.decaisse) },
        ],
      }
    },
    transformationsChartData() {
      return {
        labels: this.transformationsParJour.map(l => this.formatJour(l.date)),
        datasets: [{ label: 'Quantité transformée', backgroundColor: COULEURS_ETAPES[2], borderColor: COULEURS_ETAPES[2], data: this.transformationsParJour.map(l => l.quantite), tension: 0.3 }],
      }
    },
    stockChartData() {
      return {
        labels: this.stockParEtape.map(p => p.libelle_produit),
        datasets: [
          { label: 'Matière première', backgroundColor: COULEURS_ETAPES[0], data: this.stockParEtape.map(p => p.quantite_matiere_premiere) },
          { label: 'Torréfié', backgroundColor: COULEURS_ETAPES[1], data: this.stockParEtape.map(p => p.quantite_torrefie) },
          { label: 'Broyé', backgroundColor: COULEURS_ETAPES[2], data: this.stockParEtape.map(p => p.quantite_broye) },
          { label: 'Emballé', backgroundColor: COULEURS_ETAPES[3], data: this.stockParEtape.map(p => p.quantite_emballe) },
        ],
      }
    },
    topProduitsChartData() {
      return {
        labels: this.topProduits.map(p => p.libelle_produit),
        datasets: [{ label: 'Quantité vendue', backgroundColor: COULEUR_ENCAISSE, data: this.topProduits.map(p => p.quantite) }],
      }
    },
    topClientsChartData() {
      return {
        labels: this.topClients.map(c => `${c.nom} ${c.prenoms || ''}`.trim()),
        datasets: [{ label: 'Quantité achetée', backgroundColor: COULEURS_ETAPES[2], data: this.topClients.map(c => c.quantite) }],
      }
    },
    soldesChartData() {
      return {
        labels: this.soldesCommerciaux.map(c => `${c.nom} ${c.prenoms || ''}`.trim()),
        datasets: [{ label: 'Reste à verser (FCFA)', backgroundColor: COULEUR_DECAISSE, data: this.soldesCommerciaux.map(c => c.reste_a_verser) }],
      }
    },
    champsRecon() {
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
    reconRows() {
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
    reconTotalRow() {
      const keys = ['depart', 'total_reappro', 'entrees', 'sortie', 'reste']
      const totals = {}
      keys.forEach(k => {
        totals[k] = this.reconRows.reduce((s, row) => s + (Number(row[k]) || 0), 0)
      })
      return totals
    },
    detailReapproRows() {
      if (!this.detailProduit) return []
      const out = []
      this.reconDates.forEach((d, i) => {
        const q = (this.detailProduit.reappros || [])[i] || 0
        if (q > 0) out.push({ date: this.$dateFr(d), quantite: q })
      })
      return out
    },
  },
  methods: {
    formatJour(d) {
      return moment(d).format('DD/MM')
    },
    fmt(value) {
      return new Intl.NumberFormat('fr-FR').format(Math.floor(value || 0)) + ' FCFA'
    },
    nf(value) {
      return new Intl.NumberFormat('fr-FR').format(value || 0)
    },
    ouvrirDetailReappro(item) {
      this.detailProduit = item
      this.showDetailReappro = true
    },
    async fetchRapport() {
      await axios.get(`${API_BASE_URL}/api/rapport-analytique`, {
        params: { date_debut: this.dateDebut, date_fin: this.dateFin },
      }).then(response => {
        const d = response.data
        this.kpis = d.kpis
        this.caParJour = d.ca_par_jour
        this.tresorerieParJour = d.tresorerie_par_jour
        this.transformationsParJour = d.transformations_par_jour
        this.stockParEtape = d.stock_par_etape
        this.topProduits = d.top_produits
        this.topClients = d.top_clients
        this.soldesCommerciaux = d.soldes_commerciaux
      }).catch((err) => console.log(err))
      this.loaded = true
    },
    async fetchDash() {
      const raw = localStorage.getItem('LoggedUser')
      let headers = {}
      if (raw) {
        try {
          const user = JSON.parse(raw)
          headers = { Authorization: `Bearer ${user.username}`, 'Content-Type': 'application/json' }
        } catch (e) { /* ignore */ }
      }
      await axios.get(`${API_BASE_URL}/api/dash`, { headers }).then(response => {
        const d = response.data
        this.ventesRealiser = Math.floor((d.ventes_realiser && d.ventes_realiser.montant_total) || 0)
        this.ventesARealiser = Math.floor(d.ventes_a_realiser || 0)
        this.ventesRealiserTtc = Math.floor((d.ventes_realiser_ttc && d.ventes_realiser_ttc.montant_total) || 0)
        this.ventesARealiserTtc = Math.floor(d.ventes_a_realiser_ttc || 0)
      }).catch((err) => console.log(err))
    },
    async fetchRecon() {
      this.reconLoading = true
      try {
        const res = await axios.get(`${API_BASE_URL}/api/reconciliation_stock`)
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
    fetchTout() {
      this.fetchRapport()
      this.fetchDash()
      this.fetchRecon()
    },
  },
  created() {
    this.fetchTout()
  },
}
</script>

<style scoped>
</style>
