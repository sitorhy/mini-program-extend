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
  </div>
</template>

<script>
import {compatibleContext} from "../../libs/test-units/context";

export default {
  name: "Context",
  ...compatibleContext
}
</script>

<style scoped>

</style>