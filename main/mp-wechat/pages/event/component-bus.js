import {ComponentEx} from "../../libs/mp-extend/extend";
import {printChildren, printLevel} from "./behaviors";

ComponentEx({
    properties: {},
    data: {},
    methods: {
        checkLevel() {
            printLevel(this);
        },
        checkChildren() {
            printChildren(this);
        }
    }
});