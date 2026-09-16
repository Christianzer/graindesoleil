<template>
  <ReleveCompte type="commercial" :id="$route.params.id" />
</template>

<script>
import ReleveCompte from "@/components/comptes/ReleveCompte.vue";

export default {
  name: "compte-commercial",
  components: { ReleveCompte },
}
</script>
