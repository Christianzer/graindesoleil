<template>
  <ReleveCompte type="client" :id="$route.params.id" />
</template>

<script>
import ReleveCompte from "@/components/comptes/ReleveCompte.vue";

export default {
  name: "compte-client",
  components: { ReleveCompte },
}
</script>
