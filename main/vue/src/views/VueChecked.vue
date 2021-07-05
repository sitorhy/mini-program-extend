<template>
  <div>
    <div>
      <p><span>c={{ c }}</span></p>
    </div>
    <div>
      <p><span>d={{ d }}</span></p>
    </div>
  </div>
</template>

<script>
const LifecycleMixin = {
  created() {
    console.log('created 1');
  },
  mounted() {
    console.log('mounted 1');
  }
};

const MethodsMixin = {
  test() {
    console.log('test 1');
  }
};

const PropsMixin = {
  props: {
    d: {
      type: Number,
      default: 300
    }
  }
};

const DataMixin = {
  data() {
    return {
      a: 100,
      b: 100
    };
  }
};

const ComputedMixin = {
  computed: {
    c() {
      console.log('c changed 1');
      return this.a + this.b;
    }
  }
};

const WatchMixin = {
  watch: {
    b(val, oldVal) {
      console.log(`b handler 1 ${oldVal} => ${val}`);
    }
  }
};

const CustomMixin = {
  customData: {
    hi: 'VUE'
  },
  customMethod() {
    console.log('114514');
  }
};

export default {
  name: "VueChecked",
  mixins: [
    LifecycleMixin,
    MethodsMixin,
    DataMixin,
    WatchMixin,
    ComputedMixin,
    PropsMixin,
    CustomMixin
  ],
  props: {
    d: {
      type: Number,
      default: 400
    }
  },
  data() {
    return {
      b: 200
    }
  },
  created() {
    console.log('created 2');
  },
  mounted() {
    console.log('mounted 2');
    this.test();
    console.log(this.$data);
    this.b = 300;

    //Vue不允许游离于 methods , data 外定义的扩展
    //console.log(this.customData);
    //this.customMethod();
  },
  watch: {
    b(val, oldVal) {
      console.log(`b handler 2 ${oldVal} => ${val}`);
    }
  },
  computed: {
    c() {
      console.log('c changed 2');
      return this.a * this.b;
    }
  },
  methods: {
    test() {
      console.log('test 2');
    }
  }
}
</script>

<style scoped>

</style>