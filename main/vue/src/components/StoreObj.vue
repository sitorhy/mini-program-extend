<template>
  <div>
    <div>{{ obj }}</div>
    <div>
      <button @click="editArrEl">修改数组元素</button>
    </div>
    <div>
      <button @click="editObjField">修改字段</button>
    </div>
  </div>
</template>

<script>
import store from "../store";

store.watch((state) => {
  return state.obj;
}, (val, oldVal) => {
  console.log(`${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
}, {
  immediate: false,
  deep: true
});

export default {
  name: "StoreObj",
  computed: {
    obj() {
      return store.state.obj;
    }
  },
  methods: {
    editArrEl() {
      // Vue 直接修改数组元素不会触发 watch
      //   store.state.obj.arr[0] = 121212;
      store.state.obj.arr.splice(0, 1, 121212);
    },
    editObjField() {
      store.state.obj.a.d = 1919810;
      store.state.obj.a.b.c = 666;
    }
  }
}
</script>

<style scoped>

</style>