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

Vue.use(BootstrapVue)
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
    }
  } catch (e) {
    // localStorage indisponible ou LoggedUser corrompu : on laisse la requête partir sans en-tête.
  }
  return config
})

Vue.config.productionTip = false

let Fire = new Vue()
window.Fire = Fire;

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
