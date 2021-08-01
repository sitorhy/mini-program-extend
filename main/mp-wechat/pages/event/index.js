import {PageEx} from "../../libs/mp-extend/extend";
import {printChildren, printLevel} from "./behaviors";

PageEx({
    data: {
        keys: [1, 2, 3, 4]
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