import Vue from 'vue';
import App from './App.vue';
import router from './router'
import store from './store'

store.subscribe((mutation, state) => {
    console.log(`=== mutation ${mutation.type} ===`);
    console.log(mutation);
    console.log(state);
    console.log("======");
});

store.subscribeAction({
    before: (action, state) => {
        console.log(`before action ${action.type}`);
    },
    after: (action, state) => {
        console.log(`after action ${action.type}`);
    },
    error: (action, state, error) => {
        console.log(`error action ${action.type}`);
        console.error(error);
    }
});

new Vue({
    el: "#app",
    router,
    store,
    components: {App},
    template: "<App />"
});
