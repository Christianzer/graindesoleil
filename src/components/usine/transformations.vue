<template>
  <div class="container-fluid p-3">
    <PageHeader title="Transformations" subtitle="Torréfaction → broyage → emballage, par lot (quantités en kg)" crumb="Usine">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchAll">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" @click="$refs.modalNouveauLot.show()">
          <i class="fas fa-plus mr-1"></i> Nouveau lot
        </b-button>
      </template>
    </PageHeader>

    <!-- Lots en cours -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">Lots en cours</div>
      <div class="card-body">
        <template v-if="lotsEnCours.length">
          <b-form-input type="search" v-model="filtreLots" placeholder="Rechercher (lot, produit)…" class="mb-2" style="max-width:300px"></b-form-input>
          <b-table
              bordered
              hover
              responsive="xl"
              :items="lotsEnCoursFiltres"
              :fields="lotFields"
              :per-page="perPage"
              :current-page="pageLots"
              show-empty empty-text="Aucun lot ne correspond."
          >
            <template v-slot:cell(derniere_etape)="row">
              {{ etapeFaiteLabel(row.item.derniere_etape) }}
            </template>
            <template v-slot:cell(actions)="row">
              <b-button size="sm" variant="outline-primary" @click="ouvrirLot(row.item.code_lot)">
                Reprendre
              </b-button>
              <b-button v-if="peutCorriger" size="sm" variant="outline-danger" class="ml-1" :disabled="Loading" @click="supprimerLot(row.item.code_lot)" title="Supprimer ce lot et remettre le stock">
                <i class="fas fa-trash"></i>
              </b-button>
            </template>
          </b-table>
          <b-pagination
              v-if="lotsEnCoursFiltres.length > perPage"
              v-model="pageLots"
              :total-rows="lotsEnCoursFiltres.length"
              :per-page="perPage"
              align="right" size="sm" class="mt-2 mb-0"></b-pagination>
        </template>
        <p v-else class="text-muted mb-0">Aucun lot en cours. Cliquez sur « Nouveau lot » pour démarrer une transformation.</p>
      </div>
    </div>

    <!-- Assistant -->
    <div class="card shadow mb-4" v-if="lotActif">
      <div class="card-header py-3 d-flex flex-wrap justify-content-between align-items-center" style="gap:.25rem .75rem">
        <span>
          Lot <strong>{{ lotActif.lot.code_lot }}</strong>
          <span class="text-muted">— {{ lotActif.lot.libelle_produit }}</span>
        </span>
        <b-button size="sm" variant="link" class="p-0" @click="fermerAssistant">Fermer</b-button>
      </div>
      <div class="card-body">

        <!-- progression -->
        <div class="d-flex align-items-center flex-wrap mb-4">
          <template v-for="(e, i) in etapes">
            <span
                :key="e.value"
                class="px-2 py-1 rounded small"
                :class="{
                  'bg-success text-white': etapeEtat(e.value) === 'faite',
                  'border border-success text-success font-weight-bold': etapeEtat(e.value) === 'courante',
                  'text-muted': etapeEtat(e.value) === 'a_venir'
                }"
            >{{ i + 1 }}. {{ e.court }}</span>
            <span :key="e.value + '-sep'" v-if="i < etapes.length - 1" class="mx-2 text-muted">→</span>
          </template>
        </div>

        <!-- étapes déjà faites -->
        <b-table
            v-if="lotActif.lignes.length"
            small
            bordered
            responsive
            class="mb-4"
            :items="lotActif.lignes"
            :fields="ligneFieldsAvecActions"
        >
          <template v-slot:cell(actions)="row">
            <template v-if="peutCorriger && row.item.id === dernierId(lotActif.lignes)">
              <b-button size="sm" variant="outline-primary" class="mr-1" :disabled="Loading" @click="ouvrirEdition(row.item, lotActif.lot.code_lot)">Modifier</b-button>
              <b-button size="sm" variant="outline-warning" :disabled="Loading" @click="annulerEtape(row.item, lotActif.lot.code_lot)">Revenir en arrière</b-button>
            </template>
          </template>
          <template v-slot:cell(etape)="row">{{ etapeCourt(row.item.etape) }}</template>
          <template v-slot:cell(produit_obtenu)="row">{{ row.item.code_produit_destination ? nomProduit(row.item.code_produit_destination) : '—' }}</template>
          <template v-slot:cell(perte_pct)="row">{{ pertePctLigne(row.item) }}%</template>
        </b-table>

        <!-- étape courante -->
        <template v-if="lotActif.prochaine_etape">
          <h6 class="text-uppercase text-muted mb-3">Étape en cours — {{ etapeLabel(lotActif.prochaine_etape) }}</h6>

          <b-form-group v-if="lotActif.prochaine_etape === 'broyage_vers_emballage'" label="Produit fini obtenu"
                        description="Le café broyé (matière première partagée) devient ce produit à l'emballage.">
            <search-select v-model="produitDestination" :options="produitFinisOptions" placeholder="Choisir le produit emballé…"></search-select>
          </b-form-group>

          <div class="row">
            <div class="col-md-3">
              <b-form-group label="Quantité entrée (kg)">
                <b-form-input type="number" min="0" step="any" v-model="quantiteEntree"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-3">
              <b-form-group label="Quantité obtenue (kg)">
                <b-form-input type="number" min="0" step="any" v-model="quantiteSortie"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-3">
              <b-form-group label="Perte (kg)">
                <b-form-input readonly :value="perte"></b-form-input>
              </b-form-group>
            </div>
            <div class="col-md-3">
              <b-form-group label="Perte (%)">
                <b-form-input readonly :value="pertePct" :class="pertePct > 5 ? 'text-danger font-weight-bold' : ''"></b-form-input>
              </b-form-group>
            </div>
          </div>
          <b-form-group label="Observation (optionnel)">
            <b-form-textarea v-model="observation" rows="2"></b-form-textarea>
          </b-form-group>

          <div class="d-flex flex-wrap" style="gap:.5rem">
            <b-button variant="success" :disabled="Loading || !peutEnregistrer" @click="soumettre('continuer')">
              Enregistrer et continuer
            </b-button>
            <b-button variant="outline-success" :disabled="Loading || !peutEnregistrer" @click="soumettre('fermer')">
              Enregistrer et fermer
            </b-button>
            <b-button variant="outline-secondary" :disabled="Loading || !peutEnregistrer" @click="soumettre('terminer')">
              Enregistrer et terminer le lot
            </b-button>
          </div>

          <b-button size="sm" variant="outline-danger" class="mt-3" :disabled="Loading" @click="terminerLotSansEtape">
            Terminer le lot maintenant (sans saisir d'étape)
          </b-button>
        </template>

        <b-alert v-else show variant="success" class="mb-0">
          Lot terminé — toutes les étapes ont été enregistrées.
        </b-alert>
      </div>
    </div>

    <!-- Récapitulatif filtré par période -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">Récapitulatif des pertes</div>
      <div class="card-body">
        <b-row class="align-items-end mb-3">
          <b-col md="3"><label class="small mb-1">Du</label>
            <b-form-datepicker size="sm" locale="fr-FR" v-model="recapDebut" @input="fetchRecap"></b-form-datepicker></b-col>
          <b-col md="3"><label class="small mb-1">Au</label>
            <b-form-datepicker size="sm" locale="fr-FR" v-model="recapFin" @input="fetchRecap"></b-form-datepicker></b-col>
        </b-row>

        <div class="row text-center mb-3" v-if="recap">
          <div class="col-md-4">
            <div class="p-3 border rounded">
              <div class="text-muted small">Total entrée</div>
              <div class="h5 mb-0">{{ nf(recap.total_entree) }} kg</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-3 border rounded">
              <div class="text-muted small">Total obtenu</div>
              <div class="h5 mb-0">{{ nf(recap.total_sortie) }} kg</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="p-3 border rounded bg-light">
              <div class="text-muted small">Perte totale</div>
              <div class="h5 mb-0 font-weight-bold" :class="recap.total_perte_pct > 5 ? 'text-danger' : 'text-success'">
                {{ nf(recap.total_perte) }} kg ({{ recap.total_perte_pct }}%)
              </div>
            </div>
          </div>
        </div>

        <b-table
            v-if="recap"
            bordered hover small responsive
            :items="recap.par_etape" :fields="recapFields"
            show-empty empty-text="Aucune transformation sur la période.">
          <template v-slot:cell(etape)="row">{{ etapeCourt(row.item.etape) }}</template>
          <template v-slot:cell(perte_pct)="row">
            <span class="font-weight-bold" :class="row.item.perte_pct > 5 ? 'text-danger' : 'text-success'">{{ row.item.perte_pct }}%</span>
          </template>
        </b-table>
      </div>
    </div>

    <!-- Historique groupé par lot -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">Historique des transformations</div>
      <div class="card-body">
        <b-form-input
            v-if="historiqueGroupe.length"
            type="search" v-model="filtreHist"
            placeholder="Rechercher (lot, produit)…" class="mb-2" style="max-width:300px"></b-form-input>
        <p v-if="!historiqueGroupe.length" class="text-muted mb-0">Aucune transformation.</p>
        <p v-else-if="!historiqueGroupeFiltre.length" class="text-muted mb-0">Aucun lot ne correspond.</p>

        <div v-for="(g, i) in historiquePage" :key="g.cle" class="border rounded mb-2">
          <div
              class="d-flex flex-wrap justify-content-between align-items-center px-3 py-2"
              style="cursor:pointer; gap:.25rem .75rem"
              v-b-toggle="'hist-' + g.cle">
            <div>
              <strong>{{ g.code_lot || 'Hors lot' }}</strong>
              <span class="text-muted"> — {{ g.libelle_produit }}</span>
              <b-badge class="ml-2" variant="light">{{ g.nb }} opération{{ g.nb > 1 ? 's' : '' }}</b-badge>
              <b-button v-if="g.code_lot && peutCorriger" size="sm" variant="outline-danger" class="ml-2 py-0" :disabled="Loading" @click.stop="supprimerLot(g.code_lot)">
                Supprimer le lot
              </b-button>
            </div>
            <div class="text-muted small text-nowrap">
              perte {{ nf(g.perte_totale) }} kg · {{ g.date_max | dateFr }}
              <i class="fas fa-chevron-down ml-2"></i>
            </div>
          </div>
          <b-collapse :id="'hist-' + g.cle" :visible="i === 0">
            <b-table small bordered responsive class="mb-0" :items="g.lignes" :fields="histLigneFieldsAvecActions">
              <template v-slot:cell(actions)="row">
                <template v-if="peutCorriger">
                  <template v-if="row.item.lot_id">
                    <template v-if="row.item.id === dernierId(g.lignes)">
                      <b-button size="sm" variant="outline-primary" class="mr-1" :disabled="Loading" @click="ouvrirEdition(row.item, g.code_lot)">Modifier</b-button>
                      <b-button size="sm" variant="outline-warning" :disabled="Loading" @click="annulerEtape(row.item, g.code_lot)">Revenir en arrière</b-button>
                    </template>
                    <span v-else class="text-muted small" title="Seule la dernière étape d'un lot se corrige : annulez d'abord les suivantes.">—</span>
                  </template>
                  <b-button v-else size="sm" variant="outline-danger" :disabled="Loading" @click="supprimerHorsLot(row.item)">Supprimer</b-button>
                </template>
              </template>
              <template v-slot:cell(etape)="row">{{ etapeCourt(row.item.etape) }}</template>
              <template v-slot:cell(produit_obtenu)="row">{{ row.item.code_produit_destination ? nomProduit(row.item.code_produit_destination) : '—' }}</template>
              <template v-slot:cell(perte_pct)="row">{{ pertePctLigne(row.item) }}%</template>
            </b-table>
          </b-collapse>
        </div>

        <b-pagination
            v-if="historiqueGroupeFiltre.length > perPage"
            v-model="pageHist"
            :total-rows="historiqueGroupeFiltre.length"
            :per-page="perPage"
            align="right" size="sm" class="mt-2 mb-0"></b-pagination>
      </div>
    </div>

    <!-- Nouveau lot -->
    <b-modal ref="modalNouveauLot" hide-footer title="Nouveau lot">
      <p class="text-muted">Le lot démarre depuis le stock partagé de matière première (café grain). Vous choisirez le produit fini obtenu à l'étape d'emballage.</p>
      <b-button variant="success" block :disabled="Loading" @click="creerLot">
        Démarrer le lot
      </b-button>
    </b-modal>

    <!-- Correction de la dernière étape d'un lot -->
    <b-modal ref="modalEdition" hide-footer :title="'Corriger l\'étape — ' + (edition ? etapeCourt(edition.etape) : '')">
      <template v-if="edition">
        <p class="text-muted small">
          Lot <strong>{{ edition.code_lot }}</strong>. Le stock est ajusté de la différence : la correction est refusée
          si elle ferait passer un stock sous zéro (café déjà livré ou transformé).
        </p>

        <b-form-group v-if="edition.etape === 'broyage_vers_emballage'" label="Produit fini obtenu">
          <search-select v-model="edition.code_produit_destination" :options="produitFinisOptions" placeholder="Choisir le produit emballé…"></search-select>
        </b-form-group>

        <b-form-group label="Date de la transformation">
          <b-form-datepicker locale="fr-FR" v-model="edition.date_transformation"></b-form-datepicker>
        </b-form-group>

        <div class="row">
          <div class="col-md-6">
            <b-form-group label="Quantité entrée (kg)">
              <b-form-input type="number" min="0" step="any" v-model="edition.quantite_entree"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-6">
            <b-form-group label="Quantité obtenue (kg)">
              <b-form-input type="number" min="0" step="any" v-model="edition.quantite_sortie"></b-form-input>
            </b-form-group>
          </div>
        </div>
        <p class="small">Perte : <strong :class="pertePctEdition > 5 ? 'text-danger' : ''">{{ perteEdition }} kg ({{ pertePctEdition }}%)</strong></p>

        <b-form-group label="Observation (optionnel)">
          <b-form-textarea v-model="edition.observation" rows="2"></b-form-textarea>
        </b-form-group>

        <b-button variant="success" block :disabled="Loading || !peutEnregistrerEdition" @click="enregistrerEdition">
          Enregistrer la correction
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";

const ETAPES = [
  { value: 'matiere_vers_torrefaction', text: 'Torréfaction (matière première → torréfié)', court: 'Torréfaction' },
  { value: 'torrefaction_vers_broyage', text: 'Broyage (torréfié → broyé)', court: 'Broyage' },
  { value: 'broyage_vers_emballage', text: 'Emballage (broyé → emballé)', court: 'Emballage' },
]

export default {
  name: "transformations",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      perPage: 10,
      pageLots: 1,
      pageHist: 1,
      filtreLots: '',
      filtreHist: '',
      produits: [],
      lotsEnCours: [],
      lotActif: null, // { lot, lignes, prochaine_etape, prefill_entree }
      quantiteEntree: 0,
      quantiteSortie: 0,
      produitDestination: null,
      observation: '',
      historique: [],
      edition: null, // étape en cours de correction : { id, code_lot, etape, quantite_entree, ... }
      etapes: ETAPES,
      recapDebut: moment().startOf('month').format('YYYY-MM-DD'),
      recapFin: moment().format('YYYY-MM-DD'),
      recap: null,
      recapFields: [
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'etape', label: 'Étape' },
        { key: 'quantite_entree', label: 'Entrée (kg)' },
        { key: 'quantite_sortie', label: 'Obtenu (kg)' },
        { key: 'perte', label: 'Perte (kg)' },
        { key: 'perte_pct', label: '% perte' },
      ],
      lotFields: [
        { key: 'code_lot', label: 'Lot' },
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'derniere_etape', label: 'Dernière étape faite' },
        { key: 'date_debut', label: 'Démarré le', formatter: (v) => this.$dateFr(v) },
        { key: 'saisi_par', label: 'Saisi par', formatter: (v) => v || '—' },
        { key: 'actions', label: '' },
      ],
      ligneFields: [
        { key: 'etape', label: 'Étape' },
        { key: 'quantite_entree', label: 'Entrée (kg)' },
        { key: 'quantite_sortie', label: 'Obtenu (kg)' },
        { key: 'produit_obtenu', label: 'Produit obtenu' },
        { key: 'perte', label: 'Perte (kg)' },
        { key: 'perte_pct', label: 'Perte (%)' },
      ],
      histLigneFields: [
        { key: 'etape', label: 'Étape' },
        { key: 'quantite_entree', label: 'Entrée (kg)' },
        { key: 'quantite_sortie', label: 'Sortie (kg)' },
        { key: 'produit_obtenu', label: 'Produit obtenu' },
        { key: 'perte', label: 'Perte (kg)' },
        { key: 'perte_pct', label: 'Perte (%)' },
        { key: 'date_transformation', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'saisi_par', label: 'Saisi par', formatter: (v) => v || '—' },
      ],
    }
  },
  computed: {
    // Seule l'usine (rôle 4) corrige, annule ou supprime ses transformations.
    peutCorriger() {
      try {
        return Number(JSON.parse(localStorage.getItem('LoggedUser')).type_user) === 4
      } catch (e) {
        return false
      }
    },
    ligneFieldsAvecActions() {
      return this.peutCorriger ? [...this.ligneFields, { key: 'actions', label: '' }] : this.ligneFields
    },
    histLigneFieldsAvecActions() {
      return this.peutCorriger ? [...this.histLigneFields, { key: 'actions', label: '' }] : this.histLigneFields
    },
    peutEnregistrerEdition() {
      const e = this.edition
      return !!e && Number(e.quantite_entree) > 0 && Number(e.quantite_sortie) >= 0
        && (e.etape !== 'broyage_vers_emballage' || !!e.code_produit_destination)
    },
    perteEdition() {
      if (!this.edition) return 0
      return Math.round(((Number(this.edition.quantite_entree) || 0) - (Number(this.edition.quantite_sortie) || 0)) * 1000) / 1000
    },
    pertePctEdition() {
      const entree = this.edition ? Number(this.edition.quantite_entree) || 0 : 0
      return entree > 0 ? Math.round(this.perteEdition / entree * 10000) / 100 : 0
    },
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    // Produits finis pouvant recevoir le résultat de l'emballage — exclut la
    // matière première partagée (jamais elle-même un produit fini).
    produitFinisOptions() {
      return this.produits.filter(p => !p.est_matiere_premiere).map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    // Historique groupé par lot (les opérations hors lot sont regroupées à part).
    historiqueGroupe() {
      const groupes = new Map()
      for (const t of this.historique) {
        const cle = t.code_lot || '__hors_lot__'
        if (!groupes.has(cle)) {
          groupes.set(cle, { cle, code_lot: t.code_lot || null, code_produit: t.code_produit, lignes: [] })
        }
        groupes.get(cle).lignes.push(t)
      }
      return Array.from(groupes.values()).map(g => {
        const lignes = [...g.lignes].sort((a, b) => a.id - b.id)
        const dates = lignes.map(l => l.date_transformation).filter(Boolean).sort()
        return {
          ...g,
          lignes,
          libelle_produit: this.nomProduit(g.code_produit),
          nb: lignes.length,
          date_max: dates.length ? dates[dates.length - 1] : null,
          perte_totale: lignes.reduce((s, l) => s + (Number(l.perte) || 0), 0),
        }
      })
    },
    lotsEnCoursFiltres() {
      const q = (this.filtreLots || '').toLowerCase().trim()
      if (!q) return this.lotsEnCours
      return this.lotsEnCours.filter(l =>
        String(l.code_lot || '').toLowerCase().includes(q) ||
        String(l.libelle_produit || '').toLowerCase().includes(q))
    },
    historiqueGroupeFiltre() {
      const q = (this.filtreHist || '').toLowerCase().trim()
      if (!q) return this.historiqueGroupe
      return this.historiqueGroupe.filter(g =>
        String(g.code_lot || '').toLowerCase().includes(q) ||
        String(g.libelle_produit || '').toLowerCase().includes(q))
    },
    historiquePage() {
      const debut = (this.pageHist - 1) * this.perPage
      return this.historiqueGroupeFiltre.slice(debut, debut + this.perPage)
    },
    perte() {
      const e = Number(this.quantiteEntree) || 0
      const s = Number(this.quantiteSortie) || 0
      return Math.round((e - s) * 1000) / 1000
    },
    pertePct() {
      const e = Number(this.quantiteEntree) || 0
      if (e <= 0) return 0
      return Math.round((this.perte / e) * 10000) / 100
    },
    peutEnregistrer() {
      return !!this.lotActif
        && !!this.lotActif.prochaine_etape
        && Number(this.quantiteEntree) > 0
        && Number(this.quantiteSortie) >= 0
        && (this.lotActif.prochaine_etape !== 'broyage_vers_emballage' || !!this.produitDestination)
    },
  },
  methods: {
    // La dernière étape d'un lot est celle qui a le plus grand identifiant.
    dernierId(lignes) {
      return (lignes || []).reduce((max, l) => Math.max(max, Number(l.id) || 0), 0)
    },
    messageErreur(e, defaut) {
      return (e && e.response && e.response.data && e.response.data.message) || defaut
    },
    ouvrirEdition(ligne, codeLot) {
      this.edition = {
        id: ligne.id,
        code_lot: codeLot,
        etape: ligne.etape,
        quantite_entree: ligne.quantite_entree,
        quantite_sortie: ligne.quantite_sortie,
        date_transformation: String(ligne.date_transformation || '').slice(0, 10),
        observation: ligne.observation || '',
        code_produit_destination: ligne.code_produit_destination || null,
      }
      this.$refs.modalEdition.show()
    },
    async enregistrerEdition() {
      if (this.Loading || !this.edition) return
      this.Loading = true
      const e = this.edition
      try {
        await axios.put(`${API_BASE_URL}/api/transformations/${e.id}`, {
          quantite_entree: Number(e.quantite_entree),
          quantite_sortie: Number(e.quantite_sortie),
          date_transformation: e.date_transformation,
          observation: e.observation,
          code_produit_destination: e.code_produit_destination,
        })
        this.$bvToast.toast('Étape corrigée, stock ajusté.', { title: 'Transformation', variant: 'success', solid: true })
        this.$refs.modalEdition.hide()
        await this.rafraichirApresCorrection(e.code_lot)
      } catch (err) {
        this.$bvToast.toast(this.messageErreur(err, 'La correction a échoué.'), { title: 'Transformation', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    async annulerEtape(ligne, codeLot) {
      const ok = await this.$bvModal.msgBoxConfirm(
        `Revenir en arrière sur l'étape « ${this.etapeCourt(ligne.etape)} » du lot ${codeLot} ? `
        + `Elle sera annulée, le stock remis comme avant (${this.nf(ligne.quantite_sortie)} kg retirés, ${this.nf(ligne.quantite_entree)} kg remis) et le lot reviendra à l'étape précédente.`,
        { title: 'Revenir en arrière', okTitle: "Annuler l'étape", cancelTitle: 'Garder', okVariant: 'warning', centered: true }
      )
      if (!ok) return
      this.Loading = true
      try {
        await axios.post(`${API_BASE_URL}/api/lots/${codeLot}/etape/annuler`)
        this.$bvToast.toast('Étape annulée, stock remis.', { title: 'Transformation', variant: 'success', solid: true })
        await this.rafraichirApresCorrection(codeLot)
      } catch (err) {
        this.$bvToast.toast(this.messageErreur(err, "L'annulation a échoué."), { title: 'Transformation', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    async supprimerLot(codeLot) {
      const ok = await this.$bvModal.msgBoxConfirm(
        `Supprimer le lot ${codeLot} ? Toutes ses étapes seront annulées, le stock remis comme avant le lot, et le lot disparaîtra de la liste.`,
        { title: 'Supprimer le lot', okTitle: 'Supprimer le lot', cancelTitle: 'Garder', okVariant: 'danger', centered: true }
      )
      if (!ok) return
      this.Loading = true
      try {
        await axios.delete(`${API_BASE_URL}/api/lots/${codeLot}`)
        this.$bvToast.toast('Lot supprimé, stock remis.', { title: 'Transformation', variant: 'success', solid: true })
        if (this.lotActif && this.lotActif.lot.code_lot === codeLot) {
          this.lotActif = null
        }
        this.fetchAll()
      } catch (err) {
        this.$bvToast.toast(this.messageErreur(err, 'La suppression a échoué.'), { title: 'Transformation', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    async supprimerHorsLot(ligne) {
      const ok = await this.$bvModal.msgBoxConfirm(
        `Supprimer cette transformation « ${this.etapeCourt(ligne.etape)} » (${this.nf(ligne.quantite_entree)} kg → ${this.nf(ligne.quantite_sortie)} kg) ? Le stock sera remis comme avant.`,
        { title: 'Supprimer la transformation', okTitle: 'Supprimer', cancelTitle: 'Garder', okVariant: 'danger', centered: true }
      )
      if (!ok) return
      this.Loading = true
      try {
        await axios.delete(`${API_BASE_URL}/api/transformations/${ligne.id}`)
        this.$bvToast.toast('Transformation supprimée, stock remis.', { title: 'Transformation', variant: 'success', solid: true })
        this.fetchAll()
      } catch (err) {
        this.$bvToast.toast(this.messageErreur(err, 'La suppression a échoué.'), { title: 'Transformation', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    // Recharge les listes et, si l'assistant est ouvert sur ce lot, son état (étapes faites, étape suivante).
    async rafraichirApresCorrection(codeLot) {
      this.fetchAll()
      if (this.lotActif && this.lotActif.lot.code_lot === codeLot) {
        await this.ouvrirLot(codeLot)
      }
    },
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Number(v) || 0)
    },
    nomProduit(code) {
      const p = this.produits.find(x => x.code_produit === code)
      return p ? p.libelle_produit : (code || '—')
    },
    etapeLabel(v) {
      const e = ETAPES.find(x => x.value === v)
      return e ? e.text : (v || '—')
    },
    etapeCourt(v) {
      const e = ETAPES.find(x => x.value === v)
      return e ? e.court : (v || '—')
    },
    pertePctLigne(item) {
      const e = Number(item.quantite_entree) || 0
      if (e <= 0) return 0
      return Math.round((Number(item.perte) || 0) / e * 10000) / 100
    },
    etapeFaiteLabel(v) {
      return v ? this.etapeCourt(v) : 'Aucune'
    },
    etapeEtat(value) {
      if (!this.lotActif) return 'a_venir'
      if (this.lotActif.lignes.some(l => l.etape === value)) return 'faite'
      if (this.lotActif.prochaine_etape === value) return 'courante'
      return 'a_venir'
    },
    async creerLot() {
      if (this.Loading) return
      this.Loading = true
      await axios.post(`${API_BASE_URL}/api/lots`, {}).then(async r => {
        this.$refs.modalNouveauLot.hide()
        await this.fetchLotsEnCours()
        await this.ouvrirLot(r.data.code_lot)
      }).catch(e => {
        console.log(e)
        const msg = (e.response && e.response.data && e.response.data.message) || "Erreur lors de la création du lot."
        this.$bvToast.toast(msg, { title: 'Lot', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async ouvrirLot(codeLot) {
      await axios.get(`${API_BASE_URL}/api/lots/${codeLot}`).then(r => {
        this.lotActif = r.data
        this.quantiteEntree = r.data.prefill_entree || 0
        this.quantiteSortie = 0
        this.produitDestination = null
        this.observation = ''
      }).catch(e => {
        console.log(e)
        this.$bvToast.toast("Lot introuvable.", { title: 'Lot', variant: 'danger', solid: true })
      })
    },
    fermerAssistant() {
      this.lotActif = null
      this.quantiteEntree = 0
      this.quantiteSortie = 0
      this.produitDestination = null
      this.observation = ''
      this.fetchLotsEnCours()
      this.fetchHistorique()
    },
    async soumettre(mode) {
      if (this.Loading || !this.peutEnregistrer) return
      this.Loading = true
      const codeLot = this.lotActif.lot.code_lot
      const data = {
        etape: this.lotActif.prochaine_etape,
        quantite_entree: Number(this.quantiteEntree),
        quantite_sortie: Number(this.quantiteSortie),
        observation: this.observation || null,
      }
      if (this.lotActif.prochaine_etape === 'broyage_vers_emballage') {
        data.code_produit_destination = this.produitDestination
      }
      try {
        const r = await axios.post(`${API_BASE_URL}/api/lots/${codeLot}/etape`, data)
        const perteAffichee = Math.round((Number(r.data.perte) || 0) * 1000) / 1000
        const entreeEnvoyee = Number(data.quantite_entree) || 0
        const pertePctAffichee = entreeEnvoyee > 0 ? Math.round((perteAffichee / entreeEnvoyee) * 10000) / 100 : 0
        this.$bvToast.toast(`Étape enregistrée — perte ${perteAffichee} kg (${pertePctAffichee}%).`, { title: 'Transformation', variant: 'success', solid: true })
        if (mode === 'terminer' && r.data.statut !== 2) {
          await axios.post(`${API_BASE_URL}/api/lots/${codeLot}/terminer`)
        }
        if (mode === 'continuer' && r.data.statut !== 2) {
          await this.ouvrirLot(codeLot)
          this.fetchLotsEnCours()
          this.fetchHistorique()
        } else {
          this.fermerAssistant()
        }
      } catch (e) {
        console.log(e)
        const msg = (e.response && e.response.data && e.response.data.message) || "Erreur lors de l'enregistrement."
        this.$bvToast.toast(msg, { title: 'Transformation', variant: 'danger', solid: true })
      }
      this.Loading = false
    },
    async terminerLotSansEtape() {
      if (this.Loading || !this.lotActif) return
      this.Loading = true
      await axios.post(`${API_BASE_URL}/api/lots/${this.lotActif.lot.code_lot}/terminer`).then(() => {
        this.$bvToast.toast('Lot terminé.', { title: 'Lot', variant: 'success', solid: true })
        this.fermerAssistant()
      }).catch(e => {
        console.log(e)
        const msg = (e.response && e.response.data && e.response.data.message) || 'Erreur.'
        this.$bvToast.toast(msg, { title: 'Lot', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(r => {
        this.produits = r.data.element
      }).catch(e => console.log(e))
    },
    async fetchLotsEnCours() {
      await axios.get(`${API_BASE_URL}/api/lots`, { params: { statut: 1 } }).then(r => {
        this.lotsEnCours = r.data
      }).catch(e => console.log(e))
    },
    async fetchHistorique() {
      await axios.get(`${API_BASE_URL}/api/transformations`).then(r => {
        this.historique = r.data
      }).catch(e => console.log(e))
    },
    fetchAll() {
      this.fetchProduits()
      this.fetchLotsEnCours()
      this.fetchHistorique()
      this.fetchRecap()
    },
    async fetchRecap() {
      await axios.get(`${API_BASE_URL}/api/transformations/recap`, { params: { debut: this.recapDebut, fin: this.recapFin } }).then(r => {
        this.recap = r.data
      }).catch(e => console.log(e))
    },
  },
  watch: {
    filtreLots() { this.pageLots = 1 },
    filtreHist() { this.pageHist = 1 },
  },
  created() {
    this.fetchAll()
  },
}
</script>

<style scoped>
.fa-chevron-down {
  transition: transform 0.15s ease;
}
[aria-expanded="true"] .fa-chevron-down {
  transform: rotate(180deg);
}
</style>
