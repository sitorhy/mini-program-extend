import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

ComponentEx({
    computed: {
        isLogin() {
            return store.getters.isLogin;
        },
        token() {
            return store.state.auth.token;
        }
    },
    methods: {
        login() {
            store.commit("login", "0x123456");
        }
    }
})