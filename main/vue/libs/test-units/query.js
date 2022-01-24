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
    computed: {
        p4() {
            return 666;
        },
        p5() {
            return this.p4 + 200;
        },
        p6: {
            get() {
                return this.p6Entity;
            },
            set(v) {
                console.log('p6 setter');
                this.p6Entity = v;
            }
        },
        p6Str() {
            return JSON.stringify(this.p6);
        }
    },
    data() {
        return {
            p3: "",
            p6Entity: {a: 100}
        }
    },
    watch: {
        p1: {
            handler: function (v, ov) {
                console.log(`p1 ${ov} => ${v}`);
                this.p3 = this.p2 + " " + this.p1;
            },
            immediate: true // Vue外部属性会覆盖默认值，不会触发
        },
        p2(v, ov) {
            console.log(`p2 ${ov} => ${v}`);
            this.p3 = this.p2 + " " + this.p1;
        }
    },
    mounted() {
        this.p6.a = 999;
    }
}