import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

store.watch((state) => {
    return state.obj;
}, (val, oldVal) => {
    console.log(`watch ${JSON.stringify(oldVal)} => ${JSON.stringify(val)}`);
}, {
    immediate: false,
    deep: true
});

ComponentEx({
    computed: {
        obj() {
            return store.state.obj;
        }
    },
    methods: {
        editArrEl() {
            // Vue 直接修改数组元素不会触发 watch
            //   store.state.obj.arr[0] = 121212;
            store.state.obj.arr.splice(0, 1, 121212);
        },
        editObjField() {
            store.state.obj.a.d = 1919810;
            store.state.obj.a.b.c = 666;
        }
    }
})