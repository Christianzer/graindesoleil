<template>
  <div class="container-fluid p-3">
    <PageHeader title="Dépôt-vente" subtitle="Cessions de stock au commercial — remboursement par versements à la Caisse" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchCommerciaux(); fetchCessionsEnAttente(); fetchToutesCessions()">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" v-if="peutCeder" @click="ouvrirCession">
          <i class="fas fa-plus mr-1"></i> Nouvelle cession
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-header py-3">Soldes des commerciaux</div>
      <div class="card-body">
        <b-form-input type="search" v-model="filtre" placeholder="Rechercher un commercial…" class="mb-2" style="max-width:320px"></b-form-input>
        <b-table
            bordered hover responsive="xl"
            :items="commerciauxFiltres" :fields="fields"
            :per-page="perPage" :current-page="currentPage"
            show-empty empty-text="Aucun commercial.">
          <template v-slot:cell(type)="row">
            <b-badge :variant="row.item.type === 'equipe' ? 'info' : 'secondary'">
              {{ row.item.type === 'equipe' ? 'Équipe' : 'Personne' }}
            </b-badge>
          </template>
          <template v-slot:cell(reste_a_verser)="row">
            <span class="font-weight-bold" :class="row.item.reste_a_verser > 0 ? 'text-danger' : 'text-success'">
              {{ nf(row.item.reste_a_verser || 0) }} FCFA
            </span>
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-success" class="mr-1" @click="$refs.modalEncaissement.ouvrir(row.item)">Encaisser</b-button>
            <b-button size="sm" variant="outline-primary" class="mr-1" @click="voirHistorique(row.item)">Historique</b-button>
            <b-button v-if="peutVoirCompte" size="sm" variant="outline-info" @click="$router.push({ name: 'compte_commercial', params: { id: row.item.id } })">Compte</b-button>
          </template>
        </b-table>
        <b-pagination
            v-if="commerciauxFiltres.length > perPage"
            v-model="currentPage" :total-rows="commerciauxFiltres.length" :per-page="perPage"
            align="right" size="sm" class="mt-2 mb-0"></b-pagination>
      </div>
    </div>

    <!-- Nouvelle cession -->
    <b-modal ref="modalCession" hide-footer title="Nouvelle cession de stock" size="xl">
      <b-row class="align-items-end mb-3">
        <b-col md="6">
          <label class="small mb-1">Commercial</label>
          <search-select v-model="commercialIdCession" :options="commercialOptions" placeholder="Choisir un commercial…"></search-select>
        </b-col>
        <b-col md="3">
          <label class="small mb-1">Date</label>
          <b-form-datepicker locale="fr-FR" v-model="dateCession"></b-form-datepicker>
        </b-col>
        <b-col md="3">
          <label class="small mb-1 d-block">Niveau de prix</label>
          <b-badge variant="info" style="font-size:1rem;">Demi-gros (fixe)</b-badge>
        </b-col>
      </b-row>

      <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <tr>
          <th style="min-width:240px;">Produit</th>
          <th class="text-center">Dispo</th>
          <th style="width:140px;">Quantité</th>
          <th class="text-right">Prix unitaire</th>
          <th class="text-right">Total</th>
          <th style="width:1%"></th>
        </tr>
        <tr v-for="(ligne, index) in lignesCession" :key="index">
          <td class="align-middle">
            <search-select v-model="ligne.code_produit" :options="produitOptionsPour(index)"
                           placeholder="Choisir un produit…" @input="onProduitChoisi(index)"></search-select>
          </td>
          <td class="align-middle text-center">
            <span v-if="ligne.code_produit" :class="{ 'text-danger font-weight-bold': Number(ligne.quantite) > dispo(ligne.code_produit) }">
              {{ nf(dispo(ligne.code_produit)) }} kg
            </span>
            <span v-else class="text-muted">—</span>
          </td>
          <td class="align-middle">
            <b-input-group append="kg" size="sm">
              <b-form-input type="number" min="1" :max="dispo(ligne.code_produit)"
                            :disabled="!ligne.code_produit" v-model="ligne.quantite"></b-form-input>
            </b-input-group>
            <small v-if="ligne.code_produit && Number(ligne.quantite) > dispo(ligne.code_produit)" class="text-danger">
              Stock insuffisant
            </small>
          </td>
          <td class="align-middle text-right">{{ nf(prixUnitaire(ligne.code_produit)) }} FCFA</td>
          <td class="font-weight-bold text-right align-middle">
            {{ nf((ligne.quantite || 0) * prixUnitaire(ligne.code_produit)) }} FCFA
          </td>
          <td class="align-middle">
            <b-button size="sm" variant="outline-danger" :disabled="lignesCession.length === 1"
                      @click="lignesCession.splice(index, 1)" title="Retirer cette ligne">
              <i class="fas fa-trash"></i>
            </b-button>
          </td>
        </tr>
      </table>
      </div>

      <b-button variant="outline-primary" class="mb-3" @click="lignesCession.push({ code_produit: null, quantite: 1 })">
        <i class="fas fa-plus mr-1"></i> Ajouter une ligne
      </b-button>

      <div class="text-right mb-3">
        <h5 class="text-uppercase text-danger font-weight-bolder">TOTAL : {{ nf(totalCession) }} FCFA</h5>
      </div>
      <p class="text-muted small">Ce montant devient la dette du commercial ; il la rembourse par versements à la Caisse au fur et à mesure qu'il vend. Si le solde cumulé dépasse le seuil autorisé, la cession restera en attente de validation par le responsable.</p>

      <b-button variant="success" block :disabled="Loading || !peutValiderCession" @click="validerCession">Céder le stock</b-button>
    </b-modal>

    <!-- Cessions en attente de validation (dépassement de seuil) -->
    <div class="card shadow mb-4" v-if="peutValider">
      <div class="card-header py-3">Cessions en attente de validation</div>
      <div class="card-body">
        <b-table bordered hover small responsive :items="cessionsEnAttente" :fields="fieldsEnAttente" show-empty empty-text="Aucune cession en attente.">
          <template v-slot:cell(montant_total)="row">{{ nf(row.item.montant_total) }} FCFA</template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="success" class="mr-1" :disabled="Loading" @click="ouvrirValidation(row.item)">Valider</b-button>
            <b-button size="sm" variant="danger" :disabled="Loading" @click="rejeterEnAttente(row.item)">Rejeter</b-button>
          </template>
        </b-table>
      </div>
    </div>

    <!-- Cessions ayant dépassé le seuil (statut, pagination, filtre) -->
    <div class="card shadow mb-4">
      <div class="card-header py-3">Cessions ayant dépassé le seuil de solde</div>
      <div class="card-body">
        <div class="d-flex flex-wrap align-items-center mb-2" style="gap:.5rem">
          <b-form-input type="search" v-model="filtreCessions" placeholder="Rechercher (code, commercial)…" style="max-width:260px"></b-form-input>
          <search-select v-model="filtreStatutCession" :options="statutCessionOptions" placeholder="Tous les statuts" clearable style="min-width:200px"></search-select>
        </div>
        <b-table bordered hover small responsive
            :items="cessionsFiltrees" :fields="fieldsToutesCessions"
            :per-page="perPageCessions" :current-page="pageCessions"
            show-empty empty-text="Aucune cession n'a dépassé le seuil de solde.">
          <template v-slot:cell(montant_total)="row">{{ nf(row.item.montant_total) }} FCFA</template>
          <template v-slot:cell(statut)="row">
            <b-badge v-if="row.item.statut === 1" variant="warning">En attente</b-badge>
            <b-badge v-else-if="row.item.statut === 3" variant="danger">Rejetée</b-badge>
            <b-badge v-else variant="success">Validée</b-badge>
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-primary" class="mr-1" @click="consulterLignes(row.item)">Consulter</b-button>
            <b-button v-if="row.item.statut === 2" size="sm" variant="outline-warning" class="mr-1" @click="ouvrirAvoir(row.item)">Avoir</b-button>
            <b-button size="sm" variant="outline-danger" @click="supprimerCession(row.item)" title="Supprimer">
              <i class="fas fa-trash"></i>
            </b-button>
          </template>
        </b-table>
        <b-pagination
            v-if="cessionsFiltrees.length > perPageCessions"
            v-model="pageCessions" :total-rows="cessionsFiltrees.length" :per-page="perPageCessions"
            align="right" size="sm" class="mt-2 mb-0"></b-pagination>
      </div>
    </div>

    <!-- Historique -->
    <b-modal ref="modalHistorique" hide-footer :title="'Historique — ' + nomCommercialSelectionne" size="lg">
      <b-row class="align-items-end mb-3">
        <b-col cols="4"><label class="small mb-1">Du</label>
          <b-form-datepicker size="sm" locale="fr-FR" v-model="releveDebut"></b-form-datepicker></b-col>
        <b-col cols="4"><label class="small mb-1">Au</label>
          <b-form-datepicker size="sm" locale="fr-FR" v-model="releveFin"></b-form-datepicker></b-col>
        <b-col cols="4">
          <b-button size="sm" variant="primary" block @click="imprimerReleve">
            <i class="fas fa-print mr-1"></i> Relevé de compte
          </b-button>
        </b-col>
      </b-row>

      <h6>Cessions de stock</h6>
      <b-table bordered hover small responsive :items="prisesHistorique" :fields="fieldsPrises">
        <template v-slot:cell(montant_total)="row">{{ nf(row.item.montant_total) }} FCFA</template>
        <template v-slot:cell(actions)="row">
          <b-button size="sm" variant="outline-primary" class="mr-1" @click="consulterLignes(row.item)">Consulter</b-button>
          <b-button size="sm" variant="outline-secondary" class="mr-1" @click="imprimerCession(row.item)" title="Bon de cession">
            <i class="fas fa-print"></i>
          </b-button>
          <b-button v-if="peutSupprimer" size="sm" variant="outline-danger" @click="supprimerCession(row.item)" title="Supprimer">
            <i class="fas fa-trash"></i>
          </b-button>
        </template>
      </b-table>

      <h6 class="mt-4">Versements</h6>
      <b-table bordered hover small responsive :items="versementsHistorique" :fields="fieldsVersements" show-empty empty-text="Aucun versement.">
        <template v-slot:cell(mode_paiement)="row">{{ modePaiementLabel(row.item.mode_paiement) }}</template>
        <template v-slot:cell(montant)="row">{{ nf(row.item.montant) }} FCFA</template>
        <template v-slot:cell(actions)="row">
          <b-button v-if="peutSupprimer" size="sm" variant="outline-danger" @click="supprimerVersement(row.item)" title="Supprimer">
            <i class="fas fa-trash"></i>
          </b-button>
        </template>
      </b-table>
    </b-modal>

    <!-- Encaissement commercial : déclaration détaillée + versement -->
    <EncaissementModal ref="modalEncaissement" @success="fetchCommerciaux" />

    <!-- Motif de rejet -->
    <b-modal ref="modalRejet" title="Rejeter la cession" @ok="confirmerRejet">
      <b-form-group label="Motif du rejet (optionnel)">
        <b-form-textarea v-model="motifRejet" rows="3"></b-form-textarea>
      </b-form-group>
    </b-modal>

    <!-- Validation d'une cession en attente — quantités ajustables -->
    <b-modal ref="modalValidation" hide-footer :title="'Valider — ' + (cessionAValider ? cessionAValider.code_prise : '')" size="lg">
      <p class="text-muted small">Ajustez les quantités si le stock réellement disponible diffère de la demande initiale, puis validez.</p>
      <div class="table-responsive">
      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Demandé (kg)</th>
          <th>Dispo actuel (kg)</th>
          <th>Quantité à valider (kg)</th>
          <th>Total</th>
        </tr>
        <tr v-for="(ligne, index) in lignesValidation" :key="ligne.code_produit">
          <td class="align-middle">{{ ligne.libelle_produit }}</td>
          <td class="align-middle text-center">{{ nf(ligne.quantite_demandee) }}</td>
          <td class="align-middle text-center" :class="{ 'text-danger font-weight-bold': Number(ligne.quantite) > dispo(ligne.code_produit) }">
            {{ nf(dispo(ligne.code_produit)) }}
          </td>
          <td>
            <b-form-input type="number" min="0" :max="dispo(ligne.code_produit)" v-model="lignesValidation[index].quantite"></b-form-input>
          </td>
          <td class="font-weight-bold text-right align-middle">
            {{ nf((ligne.quantite || 0) * ligne.prix_unitaire) }} FCFA
          </td>
        </tr>
      </table>
      </div>
      <div class="text-right mb-3">
        <h5 class="text-uppercase text-danger font-weight-bolder">TOTAL : {{ nf(totalValidation) }} FCFA</h5>
      </div>
      <b-button variant="success" block :disabled="Loading" @click="confirmerValidation">Confirmer la validation</b-button>
    </b-modal>

    <!-- Avoir (retour de stock) sur une cession validée -->
    <b-modal ref="modalAvoir" hide-footer :title="'Avoir — ' + (cessionPourAvoir ? cessionPourAvoir.code_prise : '')" size="lg">
      <p class="text-muted small">Reprenez la quantité de stock non vendue par le commercial. Le montant correspondant est déduit de sa dette et le stock est remis en magasin.</p>
      <div class="table-responsive">
      <table class="table table-bordered align-middle">
        <tr>
          <th>Produit</th>
          <th class="text-center">Cédé (cette cession)</th>
          <th class="text-center">Max. reprenable</th>
          <th style="width:150px;">Quantité à reprendre</th>
          <th class="text-right">Montant</th>
        </tr>
        <tr v-for="(ligne, index) in lignesAvoir" :key="ligne.code_produit">
          <td class="align-middle">{{ ligne.libelle_produit }}</td>
          <td class="align-middle text-center">{{ nf(ligne.quantite_cedee) }} kg</td>
          <td class="align-middle text-center">{{ nf(ligne.max_reprenable) }} kg</td>
          <td>
            <b-input-group append="kg" size="sm">
              <b-form-input type="number" min="0" :max="ligne.max_reprenable"
                            :disabled="ligne.max_reprenable === 0" v-model="lignesAvoir[index].quantite"></b-form-input>
            </b-input-group>
          </td>
          <td class="font-weight-bold text-right align-middle">
            {{ nf((ligne.quantite || 0) * ligne.prix_unitaire) }} FCFA
          </td>
        </tr>
      </table>
      </div>
      <div class="text-right mb-3">
        <h5 class="text-uppercase text-danger font-weight-bolder">TOTAL AVOIR : {{ nf(totalAvoir) }} FCFA</h5>
      </div>
      <b-button variant="warning" block :disabled="Loading || totalAvoir <= 0" @click="confirmerAvoir">Enregistrer l'avoir</b-button>
    </b-modal>

    <!-- Lignes d'une cession -->
    <b-modal ref="modalLignes" hide-footer ok-only :title="lignesTitre" size="lg">
      <b-table bordered hover small responsive :items="lignesConsultees" :fields="fieldsLignes" show-empty empty-text="Aucune ligne.">
        <template v-slot:cell(prix_unitaire)="row">{{ nf(row.item.prix_unitaire) }} FCFA</template>
        <template v-slot:cell(montant_ligne)="row">{{ nf(row.item.montant_ligne) }} FCFA</template>
      </b-table>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";
import EncaissementModal from "@/components/commerciaux/EncaissementModal.vue";
import { hasPermission } from "@/utils/permissions";
import { imprimerDocument } from "@/utils/print.js";

const MODE_PAIEMENT = { 1: 'Espèces', 2: 'Mobile money', 3: 'Chèque', 4: 'Virement' }

export default {
  name: "commercial-prises-index",
  components: { PageHeader, EncaissementModal },
  data() {
    return {
      Loading: false,
      commerciauxBruts: [],
      commerciaux: [],
      currentPage: 1,
      perPage: 10,
      filtre: '',
      produits: [],
      commercialIdCession: null,
      dateCession: moment().format('YYYY-MM-DD'),
      // Prix de cession fixé au niveau demi-gros pour la Caisse : non modifiable dans l'interface.
      niveauPrixCession: 'demi_gros',
      lignesCession: [{ code_produit: null, quantite: 1 }],
      cessionsEnAttente: [],
      fieldsEnAttente: [
        { key: 'code_prise', label: 'Code' },
        { key: 'date_prise', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'commercial_id', label: 'Commercial', formatter: (v) => this.nomCommercial(v) },
        { key: 'montant_total', label: 'Montant' },
        { key: 'actions', label: '' },
      ],
      motifRejet: '',
      cessionARejeter: null,
      cessionAValider: null,
      lignesValidation: [],
      toutesCessions: [],
      filtreCessions: '',
      filtreStatutCession: null,
      pageCessions: 1,
      perPageCessions: 10,
      statutCessionOptions: [
        { value: 1, text: 'En attente' },
        { value: 2, text: 'Validée' },
        { value: 3, text: 'Rejetée' },
      ],
      fieldsToutesCessionsBase: [
        { key: 'code_prise', label: 'Code' },
        { key: 'date_prise', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'commercial_id', label: 'Commercial', formatter: (v) => this.nomCommercial(v) },
        { key: 'niveau_prix', label: 'Niveau' },
        { key: 'montant_total', label: 'Montant' },
        { key: 'statut', label: 'Statut' },
      ],
      cessionPourAvoir: null,
      lignesAvoir: [],
      commercialSelectionne: null,
      releveDebut: moment().startOf('year').format('YYYY-MM-DD'),
      releveFin: moment().format('YYYY-MM-DD'),
      prisesHistorique: [],
      versementsHistorique: [],
      lignesConsultees: [],
      lignesTitre: '',
      fields: [
        { key: 'nom', label: 'Nom / libellé', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'reste_a_verser', label: 'Reste à verser', sortable: true },
        { key: 'actions' },
      ],
      fieldsPrises: [
        { key: 'code_prise', label: 'Code' },
        { key: 'date_prise', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'montant_total', label: 'Montant' },
        { key: 'saisi_par', label: 'Saisi par', formatter: (v) => v || '—' },
        { key: 'actions', label: '' },
      ],
      fieldsVersements: [
        { key: 'date_versement', label: 'Date', formatter: (v) => this.$dateFr(v) },
        { key: 'mode_paiement', label: 'Mode' },
        { key: 'montant', label: 'Montant' },
        { key: 'saisi_par', label: 'Saisi par', formatter: (v) => v || '—' },
        { key: 'actions', label: '' },
      ],
      fieldsLignes: [
        { key: 'libelle_produit', label: 'Produit' },
        { key: 'quantite', label: 'Quantité' },
        { key: 'prix_unitaire', label: 'Prix gros' },
        { key: 'montant_ligne', label: 'Total' },
      ],
    }
  },
  computed: {
    commerciauxFiltres() {
      const q = (this.filtre || '').toLowerCase().trim()
      if (!q) return this.commerciaux
      return this.commerciaux.filter(c => String(c.nom || '').toLowerCase().includes(q))
    },
    peutCeder() {
      return hasPermission('commercial_prises_creer')
    },
    peutValider() {
      return hasPermission('valider_depassement_seuil')
    },
    peutVoirCompte() {
      return hasPermission('compte_commercial')
    },
    peutSupprimer() {
      return hasPermission('supprimer_documents')
    },
    commercialOptions() {
      return this.commerciauxBruts.map(c => ({ value: c.id, text: c.nom }))
    },
    produitOptions() {
      return this.produits.filter(p => !p.est_matiere_premiere).map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    totalCession() {
      return this.lignesCession.reduce((t, l) => t + (l.quantite || 0) * this.prixUnitaire(l.code_produit), 0)
    },
    peutValiderCession() {
      return this.commercialIdCession && this.lignesCession.some(l =>
        l.code_produit && Number(l.quantite) > 0 && Number(l.quantite) <= this.dispo(l.code_produit))
    },
    nomCommercialSelectionne() {
      return this.commercialSelectionne ? (this.commercialSelectionne.nom || '') : ''
    },
    totalValidation() {
      return this.lignesValidation.reduce((t, l) => t + (Number(l.quantite) || 0) * l.prix_unitaire, 0)
    },
    totalAvoir() {
      return this.lignesAvoir.reduce((t, l) => t + (Number(l.quantite) || 0) * l.prix_unitaire, 0)
    },
    fieldsToutesCessions() {
      return this.peutSupprimer
        ? [...this.fieldsToutesCessionsBase, { key: 'actions', label: '' }]
        : this.fieldsToutesCessionsBase
    },
    cessionsFiltrees() {
      const q = (this.filtreCessions || '').toLowerCase().trim()
      return this.toutesCessions.filter(c => {
        if (this.filtreStatutCession && Number(c.statut) !== Number(this.filtreStatutCession)) return false
        if (q) {
          const nom = this.nomCommercial(c.commercial_id)
          if (!String(c.code_prise || '').toLowerCase().includes(q) && !String(nom || '').toLowerCase().includes(q)) return false
        }
        return true
      })
    },
  },
  watch: {
    filtre() { this.currentPage = 1 },
    filtreCessions() { this.pageCessions = 1 },
    filtreStatutCession() { this.pageCessions = 1 },
  },
  methods: {
    nf(v) {
      return new Intl.NumberFormat('fr-FR').format(Math.round(Number(v) || 0))
    },
    modePaiementLabel(v) {
      return MODE_PAIEMENT[v] || '—'
    },
    // Options produit pour la ligne `index` : exclut les produits déjà
    // choisis sur les autres lignes, pour éviter les doublons dans une cession.
    produitOptionsPour(index) {
      const dejaChoisis = this.lignesCession
        .filter((l, i) => i !== index && l.code_produit)
        .map(l => l.code_produit)
      return this.produitOptions.filter(o => !dejaChoisis.includes(o.value))
    },
    prixUnitaire(code) {
      const p = this.produits.find(x => x.code_produit === code)
      if (!p) return 0
      const colonne = { detail: 'prix_detail', demi_gros: 'prix_demi_gros', gros: 'prix_gros' }[this.niveauPrixCession] || 'prix_gros'
      return Number(p[colonne]) || 0
    },
    nomCommercial(id) {
      const c = this.commerciauxBruts.find(x => x.id === id)
      return c ? c.nom : id
    },
    dispo(code) {
      const p = this.produits.find(x => x.code_produit === code)
      return p ? Number(p.quantite_produit) || 0 : 0
    },
    // Ajoute automatiquement une nouvelle ligne vide quand un produit vient
    // d'être choisi sur la dernière ligne, pour éviter de cliquer sur
    // "Ajouter une ligne" à chaque produit.
    onProduitChoisi(index) {
      const estDerniereLigne = index === this.lignesCession.length - 1
      if (estDerniereLigne && this.lignesCession[index].code_produit) {
        this.lignesCession.push({ code_produit: null, quantite: 1 })
      }
    },
    ouvrirCession() {
      this.commercialIdCession = null
      this.dateCession = moment().format('YYYY-MM-DD')
      this.niveauPrixCession = 'demi_gros'
      this.lignesCession = [{ code_produit: null, quantite: 1 }]
      this.$refs.modalCession.show()
    },
    async validerCession() {
      if (this.Loading || !this.peutValiderCession) return
      this.Loading = true
      const data = {
        commercial_id: this.commercialIdCession,
        date_prise: this.dateCession,
        niveau_prix: this.niveauPrixCession,
        lignes: this.lignesCession.filter(l => l.code_produit && l.quantite > 0),
      }
      await axios.post(`${API_BASE_URL}/api/commercial-prises`, data).then(response => {
        if (response.data.en_attente) {
          this.$bvToast.toast(
            `Cession ${response.data.code_prise} enregistrée mais en attente de validation du responsable (solde dépasserait le seuil de ${this.nf(response.data.seuil)} FCFA).`,
            { title: 'Validation requise', variant: 'warning', solid: true, noAutoHide: true }
          )
        } else {
          this.$bvToast.toast('Cession enregistrée : ' + response.data.code_prise, { title: 'Cession', variant: 'success', solid: true })
          imprimerDocument('cession', response.data.code_prise)
        }
        this.$refs.modalCession.hide()
        this.fetchCommerciaux()
        this.fetchProduits()
        this.fetchCessionsEnAttente()
        this.fetchToutesCessions()
      }).catch((err) => {
        console.log(err)
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la cession.'
        this.$bvToast.toast(msg, { title: 'Cession', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchCessionsEnAttente() {
      if (!this.peutValider) return
      await axios.get(`${API_BASE_URL}/api/commercial-prises`, { params: { statut: 1 } }).then(r => {
        this.cessionsEnAttente = r.data
      }).catch((err) => console.log(err))
    },
    async fetchToutesCessions() {
      await axios.get(`${API_BASE_URL}/api/commercial-prises`, { params: { depassement_seuil: 1 } }).then(r => {
        this.toutesCessions = r.data
      }).catch((err) => console.log(err))
    },
    async ouvrirValidation(item) {
      this.cessionAValider = item
      this.lignesValidation = []
      await axios.get(`${API_BASE_URL}/api/commercial-prises/${item.code_prise}/lignes`).then(r => {
        this.lignesValidation = r.data.map(l => ({
          code_produit: l.code_produit,
          libelle_produit: l.libelle_produit,
          quantite_demandee: Number(l.quantite),
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
        }))
      }).catch(e => console.log(e))
      this.$refs.modalValidation.show()
    },
    async confirmerValidation() {
      if (this.Loading || !this.cessionAValider) return
      const item = this.cessionAValider
      this.Loading = true
      const data = { lignes: this.lignesValidation.map(l => ({ code_produit: l.code_produit, quantite: Number(l.quantite) || 0 })) }
      await axios.put(`${API_BASE_URL}/api/commercial-prises/${item.code_prise}/valider`, data).then(() => {
        this.$bvToast.toast(`Cession ${item.code_prise} validée.`, { title: 'Validation', variant: 'success', solid: true })
        this.$refs.modalValidation.hide()
        this.fetchCessionsEnAttente()
        this.fetchCommerciaux()
        this.fetchProduits()
        this.fetchToutesCessions()
        imprimerDocument('cession', item.code_prise)
      }).catch((err) => {
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la validation.'
        this.$bvToast.toast(msg, { title: 'Validation', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    rejeterEnAttente(item) {
      this.cessionARejeter = item
      this.motifRejet = ''
      this.$refs.modalRejet.show()
    },
    async confirmerRejet() {
      if (this.Loading || !this.cessionARejeter) return
      const item = this.cessionARejeter
      this.Loading = true
      await axios.put(`${API_BASE_URL}/api/commercial-prises/${item.code_prise}/rejeter`, { motif: this.motifRejet }).then(() => {
        this.$bvToast.toast(`Cession ${item.code_prise} rejetée.`, { title: 'Rejet', variant: 'success', solid: true })
        this.fetchCessionsEnAttente()
        this.fetchToutesCessions()
      }).catch((err) => {
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors du rejet.'
        this.$bvToast.toast(msg, { title: 'Rejet', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    imprimerCession(prise) {
      imprimerDocument('cession', prise.code_prise)
    },
    imprimerReleve() {
      if (!this.commercialSelectionne) return
      imprimerDocument('releve_commercial', this.commercialSelectionne.id, this.releveDebut, this.releveFin)
    },
    async voirHistorique(commercial) {
      this.commercialSelectionne = commercial
      await axios.get(`${API_BASE_URL}/api/commercial-prises`, { params: { commercial_id: commercial.id } }).then(r => {
        this.prisesHistorique = r.data
      }).catch(e => console.log(e))
      await axios.get(`${API_BASE_URL}/api/commercial-versements`, { params: { commercial_id: commercial.id } }).then(r => {
        this.versementsHistorique = r.data
      }).catch(e => console.log(e))
      this.$refs.modalHistorique.show()
    },
    async supprimerCession(prise) {
      if (!window.confirm(`Supprimer la cession ${prise.code_prise} ? Le stock cédé sera remis en stock disponible.`)) return
      await axios.delete(`${API_BASE_URL}/api/commercial-prises/${prise.code_prise}`).then(() => {
        this.$bvToast.toast(`Cession ${prise.code_prise} supprimée.`, { title: 'Suppression', variant: 'success', solid: true })
        if (this.commercialSelectionne) this.voirHistorique(this.commercialSelectionne)
        this.fetchCommerciaux()
        this.fetchProduits()
        this.fetchToutesCessions()
      }).catch((err) => {
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la suppression.'
        this.$bvToast.toast(msg, { title: 'Suppression', variant: 'danger', solid: true })
      })
    },
    async ouvrirAvoir(item) {
      this.cessionPourAvoir = item
      this.lignesAvoir = []
      const [lignesCession, stockCommercial] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/commercial-prises/${item.code_prise}/lignes`).then(r => r.data).catch(() => []),
        axios.get(`${API_BASE_URL}/api/commercial/${item.commercial_id}/stock`).then(r => r.data).catch(() => []),
      ])
      this.lignesAvoir = lignesCession.map(l => {
        const s = stockCommercial.find(x => x.code_produit === l.code_produit)
        const resteGlobal = s ? Number(s.reste) || 0 : 0
        return {
          code_produit: l.code_produit,
          libelle_produit: l.libelle_produit,
          quantite_cedee: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
          max_reprenable: Math.min(Number(l.quantite), resteGlobal),
          quantite: 0,
        }
      })
      this.$refs.modalAvoir.show()
    },
    async confirmerAvoir() {
      if (this.Loading || !this.cessionPourAvoir || this.totalAvoir <= 0) return
      const item = this.cessionPourAvoir
      this.Loading = true
      const data = { lignes: this.lignesAvoir.filter(l => Number(l.quantite) > 0).map(l => ({ code_produit: l.code_produit, quantite: Number(l.quantite) })) }
      await axios.post(`${API_BASE_URL}/api/commercial-prises/${item.code_prise}/avoir`, data).then(() => {
        this.$bvToast.toast(`Avoir enregistré sur la cession ${item.code_prise}.`, { title: 'Avoir', variant: 'success', solid: true })
        this.$refs.modalAvoir.hide()
        if (this.commercialSelectionne) this.voirHistorique(this.commercialSelectionne)
        this.fetchCommerciaux()
        this.fetchProduits()
        this.fetchToutesCessions()
      }).catch((err) => {
        const msg = (err.response && err.response.data && err.response.data.message) || "Erreur lors de l'avoir."
        this.$bvToast.toast(msg, { title: 'Avoir', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async supprimerVersement(versement) {
      if (!window.confirm('Supprimer ce versement ? La dette du commercial sera rétablie d\'autant.')) return
      await axios.delete(`${API_BASE_URL}/api/commercial-versements/${versement.id}`).then(() => {
        this.$bvToast.toast('Versement supprimé.', { title: 'Suppression', variant: 'success', solid: true })
        this.voirHistorique(this.commercialSelectionne)
        this.fetchCommerciaux()
      }).catch((err) => {
        const msg = (err.response && err.response.data && err.response.data.message) || 'Erreur lors de la suppression.'
        this.$bvToast.toast(msg, { title: 'Suppression', variant: 'danger', solid: true })
      })
    },
    async consulterLignes(prise) {
      this.lignesTitre = 'Cession ' + prise.code_prise
      this.lignesConsultees = []
      await axios.get(`${API_BASE_URL}/api/commercial-prises/${prise.code_prise}/lignes`).then(r => {
        this.lignesConsultees = r.data
      }).catch(e => console.log(e))
      this.$refs.modalLignes.show()
    },
    async fetchCommerciaux() {
      await axios.get(`${API_BASE_URL}/api/commerciaux`).then(async response => {
        const liste = response.data
        this.commerciauxBruts = liste
        for (const c of liste) {
          try {
            const solde = await axios.get(`${API_BASE_URL}/api/commercial/${c.id}/solde`)
            c.reste_a_verser = solde.data.reste_a_verser
          } catch (e) {
            c.reste_a_verser = 0
          }
        }
        this.commerciaux = liste
      }).catch((err) => console.log(err))
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(response => {
        this.produits = response.data.element
      }).catch((err) => console.log(err))
    },
  },
  created() {
    this.fetchCommerciaux()
    this.fetchProduits()
    this.fetchCessionsEnAttente()
    this.fetchToutesCessions()
  },
}
</script>

<style scoped>
</style>
