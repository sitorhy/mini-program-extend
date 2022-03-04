import {PageEx} from "../../../libs/mp-extend/index";
import {mapGetters, mapActions} from "../../../libs/mp-extend/store";

PageEx({
    computed: {
        ...mapGetters(["boxColor"]),
        boxStyle() {
            console.log('page 2 box color change');
            return `background:${this.boxColor};width:200rpx;height:200rpx;margin:auto;`
        }
    },
    methods: {
        ...mapActions(["setBoxColor"]),
        changeColor(e) {
            const color = e.currentTarget.dataset.color;
            this.setBoxColor(color);
        }
    }
})