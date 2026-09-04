import Vue from 'vue'
import VueRouter from 'vue-router'
import Menu from "@/layouts/Menu";
import login from "@/views/login";
Vue.use(VueRouter)

function guardMyroute (to, from, next) {
  const userString = localStorage.getItem('LoggedUser');
  if (userString) {
    const user = JSON.parse(userString);
    // Routes accessibles à tout utilisateur connecté, sans permission spécifique.
    const publicRoutes = ['documents_clients', 'assistant_vente'];
    // Check if the route name is in user's permissions
    if (publicRoutes.includes(to.name) || (user.permissions && user.permissions.includes(to.name))) {
      next(); // allow to enter route
    } else {
      // Redirect to dashboard if user doesn't have permission
      next('/dashboard');
    }
  } else {
    next('/login') // go to '/login';
  }
}

const routes = [
  {
    path: '*',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: login
  },
  {
    path: '/',
    beforeEnter: (to, from, next) => {
      const userString = localStorage.getItem('LoggedUser');
      if (userString) {
        next('dashboard'); // redirect to dashboard if logged in
      } else {
        next('/login'); // redirect to login if not logged in
      }
    }
  },
  {
    path: '/app',
    redirect: 'dashboard',
    component: Menu,
    beforeEnter: guardMyroute,
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/components/admin/index.vue')
      },
      {
        path: '/assistant-vente',
        name: 'assistant_vente',
        component: () => import('@/components/assistant/index.vue')
      },
      {
        path: '/clients',
        name: 'clients',
        component : () => import('@/components/clients/index.vue')
      },
      {
        path: '/commercials',
        name: 'commercial',
        component : () => import('@/components/commercial/index.vue')
      },
      {
        path: '/stocks',
        name: 'stocks',
        component : () => import('@/components/stocks/index.vue')
      },
      {
        name: 'ventes',
        path: '/ventes',
        component : () => import('@/components/ventes/index.vue')
      },
      {
        name: 'factures_users',
        path: '/factures_users',
        component: () => import('@/components/maj/ventes.vue')
      },
      {
        name: 'panier_facture',
        path: '/panier_facture',
        component: () => import('@/components/maj/panier.vue')
      },
      {
        name: 'rapport',
        path: '/rapport',
        component: () => import('@/components/rapport.vue')
      },
      {
        path: '/appro',
        name: 'appro',
        component: () => import('@/components/entree/index.vue')
      },
      {
        name: 'listes_commandes',
        path: '/listes_commandes/:id',
        component: () => import('@/components/commande/listes_commandes.vue')
      },
      {
        name: 'factures_avoir',
        path: '/factures_avoir/:code_commande/:montant',
        component: () => import('@/components/commande/factures_avoir.vue')
      },
      {
        name: 'facture',
        path: '/facture/:code_facture',
        component: () => import('@/components/ventes/facture.vue')
      },
      {
        name: 'livraison',
        path: '/livraison/:code_commande',
        component: () => import('@/components/ventes/livraison.vue')
      },
      {
        name: 'historiques',
        path: '/historiques',
        component: () => import('@/components/historiques/index.vue')
      },
      {
        name: 'caisses',
        path: '/caisses',
        component: () => import('@/components/caisse/index.vue')
      },
      {
        name: 'historiques_factures',
        path: '/historiques_factures/:data',
        component: () => import('@/components/historiques/historiques_ventes')
      },
      {
        name: 'historiques_livraisons',
        path: '/historiques_livraisons/:data',
        component: () => import('@/components/historiques/historiques_livraisons')
      },
      {
        name: 'recu',
        path: '/recu/:code_recu',
        component: () => import('@/components/caisse/imprimer.vue')
      },
      {
        path: '/caisse/rapport',
        name: 'rapport_caisse',
        component: () => import('@/components/rapport/index.vue')
      },
      {
        path: '/documents_clients',
        name: 'documents_clients',
        component: () => import('@/components/documents/index.vue')
      },
      {
        path: '/ventes/historiques',
        name: 'ventes_historiques',
        component: () => import('@/components/historiks/ventes.vue')
      },
      {
        path: '/commande/clients',
        name: 'commande_clients',
        component: () => import('@/components/commande/index.vue')
      },
      {
        path: '/decaissement',
        name: 'decaissement',
        component: () => import('@/components/sortie/index.vue')
      },
      {
        name: 'historiques_encaissement',
        path: '/historiques_encaissement',
        component: () => import('@/components/caisse/historique.vue')
      },
      {
        name: 'historiques_encaissement_clients',
        path: '/historiques_encaissement/:id',
        component: () => import('@/components/caisse/historique_recu.vue')
      },
      {
        name: 'journal_activite',
        path: '/journal_activite',
        component: () => import('@/components/journal_activite/index.vue')
      },
      {
        name: 'fournisseurs',
        path: '/fournisseurs',
        component: () => import('@/components/fournisseurs/index.vue')
      },
      {
        name: 'approvisionnement',
        path: '/approvisionnement',
        component: () => import('@/components/fournisseurs/approvisionnement.vue')
      },
      {
        name: 'parametres',
        path: '/parametres',
        component: () => import('@/components/parametres/index.vue')
      },
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  // Classe appliquée au lien de la route EXACTEMENT courante (menu actif du sidebar).
  linkExactActiveClass: 'active',
  routes
})

export default router
