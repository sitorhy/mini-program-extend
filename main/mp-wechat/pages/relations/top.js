// pages/relations/top.js
import {ComponentEx} from "../../libs/mp-extend/index";
import {Leaf, Top} from "./relations";

ComponentEx({
    behaviors: [Top],
    relations: {
        leaf: {
            type: "descendant",
            target: Leaf,
            linked(t) {
                console.log(`D ${this.is} <= ${t.is}`);
            }
        }
    }
})
