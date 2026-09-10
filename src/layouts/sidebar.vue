<!-- eslint-disable vue/valid-template-root -->
// eslint-disable-next-line vue/valid-template-root
<template>
  <!-- Sidebar -->
  <ul class="navbar-nav sidebar obf-sidebar accordion" id="accordionSidebar">
    <!-- Sidebar - Brand -->
    <router-link class="sidebar-brand d-flex align-items-center justify-content-center" :to="{name : 'dashboard'}">
      <div class="sidebar-brand-icon text-center">
        <img src="@/assets/logo_obf.png" alt="Grains Moulus" width="30%">
      </div>
    </router-link>

    <!-- Zone de navigation défilante -->
    <div class="obf-sidebar__scroll">

      <!-- Tableau de bord -->
      <li class="nav-item" v-if="hasPermission('dashboard')">
        <router-link class="nav-link" :to="{name : 'dashboard'}">
          <i class="fas fa-fw fa-tachometer-alt"></i>
          <span class="text-uppercase">Tableau de bord</span>
        </router-link>
      </li>

      <!-- Section : Ventes -->
      <div class="obf-nav-section" v-if="canAny(['ventes','commande_clients','clients','commerciaux','commercial_prises'])">Ventes</div>

      <li class="nav-item" v-if="hasPermission('ventes') || hasPermission('commande_clients')">
        <a class="nav-link" href="javascript:;" v-b-toggle.collapse-2>
          <i class="fas fa-fw fa-shopping-cart"></i>
          <span class="text-uppercase">Bons de livraison</span>
          <i class="fas fa-chevron-down obf-caret"></i>
        </a>
        <b-collapse id="collapse-2" accordion="sidebar-menu" class="collapse">
          <div class="bg-white py-2 collapse-inner rounded">
            <router-link class="collapse-item" :to="{name : 'ventes'}" v-if="hasPermission('ventes')">
              <i class="fas fa-fw fa-cart-plus"></i>
              <span class="text-uppercase">Nouveau bon de livraison</span>
            </router-link>
            <router-link class="collapse-item" :to="{name : 'commande_clients'}" v-if="hasPermission('commande_clients')">
              <i class="fas fa-fw fa-file-invoice"></i>
              <span class="text-uppercase">Liste des bons de livraison</span>
            </router-link>
          </div>
        </b-collapse>
      </li>

      <li class="nav-item" v-if="hasPermission('clients')">
        <router-link class="nav-link" :to="{name : 'clients'}">
          <i class="fas fa-fw fa-user-alt"></i>
          <span class="text-uppercase">Clients</span>
        </router-link>
      </li>

      <li class="nav-item" v-if="hasPermission('commerciaux')">
        <router-link class="nav-link" :to="{name : 'commerciaux'}">
          <i class="fas fa-fw fa-address-card"></i>
          <span class="text-uppercase">Commerciaux</span>
        </router-link>
      </li>

      <li class="nav-item" v-if="hasPermission('commercial_prises')">
        <router-link class="nav-link" :to="{name : 'commercial_prises'}">
          <i class="fas fa-fw fa-people-carry"></i>
          <span class="text-uppercase">Dépôt-vente</span>
        </router-link>
      </li>

      <!-- Section : Stock & Production (ordre = flux : matière -> transformation -> livraison) -->
      <div class="obf-nav-section" v-if="canAny(['stocks','fournisseurs','approvisionnement','transformations','demandes'])">Stock &amp; Production</div>

      <li class="nav-item" v-if="hasPermission('stocks')">
        <router-link class="nav-link" :to="{name : 'stocks'}">
          <i class="fas fa-fw fa-file-archive"></i>
          <span class="text-uppercase">Produits</span>
        </router-link>
      </li>

      <!-- Fournisseurs : menu déroulant pour admin/responsable ; éclaté en liens directs pour l'usine -->
      <template v-if="menuPlat">
        <li class="nav-item" v-if="hasPermission('fournisseurs')">
          <router-link class="nav-link" :to="{name : 'fournisseurs'}">
            <i class="fas fa-fw fa-address-book"></i>
            <span class="text-uppercase">Liste fournisseurs</span>
          </router-link>
        </li>
        <li class="nav-item" v-if="hasPermission('approvisionnement')">
          <router-link class="nav-link" :to="{name : 'approvisionnement'}">
            <i class="fas fa-fw fa-dolly"></i>
            <span class="text-uppercase">Approvisionnement</span>
          </router-link>
        </li>
      </template>
      <li class="nav-item" v-else-if="hasPermission('fournisseurs') || hasPermission('approvisionnement')">
        <a class="nav-link" href="javascript:;" v-b-toggle.collapse-15>
          <i class="fas fa-fw fa-truck"></i>
          <span class="text-uppercase">Fournisseurs</span>
          <i class="fas fa-chevron-down obf-caret"></i>
        </a>
        <b-collapse id="collapse-15" accordion="sidebar-menu" class="collapse">
          <div class="bg-white py-2 collapse-inner rounded">
            <router-link class="collapse-item" :to="{name : 'fournisseurs'}" v-if="hasPermission('fournisseurs')">
              <i class="fas fa-fw fa-address-book"></i>
              <span class="text-uppercase">Liste fournisseurs</span>
            </router-link>
            <router-link class="collapse-item" :to="{name : 'approvisionnement'}" v-if="hasPermission('approvisionnement')">
              <i class="fas fa-fw fa-dolly"></i>
              <span class="text-uppercase">Approvisionnement</span>
            </router-link>
          </div>
        </b-collapse>
      </li>

      <li class="nav-item" v-if="hasPermission('transformations')">
        <router-link class="nav-link" :to="{name : 'transformations'}">
          <i class="fas fa-fw fa-industry"></i>
          <span class="text-uppercase">Transformations</span>
        </router-link>
      </li>

      <li class="nav-item" v-if="hasPermission('demandes')">
        <router-link class="nav-link" :to="{name : 'demandes'}">
          <i class="fas fa-fw fa-exchange-alt"></i>
          <span class="text-uppercase">Demandes à l'usine</span>
        </router-link>
      </li>

      <!-- Section : Trésorerie -->
      <div class="obf-nav-section" v-if="canAny(['caisses','appro','decaissement','rapport_caisse'])">Trésorerie</div>

      <!-- Trésorerie : menu déroulant pour admin/responsable ; éclaté en liens directs pour la caisse -->
      <template v-if="menuPlat">
        <li class="nav-item" v-if="hasPermission('caisses')">
          <router-link class="nav-link" :to="{name : 'caisses'}">
            <i class="fas fa-fw fa-calculator"></i>
            <span class="text-uppercase">Encaissement</span>
          </router-link>
        </li>
        <li class="nav-item" v-if="hasPermission('appro')">
          <router-link class="nav-link" :to="{name : 'appro'}">
            <i class="fas fa-fw fa-coins"></i>
            <span class="text-uppercase">Autres entrées</span>
          </router-link>
        </li>
        <li class="nav-item" v-if="hasPermission('decaissement')">
          <router-link class="nav-link" :to="{name : 'decaissement'}">
            <i class="fas fa-fw fa-compress"></i>
            <span class="text-uppercase">Décaissement</span>
          </router-link>
        </li>
        <li class="nav-item" v-if="hasPermission('rapport_caisse')">
          <router-link class="nav-link" :to="{name : 'rapport_caisse'}">
            <i class="fas fa-fw fa-cash-register"></i>
            <span class="text-uppercase">Rapport de caisse</span>
          </router-link>
        </li>
      </template>
      <li class="nav-item" v-else-if="hasPermission('caisses') || hasPermission('appro') || hasPermission('decaissement') || hasPermission('rapport_caisse')">
        <a class="nav-link" href="javascript:;" v-b-toggle.collapse-1>
          <i class="fas fa-fw fa-store"></i>
          <span class="text-uppercase">Trésorerie</span>
          <i class="fas fa-chevron-down obf-caret"></i>
        </a>
        <b-collapse id="collapse-1" accordion="sidebar-menu" class="collapse">
          <div class="bg-white py-2 collapse-inner rounded">
            <router-link class="collapse-item" :to="{name : 'caisses'}" v-if="hasPermission('caisses')">
              <i class="fas fa-fw fa-calculator"></i>
              <span class="text-uppercase">Encaissement</span>
            </router-link>
            <router-link class="collapse-item" :to="{name : 'appro'}" v-if="hasPermission('appro')">
              <i class="fas fa-fw fa-coins"></i>
              <span class="text-uppercase">Autres entrées</span>
            </router-link>
            <router-link class="collapse-item" :to="{name : 'decaissement'}" v-if="hasPermission('decaissement')">
              <i class="fas fa-fw fa-compress"></i>
              <span class="text-uppercase">Décaissement</span>
            </router-link>
            <router-link class="collapse-item" :to="{name : 'rapport_caisse'}" v-if="hasPermission('rapport_caisse')">
              <i class="fas fa-fw fa-cash-register"></i>
              <span class="text-uppercase">Rapport de caisse</span>
            </router-link>
          </div>
        </b-collapse>
      </li>

      <!-- Section : Suivi -->
      <div class="obf-nav-section" v-if="canAny(['documents_clients','historiques','historiques_encaissement','journal_activite'])">Suivi &amp; Documents</div>

      <li class="nav-item" v-if="hasPermission('documents_clients')">
        <router-link class="nav-link" :to="{name : 'documents_clients'}">
          <i class="fas fa-fw fa-folder-open"></i>
          <span class="text-uppercase">Archive</span>
        </router-link>
      </li>

      <li class="nav-item" v-if="hasPermission('historiques') || hasPermission('historiques_encaissement')">
        <a class="nav-link" href="javascript:;" v-b-toggle.collapse-3>
          <i class="fas fa-fw fa-history"></i>
          <span class="text-uppercase">Historiques</span>
          <i class="fas fa-chevron-down obf-caret"></i>
        </a>
        <b-collapse id="collapse-3" accordion="sidebar-menu" class="collapse">
          <div class="bg-white py-2 collapse-inner rounded">
            <router-link class="collapse-item" :to="{name : 'historiques'}" v-if="hasPermission('historiques')">
              <i class="fas fa-fw fa-user"></i>
              <span class="text-uppercase">Clients</span>
            </router-link>
            <router-link class="collapse-item" :to="{name : 'historiques_encaissement'}" v-if="hasPermission('historiques_encaissement')">
              <i class="fas fa-fw fa-calculator"></i>
              <span class="text-uppercase">Encaissement</span>
            </router-link>
          </div>
        </b-collapse>
      </li>

      <li class="nav-item" v-if="hasPermission('journal_activite')">
        <router-link class="nav-link" :to="{name : 'journal_activite'}">
          <i class="fas fa-fw fa-clipboard-list"></i>
          <span class="text-uppercase">Journal d'activité</span>
        </router-link>
      </li>

      <!-- Section : Administration -->
      <div class="obf-nav-section" v-if="canAny(['commercial','parametres'])">Administration</div>

      <li class="nav-item" v-if="hasPermission('commercial')">
        <router-link class="nav-link" :to="{name : 'commercial'}">
          <i class="fas fa-fw fa-users-cog"></i>
          <span class="text-uppercase">Comptes utilisateurs</span>
        </router-link>
      </li>

      <li class="nav-item" v-if="hasPermission('parametres')">
        <router-link class="nav-link" :to="{name : 'parametres'}">
          <i class="fas fa-fw fa-cog"></i>
          <span class="text-uppercase">Paramètres</span>
        </router-link>
      </li>

    </div>
    <!-- /zone défilante -->

    <!-- Pied de sidebar : déconnexion + version (toujours visibles) -->
    <div class="obf-sidebar__footer">
      <li class="nav-item">
        <a href="#" @click="logout" class="nav-link obf-logout">
          <i class="fas fa-fw fa-sign-out-alt"></i>
          <span class="text-uppercase">Déconnexion</span>
        </a>
      </li>
      <div class="obf-version-badge">v2.0 · Nouvelle interface</div>
    </div>

  </ul>
</template>

<script>
export default {
  data() {
    return {
      currentUser: null
    }
  },
  mounted() {
    this.loadCurrentUser();
  },
  computed: {
    // Usine (type_user 4) et Caisse (type_user 5) : périmètre restreint, on éclate
    // les sous-menus déroulants (Fournisseurs, Trésorerie) en liens directs.
    menuPlat() {
      const t = this.currentUser && Number(this.currentUser.type_user);
      return t === 4 || t === 5;
    },
  },
  methods: {
    toggleMenu () {
      const menu = document.querySelector('#accordionSidebar')
      menu.classList.toggle('toggled')
    },
    loadCurrentUser() {
      const userString = localStorage.getItem('LoggedUser');
      if (userString) {
        this.currentUser = JSON.parse(userString);
      }
    },
    hasPermission(routeName) {
      if (!this.currentUser || !this.currentUser.permissions) {
        return false;
      }
      return this.currentUser.permissions.includes(routeName);
    },
    // Vrai si l'utilisateur a au moins une des permissions de la liste (libellés de section).
    canAny(routeNames) {
      return routeNames.some(r => this.hasPermission(r));
    },
    logout() {
      localStorage.removeItem('LoggedUser');
      this.$router.push({ name: 'Login' });
    }
  }
}
</script>

<style scoped>
/* La mise en forme (états actif/survol, sections, chevrons, footer, badge) est gérée par le
   thème global obf-v2.css via la classe .obf-sidebar pour rester cohérente sur toute l'app. */
</style>

<style>
</style>
