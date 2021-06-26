<template>
  <div>
    <p><span>a={{ a }}</span></p>
    <p><span>b={{ b }}</span></p>
    <p><span>c={{ c }}</span></p>
    <p><span>d={{ d }}</span></p>
    <p><span>e={{ e }}</span></p>
  </div>
</template>

<script>
import Watch from "../../libs/test-units/watch"

export default {
  name: "Watch",
  ...Watch
}
</script>

<style scoped>

</style>