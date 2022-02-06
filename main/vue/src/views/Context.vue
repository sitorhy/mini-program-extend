<template>
  <div>
    <p>
      <span>p1={{ p1 }}</span>
    </p>
    <p>
      <span>p2={{ p2 }}</span>
    </p>
    <p>
      <span>p3={{ p5 }}</span>
    </p>
    <p>
      <span>p4={{ p4 }}</span>
    </p>
    <p>
      <span>p5History={{ p5History }}</span>
    </p>
    <p>
      <span>p3RefreshTime={{ p3RefreshTime }}</span>
    </p>
    <button @click="test">测试</button>
  </div>
</template>

<script>
import Context from "../../libs/test-units/context";

export default {
  name: "Query",
  ...Context
}
</script>

<style scoped>

</style>