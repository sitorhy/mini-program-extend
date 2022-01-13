// pages/computed/changePropNum.js
import {ComponentEx} from "../../libs/mp-extend/index";

ComponentEx({
    props: {
        propThroughNum: {
            type: Number,
            default: 0
        }
    },
    computed: {
        doubleNum() {
            return this.propThroughNum * 2;
        }
    }
})
