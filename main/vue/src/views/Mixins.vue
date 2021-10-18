<template>
  <div>
    <MixinsComponent01/>
    <MixinsComponent02/>
    <MixinsComponent03/>
  </div>
</template>

<script>
import MixinsComponent01 from "../components/MixinsComponent01";
import MixinsComponent02 from "../components/MixinsComponent02";
import MixinsComponent03 from "../components/MixinsComponent02";

export default {
  name: "Extend",
  components: {
    MixinsComponent01,
    MixinsComponent02,
    MixinsComponent03
  }
}
</script>

<style scoped>

</style>