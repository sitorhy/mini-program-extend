// pages/computed/doubleBase.js
import {ComponentEx} from "../../libs/mp-extend/index";

ComponentEx({
    /**
     * 组件的属性列表
     */
    properties: {
        base: {
            type: Number,
            value: 0
        }
    },

    computed: {
        doubleBase() {
            return this.base * 2;
        }
    },

    /**
     * 组件的初始数据
     */
    data: {},

    /**
     * 组件的方法列表
     */
    methods: {}
})
