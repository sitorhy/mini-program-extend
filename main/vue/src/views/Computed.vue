<template>
  <div>
    <PropThroughNum :propThroughNum="propThroughNum"/>
    <div><span>doubleBase=</span><span>{{ doubleBase }}</span></div>
    <div><span>aPlus=</span><span>{{ aPlus }}</span></div>
    <div><span>a=</span><span>{{ a }}</span></div>
    <div><span>aDouble=</span><span>{{ aDouble }}</span></div>
    <div><span>cPlus=</span><span>{{ cPlus }}</span></div>
    <div><span>squarePropThroughNum=</span><span>{{ squarePropThroughNum }}</span></div>
    <div><span>plusSelf=</span><span>{{ plusSelf }}</span></div>
    <div><span>doublePlusSelf=</span><span>{{ doublePlusSelf }}</span></div>
    <div><span>strPlusSelf=</span><span>{{ strPlusSelf }}</span></div>
    <div><span>动态测试=</span><span>{{ formatTime }}</span></div>

    <div>
      <button @click="changePropNum">Change PropThroughNum</button>
    </div>
    <div>
      <button @click="changeSquarePropNum">Change SquarePropNum</button>
    </div>
    <div>
      <button @click="testPlusSelf">自增测试</button>
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