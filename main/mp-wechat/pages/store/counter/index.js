import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

store.watch((state) => {
    return state.count;
}, (val, oldVal) => {
    console.log(`${oldVal} => ${val}`);
});

ComponentEx({
    computed: {
        count() {
            return store.state.count;
        }
    },
    increment() {
        store.state.count++;
    },
    increment2() {
        store.commit("increment");
    }
})