<template>
  <div>
    <Counter/>
    <Obj/>
    <Todos/>
    <Auth/>
    <Namespace/>
    <AsyncTask/>
  </div>
</template>

<script>
import Counter from "../components/Counter";
import StoreObj from "../components/StoreObj";
import Todos from "../components/Todos";
import Auth from "../components/Auth";
import Namespace from "../components/Namespace";
import AsyncTask from "../components/AsyncTask";

export default {
  name: "Store",
  components: {
    Counter,
    Obj: StoreObj,
    Todos,
    Auth,
    Namespace,
    AsyncTask
  }
}
</script>

<style scoped>

</style>