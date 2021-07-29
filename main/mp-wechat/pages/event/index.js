import {PageEx} from "../../libs/mp-extend/extend";

PageEx({
    data: {
        keys: [1, 2, 3, 4]
    },
    methods: {
        random() {
            this.keys = [1, 3, 4, 2];
        }
    }
})