<template>
  <div>
    <div>{{ count }}</div>
    <div>
      <button @click="increment">increment</button>
    </div>
    <div>
      <button @click="increment2">increment2</button>
    </div>
  </div>
</template>

<script>
import store from "../store";

store.watch((state) => {
  return state.count;
}, (val, oldVal) => {
  console.log(`${oldVal} => ${val}`);
}, {
  immediate: false
});

export default {
  name: "Counter",
  store: store,
  computed: {
    count() {
      return store.state.count;
    }
  },
  methods: {
    increment() {
      store.state.count++;
    },
    increment2() {
      store.commit("increment");
    }
  },
  mounted() {
    console.log(store)
  }
}
</script>

<style scoped>

</style>