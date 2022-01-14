<template>
  <div>
    <PropThroughNum :propThroughNum="propThroughNum"/>
    <div><span>doubleBase=</span><span>{{ doubleBase }}</span></div>
    <div><span>aPlus=</span><span>{{ aPlus }}</span></div>
    <div><span>a=</span><span>{{ a }}</span></div>
    <div><span>aDouble=</span><span>{{ aDouble }}</span></div>
    <div><span>cPlus=</span><span>{{ cPlus }}</span></div>
    <div><span>squarePropThroughNum=</span><span>{{ squarePropThroughNum }}</span></div>
    <div><span>动态测试=</span><span>{{ formatTime }}</span></div>

    <div>
      <button @click="changePropNum">Change PropThroughNum</button>
    </div>
    <div>
      <button @click="changeSquarePropNum">Change SquarePropNum</button>
    </div>
  </div>
</template>

<script>
import Computed from "../../libs/test-units/computed";
import PropThroughNum from "../components/PropThroughNum";

export default {
  name: "Computed",
  components: {
    PropThroughNum
  },
  ...Computed
}
</script>

<style scoped>

</style>