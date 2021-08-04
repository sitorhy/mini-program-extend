import {ComponentEx} from "../../libs/mp-extend/extend";
import {printChildren, printLevel} from "./behaviors";

ComponentEx({
    properties: {},
    data: {},
    mounted() {
        this.$on('top', () => {
            console.log(`接收广播 ${this.is}`)
        });
    },
    methods: {
        checkLevel() {
            this.$emit('parent', `来自${this.is}组件`);
            printLevel(this);
        },
        checkChildren() {
            printChildren(this);
        }
    }
});
