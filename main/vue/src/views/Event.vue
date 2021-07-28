<template>
  <EventComponent/>
</template>

<script>
import Event from "../../libs/test-units/event"
import EventComponent from "../components/EventComponent";

export default {
  name: "Event",
  components: {
    EventComponent
  },
  mixins: [Event]
}
</script>

<style scoped>

</style>