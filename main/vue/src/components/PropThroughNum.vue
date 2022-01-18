<template>
  <p><span>propThroughNum * 2 ={{ doubleNum }}</span></p>
</template>

<script>
export default {
  name: "PropThroughNum",
  props: {
    propThroughNum: {
      type: Number,
      default: 0
    }
  },
  computed: {
    doubleNum() {
      return this.propThroughNum * 2;
    }
  }
}
</script>

<style scoped>

</style>