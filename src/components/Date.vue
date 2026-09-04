<template>
  <b-modal ref="my-modal" :hide-footer="true" :title="title">
    <form action="" @submit.prevent="save">
      <div class="row">
        <div class="col-md-12">
          <b-form-group
              id="code"
              description="Date rapport"
              label="A quelle date voulez vous voir le rapport"
              label-for="input-horizontal"
          >
            <b-form-datepicker
                placeholder="Selectionner une date"
                locale="fr-FR"
                v-model="created_at"
                class="mb-2">
            </b-form-datepicker>
          </b-form-group>
        </div>
      </div>
      <div class="row justify-content-end">
        <b-button variant="primary mr-3" type="submit">Selectionner
        </b-button>
        <b-button class="mr-2" @click="closeModal">Fermer</b-button>
      </div>
    </form>
  </b-modal>
</template>

<script>
import moment from "moment";
export default {

  name: "Date",
  data () {
    return {
      locale: 'fr',
      title: 'Date rapport',
      created_at: ''
    }
  },
  created () {
    this.created_at = moment().format('YYYY-MM-DD')
  },
  methods: {
    showModal () {
      this.$refs['my-modal'].show()
    },
    closeModal () {
      this.$refs['my-modal'].hide()
    },
    save () {
      this.$parent.LoadCatalogue(this.created_at)
      this.closeModal()
    }
  }
}
</script>

<style scoped>

</style>
