<template>
  <div class="obf-stat card h-100">
    <div class="card-body d-flex align-items-center">
      <div class="obf-stat__icon" :class="'obf-stat__icon--' + variant">
        <i :class="icon"></i>
      </div>
      <div class="obf-stat__body">
        <div class="obf-stat__label">{{ label }}</div>
        <div class="obf-stat__value" :class="'obf-stat__value--' + variant">{{ value }}</div>
        <div v-if="sub" class="obf-stat__sub">{{ sub }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: true },
    icon: { type: String, default: 'fas fa-coins' },
    // 'accent' (sarcelle, défaut) | 'primary' (indigo) | 'warning' | 'danger'
    variant: { type: String, default: 'accent' },
    // Ligne secondaire optionnelle (ex. montant HT sous le TTC)
    sub: { type: String, default: '' },
  },
}
</script>

<style scoped>
.obf-stat__icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  margin-right: 14px;
  flex: 0 0 auto;
}
.obf-stat__icon--accent  { background: var(--obf-accent-50, #e6f5f3); color: var(--obf-accent, #0d9488); }
.obf-stat__icon--primary { background: var(--obf-primary-50, #eef0fe); color: var(--obf-primary, #4f46e5); }
.obf-stat__icon--warning { background: #fff5e6; color: #d97706; }
.obf-stat__icon--danger  { background: #fdecec; color: #dc2626; }

.obf-stat__label {
  font-size: .72rem;
  text-transform: uppercase;
  letter-spacing: .4px;
  font-weight: 700;
  color: var(--obf-muted, #64748b);
  margin-bottom: 2px;
}
.obf-stat__value { font-size: 1.25rem; font-weight: 800; line-height: 1.1; }
.obf-stat__sub { font-size: .72rem; color: var(--obf-muted, #64748b); margin-top: 3px; font-weight: 600; }
.obf-stat__value--accent  { color: var(--obf-accent, #0d9488); }
.obf-stat__value--primary { color: var(--obf-primary, #4f46e5); }
.obf-stat__value--warning { color: #d97706; }
.obf-stat__value--danger  { color: #dc2626; }
</style>
