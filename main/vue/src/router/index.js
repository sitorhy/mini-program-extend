import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Props from '../views/Props.vue';
import Computed from '../views/Computed.vue';
import Watch from '../views/Watch.vue';
import VueChecked from '../views/VueChecked.vue';
import Provide from '../views/Provide.vue';
import Mixins from '../views/Mixins.vue';
import Options from '../views/Options.vue';
import Snake from '../views/Snake.vue';
import Store from '../views/Store.vue';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/checked',
        name: 'VueChecked',
        component: VueChecked
    },
    {
        path: '/props',
        name: 'Props',
        component: Vue.extend({
            components: {
                Props
            },
            data() {
                return {
                    name: "田所浩二"
                }
            },
            template: "<Props :name='name'/>"
        })
    },
    {
        path: '/computed',
        name: 'Computed',
        component: Vue.extend({
            components: {
                Computed
            },
            data() {
                return {
                    base: 57257
                }
            },
            template: "<Computed :base='base'/>"
        })
    },
    {
        path: '/watch',
        name: 'Watch',
        component: Watch
    },
    {
        path: '/options',
        name: 'Options',
        component: Options
    },
    {
        path: '/provide',
        name: 'Provide',
        component: Provide
    },
    {
        path: '/mixins',
        name: 'Mixins',
        component: Mixins
    },
    {
        path: '/snake',
        name: 'Snake',
        component: Snake
    },
    {
        path: '/store',
        name: 'Store',
        component: Store
    }
]

const router = new VueRouter({
    mode: 'history',
    routes
})

export default router
