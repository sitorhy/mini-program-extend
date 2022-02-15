// pages/relations/parent.js
import {ComponentEx} from "../../libs/mp-extend/index";
import {Child, Parent, Parent2, Child2} from "./relations";

ComponentEx({
    behaviors: [Parent, Parent2],
    relations: {
        child: {
            type: "child",
            target: Child,
            linked(t) {
                console.log(`C ${this.is} <= ${t.is}`);
            }
        },
        child2: {
            type: "child",
            target: Child2,
            linked(t) {
                console.log(`C2 ${this.is} <= ${t.is}`);
            }
        }
    }
})
