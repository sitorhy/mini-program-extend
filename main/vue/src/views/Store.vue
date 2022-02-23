<template>
  <div>
    <Counter/>
    <Obj/>
    <Todos/>
    <Auth/>
  </div>
</template>

<script>
import Counter from "../components/Counter";
import StoreObj from "../components/StoreObj";
import Todos from "../components/Todos";
import Auth from "../components/Auth";

export default {
  name: "Store",
  components: {
    Counter,
    Obj: StoreObj,
    Todos,
    Auth
  }
}
</script>

<style scoped>

</style>