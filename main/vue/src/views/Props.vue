<template>
  <div>
    <p><span>num={{ num }}</span></p>
    <p><span>str={{ str }}</span></p>
    <p><span>bool={{ bool }}</span></p>
    <p><span>obj={{ obj }}</span></p>
    <p><span>name={{ name }}</span></p>
    <p><span>d={{ d }}</span></p>
    <p><span>c={{ c }}</span></p>
  </div>
</template>

<script>
import Props from "../../libs/test-units/props";

export default {
  name: "Props",
  ...Props
}
</script>

<style scoped>

</style>