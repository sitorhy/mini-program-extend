<template>
  <div>
    <p><span>p1={{ p1 }}</span></p>
    <p><span>p2={{ p2 }}</span></p>
    <p><span>p3={{ p3 }}</span></p>
    <p><span>p4={{ p4 }}</span></p>
    <p><span>p5={{ p5 }}</span></p>
    <p><span>p6Count={{ p6Count }}</span></p>
    <p><span>p6Str={{ p6Str }}</span></p>
  </div>
</template>

<script>
import Query from "../../libs/test-units/query";

export default {
  name: "Query",
  ...Query
}
</script>

<style scoped>

</style>