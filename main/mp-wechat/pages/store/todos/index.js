import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

ComponentEx({
    computed: {
        todos: () => store.getters.doneTodos
    }
})