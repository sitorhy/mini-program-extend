<template>
  <div>
    <div>text1 = <span>{{ txt1 }}</span></div>
    <div>text2 = <span>{{ txt2 }}</span></div>
    <div>
      <button @click="asyncTask">read a poem</button>
    </div>
    <div>
      <button @click="throwTest">throwTest</button>
    </div>
    <div>
      <button @click="throwTest2">throwTest2</button>
    </div>
    <div>
      <button @click="throwTest3">throwTest3</button>
    </div>
    <div>
      <button @click="rejectTest">rejectTest</button>
    </div>
  </div>
</template>

<script>
import {createNamespacedHelpers} from "vuex";

const {
  mapActions,
  mapGetters
} = createNamespacedHelpers("task");

export default {
  name: "AsyncTask",
  computed: {
    ...mapGetters({
      txt1: "text1",
      txt2: "text2"
    })
  },
  methods: {
    ...mapActions(["asyncTask", "throwTest", "throwTest2", "throwTest3", "rejectTest"])
  }
}
</script>

<style scoped>

</style>