<template>
  <div class="obf-login">
    <!-- Panneau gauche : branding -->
    <div class="obf-login__brand">
      <div class="obf-login__brand-inner">
        <img src="@/assets/logo_obf.png" alt="logo Grains Moulus" class="obf-login__logo">
        <h1 class="obf-login__brand-title">Grains Moulus</h1>
        <p class="obf-login__brand-text">Gestion de stock, bons de livraison et trésorerie.</p>
        <span class="obf-login__version">Version 1.0</span>
      </div>
    </div>

    <!-- Panneau droit : formulaire -->
    <div class="obf-login__panel">
      <form class="obf-login__form" v-on:submit.prevent="login_user">
        <h2 class="obf-login__title">Connexion</h2>
        <p class="obf-login__subtitle">Accédez à votre espace de gestion</p>

        <div class="alert alert-danger" v-if="error">{{ error }}</div>

        <div class="form-group">
          <label class="obf-login__label">Utilisateur</label>
          <input type="text" v-model="form.username" class="form-control form-control-lg" placeholder="Nom d'utilisateur" required>
        </div>
        <div class="form-group">
          <label class="obf-login__label">Mot de passe</label>
          <input type="password" v-model="form.password" class="form-control form-control-lg" placeholder="••••••••" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block btn-lg text-uppercase">Connexion</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_BASE_URL from '@/api/config'

export default {
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      error: null,
      // Utilisateur unique Grains Moulus. Un seul type de document (Bon de Livraison) :
      // pas de permissions HT/proforma/certification FNE.
      users: {
        admin: {
          password: 'admin2026',
          role: 'admin',
          permissions: ['dashboard', 'clients', 'stocks', 'ventes', 'factures_users', 'panier_facture', 'listes_commandes', 'factures_avoir', 'facture', 'livraison', 'historiques', 'caisses', 'historiques_factures', 'historiques_livraisons', 'recu', 'rapport_caisse', 'documents_clients', 'ventes_historiques', 'commande_clients', 'appro', 'decaissement', 'historiques_encaissement', 'historiques_encaissement_clients', 'fournisseurs', 'approvisionnement', 'commercial', 'journal_activite', 'parametres']
        }
      }
    }
  },
  methods: {
    async login_user () {
      this.error = null;

      // Check if user exists and password is correct
      const user = this.users[this.form.username];
      if (user && user.password === this.form.password) {
        // Store user info in localStorage
        const userInfo = {
          username: this.form.username,
          role: user.role,
          permissions: user.permissions
        };
        localStorage.setItem('LoggedUser', JSON.stringify(userInfo));
        this.logConnexion(this.form.username, true);
        this.$router.push({ name: 'dashboard' });
      } else {
        this.error = 'Nom d\'utilisateur ou mot de passe incorrect';
        this.logConnexion(this.form.username, false);
      }
    },
    logConnexion (utilisateur, succes) {
      // Fire-and-forget : ne doit jamais bloquer ni casser le flux de connexion.
      axios.post(`${API_BASE_URL}/api/journal/connexion`, { utilisateur, succes }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.obf-login {
  display: flex;
  min-height: 100vh;
  background: var(--obf-bg, #f4f6fb);
}

/* Panneau gauche : branding indigo */
.obf-login__brand {
  flex: 1 1 45%;
  background: linear-gradient(150deg, #4F46E5 0%, #4338CA 60%, #3730A3 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
}
.obf-login__brand::after {
  content: "";
  position: absolute;
  width: 420px; height: 420px;
  border-radius: 50%;
  background: rgba(255,255,255,.08);
  top: -120px; right: -120px;
}
.obf-login__brand-inner { position: relative; z-index: 1; max-width: 360px; text-align: center; }
.obf-login__logo {
  width: 120px;
  background: #fff;
  border-radius: 20px;
  padding: 14px;
  margin-bottom: 26px;
  box-shadow: 0 10px 30px rgba(0,0,0,.18);
}
.obf-login__brand-title { font-size: 1.9rem; font-weight: 800; margin: 0 0 10px; }
.obf-login__brand-text { opacity: .85; font-size: 1rem; margin-bottom: 26px; }
.obf-login__version {
  display: inline-block;
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: .5px;
  background: rgba(255,255,255,.16);
  border: 1px solid rgba(255,255,255,.3);
  border-radius: 999px;
  padding: 7px 16px;
}

/* Panneau droit : formulaire */
.obf-login__panel {
  flex: 1 1 55%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.obf-login__form {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border: 1px solid var(--obf-border, #e8ebf2);
  border-radius: 18px;
  box-shadow: var(--obf-shadow-md, 0 6px 22px rgba(31,41,55,.10));
  padding: 38px 34px;
}
.obf-login__title { font-size: 1.6rem; font-weight: 800; color: var(--obf-text, #1f2937); margin: 0; }
.obf-login__subtitle { color: var(--obf-muted, #64748b); margin: 6px 0 24px; font-size: .92rem; }
.obf-login__label {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: var(--obf-muted, #64748b);
  margin-bottom: 6px;
}
.obf-login__form .form-group { margin-bottom: 18px; }
.obf-login__form .btn-primary { margin-top: 8px; }

/* Responsive : on masque le panneau de marque sur petit écran */
@media (max-width: 768px) {
  .obf-login__brand { display: none; }
  .obf-login__panel { flex: 1 1 100%; }
}
</style>
