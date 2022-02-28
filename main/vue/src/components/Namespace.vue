<template>
  <div>
    <div>role = {{ role }}</div>
    <div>name = {{ name }}</div>
    <div>isAdmin = {{ isAdmin }}</div>
    <div>
      <button @click="login">login</button>
    </div>
  </div>
</template>

<script>
import store from "../store";

export default {
  name: "Namespace",
  computed: {
    role() {
      return store.state.account.role;
    },
    name() {
      return store.state.account.name;
    },
    isAdmin() {
      return store.getters['account/isAdmin'];
    }
  },
  methods: {
    login() {
      store.dispatch('account/login', {
        role: 'admin',
        name: 'test'
      });
    }
  }
}
</script>

<style scoped>

</style>