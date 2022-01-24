import Query from "../../libs/test-units/query";
import {PageEx} from "../../libs/mp-extend/index";

PageEx({
    ...Query,
    onLoad() {
        console.log(`onLoad p1=${this.p1} p2=${this.p2}`);
    }
});