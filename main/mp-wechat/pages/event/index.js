import {PageEx} from "../../libs/mp-extend/extend";
import {printChildren, printLevel} from "./behaviors";

PageEx({
    data: {
        keys: [1, 2, 3, 4]
    },
    mounted() {
        this.$on('parent', (msg) => {
            console.log(msg);
        });
        this.$once('parent', (msg) => {
            console.log(msg);
        });
        this.$on('top', (e) => {
            console.log(e);
            console.log(`接收广播 ${this.is}`)
        });
    },
    methods: {
        checkLevel() {
            printLevel(this);
        },
        checkChildren() {
            printChildren(this);
        }
    }
})