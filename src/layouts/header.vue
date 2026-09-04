<template>
  <nav class="navbar navbar-expand navbar-light topbar mb-4 static-top">
    <div class="obf-topbar-title">Grains Moulus — Stock &amp; Caisse</div>
    <ul class="navbar-nav ml-auto">
      <li class="nav-item">
        <div class="obf-user-chip" v-if="user">
          <div class="obf-user-chip__avatar">{{ initiale }}</div>
          <div class="obf-user-chip__info">
            <div class="obf-user-chip__name">{{ user.username }}</div>
            <div class="obf-user-chip__role">{{ user.role }}</div>
          </div>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'Header',
  data() {
    return { user: null }
  },
  computed: {
    initiale() {
      return this.user && this.user.username ? this.user.username.charAt(0).toUpperCase() : '?'
    },
  },
  created() {
    const userString = localStorage.getItem('LoggedUser')
    if (userString) {
      try { this.user = JSON.parse(userString) } catch (e) { this.user = null }
    }
  },
}
</script>

<style scoped>
.obf-topbar-title {
  font-weight: 800;
  color: var(--obf-text, #1f2937);
  letter-spacing: .2px;
}
.obf-user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--obf-primary-50, #eef0fe);
  border: 1px solid #dfe1fb;
  border-radius: 999px;
  padding: 4px 14px 4px 4px;
}
.obf-user-chip__avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--obf-primary, #4f46e5);
  color: #fff;
  font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.obf-user-chip__name {
  font-weight: 700;
  font-size: .85rem;
  color: var(--obf-text, #1f2937);
  line-height: 1.1;
  text-transform: capitalize;
}
.obf-user-chip__role {
  font-size: .7rem;
  color: var(--obf-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: .3px;
}
</style>
