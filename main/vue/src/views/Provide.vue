<template>
  <Provider :num="114514">
    <Customer/>
    <Customer/>
  </Provider>
</template>

<script>
import Provider from "../components/Provider";
import Customer from "../components/Customer";

export default {
  name: "Provide",
  components: {
    Provider,
    Customer
  }
}
</script>

<style scoped>

</style>