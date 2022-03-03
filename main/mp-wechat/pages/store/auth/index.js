import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../../../store/index";

ComponentEx({
    computed: {
        isLogin() {
            return store.getters.isLogin;
        },
        token() {
            return store.state.auth.token;
        }
    },
    watch: {
        token(val, oldVal) {
            console.log(`token ${oldVal} => ${val}`);
        },
        isLogin(val, oldVal) {
            console.log(`isLogin ${oldVal} => ${val}`);
        }
    },
    methods: {
        login() {
            store.commit("login", "0x123456");
        },
        unregister() {
            store.unregisterModule("auth");
            console.log(store);
        },
        check() {
            console.log(store);
        }
    }
})