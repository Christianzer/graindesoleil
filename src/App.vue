<template>
  <div id="app">
    <router-view />
    <UpdateBanner />
  </div>
</template>

<script>
import UpdateBanner from '@/components/ui/UpdateBanner.vue'

export default {
  components: { UpdateBanner },
}
</script>

<style>
</style>
