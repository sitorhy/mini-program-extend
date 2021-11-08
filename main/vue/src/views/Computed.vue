<template>
  <div>
    <div><span>doubleBase=</span><span>{{ doubleBase }}</span></div>
    <div><span>aPlus=</span><span>{{ aPlus }}</span></div>
    <div><span>a=</span><span>{{ a }}</span></div>
    <div><span>aDouble=</span><span>{{ aDouble }}</span></div>
    <div><span>cPlus=</span><span>{{ cPlus }}</span></div>
    <div><span>动态测试=</span><span>{{ formatTime }}</span></div>
  </div>
</template>

<script>
import Computed from "../../libs/test-units/computed";

export default {
  name: "Computed",
  ...Computed
}
</script>

<style scoped>

</style>