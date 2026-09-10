<template>
  <v-select
      class="obf-search-select"
      :options="normalized"
      :value="value"
      :reduce="o => o.value"
      label="text"
      :multiple="multiple"
      :selectable="o => !o.disabled"
      :disabled="disabled"
      :clearable="clearable"
      :placeholder="placeholder"
      append-to-body
      @input="onInput"
  ></v-select>
</template>

<script>
// Select recherchable, API compatible avec l'usage <b-form-select> du projet :
//   <search-select v-model="x" :options="[{ value, text }]" />
//   <search-select multiple v-model="tab" :options="[{ value, text }]" />
// vue-select est déjà enregistré globalement (v-select) et sa CSS importée
// dans main.js.
export default {
  name: "SearchSelect",
  props: {
    value: { default: null },
    options: { type: Array, default: () => [] },
    multiple: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    placeholder: { type: String, default: "Rechercher…" },
  },
  computed: {
    normalized() {
      return (this.options || []).map(o => {
        if (o && typeof o === "object") {
          return {
            value: o.value,
            text: o.text != null ? String(o.text) : String(o.value),
            disabled: !!o.disabled,
          }
        }
        return { value: o, text: String(o), disabled: false }
      })
    },
  },
  methods: {
    onInput(v) {
      if (v === undefined || v === null) {
        this.$emit('input', this.multiple ? [] : null)
      } else {
        this.$emit('input', v)
      }
    },
  },
}
</script>

<style>
.obf-search-select.v-select {
  background: #fff;
}
.obf-search-select .vs__dropdown-toggle {
  min-height: calc(1.5em + 0.75rem + 2px);
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  padding: 0 0 4px 0;
}
.obf-search-select .vs__search,
.obf-search-select .vs__selected {
  margin-top: 4px;
}
.obf-search-select.vs--disabled .vs__dropdown-toggle {
  background-color: #e9ecef;
}
/* Avec append-to-body, le menu déroulant devient enfant de <body> : il doit
   passer AU-DESSUS des modales Bootstrap (z-index 1050) et de leur backdrop,
   sinon il s'ouvre "derrière" la modale et paraît vide. Sélecteur global :
   le menu n'a plus la classe .obf-search-select une fois appendu. */
.vs__dropdown-menu {
  z-index: 1060 !important;
}
</style>
