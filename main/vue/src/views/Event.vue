<template>
  <div>
    <EventComponent @test="onTest">
      <EventComponent>
        <EventComponent/>
      </EventComponent>
    </EventComponent>
    <EventComponent2 @test="onTest"/>
  </div>
</template>

<script>
import EventComponent from "../components/EventComponent";
import EventComponent2 from "../components/EventComponent2";

export default {
  name: "Event",
  components: {
    EventComponent,
    EventComponent2
  },
  methods: {
    mounted() {
      this.$on('test', () => {
        console.log('test2');
      });
    },
    onTest() {
      console.log('ontest');
    }
  }
}
</script>

<style scoped>

</style>