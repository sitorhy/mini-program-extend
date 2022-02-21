<template>
  <div>
    <Counter/>
    <Obj/>
    <Todos/>
  </div>
</template>

<script>
import Counter from "../components/Counter";
import StoreObj from "../components/StoreObj";
import Todos from "../components/Todos";

export default {
  name: "Store",
  components: {
    Counter,
    Obj: StoreObj,
    Todos
  }
}
</script>

<style scoped>

</style>