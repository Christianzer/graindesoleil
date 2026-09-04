<template>
  <div class="obf-page-header d-flex flex-wrap align-items-center justify-content-between mb-4">
    <div class="obf-page-header__titles">
      <div class="obf-page-header__crumb" v-if="crumb">{{ crumb }}</div>
      <h1 class="obf-page-header__title">{{ title }}</h1>
      <p class="obf-page-header__subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="obf-page-header__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    crumb: { type: String, default: '' },
  },
}
</script>

<style scoped>
.obf-page-header { gap: 12px; }
.obf-page-header__crumb {
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .6px;
  font-weight: 700;
  color: var(--obf-muted, #64748b);
  margin-bottom: 2px;
}
.obf-page-header__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--obf-text, #1f2937);
  margin: 0;
}
.obf-page-header__subtitle {
  margin: 4px 0 0;
  color: var(--obf-muted, #64748b);
  font-size: .9rem;
}
.obf-page-header__actions { display: flex; gap: 8px; align-items: center; }
</style>
