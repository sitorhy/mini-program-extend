import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

store.watch((state) => {
        return state.count;
    }, (val, oldVal) => {
        console.log(`watch ${oldVal} => ${val}`);
    },
    {
        immediate: false,
        deep: false
    }
);

ComponentEx({
    computed: {
        count: {
            get() {
                return store.state.count;
            },
            set(v) {
                store.state.count = v;
            }
        }
    },
    increment() {
        store.state.count++;
    },
    increment2() {
        store.commit("increment");
    },
    reset() {
        this.count = 0;
    }
})