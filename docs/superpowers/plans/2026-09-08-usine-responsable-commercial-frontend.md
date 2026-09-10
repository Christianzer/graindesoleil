# Usine / Responsable / Commercial — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the app to the real backend login (replacing the hardcoded single-admin login), give each of the 4 roles (admin/responsable/usine/commercial) the right menu and screens, and build the 3 new screens the backend plan already supports: transformations (usine), demandes de transfert (responsable ↔ usine), and cessions/versements commerciaux (responsable).

**Architecture:** Vue 2 Options API, BootstrapVue components, axios, `vue-select`/`b-form-select` for pickers — no new libraries. Permissions stay client-side (route names in a `permissions` array on the logged-in user, exactly like today), computed from the role (`type_user`) the backend now returns from `/api/login`. No new backend work — this plan only calls endpoints the backend plan already shipped and verified in production.

**Tech Stack:** Vue 2.6, Vue Router 3, BootstrapVue, axios, moment.

**Spec:** `../../../gstockgrainsmoulus/docs/superpowers/specs/2026-09-08-usine-responsable-commercial-design.md` (sibling repo — this frontend consumes the API the backend plan built from that spec).

## Global Constraints

- Every new/changed screen follows the exact structure of `src/components/fournisseurs/approvisionnement.vue` (forms) and `src/components/fournisseurs/index.vue` (list + solde + modals) — same `PageHeader`, `b-table`/`b-pagination`, `$bvToast` feedback, `Loading`/`loader` flags, `API_BASE_URL` import. Don't introduce a different UI pattern for the same kind of screen.
- `localStorage.LoggedUser` must always keep a `username` key — `src/main.js:22-35`'s axios interceptor reads it to set the `X-User` header the backend's `journaliser()` logs against. Losing it silently breaks the activity journal for every request.
- Route/permission names used in this plan (exact strings, must match on both ends — router, sidebar, and the permission arrays): `transformations`, `demandes`, `demandes_creer`, `demandes_livrer`, `commercial_prises`, `commercial_prises_creer`. `demandes_creer`/`demandes_livrer`/`commercial_prises_creer` are action-level tokens (not routes) checked inside a screen, not by the router guard.
- No automated test runner exists in this project (`package.json` has no Jest/Vitest/Cypress). Every task's verification step is a manual check in the browser (dev server + the 4 roles) — described exactly, not "test it works."
- Admin and responsable have the **same** permission set (ruling from brainstorming: admin is a hierarchy label, not a wider functional scope) — never give admin a screen responsable doesn't also get, or vice versa.

## Ruling carried from brainstorming (recorded here so it isn't re-litigated mid-implementation)

The commercial role gets no dedicated screen in this plan — cessions, versements, and balance viewing are all done by the responsable/admin on the `commercial_prises` screen (matches the spec: "le responsable cède du stock à un commercial"). A commercial logging in only ever sees the dashboard. If a self-service screen for commerciaux is wanted later, it's a new, separate task — not a gap in this plan.

---

## Task 1: Real login + role-based permissions

Replaces the hardcoded single-admin login (`src/views/login.vue` currently never calls the backend) with a real call to `POST /api/login`, and introduces a shared permissions module so every later task (and the existing `sidebar.vue`, unchanged) can gate on role.

**Files:**
- Create: `src/utils/permissions.js`
- Modify: `src/views/login.vue`

**Interfaces:**
- Produces: `getPermissionsForRole(typeUser: number): string[]` and `hasPermission(routeName: string): boolean` from `src/utils/permissions.js` — every later task's screens import `hasPermission` for in-screen action gating (the router guard and `sidebar.vue` keep using their own existing inline logic, unchanged, since it already just reads `LoggedUser.permissions`).
- Consumes: `POST /api/login` body `{ login, password }` → `{ id_com, nom, prenoms, login, type_user, ... }` on success (200/201) or a non-2xx status on failure (`ApiClientsControllers::login_obf`, unchanged by this plan).

- [ ] **Step 1: Create the permissions module**

Create `src/utils/permissions.js`:

```js
// Rôles (commercial.type_user, côté backend) : 1=admin, 2=commercial, 3=responsable, 4=usine.
// Admin et responsable ont le même périmètre fonctionnel — admin n'est qu'un rang
// hiérarchique au-dessus, sans écran réservé en plus (ruling brainstorming 2026-09-08).
const ADMIN_RESPONSABLE_PERMISSIONS = [
  'dashboard', 'clients', 'stocks', 'ventes', 'factures_users', 'panier_facture',
  'listes_commandes', 'factures_avoir', 'facture', 'livraison', 'historiques',
  'caisses', 'historiques_factures', 'historiques_livraisons', 'recu', 'rapport_caisse',
  'documents_clients', 'ventes_historiques', 'commande_clients', 'appro', 'decaissement',
  'historiques_encaissement', 'historiques_encaissement_clients', 'commercial',
  'journal_activite', 'parametres',
  'demandes', 'demandes_creer', 'commercial_prises', 'commercial_prises_creer',
]

// L'usine ne vend rien : pas de fournisseurs/appro pour le responsable (c'est elle
// qui lui donne les produits, cf. spec) — fournisseurs/approvisionnement passent ici.
const USINE_PERMISSIONS = [
  'dashboard', 'fournisseurs', 'approvisionnement', 'transformations',
  'demandes', 'demandes_livrer', 'journal_activite',
]

// Aucun écran dédié pour le commercial dans ce plan (voir ruling en tête de plan) :
// les cessions/versements/solde sont gérés par le responsable.
const COMMERCIAL_PERMISSIONS = ['dashboard']

const PERMISSIONS_BY_ROLE = {
  1: ADMIN_RESPONSABLE_PERMISSIONS, // admin
  2: COMMERCIAL_PERMISSIONS,        // commercial
  3: ADMIN_RESPONSABLE_PERMISSIONS, // responsable
  4: USINE_PERMISSIONS,             // usine
}

export function getPermissionsForRole(typeUser) {
  return PERMISSIONS_BY_ROLE[typeUser] || []
}

export function hasPermission(routeName) {
  try {
    const raw = localStorage.getItem('LoggedUser')
    if (!raw) return false
    const user = JSON.parse(raw)
    return !!(user.permissions && user.permissions.includes(routeName))
  } catch (e) {
    return false
  }
}

export const ROLE_LABELS = {
  1: 'Admin',
  2: 'Commercial',
  3: 'Responsable',
  4: 'Usine',
}
```

- [ ] **Step 2: Wire the real login**

Read `src/views/login.vue` first (the `<template>` doesn't change at all — only the `<script>` block). Replace the entire `<script>` block with:

```js
<script>
import axios from 'axios'
import API_BASE_URL from '@/api/config'
import { getPermissionsForRole } from '@/utils/permissions'

export default {
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      error: null,
      submitting: false,
    }
  },
  methods: {
    async login_user () {
      this.error = null
      if (this.submitting) return
      this.submitting = true

      try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, {
          login: this.form.username,
          password: this.form.password,
        })

        const compte = response.data
        const userInfo = {
          username: compte.login,
          id_com: compte.id_com,
          nom: compte.nom,
          prenoms: compte.prenoms,
          type_user: compte.type_user,
          permissions: getPermissionsForRole(compte.type_user),
        }
        localStorage.setItem('LoggedUser', JSON.stringify(userInfo))
        this.logConnexion(this.form.username, true)
        this.$router.push({ name: 'dashboard' })
      } catch (err) {
        this.error = 'Nom d\'utilisateur ou mot de passe incorrect'
        this.logConnexion(this.form.username, false)
      }

      this.submitting = false
    },
    logConnexion (utilisateur, succes) {
      // Fire-and-forget : ne doit jamais bloquer ni casser le flux de connexion.
      axios.post(`${API_BASE_URL}/api/journal/connexion`, { utilisateur, succes }).catch(() => {})
    }
  }
}
</script>
```

Also update the submit button to reflect the async call — in the `<template>`, change:

```html
<button type="submit" class="btn btn-primary btn-block btn-lg text-uppercase">Connexion</button>
```

to:

```html
<button type="submit" class="btn btn-primary btn-block btn-lg text-uppercase" :disabled="submitting">Connexion</button>
```

- [ ] **Step 3: Manual verification in the browser**

This step needs at least one account per role in the database. Use the (now-working, once Task 2 lands) `commercial` screen, or insert directly for now via `php artisan tinker` against the **local dev** backend (`gstockgrainsmoulus/`, not production):

```
php artisan tinker --execute="DB::table('commercial')->insert(['nom'=>'Test Usine','login'=>'usine_test','mdp'=>md5('test1234'),'type_user'=>4,'id_client'=>0,'statut'=>1]);"
php artisan tinker --execute="DB::table('commercial')->insert(['nom'=>'Test Resp','login'=>'resp_test','mdp'=>md5('test1234'),'type_user'=>3,'id_client'=>0,'statut'=>1]);"
```

Then, with `yarn tauri:dev` (or `yarn serve` + the backend on `php artisan serve`) running:

1. Log in as `usine_test` / `test1234`. Expected: redirected to the dashboard; the sidebar shows only Fournisseurs (once visible — see Task 1's permission list) and no Ventes/Clients/Stocks section.
2. Log in as `resp_test` / `test1234`. Expected: redirected to the dashboard; sidebar shows the same sections as the current admin does today, **except** Fournisseurs.
3. Try a wrong password. Expected: the red "Nom d'utilisateur ou mot de passe incorrect" banner appears, no redirect.
4. Open the browser's Network tab, trigger any API call (e.g. navigate to Clients as `resp_test`), and confirm the request carries an `X-User: resp_test` header — this proves `localStorage.LoggedUser.username` is still set correctly for the axios interceptor in `src/main.js`.

- [ ] **Step 4: Commit**

```bash
git add src/utils/permissions.js src/views/login.vue
git commit -m "feat: wire real backend login with per-role permissions"
```

*(Skip if this checkout has no `.git` remote/init — leave the change in place.)*

---

## Task 2: Fix commercial account management (id_com bug) + role assignment UI

`src/components/commercial/form.vue` and `src/components/commercial/index.vue` both reference `row.item.id` / `selectedTA.id` — but the `commercial` table's primary key is `id_com` (confirmed in the backend plan: this bug already made `updateCommercial`/`deleteCommercial` silently fail server-side, now fixed there; the frontend has the matching bug and must be fixed too, or edit/delete will send `undefined` as the id). This task also adds the role picker so admin/responsable can actually create usine/commercial/responsable accounts from the UI instead of `tinker`.

**Files:**
- Modify: `src/components/commercial/form.vue`
- Modify: `src/components/commercial/index.vue`

**Interfaces:**
- Consumes: `getPermissionsForRole`'s role numbering is not used here directly, but `ROLE_LABELS` from `src/utils/permissions.js` (Task 1) is used to display a human-readable role in the table.

- [ ] **Step 1: Fix and extend `form.vue`**

In `src/components/commercial/form.vue`, add the role field to the template — insert this new row right after the "Mail / Login" row (after the closing `</div>` of that row, before the "Mot de passe" row):

```html
      <div class="row">
        <div class="col-md-6">
          <b-form-group label="Rôle *">
            <b-form-select v-model="formData.type_user" :options="roleOptions"></b-form-select>
          </b-form-group>
        </div>
      </div>
```

In the `<script>` block:

Replace:
```js
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
export default {
```
with:
```js
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
export default {
  data() {
    return {
      apidata : `${API_BASE_URL}/api/commercial`,
      selected : null,
      isSubmitting : false,
      title:"Mise à jour commercial",
      roleOptions: [
        { value: 1, text: 'Admin' },
        { value: 3, text: 'Responsable' },
        { value: 4, text: 'Usine' },
        { value: 2, text: 'Commercial' },
      ],
      formData: {
        id:null,
        nom: "",
        prenoms:'',
        telephone:'',
        mail: "",
        login: "",
        mdp: "",
        contact: "",
        type_user: 2,
      }
    }
  },
```
(This whole `data()` replaces the existing one below the `export default {` line — don't leave two `data()` methods.)

Replace:
```js
    showModal() {
      if (this.editMode === true) {
        this.selected = this.selectedTA.id
        this.formData.nom = this.selectedTA.nom
        this.formData.prenoms = this.selectedTA.prenoms
        this.formData.telephone = this.selectedTA.telephone
        this.formData.mail = this.selectedTA.mail
        this.formData.login = this.selectedTA.login
        this.formData.mdp = ''
        this.formData.contact = this.selectedTA.contact
      } else {
        this.formData.nom = ''
        this.formData.prenoms = ''
        this.formData.telephone = ''
        this.formData.mail = ''
        this.formData.login =
        this.formData.mdp =
        this.formData.contact = ''
      }
      this.$refs['my-modal'].show()
    },
```
with:
```js
    showModal() {
      if (this.editMode === true) {
        this.selected = this.selectedTA.id_com
        this.formData.nom = this.selectedTA.nom
        this.formData.prenoms = this.selectedTA.prenoms
        this.formData.telephone = this.selectedTA.telephone
        this.formData.mail = this.selectedTA.mail
        this.formData.login = this.selectedTA.login
        this.formData.mdp = ''
        this.formData.contact = this.selectedTA.contact
        this.formData.type_user = this.selectedTA.type_user
      } else {
        this.formData.nom = ''
        this.formData.prenoms = ''
        this.formData.telephone = ''
        this.formData.mail = ''
        this.formData.login = ''
        this.formData.mdp = ''
        this.formData.contact = ''
        this.formData.type_user = 2
      }
      this.$refs['my-modal'].show()
    },
```

(This also fixes a pre-existing chained-assignment bug: `this.formData.login = this.formData.mdp = this.formData.contact = ''` was harmless here since all three reset to the same empty string, but the rewrite makes the intent explicit rather than relying on that coincidence.)

Replace the `data` object built in `save()`:
```js
      var data = {
        nom : this.formData.nom,
        prenoms : this.formData.prenoms,
        telephone : this.formData.telephone,
        mail: this.formData.mail,
        login: this.formData.login,
        mdp: this.formData.mdp,
        contact: this.formData.contact,
      }
```
with:
```js
      var data = {
        nom : this.formData.nom,
        prenoms : this.formData.prenoms,
        telephone : this.formData.telephone,
        mail: this.formData.mail,
        login: this.formData.login,
        mdp: this.formData.mdp,
        contact: this.formData.contact,
        type_user: this.formData.type_user,
      }
```

- [ ] **Step 2: Fix `index.vue`**

In `src/components/commercial/index.vue`, add a role column and fix the delete call.

Replace:
```js
              <b-button
                  size="sm"
                  variant="outline-danger"
                  class="mr-1"
                  @click="supprimer(row.item.id)"
              >
                supprimer
              </b-button>
```
with:
```js
              <b-button
                  size="sm"
                  variant="outline-danger"
                  class="mr-1"
                  @click="supprimer(row.item.id_com)"
              >
                supprimer
              </b-button>
```

Add a role column to the template — insert this `<template>` block right before `<template v-slot:cell(actions)="row">`:
```html
            <template v-slot:cell(type_user)="row">
              {{ roleLabel(row.item.type_user) }}
            </template>
```

Add `{ key: 'type_user', label: 'Rôle', sortable: true }` to the `fields` array, right before the `{ key: 'actions' }` entry.

In the `<script>` block, add the import and the `roleLabel` method:
```js
import API_BASE_URL from '@/api/config.js'
const axios = require('axios')
import Form from "./form";
import flow from "@/store/flow";
import { ROLE_LABELS } from '@/utils/permissions'
```
and, inside `methods: { ... }`, add:
```js
    roleLabel(typeUser) {
      return ROLE_LABELS[typeUser] || 'Inconnu'
    },
```

- [ ] **Step 3: Manual verification in the browser**

Logged in as `resp_test` (or any admin/responsable account — this screen is already gated by the existing `commercial` permission, present for both):

1. Go to the Commercial screen, click "Créer un nouveau commercial", fill the form with role "Usine", save. Expected: toast/redirect confirms creation (`Fire.$emit('creationok')` refreshes the list), the new row shows "Usine" in the Rôle column.
2. Click "modifier" on that row, change the role to "Responsable", save. Expected: the table updates to show "Responsable" — this specifically proves the `id_com` fix works, since before this fix the PUT silently failed (sent `id: undefined`).
3. Click "supprimer" on a test row. Expected: it disappears from the list (soft-delete, `statut=2`) — again proves the `id_com` fix, since delete had the same bug.

- [ ] **Step 4: Commit**

```bash
git add src/components/commercial/form.vue src/components/commercial/index.vue
git commit -m "fix: commercial account edit/delete used a non-existent id column; add role picker"
```

---

## Task 3: Transformations screen (usine)

**Files:**
- Create: `src/components/usine/transformations.vue`
- Modify: `src/router/index.js`
- Modify: `src/layouts/sidebar.vue`

**Interfaces:**
- Consumes: `GET /api/produits` (now returns `quantite_matiere_premiere`/`quantite_torrefie`/`quantite_broye`/`quantite_emballe` per the backend plan), `GET /api/transformations?code_produit=...`, `POST /api/transformations`.

- [ ] **Step 1: Create the screen**

Create `src/components/usine/transformations.vue`:

```html
<template>
  <div class="container-fluid p-3">
    <PageHeader title="Transformations" subtitle="Matière première → torréfié → broyé → emballé" crumb="Usine" />

    <div class="card shadow mb-4">
      <div class="card-body">
        <b-form-group label="Produit">
          <b-form-select v-model="codeProduit" :options="produitOptions" @change="onProduitChange"></b-form-select>
        </b-form-group>

        <div class="row mb-3" v-if="produitSelectionne">
          <div class="col-md-3">
            <div class="text-muted small text-uppercase">Matière première</div>
            <div class="font-weight-bold">{{ produitSelectionne.quantite_matiere_premiere }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-muted small text-uppercase">Torréfié</div>
            <div class="font-weight-bold">{{ produitSelectionne.quantite_torrefie }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-muted small text-uppercase">Broyé</div>
            <div class="font-weight-bold">{{ produitSelectionne.quantite_broye }}</div>
          </div>
          <div class="col-md-3">
            <div class="text-muted small text-uppercase">Emballé</div>
            <div class="font-weight-bold">{{ produitSelectionne.quantite_emballe }}</div>
          </div>
        </div>

        <b-form-group label="Étape">
          <b-form-select v-model="etape" :options="etapeOptions"></b-form-select>
        </b-form-group>

        <div class="row">
          <div class="col-md-4">
            <b-form-group label="Quantité entrée">
              <b-form-input type="number" min="1" v-model="quantiteEntree"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-4">
            <b-form-group label="Quantité obtenue">
              <b-form-input type="number" min="0" v-model="quantiteSortie"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-4">
            <b-form-group label="Perte">
              <b-form-input readonly :value="perte"></b-form-input>
            </b-form-group>
          </div>
        </div>

        <b-form-group label="Observation (optionnel)">
          <b-form-textarea v-model="observation" rows="2"></b-form-textarea>
        </b-form-group>

        <b-button variant="success" :disabled="Loading || !peutValider" @click="valider">
          Enregistrer la transformation
        </b-button>
      </div>
    </div>

    <div class="card shadow mb-4">
      <div class="card-header py-3">Historique des transformations{{ produitSelectionne ? ' — ' + produitSelectionne.libelle_produit : '' }}</div>
      <div class="card-body">
        <b-table
            bordered
            hover
            responsive="xl"
            :items="transformations"
            :fields="fields"
        >
          <template v-slot:cell(etape)="row">
            {{ etapeLabel(row.item.etape) }}
          </template>
        </b-table>
      </div>
    </div>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import PageHeader from "@/components/ui/PageHeader.vue";

const ETAPES = [
  { value: 'matiere_vers_torrefaction', text: 'Torréfaction (matière première → torréfié)' },
  { value: 'torrefaction_vers_broyage', text: 'Broyage (torréfié → broyé)' },
  { value: 'broyage_vers_emballage', text: 'Emballage (broyé → emballé)' },
]

export default {
  name: "transformations",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      produits: [],
      codeProduit: null,
      etape: ETAPES[0].value,
      quantiteEntree: 0,
      quantiteSortie: 0,
      observation: '',
      transformations: [],
      etapeOptions: ETAPES,
      fields: [
        { key: 'etape', label: 'Étape' },
        { key: 'quantite_entree', label: 'Entrée' },
        { key: 'quantite_sortie', label: 'Sortie' },
        { key: 'perte', label: 'Perte' },
        { key: 'date_transformation', label: 'Date' },
      ],
    }
  },
  computed: {
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    produitSelectionne() {
      return this.produits.find(p => p.code_produit === this.codeProduit) || null
    },
    perte() {
      const entree = Number(this.quantiteEntree) || 0
      const sortie = Number(this.quantiteSortie) || 0
      return entree - sortie
    },
    peutValider() {
      return this.codeProduit && this.etape && Number(this.quantiteEntree) > 0
    }
  },
  methods: {
    etapeLabel(valeur) {
      const trouve = ETAPES.find(e => e.value === valeur)
      return trouve ? trouve.text : valeur
    },
    onProduitChange() {
      this.fetchTransformations()
    },
    async valider() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        code_produit: this.codeProduit,
        etape: this.etape,
        quantite_entree: Number(this.quantiteEntree),
        quantite_sortie: Number(this.quantiteSortie),
        observation: this.observation || null,
      }
      await axios.post(`${API_BASE_URL}/api/transformations`, data).then(async () => {
        this.$bvToast.toast('Transformation enregistrée.', { title: 'Transformation', variant: 'success', solid: true })
        this.quantiteEntree = 0
        this.quantiteSortie = 0
        this.observation = ''
        await this.fetchProduits()
        await this.fetchTransformations()
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de l\'enregistrement.', { title: 'Transformation', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(response => {
        this.produits = response.data.element
      }).catch((err) => console.log(err))
    },
    async fetchTransformations() {
      if (!this.codeProduit) {
        this.transformations = []
        return
      }
      await axios.get(`${API_BASE_URL}/api/transformations`, { params: { code_produit: this.codeProduit } }).then(response => {
        this.transformations = response.data
      }).catch((err) => console.log(err))
    },
  },
  created() {
    this.fetchProduits()
  },
}
</script>

<style scoped>
</style>
```

- [ ] **Step 2: Add the route**

In `src/router/index.js`, add this entry to the `children` array (right after the `approvisionnement` route):

```js
      {
        path: '/transformations',
        name: 'transformations',
        component: () => import('@/components/usine/transformations.vue')
      },
```

- [ ] **Step 3: Add the sidebar entry**

In `src/layouts/sidebar.vue`, add a new "Production" section right after the "Fournisseurs" section (after its closing `</li>`, before the "Section : Trésorerie" comment):

```html
      <!-- Section : Production -->
      <div class="obf-nav-section" v-if="hasPermission('transformations')">Production</div>

      <li class="nav-item" v-if="hasPermission('transformations')">
        <router-link class="nav-link" :to="{name : 'transformations'}">
          <i class="fas fa-fw fa-industry"></i>
          <span class="text-uppercase">Transformations</span>
        </router-link>
      </li>
```

- [ ] **Step 4: Manual verification in the browser**

Logged in as `usine_test` (needs at least one product created via the existing Stocks screen first, and some matière première received via Fournisseurs/Approvisionnement — both already usine-accessible after Task 1):

1. Navigate to "Transformations" from the sidebar. Expected: the 4 stock counters show for the selected product, all `0` if nothing received yet.
2. Do an "Approvisionnement" first (existing screen) to get matière première > 0, come back to Transformations, select the product — matière première count reflects it.
3. Fill étape "Torréfaction", quantité entrée = the received amount, quantité obtenue = something smaller, observe the "Perte" field update live, submit. Expected: success toast, matière première count drops to 0, torréfié count shows the obtained quantity, a row appears in the history table below.
4. Repeat for broyage and emballage, confirming each stage's counter updates correctly.

- [ ] **Step 5: Commit**

```bash
git add src/components/usine/transformations.vue src/router/index.js src/layouts/sidebar.vue
git commit -m "feat: add usine transformations screen"
```

---

## Task 4: Demandes screen (transfert usine ↔ responsable)

**Files:**
- Create: `src/components/demandes/index.vue`
- Modify: `src/router/index.js`
- Modify: `src/layouts/sidebar.vue`

**Interfaces:**
- Consumes: `Controller::hasPermission` (Task 1) for the fine-grained `demandes_creer`/`demandes_livrer` checks. `GET /api/demandes`, `GET /api/demandes/{code_demande}/lignes`, `POST /api/demandes`, `POST /api/demandes/{code_demande}/livrer`.

- [ ] **Step 1: Create the screen**

Create `src/components/demandes/index.vue`:

```html
<template>
  <div class="container-fluid p-3">
    <PageHeader title="Demandes" subtitle="Transfert de produit fini usine → responsable" crumb="Production">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchDemandes">
          <i class="fas fa-sync-alt mr-1"></i> Rafraîchir
        </b-button>
        <b-button variant="primary" v-if="peutCreer" @click="ouvrirCreation">
          <i class="fas fa-plus mr-1"></i> Nouvelle demande
        </b-button>
      </template>
    </PageHeader>

    <div class="card shadow mb-4">
      <div class="card-header py-3">Liste des demandes</div>
      <div class="card-body">
        <b-table
            bordered
            hover
            responsive="xl"
            :items="demandes"
            :fields="fields"
        >
          <template v-slot:cell(statut)="row">
            <span class="badge" :class="statutClasse(row.item.statut)">{{ statutLabel(row.item.statut) }}</span>
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-primary" @click="ouvrirLivraison(row.item)" v-if="peutLivrer && row.item.statut !== 3">
              Traiter / livrer
            </b-button>
          </template>
        </b-table>
      </div>
    </div>

    <b-modal ref="modalCreation" hide-footer title="Nouvelle demande" size="lg">
      <b-form-group label="Date de la demande">
        <b-form-datepicker locale="fr-FR" v-model="dateDemande"></b-form-datepicker>
      </b-form-group>

      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Quantité demandée</th>
          <th></th>
        </tr>
        <tr v-for="(ligne, index) in lignesCreation" :key="index">
          <td style="min-width:220px;">
            <b-form-select v-model="ligne.code_produit" :options="produitOptions"></b-form-select>
          </td>
          <td>
            <b-form-input type="number" min="1" v-model="ligne.quantite_demandee"></b-form-input>
          </td>
          <td>
            <b-button size="sm" variant="danger" @click="lignesCreation.splice(index, 1)">
              <i class="fas fa-trash"></i>
            </b-button>
          </td>
        </tr>
      </table>

      <b-button variant="outline-primary" class="mb-3" @click="lignesCreation.push({ code_produit: null, quantite_demandee: 1 })">
        <i class="fas fa-plus mr-1"></i> Ajouter une ligne
      </b-button>

      <b-button variant="success" block :disabled="Loading" @click="creerDemande">Envoyer la demande</b-button>
    </b-modal>

    <b-modal ref="modalLivraison" hide-footer :title="'Livraison — ' + (demandeSelectionnee ? demandeSelectionnee.code_demande : '')" size="lg">
      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Demandé</th>
          <th>Déjà livré</th>
          <th>À livrer maintenant</th>
        </tr>
        <tr v-for="(ligne, index) in lignesLivraison" :key="index">
          <td>{{ ligne.libelle_produit }}</td>
          <td>{{ ligne.quantite_demandee }}</td>
          <td>{{ ligne.quantite_livree }}</td>
          <td>
            <b-form-input type="number" min="0" :max="ligne.quantite_demandee - ligne.quantite_livree" v-model="ligne.a_livrer"></b-form-input>
          </td>
        </tr>
      </table>

      <b-button variant="success" block :disabled="Loading" @click="confirmerLivraison">Confirmer la livraison</b-button>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";
import { hasPermission } from "@/utils/permissions";

const STATUTS = {
  1: { label: 'En attente', classe: 'badge-secondary' },
  2: { label: 'En préparation', classe: 'badge-warning' },
  3: { label: 'Livrée', classe: 'badge-success' },
  4: { label: 'Annulée', classe: 'badge-danger' },
}

export default {
  name: "demandes-index",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      demandes: [],
      produits: [],
      dateDemande: moment().format('YYYY-MM-DD'),
      lignesCreation: [{ code_produit: null, quantite_demandee: 1 }],
      demandeSelectionnee: null,
      lignesLivraison: [],
      fields: [
        { key: 'code_demande', label: 'Code' },
        { key: 'date_demande', label: 'Date' },
        { key: 'statut', label: 'Statut' },
        { key: 'actions' },
      ],
    }
  },
  computed: {
    peutCreer() {
      return hasPermission('demandes_creer')
    },
    peutLivrer() {
      return hasPermission('demandes_livrer')
    },
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
  },
  methods: {
    statutLabel(statut) {
      return (STATUTS[statut] || {}).label || 'Inconnu'
    },
    statutClasse(statut) {
      return (STATUTS[statut] || {}).classe || 'badge-secondary'
    },
    ouvrirCreation() {
      this.dateDemande = moment().format('YYYY-MM-DD')
      this.lignesCreation = [{ code_produit: null, quantite_demandee: 1 }]
      this.$refs.modalCreation.show()
    },
    async creerDemande() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        date_demande: this.dateDemande,
        lignes: this.lignesCreation.filter(l => l.code_produit && l.quantite_demandee > 0),
      }
      await axios.post(`${API_BASE_URL}/api/demandes`, data).then(response => {
        this.$bvToast.toast('Demande envoyée : ' + response.data.code_demande, { title: 'Demande', variant: 'success', solid: true })
        this.$refs.modalCreation.hide()
        this.fetchDemandes()
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de l\'envoi.', { title: 'Demande', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async ouvrirLivraison(demande) {
      this.demandeSelectionnee = demande
      await axios.get(`${API_BASE_URL}/api/demandes/${demande.code_demande}/lignes`).then(response => {
        this.lignesLivraison = response.data.map(l => ({ ...l, a_livrer: 0 }))
      }).catch((err) => console.log(err))
      this.$refs.modalLivraison.show()
    },
    async confirmerLivraison() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        lignes: this.lignesLivraison
          .filter(l => Number(l.a_livrer) > 0)
          .map(l => ({ code_produit: l.code_produit, quantite_livree: Number(l.a_livrer) })),
      }
      await axios.post(`${API_BASE_URL}/api/demandes/${this.demandeSelectionnee.code_demande}/livrer`, data).then(() => {
        this.$bvToast.toast('Livraison enregistrée.', { title: 'Demande', variant: 'success', solid: true })
        this.$refs.modalLivraison.hide()
        this.fetchDemandes()
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de la livraison.', { title: 'Demande', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async fetchDemandes() {
      await axios.get(`${API_BASE_URL}/api/demandes`).then(response => {
        this.demandes = response.data
      }).catch((err) => console.log(err))
    },
    async fetchProduits() {
      await axios.get(`${API_BASE_URL}/api/produits`).then(response => {
        this.produits = response.data.element
      }).catch((err) => console.log(err))
    },
  },
  created() {
    this.fetchDemandes()
    this.fetchProduits()
  },
}
</script>

<style scoped>
</style>
```

- [ ] **Step 2: Add the route**

In `src/router/index.js`, add this entry to the `children` array (right after the `transformations` route added in Task 3):

```js
      {
        path: '/demandes',
        name: 'demandes',
        component: () => import('@/components/demandes/index.vue')
      },
```

- [ ] **Step 3: Add the sidebar entry**

In `src/layouts/sidebar.vue`, add this inside the "Production" section created in Task 3, right after the Transformations `<li>`:

```html
      <li class="nav-item" v-if="hasPermission('demandes')">
        <router-link class="nav-link" :to="{name : 'demandes'}">
          <i class="fas fa-fw fa-exchange-alt"></i>
          <span class="text-uppercase">Demandes</span>
        </router-link>
      </li>
```

Also update the section's `v-if` from `hasPermission('transformations')` to `canAny(['transformations', 'demandes'])` so the "Production" section header shows for responsable/admin too (they get `demandes` but not `transformations`):

```html
      <div class="obf-nav-section" v-if="canAny(['transformations', 'demandes'])">Production</div>
```

- [ ] **Step 4: Manual verification in the browser**

1. Logged in as `resp_test`: navigate to Demandes, click "Nouvelle demande", add a line for a product with `quantite_emballe > 0` (from Task 3's manual test), quantity less than what's emballé, submit. Expected: success toast with a `DM...` code, the demande appears in the table with status "En attente". No "Traiter / livrer" button should be visible for this account (`demandes_livrer` isn't in the responsable permission list).
2. Log out, log in as `usine_test`: the same demande is visible with a "Traiter / livrer" button. Click it, enter a partial quantity (less than requested) in "À livrer maintenant", confirm. Expected: success toast, status becomes "En préparation" on refresh.
3. Click "Traiter / livrer" again, deliver the remainder. Expected: status becomes "Livrée", the button disappears for that row (statut === 3 check).
4. Go to Transformations (or Stocks) and confirm the emballé counter dropped by the total delivered, and (for `resp_test`) the regular Stocks screen's quantity for that product increased by the same amount.

- [ ] **Step 5: Commit**

```bash
git add src/components/demandes/index.vue src/router/index.js src/layouts/sidebar.vue
git commit -m "feat: add demandes screen (usine <-> responsable transfer requests)"
```

---

## Task 5: Cessions et versements commerciaux

**Files:**
- Create: `src/components/commercial_prises/index.vue`
- Modify: `src/router/index.js`
- Modify: `src/layouts/sidebar.vue`

**Interfaces:**
- Consumes: `hasPermission` (Task 1). `GET /api/commercial` (filtered client-side to `type_user === 2`), `GET /api/commercial/{id}/solde`, `GET /api/commercial-prises?commercial_id=...`, `GET /api/commercial-versements?commercial_id=...`, `POST /api/commercial-prises`, `POST /api/commercial-versements`.

- [ ] **Step 1: Create the screen**

Create `src/components/commercial_prises/index.vue`:

```html
<template>
  <div class="container-fluid p-3">
    <PageHeader title="Commerciaux" subtitle="Cessions de stock en dépôt et versements" crumb="Ventes">
      <template #actions>
        <b-button variant="outline-primary" @click="fetchCommerciaux">
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
        <b-table
            bordered
            hover
            responsive="xl"
            :items="commerciaux"
            :fields="fields"
        >
          <template v-slot:cell(reste_a_verser)="row">
            <span class="font-weight-bold" :class="row.item.reste_a_verser > 0 ? 'text-danger' : 'text-success'">
              {{ new Intl.NumberFormat().format(row.item.reste_a_verser || 0) }} FCFA
            </span>
          </template>
          <template v-slot:cell(actions)="row">
            <b-button size="sm" variant="outline-primary" class="mr-1" @click="voirHistorique(row.item)">Historique</b-button>
            <b-button size="sm" variant="outline-success" v-if="peutCeder" @click="ouvrirVersement(row.item)">Verser</b-button>
          </template>
        </b-table>
      </div>
    </div>

    <b-modal ref="modalCession" hide-footer title="Nouvelle cession de stock" size="lg">
      <b-form-group label="Commercial">
        <b-form-select v-model="commercialIdCession" :options="commercialOptions"></b-form-select>
      </b-form-group>
      <b-form-group label="Date">
        <b-form-datepicker locale="fr-FR" v-model="dateCession"></b-form-datepicker>
      </b-form-group>

      <table class="table table-bordered">
        <tr>
          <th>Produit</th>
          <th>Quantité</th>
          <th>Prix Gros</th>
          <th>Total</th>
          <th></th>
        </tr>
        <tr v-for="(ligne, index) in lignesCession" :key="index">
          <td style="min-width:220px;">
            <b-form-select v-model="ligne.code_produit" :options="produitOptions"></b-form-select>
          </td>
          <td>
            <b-form-input type="number" min="1" v-model="ligne.quantite"></b-form-input>
          </td>
          <td class="align-middle">{{ new Intl.NumberFormat().format(prixGros(ligne.code_produit)) }} FCFA</td>
          <td class="font-weight-bold text-right align-middle">
            {{ new Intl.NumberFormat().format((ligne.quantite || 0) * prixGros(ligne.code_produit)) }} FCFA
          </td>
          <td class="align-middle">
            <b-button size="sm" variant="danger" @click="lignesCession.splice(index, 1)">
              <i class="fas fa-trash"></i>
            </b-button>
          </td>
        </tr>
      </table>

      <b-button variant="outline-primary" class="mb-3" @click="lignesCession.push({ code_produit: null, quantite: 1 })">
        <i class="fas fa-plus mr-1"></i> Ajouter une ligne
      </b-button>

      <div class="text-right mb-3">
        <h5 class="text-uppercase text-danger font-weight-bolder">TOTAL : {{ new Intl.NumberFormat().format(totalCession) }} FCFA</h5>
      </div>

      <b-button variant="success" block :disabled="Loading || !peutValiderCession" @click="validerCession">Céder le stock</b-button>
    </b-modal>

    <b-modal ref="modalVersement" hide-footer :title="'Versement — ' + (commercialSelectionne ? (commercialSelectionne.nom + ' ' + commercialSelectionne.prenoms) : '')">
      <b-form-group label="Montant versé">
        <b-form-input type="number" min="1" v-model="montantVersement"></b-form-input>
      </b-form-group>
      <b-button variant="success" block :disabled="Loading" @click="enregistrerVersement">Enregistrer le versement</b-button>
    </b-modal>

    <b-modal ref="modalHistorique" hide-footer :title="'Historique — ' + (commercialSelectionne ? (commercialSelectionne.nom + ' ' + commercialSelectionne.prenoms) : '')" size="lg">
      <h6>Prises de stock</h6>
      <b-table bordered hover :items="prisesHistorique" :fields="fieldsPrises">
        <template v-slot:cell(montant_total)="row">{{ new Intl.NumberFormat().format(row.item.montant_total) }} FCFA</template>
      </b-table>
      <h6 class="mt-4">Versements</h6>
      <b-table bordered hover :items="versementsHistorique" :fields="fieldsVersements">
        <template v-slot:cell(montant)="row">{{ new Intl.NumberFormat().format(row.item.montant) }} FCFA</template>
      </b-table>
    </b-modal>
  </div>
</template>

<script>
import API_BASE_URL from "@/api/config.js";
const axios = require('axios')
import moment from "moment";
import PageHeader from "@/components/ui/PageHeader.vue";
import { hasPermission } from "@/utils/permissions";

export default {
  name: "commercial-prises-index",
  components: { PageHeader },
  data() {
    return {
      Loading: false,
      commerciauxBruts: [],
      commerciaux: [],
      produits: [],
      commercialIdCession: null,
      dateCession: moment().format('YYYY-MM-DD'),
      lignesCession: [{ code_produit: null, quantite: 1 }],
      commercialSelectionne: null,
      montantVersement: 0,
      prisesHistorique: [],
      versementsHistorique: [],
      fields: [
        { key: 'nom', sortable: true },
        { key: 'prenoms', sortable: true },
        { key: 'login', sortable: true },
        { key: 'reste_a_verser', label: 'Reste à verser', sortable: true },
        { key: 'actions' },
      ],
      fieldsPrises: [
        { key: 'code_prise', label: 'Code' },
        { key: 'date_prise', label: 'Date' },
        { key: 'montant_total', label: 'Montant' },
      ],
      fieldsVersements: [
        { key: 'date_versement', label: 'Date' },
        { key: 'montant', label: 'Montant' },
      ],
    }
  },
  computed: {
    peutCeder() {
      return hasPermission('commercial_prises_creer')
    },
    commercialOptions() {
      return this.commerciauxBruts.map(c => ({ value: c.id_com, text: `${c.nom} ${c.prenoms || ''}` }))
    },
    produitOptions() {
      return this.produits.map(p => ({ value: p.code_produit, text: p.libelle_produit }))
    },
    totalCession() {
      return this.lignesCession.reduce((t, l) => t + (l.quantite || 0) * this.prixGros(l.code_produit), 0)
    },
    peutValiderCession() {
      return this.commercialIdCession && this.lignesCession.some(l => l.code_produit && l.quantite > 0)
    },
  },
  methods: {
    prixGros(codeProduit) {
      const produit = this.produits.find(p => p.code_produit === codeProduit)
      return produit ? produit.prix_gros : 0
    },
    ouvrirCession() {
      this.commercialIdCession = null
      this.dateCession = moment().format('YYYY-MM-DD')
      this.lignesCession = [{ code_produit: null, quantite: 1 }]
      this.$refs.modalCession.show()
    },
    async validerCession() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        commercial_id: this.commercialIdCession,
        date_prise: this.dateCession,
        lignes: this.lignesCession.filter(l => l.code_produit && l.quantite > 0),
      }
      await axios.post(`${API_BASE_URL}/api/commercial-prises`, data).then(response => {
        this.$bvToast.toast('Cession enregistrée : ' + response.data.code_prise, { title: 'Cession', variant: 'success', solid: true })
        this.$refs.modalCession.hide()
        this.fetchCommerciaux()
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors de la cession.', { title: 'Cession', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    ouvrirVersement(commercial) {
      this.commercialSelectionne = commercial
      this.montantVersement = 0
      this.$refs.modalVersement.show()
    },
    async enregistrerVersement() {
      if (this.Loading) return
      this.Loading = true
      const data = {
        commercial_id: this.commercialSelectionne.id_com,
        montant: Number(this.montantVersement),
      }
      await axios.post(`${API_BASE_URL}/api/commercial-versements`, data).then(() => {
        this.$bvToast.toast('Versement enregistré.', { title: 'Versement', variant: 'success', solid: true })
        this.$refs.modalVersement.hide()
        this.fetchCommerciaux()
      }).catch((err) => {
        console.log(err)
        this.$bvToast.toast('Erreur lors du versement.', { title: 'Versement', variant: 'danger', solid: true })
      })
      this.Loading = false
    },
    async voirHistorique(commercial) {
      this.commercialSelectionne = commercial
      await axios.get(`${API_BASE_URL}/api/commercial-prises`, { params: { commercial_id: commercial.id_com } }).then(response => {
        this.prisesHistorique = response.data
      }).catch((err) => console.log(err))
      await axios.get(`${API_BASE_URL}/api/commercial-versements`, { params: { commercial_id: commercial.id_com } }).then(response => {
        this.versementsHistorique = response.data
      }).catch((err) => console.log(err))
      this.$refs.modalHistorique.show()
    },
    async fetchCommerciaux() {
      await axios.get(`${API_BASE_URL}/api/commercial`).then(async response => {
        const liste = response.data.filter(c => Number(c.type_user) === 2)
        this.commerciauxBruts = liste
        for (const c of liste) {
          try {
            const solde = await axios.get(`${API_BASE_URL}/api/commercial/${c.id_com}/solde`)
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
  },
}
</script>

<style scoped>
</style>
```

- [ ] **Step 2: Add the route**

In `src/router/index.js`, add this entry to the `children` array (right after the `demandes` route added in Task 4):

```js
      {
        path: '/commercial-prises',
        name: 'commercial_prises',
        component: () => import('@/components/commercial_prises/index.vue')
      },
```

- [ ] **Step 3: Add the sidebar entry**

In `src/layouts/sidebar.vue`, add this inside the existing "Ventes" section (`v-if="canAny(['ventes','commande_clients'])"`), right after the closing `</b-collapse>` of the Ventes collapse block — as its own top-level item, not nested inside the collapse:

```html
      <li class="nav-item" v-if="hasPermission('commercial_prises')">
        <router-link class="nav-link" :to="{name : 'commercial_prises'}">
          <i class="fas fa-fw fa-people-carry"></i>
          <span class="text-uppercase">Commerciaux</span>
        </router-link>
      </li>
```

Also update the Ventes section header's `v-if` to include the new permission, so it shows even if a role somehow has `commercial_prises` without `ventes`/`commande_clients` (not the case for any current role, but keeps the header logic honest):

```html
      <div class="obf-nav-section" v-if="canAny(['ventes','commande_clients','commercial_prises'])">Ventes</div>
```

- [ ] **Step 4: Manual verification in the browser**

Logged in as `resp_test` (needs a commercial-role account too — create one via the Commercial screen from Task 2 with role "Commercial", and needs `quantite_stock > 0` for at least one product, e.g. from Task 4's delivered demande):

1. Navigate to "Commerciaux". Expected: the test commercial account appears with "0 FCFA" reste à verser.
2. Click "Nouvelle cession", pick the commercial, add a line with a product and quantity, confirm the displayed unit price matches that product's Gros price and the total is quantity × Gros price, submit. Expected: success toast, the commercial's "reste à verser" updates to the ceded amount; the product's stock (visible on the Stocks screen) dropped by the ceded quantity.
3. Click "Verser" on that commercial, enter an amount smaller than the total owed, submit. Expected: "reste à verser" decreases by exactly that amount.
4. Click "Historique". Expected: the prise and the versement both appear in their respective tables with matching amounts.

- [ ] **Step 5: Commit**

```bash
git add src/components/commercial_prises/index.vue src/router/index.js src/layouts/sidebar.vue
git commit -m "feat: add commercial stock cessions, versements, and balance screen"
```

---

## Done

At this point: login goes through the real backend with role-based menus (admin/responsable identical, usine scoped to production, commercial minimal), account management works (role assignment, and the `id_com` edit/delete bug is fixed), and the 3 new screens cover the full spec workflow — transformations, transfer requests, and commercial cessions/versements. Nothing in the existing sales/client/caisse screens was touched.
