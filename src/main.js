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

// Thème OBF v2.0 — chargé en dernier pour primer sur Bootstrap / SB Admin 2
import '@/assets/theme/obf-v2.css'

Vue.use(BootstrapVue)
Vue.prototype.$http = axios

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
