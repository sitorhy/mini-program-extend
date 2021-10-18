<template>
  <div>
    <p>Provider timestamp = {{timestamp}}</p>
    <button @click="updateTime">Provider 更新</button>
    <slot></slot>
  </div>
</template>

<script>
import Provide from "../../libs/test-units/provide";

export default {
  name: "Provider",
  ...Provide
}
</script>

<style scoped>

</style>