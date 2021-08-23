import Vue from 'vue';
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Props from '../views/Props.vue'
import Computed from '../views/Computed.vue'
import Watch from '../views/Watch.vue'
import VueChecked from '../views/VueChecked.vue'
import Provide from '../views/Provide.vue'
import Options from '../views/Options.vue'
import Snake from '../views/Snake.vue';

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
        component: Computed
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
        path: '/snake',
        name: 'Snake',
        component: Snake
    }
]

const router = new VueRouter({
    mode: 'history',
    routes
})

export default router
