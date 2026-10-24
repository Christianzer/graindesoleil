import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import { BootstrapVue } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'element-plus/dist/index.css'
import vSelect from 'vue-select'

Vue.component('v-select', vSelect)
import 'vue-select/dist/vue-select.css'

// Select recherchable réutilisable (wrapper vue-select), compatible avec
// l'usage <b-form-select> du projet.
import SearchSelect from '@/components/ui/SearchSelect.vue'
Vue.component('search-select', SearchSelect)

// Thème OBF v2.0 — chargé en dernier pour primer sur Bootstrap / SB Admin 2
import '@/assets/theme/obf-v2.css'

// PWA : installabilité mobile (voir vue.config.js `pwa` + registerServiceWorker.js)
import './registerServiceWorker'

// Notifications push : (ré)abonne l'appareil si une session est déjà ouverte
// (PWA rouverte sans repasser par l'écran de connexion).
import { activerNotifications } from '@/push'
if (localStorage.getItem('LoggedUser')) {
  activerNotifications().catch(() => {})
}

Vue.use(BootstrapVue)

// Champs de montants (FCFA) : entiers uniquement — voir src/utils/entier.js
import entier from '@/utils/entier'
Vue.directive('entier', entier)
Vue.prototype.$http = axios

// Format d'affichage des dates : JJ/MM/AAAA (ex. 09/09/2026), partout dans
// l'application. Exceptions volontaires : les reçus et relevés gardent le
// format long en toutes lettres (voir les helpers `date_com` locaux).
import moment from 'moment'
function formatDateFr(value) {
  if (value === null || value === undefined || value === '') return ''
  const m = moment(String(value).replace(' ', 'T'))
  return m.isValid() ? m.format('DD/MM/YYYY') : String(value)
}
Vue.filter('dateFr', formatDateFr)
Vue.prototype.$dateFr = formatDateFr

// Journal d'activité : attache l'utilisateur connecté (LoggedUser) à chaque
// requête sortante, sans avoir à toucher chaque écran individuellement.
axios.interceptors.request.use(config => {
  try {
    const raw = localStorage.getItem('LoggedUser')
    if (raw) {
      const user = JSON.parse(raw)
      if (user && user.username) {
        config.headers['X-User'] = user.username
      }
      if (user && user.type_user) {
        config.headers['X-User-Role'] = user.type_user
      }
    }
  } catch (e) {
    // localStorage indisponible ou LoggedUser corrompu : on laisse la requête partir sans en-tête.
  }
  return config
})

Vue.config.productionTip = false

let Fire = new Vue()
window.Fire = Fire;

const app = new Vue({
  router,
  render: h => h(App),
}).$mount('#app')

// Période clôturée : le serveur refuse (423) toute écriture sur une pièce verrouillée.
// Message clair pour l'utilisateur, quel que soit l'écran qui a envoyé la requête.
axios.interceptors.response.use(
  response => response,
  error => {
    const r = error && error.response
    if (r && r.status === 423 && r.data && r.data.periode_cloturee) {
      app.$bvToast.toast(r.data.message, { title: 'Période clôturée', variant: 'warning', solid: true, autoHideDelay: 8000 })
    }
    if (r && r.status === 403 && r.data && /^Consultation seule/.test(r.data.message || '')) {
      app.$bvToast.toast(r.data.message, { title: 'Consultation seule', variant: 'info', solid: true, autoHideDelay: 6000 })
    }
    return Promise.reject(error)
  }
)
