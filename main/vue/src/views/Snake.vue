<template>
  <div>
    <button @click="stop">中断</button>
    <button @click="replay">再搞一次</button>
    <div>
      <canvas id="canvas" :width="`${width+1}px`" :height="`${height+1}px`" :style="backgroundStyle"/>
    </div>
    <div>
      <div style="display: flex;justify-content: center;">
        <div></div>
        <div>
          <button class="btn" @click="onUp">↑</button>
        </div>
        <div></div>
      </div>
      <div style="display: flex;justify-content: center;">
        <div>
          <button class="btn" @click="onLeft">←</button>
        </div>
        <div>
          <button class="btn" @click="onDown">↓</button>
        </div>
        <div>
          <button class="btn" @click="onRight">→</button>
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
.btn {
  width: 48px;
  height: 48px;
  background: #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  border: solid 1px lightgray;
}

.btn:hover {
  background-color: #b2cefd;
}

.btn:active {
  background-color: #33fffc;
}
</style>