import {ComponentEx} from "../../../libs/mp-extend/index";
import store from "../store";

ComponentEx({
    computed: {
        role() {
            return store.state.account.role;
        },
        name() {
            return store.state.account.name;
        },
        isAdmin() {
            return store.getters['account/isAdmin'];
        }
    },
    methods: {
        login() {
            store.dispatch('account/login', {
                role: 'admin',
                name: 'test'
            });
        }
    }
})
