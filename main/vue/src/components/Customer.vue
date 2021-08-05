<template>
  <div>
    <p><span>num={{ num }}</span></p>
    <p><span>num2={{ num2 }}</span></p>
    <p><span>num3={{ num3 }}</span></p>
    <p><span>Customer timestamp={{ timestamp }}</span></p>
    <button @click="update">Customer 更新</button>
  </div>
</template>

<script>
import Customer from "../../libs/test-units/customer";

export default {
  name: "Customer",
  ...Customer
}
</script>

<style scoped>

</style>