<template>
  <div class="container-fluid p-3">
    <PageHeader :title="'Compte — ' + (releve.tiers ? releve.tiers.nom : '')" :subtitle="sousTitre" crumb="Comptes">
      <template #actions>
        <b-button variant="outline-primary" @click="$router.back()">
          <i class="fas fa-arrow-left mr-1"></i> Retour
        </b-button>
        <b-button variant="primary" @click="imprimer">
          <i class="fas fa-print mr-1"></i> Imprimer
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-body">
        <b-row class="align-items-end mb-3">
          <b-col md="3"><label class="small mb-1">Du</label>
            <b-form-datepicker size="sm" locale="fr-FR" v-model="debut" @input="fetchReleve"></b-form-datepicker></b-col>
          <b-col md="3"><label class="small mb-1">Au</label>
            <b-form-datepicker size="sm" locale="fr-FR" v-model="fin" @input="fetchReleve"></b-form-datepicker></b-col>
        </b-row>

        <template v-if="loader === false">
          <div class="text-center"><b-spinner style="width: 3rem; height: 3rem;"></b-spinner></div>
        </template>
        <template v-else>
          <div class="row text-center mb-3">
            <div class="col-md-4">
              <div class="p-3 border rounded">
                <div class="text-muted small">Solde d'ouverture</div>
                <div class="h5 mb-0">{{ nf(releve.solde_ouverture) }} FCFA</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="p-3 border rounded">
                <div class="text-muted small">Total débit / crédit</div>
                <div class="h5 mb-0">{{ nf(releve.total_debit) }} / {{ nf(releve.total_credit) }} FCFA</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="p-3 border rounded bg-light">
                <div class="text-muted small">Solde de clôture</div>
                <div class="h5 mb-0 font-weight-bold" :class="releve.solde_cloture > 0 ? 'text-danger' : 'text-success'">
                  {{ nf(releve.solde_cloture) }} FCFA
                </div>
              </div>
            </div>
          </div>

          <b-table bordered hover small responsive :items="releve.mouvements || []" :fields="fields" show-empty empty-text="Aucun mouvement sur la période.">
            <template v-slot:cell(date)="row">{{ $dateFr(row.item.date) }}</template>
            <template v-slot:cell(debit)="row">{{ row.item.debit ? nf(row.item.debit) : '' }}</template>
            <template v-slot:cell(credit)="row">{{ row.item.credit ? nf(row.item.credit) : '' }}</template>
            <template v-slot:cell(solde)="row">{{ nf(row.item.solde) }}</template>
          </b-table>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";
import { imprimerDocument } from "@/utils/print.js";

export default {
  name: "releve-compte",
  components: { PageHeader },
  props: {
    // 'client' ou 'commercial'
    type: { type: String, required: true },
    id: { type: [String, Number], required: true },
  },
  data() {
    return {
      loader: false,
      debut: moment().startOf('year').format('YYYY-MM-DD'),
      fin: moment().format('YYYY-MM-DD'),
      releve: {},
      fields: [
        { key: 'date', label: 'Date' },
        { key: 'piece', label: 'Pièce' },
        { key: 'libelle', label: 'Libellé' },
        { key: 'produits', label: 'Variation de stock' },
        { key: 'debit', label: 'Débit' },
        { key: 'credit', label: 'Crédit' },
        { key: 'solde', label: 'Solde' },
      ],
    }
  },
  computed: {
    sousTitre() {
      return this.type === 'client'
        ? 'Récapitulatif détaillé des ventes et versements du client'
        : 'Récapitulatif détaillé des cessions et versements du commercial'
    },
    docType() {
      return this.type === 'client' ? 'releve_client' : 'releve_commercial'
    },
    endpoint() {
      return this.type === 'client'
        ? `${API_BASE_URL}/api/doc/releve-client/${this.id}/${this.debut}/${this.fin}`
        : `${API_BASE_URL}/api/doc/releve-commercial/${this.id}/${this.debut}/${this.fin}`
    },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    async fetchReleve() {
      this.loader = false
      await axios.get(this.endpoint).then(response => {
        this.releve = response.data
      }).catch((err) => console.log(err))
      this.loader = true
    },
    imprimer() {
      imprimerDocument(this.docType, this.id, this.debut, this.fin)
    },
  },
  created() {
    this.fetchReleve()
  },
}
</script>

<style scoped>
</style>
