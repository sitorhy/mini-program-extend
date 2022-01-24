export default {
    props: {
        p1: {
            type: Number,
            default: 0
        },
        p2: {
            type: String,
            default: "str"
        }
    },
    watch: {
        p1(v, ov) {
            console.log(`p1 ${ov} => ${v}`);
        },
        p2(v, ov) {
            console.log(`p2 ${ov} => ${v}`);
        }
    }
}