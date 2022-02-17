<template>
  <div>
    <Counter/>
    <Obj/>
  </div>
</template>

<script>
import Counter from "../components/Counter";
import StoreObj from "../components/StoreObj";

export default {
  name: "Store",
  components: {
    Counter,
    Obj: StoreObj
  }
}
</script>

<style scoped>

</style>