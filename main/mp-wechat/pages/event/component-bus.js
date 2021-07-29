import {ComponentEx} from "../../libs/mp-extend/extend";

ComponentEx({
    properties: {},
    data: {},
    methods: {
        checkChildren() {
            console.log('--component-bus--');
            console.log(this.$children);
            console.log(this.$parent);
            console.log('--component-bus--');
        }
    }
});