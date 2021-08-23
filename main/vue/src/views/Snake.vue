<template>
  <div>
    <button @click="replay">再搞一次</button>
    <div>
      <canvas id="canvas" :width="`${width}px`" :height="`${height}px`" :style="backgroundStyle"/>
    </div>
    <div>
      <div style="display: flex;justify-content: center;">
        <div></div>
        <div>
          <button @click="onUp">↑</button>
        </div>
        <div></div>
      </div>
      <div style="display: flex;justify-content: center;">
        <div>
          <button @click="onLeft">←</button>
        </div>
        <div>
          <button @click="onDown">↓</button>
        </div>
        <div>
          <button @click="onRight">→</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Snake from "../../libs/test-units/snake";

export default {
  name: "Snake",
  mixins: [Snake]
}
</script>

<style scoped>

</style>