// pages/relations/child.js
import {ComponentEx} from "../../libs/mp-extend/index";
import {Child, Child2, Leaf, Parent, Parent2, Top} from "./relations";

ComponentEx({
    behaviors: [Leaf, Child, Child2],
    relations: {
        top: {
            type: "ancestor",
            target: Top,
            linked(t) {
                console.log(`A ${this.is} <= ${t.is}`);
            }
        },
        parent: {
            type: "parent",
            target: Parent,
            linked(t) {
                console.log(`P ${this.is} <= ${t.is}`);
            }
        },
        parent2: {
            type: "parent",
            target: Parent2,
            linked(t) {
                console.log(`P2 ${this.is} <= ${t.is}`);
            }
        }
    }
})
