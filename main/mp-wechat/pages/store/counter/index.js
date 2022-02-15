import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

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