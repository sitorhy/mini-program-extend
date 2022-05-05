<template>
  <div>
    <p>
      <span>p1={{ p1 }}</span>
    </p>
    <p>
      <span>p2={{ p2 }}</span>
    </p>
    <p>
      <span>p3={{ p5 }}</span>
    </p>
    <p>
      <span>p4={{ p4 }}</span>
    </p>
    <p>
      <span>p5History={{ p5History }}</span>
    </p>
    <p>
      <span>p3RefreshTime={{ p3RefreshTime }}</span>
    </p>
    <p>
      <span>数组测试={{ JSON.stringify(arrayObserver) }}</span>
    </p>
    <p>
      <span>对象数组={{ JSON.stringify(objectArray) }}</span>
    </p>
    <div>
      <button @click="test">测试</button>
    </div>
    <div>
      <button @click="push">数组插入</button>
    </div>
    <div>
      <button @click="pop">数组删除</button>
    </div>
    <div>
      <button @click="doubleObjectArray">数组元素修改</button>
    </div>
    <div>
      <button @click="reverseObjectArray">数组反转</button>
    </div>
    <div>
      <button @click="reverseObjectArray">数组重置</button>
    </div>
    <div>
      <button @click="destructObjectArray">解构重置</button>
    </div>
  </div>
</template>

<script>
import {compatibleContext} from "../../libs/test-units/context";

export default {
  name: "Context",
  ...compatibleContext
}
</script>

<style scoped>

</style>