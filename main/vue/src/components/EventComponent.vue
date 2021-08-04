<template>
  <div>
    <button @click="onclick">触发</button>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "EventComponent",
  methods: {
    mounted() {
      this.$on('test', () => {
        console.log('穿透测试');
      });
    },
    onclick() {
      this.$emit('test', '穿透测试');
    }
  }
}
</script>

<style scoped>

</style>