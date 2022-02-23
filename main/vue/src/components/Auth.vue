<template>
  <div>
    <div>isLogin = <span>{{ isLogin }}</span></div>
    <div>token = <span>{{ token }}</span></div>
    <div>
      <button @click="login">login</button>
    </div>
  </div>
</template>

<script>
import store from "../store";

export default {
  name: "Auth",
  computed: {
    isLogin() {
      return store.getters.isLogin;
    },
    token() {
      return store.state.auth.token;
    }
  },
  methods: {
    login() {
      store.commit("login", "0x123456");
    }
  }
}
</script>

<style scoped>

</style>