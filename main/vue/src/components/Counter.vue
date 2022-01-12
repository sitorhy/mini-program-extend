<template>
  <div>{{ count }}</div>
</template>

<script>
import store from "../store";

export default {
  name: "Counter",
  computed: {
    count () {
      return store.state.count
    }
  }
}
</script>

<style scoped>

</style>