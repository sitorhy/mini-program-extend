<template>
  <div class="container">
    <button @click="onSendEvent">内建事件</button>
  </div>
</template>

<script>
import Event from "../../libs/test-units/event";

export default {
  name: "EventComponent",
  mixins: [Event]
}
</script>

<style scoped>
.container,
.container > div {
  text-align: center;
}
</style>