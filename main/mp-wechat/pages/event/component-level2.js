import {ComponentEx} from "../../libs/mp-extend/extend";

ComponentEx({
    properties: {},
    data: {},
    methods: {
        checkParent() {
            console.log('--component 2--');
            console.log(this.$children);
            console.log(this.$parent);
            console.log('--component 2--');
        }
    }
});
