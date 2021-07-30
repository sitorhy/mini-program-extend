import {PageEx} from "../../libs/mp-extend/extend";
import {printChildren, printLevel} from "./behaviors";

PageEx({
    data: {
        keys: [1, 2, 3, 4]
    },
    methods: {
        random() {
            this.keys = [1, 3, 4, 2];
        },
        checkLevel() {
            printLevel(this);
        },
        checkChildren() {
            printChildren(this);
        }
    }
})