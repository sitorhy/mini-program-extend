<template>
  <div>
    <Counter/>
    <Obj/>
    <Todos/>
    <Auth/>
    <Namespace/>
  </div>
</template>

<script>
import Counter from "../components/Counter";
import StoreObj from "../components/StoreObj";
import Todos from "../components/Todos";
import Auth from "../components/Auth";
import Namespace from "../components/Namespace";

export default {
  name: "Store",
  components: {
    Counter,
    Obj: StoreObj,
    Todos,
    Auth,
    Namespace
  }
}
</script>

<style scoped>

</style>