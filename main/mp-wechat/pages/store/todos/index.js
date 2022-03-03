import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../../../store/index";

ComponentEx({
    computed: {
        todos: () => store.getters.doneTodos
    }
})