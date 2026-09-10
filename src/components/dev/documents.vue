<template>
  <div class="container-fluid p-4">
    <h4 class="mb-1">Prévisualisation des documents</h4>
    <p class="text-muted">Rendu pdfmake avec données d'exemple (aucun appel API). Ouvre chaque PDF pour contrôle visuel.</p>

    <div class="d-flex flex-wrap" style="gap:10px;">
      <b-button v-for="d in docs" :key="d.type" variant="outline-primary" @click="voir(d)">
        {{ d.label }}
      </b-button>
    </div>

    <b-alert :show="!!erreur" variant="danger" class="mt-3">{{ erreur }}</b-alert>
  </div>
</template>

<script>
import { genererDocument } from '@/documents'
import * as B from '@/documents/builders'
import { FIXTURES } from '@/documents/fixtures'

export default {
  name: 'dev-documents',
  data () {
    return {
      erreur: null,
      docs: [
        { type: 'bl', label: '1 · Bon de livraison', build: B.bl },
        { type: 'recu', label: '2 · Reçu de versement (client)', build: B.recu },
        { type: 'recu_commercial', label: '3 · Reçu de versement (commercial)', build: B.recu },
        { type: 'avoir', label: '4 · Avoir', build: B.avoir },
        { type: 'releve_client', label: '5 · Relevé de compte client', build: B.releveClient },
        { type: 'releve_commercial', label: '6 · Relevé de compte commercial', build: B.releveCommercial },
        { type: 'cession', label: '7 · Bon de cession commercial', build: B.cession },
        { type: 'transfert', label: '8 · Bon de transfert usine → magasin', build: B.transfert },
        { type: 'cloture_caisse', label: '9 · Clôture de caisse', build: B.clotureCaisse },
      ],
    }
  },
  methods: {
    async voir (d) {
      this.erreur = null
      try {
        await genererDocument(d.build(FIXTURES[d.type]))
      } catch (e) {
        this.erreur = (e && e.message) || String(e)
        console.error(e)
      }
    },
  },
}
</script>
