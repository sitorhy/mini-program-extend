<template>
  <div>
    <div>{{ count }}</div>
    <div>
      <button @click="increment">increment</button>
    </div>
    <div>
      <button @click="increment2">increment2</button>
    </div>
    <div>
      <button @click="increment3">increment3</button>
    </div>
    <div>
      <button @click="reset">reset</button>
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
  immediate: false,
  deep: false
});

export default {
  name: "Counter",
  store: store,
  computed: {
    count: {
      get() {
        return store.state.count;
      },
      set(v) {
        store.state.count = v;
      }
    }
  },
  methods: {
    increment() {
      store.state.count++;
    },
    increment2() {
      store.commit("increment");
    },
    increment3() {
      store.dispatch("increment");
    },
    reset() {
      this.count = 0;
    }
  },
  mounted() {
    console.log(store);
    console.log(JSON.stringify(store.state));
  }
}
</script>

<style scoped>

</style>