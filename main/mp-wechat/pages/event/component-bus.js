import {ComponentEx} from "../../libs/mp-extend/extend";
import {printChildren, printLevel} from "./behaviors";

ComponentEx({
    properties: {},
    data: {},
    methods: {
        checkLevel() {
            this.$emit('parent', '来自顶层组件');
            printLevel(this);
        },
        checkChildren() {
            printChildren(this);
        }
    }
});