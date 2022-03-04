import {PageEx} from "../../libs/mp-extend/index";
import {mapGetters} from "../../libs/mp-extend/store";

PageEx({
    computed: {
        ...mapGetters(["boxColor"]),
        boxStyle() {
            console.log('page 1 box color change');
            return `background:${this.boxColor};width:200rpx;height:200rpx;margin:auto;`
        }
    }
})