<template>
  <transition name="obf-update-slide">
    <div v-if="visible" class="obf-update" :class="'obf-update--' + state">
      <div class="obf-update__icon">
        <i :class="iconClass"></i>
      </div>

      <div class="obf-update__body">
        <!-- Mise à jour disponible -->
        <template v-if="state === 'available'">
          <div class="obf-update__title">Nouvelle version disponible{{ version ? ' (v' + version + ')' : '' }}</div>
          <div class="obf-update__text">Une mise à jour de l'application est prête à être téléchargée.</div>
        </template>

        <!-- Téléchargement en cours -->
        <template v-else-if="state === 'downloading'">
          <div class="obf-update__title">Téléchargement de la mise à jour… {{ percent }}%</div>
          <div class="obf-update__progress">
            <div class="obf-update__progress-bar" :style="{ width: percent + '%' }"></div>
          </div>
        </template>

        <!-- Téléchargée, prête à installer -->
        <template v-else-if="state === 'downloaded'">
          <div class="obf-update__title">Mise à jour prête{{ version ? ' (v' + version + ')' : '' }}</div>
          <div class="obf-update__text">Redémarrez l'application pour terminer l'installation.</div>
        </template>

        <!-- Erreur -->
        <template v-else-if="state === 'error'">
          <div class="obf-update__title">Échec de la mise à jour</div>
          <div class="obf-update__text">{{ errorMsg }}</div>
        </template>
      </div>

      <div class="obf-update__actions">
        <b-button
          v-if="state === 'available'"
          size="sm" variant="light" @click="telecharger">
          <i class="fas fa-download mr-1"></i> Télécharger
        </b-button>
        <b-button
          v-if="state === 'downloaded'"
          size="sm" variant="light" @click="installer">
          <i class="fas fa-redo mr-1"></i> Redémarrer
        </b-button>
        <button
          v-if="state !== 'downloading'"
          class="obf-update__close" @click="visible = false" title="Fermer">
          &times;
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'UpdateBanner',
  data() {
    return {
      visible: false,
      state: 'available',   // available | downloading | downloaded | error
      version: '',
      percent: 0,
      errorMsg: '',
      update: null,         // instance retournée par check(), réutilisée pour downloadAndInstall()
      contentLength: 0,
      downloaded: 0,
    }
  },
  computed: {
    iconClass() {
      if (this.state === 'downloaded') return 'fas fa-check-circle'
      if (this.state === 'error') return 'fas fa-exclamation-triangle'
      if (this.state === 'downloading') return 'fas fa-cloud-download-alt'
      return 'fas fa-arrow-circle-up'
    },
  },
  async mounted() {
    // Disponible uniquement dans l'app Tauri (pas en navigateur web)
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      if (update) {
        this.update = update
        this.version = update.version
        this.state = 'available'
        this.visible = true
      }
    } catch (e) {
      // Hors contexte Tauri, ou pas de mise à jour disponible : silencieux.
      console.log('Vérification de mise à jour ignorée :', e)
    }
  },
  methods: {
    async telecharger() {
      if (!this.update) return
      this.state = 'downloading'
      this.percent = 0
      this.contentLength = 0
      this.downloaded = 0
      try {
        await this.update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              this.contentLength = event.data.contentLength || 0
              break
            case 'Progress':
              this.downloaded += event.data.chunkLength || 0
              this.percent = this.contentLength
                ? Math.round((this.downloaded / this.contentLength) * 100)
                : 0
              break
            case 'Finished':
              this.state = 'downloaded'
              break
          }
        })
      } catch (e) {
        this.errorMsg = (e && e.message) || String(e) || 'Erreur inconnue'
        this.state = 'error'
      }
    },
    async installer() {
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    },
  },
}
</script>

<style scoped>
.obf-update {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 420px;
  padding: 14px 16px;
  border-radius: 14px;
  color: #fff;
  box-shadow: 0 12px 32px rgba(0, 0, 0, .25);
  background: linear-gradient(135deg, #4F46E5, #4338CA);
}
.obf-update--downloaded { background: linear-gradient(135deg, #0D9488, #0B7D72); }
.obf-update--error { background: linear-gradient(135deg, #dc2626, #b91c1c); }

.obf-update__icon { font-size: 1.6rem; flex: 0 0 auto; opacity: .95; }
.obf-update__body { flex: 1 1 auto; min-width: 0; }
.obf-update__title { font-weight: 800; font-size: .92rem; }
.obf-update__text { font-size: .8rem; opacity: .9; margin-top: 2px; }

.obf-update__progress {
  margin-top: 8px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .3);
  overflow: hidden;
}
.obf-update__progress-bar {
  height: 100%;
  background: #fff;
  border-radius: 999px;
  transition: width .2s ease;
}

.obf-update__actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }
.obf-update__close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  opacity: .8;
}
.obf-update__close:hover { opacity: 1; }

.obf-update-slide-enter-active, .obf-update-slide-leave-active { transition: all .25s ease; }
.obf-update-slide-enter, .obf-update-slide-leave-to { opacity: 0; transform: translateY(16px); }
</style>
