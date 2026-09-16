<template>
  <div class="container-fluid p-3">
    <PageHeader title="Tableau de bord" subtitle="Atelier de transformation" crumb="Usine">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchData(); fetchRapport()">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="imprimerDashboard">
          <i class="fas fa-print mr-1"></i> Imprimer
        </b-button>
      </template>
    </PageHeader>

    <div v-if="!loaded" class="text-center text-muted py-5">
      <b-spinner style="width:2.5rem;height:2.5rem;" class="text-primary"></b-spinner>
      <div class="mt-2">Chargement…</div>
    </div>

    <template v-else>
      <div class="row">
        <div class="col-xl-4 col-md-6 mb-4">
          <StatCard label="Demandes à livrer" :value="String(data.demandes_a_livrer)"
                    icon="fas fa-dolly" variant="primary" />
        </div>
        <div class="col-xl-4 col-md-6 mb-4">
          <StatCard label="Dette fournisseurs" :value="fmt(data.dette_fournisseurs)"
                    icon="fas fa-file-invoice-dollar" variant="danger" />
        </div>
        <div class="col-xl-4 col-md-6 mb-4">
          <StatCard label="Approvisionnement du mois" :value="fmt(data.appro_mois)"
                    icon="fas fa-truck-loading" variant="warning" />
        </div>
      </div>

      <div class="row">
        <div class="col-lg-7">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-layer-group mr-2"></i> Stock par stade <span class="text-muted small">(kg)</span>
            </div>
            <div class="card-body">
              <b-table
                  head-variant="light" hover responsive small
                  :items="data.stock_stades" :fields="champsStades"
                  show-empty empty-text="Aucun produit">
                <template v-slot:cell(matiere_premiere)="row">{{ nf(row.item.matiere_premiere) }}</template>
                <template v-slot:cell(torrefie)="row">{{ nf(row.item.torrefie) }}</template>
                <template v-slot:cell(broye)="row">{{ nf(row.item.broye) }}</template>
                <template v-slot:cell(emballe)="row">{{ nf(row.item.emballe) }}</template>
              </b-table>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-industry mr-2"></i> Lots en cours <span class="text-muted small">/ {{ data.lots_en_cours.length }}</span>
            </div>
            <div class="card-body">
              <b-table
                  head-variant="light" hover responsive small
                  :items="data.lots_en_cours" :fields="champsLots"
                  show-empty empty-text="Aucun lot en cours">
                <template v-slot:cell(prochaine_etape)="row">{{ etapeLabel(row.item.prochaine_etape) }}</template>
              </b-table>
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
              <LineChart ref="transformationsChart" :chart-data="transformationsChartData" :chart-options="lineOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-warehouse mr-2"></i> Stock par étape de production
            </div>
            <div class="card-body" style="height: 300px;">
              <BarChart ref="stockChart" :chart-data="stockChartData" :chart-options="barOptions" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import PageHeader from "@/components/ui/PageHeader.vue";
import StatCard from "@/components/ui/StatCard.vue";
import moment from "moment";
import { genererDocument } from '@/documents'
import { dashboardUsine } from '@/documents/builders'

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

const COULEURS_ETAPES = ['#94A3B8', '#D97706', '#7C3AED', '#16A34A']

const ETAPE_COURT = {
  matiere_vers_torrefaction: 'Torréfaction',
  torrefaction_vers_broyage: 'Broyage',
  broyage_vers_emballage: 'Emballage',
}

export default {
  name: "usine-dashboard",
  components: { PageHeader, StatCard, LineChart: Line, BarChart: Bar },
  data() {
    return {
      loaded: false,
      data: {
        stock_stades: [],
        lots_en_cours: [],
        demandes_a_livrer: 0,
        dette_fournisseurs: 0,
        appro_mois: 0,
      },
      transformationsParJour: [],
      stockParEtape: [],
      lineOptions: { responsive: true, maintainAspectRatio: false },
      barOptions: { responsive: true, maintainAspectRatio: false },
      champsStades: [
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'matiere_premiere', label: 'Matière première', class: 'text-right' },
        { key: 'torrefie', label: 'Torréfié', class: 'text-right' },
        { key: 'broye', label: 'Broyé', class: 'text-right' },
        { key: 'emballe', label: 'Emballé', class: 'text-right' },
      ],
      champsLots: [
        { key: 'code_lot', label: 'Lot' },
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'prochaine_etape', label: 'Prochaine étape' },
      ],
    }
  },
  computed: {
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
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Number(v) || 0)
    },
    fmt(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0)) + ' FCFA'
    },
    etapeLabel(v) {
      return ETAPE_COURT[v] || (v || '—')
    },
    formatJour(d) {
      return moment(d).format('DD/MM')
    },
    async fetchData() {
      await axios.get(`${API_BASE_URL}/api/usine/dashboard`).then(r => {
        this.data = r.data
      }).catch(e => console.log(e))
      this.loaded = true
    },
    async fetchRapport() {
      await axios.get(`${API_BASE_URL}/api/rapport-analytique`).then(response => {
        const d = response.data
        this.transformationsParJour = d.transformations_par_jour || []
        this.stockParEtape = d.stock_par_etape || []
      }).catch(e => console.log(e))
    },
    imprimerDashboard() {
      genererDocument(dashboardUsine({
        date: moment().format('YYYY-MM-DD'),
        stades: this.data.stock_stades,
        lots: this.data.lots_en_cours,
        demandes_a_livrer: this.data.demandes_a_livrer,
        dette_fournisseurs: this.data.dette_fournisseurs,
        appro_mois: this.data.appro_mois,
      }))
    },
  },
  created() {
    this.fetchData()
    this.fetchRapport()
  },
}
</script>

<style scoped>
</style>
