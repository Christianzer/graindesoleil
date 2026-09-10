<template>
  <div class="container-fluid p-3">
    <PageHeader title="Tableau de bord" subtitle="Caisse — encaissements et trésorerie du jour" crumb="Caisse">
      <template #actions>
        <b-form-datepicker
            v-model="date" locale="fr-FR" :max="today"
            size="sm" class="d-inline-block mr-2" style="width:190px"
            :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
            @input="fetchData" />
        <b-button variant="outline-primary" @click="fetchData">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" class="ml-2" @click="imprimerCloture">
          <i class="fas fa-print mr-1"></i> Imprimer la clôture
        </b-button>
      </template>
    </PageHeader>

    <div v-if="!loaded" class="text-center text-muted py-5">
      <b-spinner style="width:2.5rem;height:2.5rem;" class="text-primary"></b-spinner>
      <div class="mt-2">Chargement…</div>
    </div>

    <template v-else>
      <!-- Figures du jour -->
      <div class="row">
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Encaissé (jour)"
                    :value="fmt(data.encaisse_jour)"
                    :sub="'BL ' + fmt(data.encaisse_bl) + ' · Comm. ' + fmt(data.encaisse_commerciaux)"
                    icon="fas fa-check-circle" variant="accent" />
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Autres entrées (jour)"
                    :value="fmt(data.autres_entrees)"
                    icon="fas fa-coins" variant="warning" />
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Décaissé (jour)"
                    :value="fmt(data.decaisse_jour)"
                    icon="fas fa-arrow-down" variant="danger" />
        </div>
        <div class="col-xl-3 col-md-6 mb-4">
          <StatCard label="Solde du jour"
                    :value="fmt(data.solde_jour)"
                    sub="Encaissé + entrées − décaissé"
                    icon="fas fa-balance-scale" variant="primary" />
        </div>
      </div>

      <div class="row">
        <!-- À encaisser -->
        <div class="col-lg-4">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-hourglass-half mr-2"></i> À encaisser
            </div>
            <div class="card-body">
              <div class="obf-ae">
                <div class="obf-ae__row">
                  <span class="obf-ae__label">
                    <i class="fas fa-file-invoice text-muted mr-2"></i>BL clients
                    <b-badge variant="light">{{ data.a_encaisser.bl.nombre }}</b-badge>
                  </span>
                  <span class="obf-ae__val">{{ fmt(data.a_encaisser.bl.montant) }}</span>
                </div>
                <div class="obf-ae__row">
                  <span class="obf-ae__label">
                    <i class="fas fa-people-carry text-muted mr-2"></i>Commerciaux
                    <b-badge variant="light">{{ data.a_encaisser.commerciaux.nombre }}</b-badge>
                  </span>
                  <span class="obf-ae__val">{{ fmt(data.a_encaisser.commerciaux.montant) }}</span>
                </div>
                <div class="obf-ae__row obf-ae__row--total">
                  <span class="obf-ae__label">Total</span>
                  <span class="obf-ae__val text-danger">{{ fmt(data.a_encaisser.total) }}</span>
                </div>
              </div>
              <router-link :to="{ name: 'caisses' }" class="btn btn-sm btn-primary btn-block mt-3">
                Aller à l'encaissement
              </router-link>
            </div>
          </div>
        </div>

        <!-- Derniers versements -->
        <div class="col-lg-8">
          <div class="card shadow mb-4">
            <div class="card-header py-3 font-weight-bold text-primary">
              <i class="fas fa-stream mr-2"></i> Derniers versements
            </div>
            <div class="card-body">
              <b-table
                  head-variant="light" hover responsive small
                  :items="data.derniers_versements" :fields="champsVersements"
                  show-empty empty-text="Aucun versement enregistré">
                <template v-slot:cell(date)="row">{{ row.item.date | dateFr }}</template>
                <template v-slot:cell(source)="row">
                  <b-badge :variant="row.item.source === 'Commercial' ? 'info' : 'secondary'">
                    {{ row.item.source }}
                  </b-badge>
                </template>
                <template v-slot:cell(montant)="row">
                  <span class="font-weight-bold">{{ fmt(row.item.montant) }}</span>
                </template>
              </b-table>
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
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";
import StatCard from "@/components/ui/StatCard.vue";
import { imprimerDocument } from "@/utils/print.js";

export default {
  name: "caisse-dashboard",
  components: { PageHeader, StatCard },
  data() {
    return {
      loaded: false,
      today: moment().format('YYYY-MM-DD'),
      date: moment().format('YYYY-MM-DD'),
      data: {
        encaisse_jour: 0, encaisse_bl: 0, encaisse_commerciaux: 0,
        autres_entrees: 0, decaisse_jour: 0, solde_jour: 0,
        a_encaisser: { bl: { nombre: 0, montant: 0 }, commerciaux: { nombre: 0, montant: 0 }, total: 0 },
        derniers_versements: [],
      },
      champsVersements: [
        { key: 'date', label: 'Date' },
        { key: 'source', label: 'Source' },
        { key: 'nom', label: 'Client / commercial' },
        { key: 'montant', label: 'Montant', class: 'text-right' },
      ],
    }
  },
  methods: {
    fmt(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0)) + ' FCFA'
    },
    imprimerCloture() {
      imprimerDocument('cloture_caisse', this.date)
    },
    async fetchData() {
      this.loaded = false
      await axios.get(`${API_BASE_URL}/api/caisse/dashboard`, { params: { date: this.date } })
        .then(r => { this.data = r.data })
        .catch(e => console.log(e))
      this.loaded = true
    },
  },
  created() {
    this.fetchData()
  },
}
</script>

<style scoped>
.obf-ae__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--obf-border, #e8ebf2);
  font-size: .9rem;
}
.obf-ae__row:last-child { border-bottom: none; }
.obf-ae__row--total { font-weight: 800; padding-top: 12px; }
.obf-ae__val { font-variant-numeric: tabular-nums; }
</style>
