import {ComponentEx} from "../../../libs/mp-extend/index";
import {createNamespacedHelpers} from "../../../libs/mp-extend/store";

const {
    mapActions,
    mapGetters
} = createNamespacedHelpers("task");

ComponentEx({
    computed: {
        ...mapGetters({
            txt1: "text1",
            txt2: "text2"
        })
    },
    methods: {
        ...mapActions(["asyncTask", "throwTest", "throwTest2", "throwTest3", "rejectTest"])
    }
})
