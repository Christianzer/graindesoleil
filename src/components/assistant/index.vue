<template>
  <div class="container-fluid p-3">
    <PageHeader title="Assistant de vente" subtitle="Parcours guidé : client, produits, document, impression" crumb="Ventes" />

    <!-- Barre de progression / étapes -->
    <div class="card shadow mb-3">
      <div class="card-body">
        <b-progress :max="steps.length - 1" height="6px" class="mb-3">
          <b-progress-bar :value="step" variant="success"></b-progress-bar>
        </b-progress>
        <div class="d-flex justify-content-between flex-wrap" style="gap:4px;">
          <div
            v-for="(s, i) in steps"
            :key="i"
            class="text-center flex-fill"
            style="min-width:90px;"
          >
            <div
              class="rounded-circle d-inline-flex align-items-center justify-content-center mb-1"
              :class="i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-light text-muted border'"
              style="width:34px;height:34px;font-weight:bold;"
            >
              <i v-if="i < step" class="fas fa-check"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div :class="i === step ? 'font-weight-bold text-primary' : 'text-muted'" style="font-size:12px;">
              {{ s }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow mb-4">
      <div class="card-body">

        <!-- ÉTAPE 0 : Type de vente -->
        <template v-if="step === 0">
          <h5 class="text-uppercase font-weight-bold mb-3">Quel type de vente ?</h5>
          <b-row>
            <b-col md="6" class="mb-2">
              <b-card
                class="h-100 cursor-pointer"
                :border-variant="mode === 'ht' ? 'success' : 'light'"
                @click="choisirMode('ht')"
              >
                <div class="d-flex align-items-center">
                  <i class="fas fa-store fa-2x text-success mr-3"></i>
                  <div>
                    <div class="font-weight-bold">Vente diverse (HT)</div>
                    <small class="text-muted">Clients divers — hors taxe. (Recommandé)</small>
                  </div>
                </div>
              </b-card>
            </b-col>
            <b-col md="6" class="mb-2">
              <b-card
                class="h-100 cursor-pointer"
                :border-variant="mode === 'ttc' ? 'primary' : 'light'"
                @click="choisirMode('ttc')"
              >
                <div class="d-flex align-items-center">
                  <i class="fas fa-file-invoice-dollar fa-2x text-primary mr-3"></i>
                  <div>
                    <div class="font-weight-bold">Vente normale (TTC)</div>
                    <small class="text-muted">Taxe incluse (×1,18).</small>
                  </div>
                </div>
              </b-card>
            </b-col>
          </b-row>
        </template>

        <!-- ÉTAPE 1 : Client -->
        <template v-else-if="step === 1">
          <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap" style="gap:8px;">
            <h5 class="text-uppercase font-weight-bold mb-0">Sélectionner un client</h5>
            <b-form-input type="search" v-model="filterClient" placeholder="Rechercher un client..." style="max-width:280px;"></b-form-input>
          </div>
          <div v-if="loadingClients" class="text-center py-4">
            <b-spinner variant="primary"></b-spinner>
          </div>
          <b-table
            v-else
            small bordered hover
            :items="clients"
            :fields="clientFields"
            :filter="filterClient"
            :per-page="perPage"
            :current-page="pageClient"
            :tbody-tr-class="rowClientClass"
          >
            <template v-slot:cell(select)="row">
              <b-button
                size="sm"
                :variant="selectedClient && selectedClient.id === row.item.id ? 'success' : 'outline-primary'"
                @click="choisirClient(row.item)"
              >
                {{ selectedClient && selectedClient.id === row.item.id ? '✓ Choisi' : 'Choisir' }}
              </b-button>
            </template>
          </b-table>
          <b-pagination v-if="clients.length > perPage" v-model="pageClient" :total-rows="clients.length" :per-page="perPage" size="sm" />
        </template>

        <!-- ÉTAPE 2 : Produits -->
        <template v-else-if="step === 2">
          <h5 class="text-uppercase font-weight-bold mb-2">Produits du panier</h5>
          <div v-if="loadingProduits" class="text-center py-4">
            <b-spinner variant="primary"></b-spinner>
          </div>
          <template v-else>
            <b-form-input type="search" v-model="filterProduit" placeholder="Rechercher un produit..." class="mb-2" style="max-width:280px;"></b-form-input>
            <table class="table table-sm table-bordered">
              <thead class="thead-light">
                <tr>
                  <th>Produit</th>
                  <th style="width:130px;">Dispo</th>
                  <th style="width:150px;">Prix HT</th>
                  <th style="width:150px;">Quantité</th>
                  <th style="width:140px;" class="text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in produitsFiltres" :key="p.id_article" :class="{ 'table-success': Number(p.quantite_acheter) > 0 }">
                  <td>{{ p.libelle_produit }}</td>
                  <td>{{ p.quantite_produit }}</td>
                  <td><b-form-input type="number" size="sm" v-model="p.prix_vente" /></td>
                  <td><b-form-input type="number" size="sm" min="0" :max="p.quantite_produit" v-model="p.quantite_acheter" /></td>
                  <td class="text-right font-weight-bold">
                    {{ money((Number(p.prix_vente) || 0) * (Number(p.quantite_acheter) || 0)) }} FCFA
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="text-right">
              <span class="badge badge-primary p-2" style="font-size:14px;">
                {{ nbLignes }} produit(s) — Total HT : {{ money(totalHT) }} FCFA
                <template v-if="mode === 'ttc'"> · TTC : {{ money(totalTTC) }} FCFA</template>
              </span>
            </div>
          </template>
        </template>

        <!-- ÉTAPE 3 : Document -->
        <template v-else-if="step === 3">
          <h5 class="text-uppercase font-weight-bold mb-3">Type de document à générer</h5>
          <b-row>
            <b-col md="4" class="mb-2" v-for="d in docTypes" :key="d.value">
              <b-card
                class="h-100 cursor-pointer text-center"
                :border-variant="docType === d.value ? 'success' : 'light'"
                @click="docType = d.value"
              >
                <i :class="d.icon + ' fa-2x mb-2 text-secondary'"></i>
                <div class="font-weight-bold">{{ d.label }}</div>
                <small class="text-muted">{{ d.desc }}</small>
              </b-card>
            </b-col>
          </b-row>
        </template>

        <!-- ÉTAPE 4 : Validation -->
        <template v-else-if="step === 4">
          <h5 class="text-uppercase font-weight-bold mb-3">Récapitulatif avant validation</h5>
          <b-row>
            <b-col md="6">
              <ul class="list-unstyled">
                <li><strong>Type de vente :</strong> {{ mode === 'ht' ? 'Diverse (HT)' : 'Normale (TTC)' }}</li>
                <li><strong>Client :</strong> {{ selectedClient ? (selectedClient.nom + ' ' + selectedClient.prenoms) : '—' }}</li>
                <li><strong>Document :</strong> {{ docLabel }}</li>
              </ul>
            </b-col>
            <b-col md="6" class="text-md-right">
              <ul class="list-unstyled">
                <li><strong>Produits :</strong> {{ nbLignes }} ligne(s)</li>
                <li><strong>Total HT :</strong> {{ money(totalHT) }} FCFA</li>
                <li v-if="mode === 'ttc'"><strong>Total TTC :</strong> {{ money(totalTTC) }} FCFA</li>
              </ul>
            </b-col>
          </b-row>
          <table class="table table-sm table-bordered mt-2">
            <thead class="thead-light"><tr><th>Produit</th><th class="text-right">Qté</th><th class="text-right">PU HT</th><th class="text-right">Total HT</th></tr></thead>
            <tbody>
              <tr v-for="p in panier" :key="p.id_article">
                <td>{{ p.libelle_produit }}</td>
                <td class="text-right">{{ p.quantite_acheter }}</td>
                <td class="text-right">{{ money(p.prix_vente) }}</td>
                <td class="text-right">{{ money(p.prix_vente * p.quantite_acheter) }} FCFA</td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- ÉTAPE 5 : Impression -->
        <template v-else-if="step === 5">
          <div class="text-center py-3">
            <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
            <h5 class="font-weight-bold">{{ docLabel }} enregistré(e) avec succès</h5>
            <p class="text-muted">Code : <strong>{{ resultCode }}</strong></p>
            <b-button variant="primary" class="mr-2" @click="imprimer">
              <i class="fas fa-print mr-1"></i> Imprimer {{ docLabel }}
            </b-button>
            <b-button variant="outline-success" @click="recommencer">
              <i class="fas fa-plus mr-1"></i> Nouvelle vente
            </b-button>
            <div v-if="docType === 'facture'" class="text-muted mt-3" style="font-size:13px;">
              La certification FNE reste disponible depuis la liste des factures.
            </div>
          </div>
        </template>

      </div>

      <!-- Navigation -->
      <div v-if="step < 5" class="card-footer d-flex justify-content-between">
        <b-button variant="outline-secondary" :disabled="step === 0" @click="precedent">
          <i class="fas fa-arrow-left mr-1"></i> Précédent
        </b-button>
        <b-button
          v-if="step < 4"
          variant="primary"
          :disabled="!peutContinuer"
          @click="suivant"
        >
          Suivant <i class="fas fa-arrow-right ml-1"></i>
        </b-button>
        <b-button
          v-else
          variant="success"
          :disabled="submitting"
          @click="valider"
        >
          <b-spinner small v-if="submitting"></b-spinner>
          <i v-else class="fas fa-check mr-1"></i> Valider et enregistrer
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import moment from "moment";
import API_BASE_URL from "@/api/config.js";
import PageHeader from "@/components/ui/PageHeader.vue";
import { ouvrirDocument } from "@/utils/print.js";

export default {
  name: "assistant-vente",
  components: { PageHeader },
  data() {
    return {
      step: 0,
      mode: null,               // 'ttc' | 'ht'
      steps: ["Type de vente", "Client", "Produits", "Document", "Validation", "Impression"],
      // Client
      clients: [],
      selectedClient: null,
      loadingClients: false,
      filterClient: "",
      pageClient: 1,
      perPage: 8,
      clientFields: [
        { key: "matricule", label: "Matricule", sortable: true },
        { key: "nom", label: "Nom", sortable: true },
        { key: "prenoms", label: "Prénoms" },
        { key: "telephone", label: "Téléphone" },
        { key: "select", label: "" },
      ],
      // Produits
      produits: [],
      loadingProduits: false,
      filterProduit: "",
      // Document
      docType: null,            // 'bl' | 'proforma' | 'facture'
      docTypes: [
        { value: "bl", label: "Bon de livraison", desc: "Livraison avant facturation", icon: "fas fa-truck" },
        { value: "facture", label: "Facture", desc: "Facturation directe", icon: "fas fa-file-invoice" },
        { value: "proforma", label: "Pro forma", desc: "Devis", icon: "fas fa-file-alt" },
      ],
      submitting: false,
      resultCode: null,
      resultType: null,
    };
  },
  computed: {
    panier() {
      return this.produits.filter((p) => Number(p.quantite_acheter) > 0);
    },
    nbLignes() {
      return this.panier.length;
    },
    totalHT() {
      return Math.floor(this.panier.reduce((s, p) => s + (Number(p.prix_vente) || 0) * (Number(p.quantite_acheter) || 0), 0));
    },
    totalTTC() {
      return Math.floor(this.panier.reduce((s, p) => s + (Number(p.prix_vente) || 0) * 1.18 * (Number(p.quantite_acheter) || 0), 0));
    },
    produitsFiltres() {
      const f = (this.filterProduit || "").toLowerCase();
      if (!f) return this.produits;
      return this.produits.filter((p) => (p.libelle_produit || "").toLowerCase().includes(f) || (p.code_produit || "").toString().includes(f));
    },
    docLabel() {
      const d = this.docTypes.find((x) => x.value === this.docType);
      return d ? d.label : "—";
    },
    peutContinuer() {
      if (this.step === 0) return !!this.mode;
      if (this.step === 1) return !!this.selectedClient;
      if (this.step === 2) return this.nbLignes > 0;
      if (this.step === 3) return !!this.docType;
      return true;
    },
  },
  methods: {
    money(v) {
      return new Intl.NumberFormat().format(Math.floor(Number(v) || 0));
    },
    choisirMode(m) {
      this.mode = m;
    },
    choisirClient(c) {
      this.selectedClient = c;
    },
    rowClientClass(item) {
      if (this.selectedClient && item && item.id === this.selectedClient.id) return "table-success";
    },
    precedent() {
      if (this.step > 0) this.step--;
    },
    async suivant() {
      if (!this.peutContinuer) return;
      // Chargements paresseux en entrant dans l'étape
      if (this.step === 0) await this.chargerClients();
      if (this.step === 1) await this.chargerProduits();
      this.step++;
    },
    async chargerClients() {
      this.loadingClients = true;
      const url = this.mode === "ht" ? `${API_BASE_URL}/api/clients_ht` : `${API_BASE_URL}/api/clients`;
      try {
        const res = await axios.get(url);
        if (res.status === 200) this.clients = res.data;
      } catch (e) {
        this.$bvToast.toast("Impossible de charger les clients.", { title: "Assistant", variant: "danger", solid: true });
      } finally {
        this.loadingClients = false;
      }
    },
    async chargerProduits() {
      // Ne recharge pas si déjà chargé (conserve les quantités saisies)
      if (this.produits.length > 0) return;
      this.loadingProduits = true;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/produits`);
        if (res.status === 201 || res.status === 200) {
          const element = (res.data && res.data.element) ? res.data.element : [];
          this.produits = element.map((p) => ({ ...p, quantite_acheter: 0 }));
        }
      } catch (e) {
        this.$bvToast.toast("Impossible de charger les produits.", { title: "Assistant", variant: "danger", solid: true });
      } finally {
        this.loadingProduits = false;
      }
    },
    endpointPour(docType) {
      if (docType === "facture") return `${API_BASE_URL}/api/facture_directe`;
      if (docType === "proforma") return `${API_BASE_URL}/api/proforma`;
      return `${API_BASE_URL}/api/commandes`; // bon de livraison
    },
    async valider() {
      if (this.submitting) return;
      this.submitting = true;
      const today = moment().format("YYYY-MM-DD");
      const data = {
        produits: this.panier,
        bareme: "standard",
        montant_total: this.totalHT,
        montant_total_ttc: this.mode === "ht" ? this.totalHT : this.totalTTC,
        clients: this.selectedClient.id,
        date_commande: today,
        update_data: today,
      };
      if (this.docType === "facture") data.avec_fne = false;
      try {
        const res = await axios.post(this.endpointPour(this.docType), data);
        if (res.status === 201) {
          this.resultCode = res.data;
          this.resultType = this.docType;
          this.step = 5;
        } else {
          this.$bvToast.toast("Réponse inattendue du serveur.", { title: "Assistant", variant: "danger", solid: true });
        }
      } catch (e) {
        this.$bvToast.toast("Erreur lors de l'enregistrement.", { title: "Assistant", variant: "danger", solid: true });
      } finally {
        this.submitting = false;
      }
    },
    imprimer() {
      if (!this.resultCode) return;
      const url = this.resultType === "facture"
        ? `${API_BASE_URL}/api/imprimer_factures/${this.resultCode}`
        : `${API_BASE_URL}/api/imprimer_livraison/${this.resultCode}`;
      ouvrirDocument(url);
    },
    recommencer() {
      this.step = 0;
      this.mode = null;
      this.selectedClient = null;
      this.filterClient = "";
      this.produits = [];
      this.filterProduit = "";
      this.docType = null;
      this.resultCode = null;
      this.resultType = null;
    },
  },
};
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
.cursor-pointer:hover { box-shadow: 0 0 0 2px rgba(0,0,0,0.05); }
</style>
