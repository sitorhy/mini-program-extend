<template>
  <div>
    <div>isLogin = <span>{{ isLogin }}</span></div>
    <div>token = <span>{{ token }}</span></div>
    <div>
      <button @click="login">login</button>
    </div>
    <div>
      <button @click="unregister">unregister</button>
    </div>
    <div>
      <button @click="check">check</button>
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
  watch: {
    token(val, oldVal) {
      console.log(`token ${oldVal} => ${val}`);
    },
    isLogin(val, oldVal) {
      console.log(`isLogin ${oldVal} => ${val}`);
    }
  },
  methods: {
    login() {
      store.commit("login", "0x123456");
    },
    unregister() {
      store.unregisterModule("auth");
    },
    check() {
      console.log(store);
    }
  }
}
</script>

<style scoped>

</style>