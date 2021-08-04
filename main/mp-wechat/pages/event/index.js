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