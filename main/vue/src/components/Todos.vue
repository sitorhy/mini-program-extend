<template>
  <div>
    {{todos}}
  </div>
</template>

<script>
import store from "../store";

export default {
  name: "Todos",
  computed: {
    todos: () => store.getters.doneTodos
  }
}
</script>

<style scoped>

</style>