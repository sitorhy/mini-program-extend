export default {
    mixins: [
        {
            props: {
                num: {
                    type: Number
                },
                str: {
                    type: String
                },
                bool: {
                    type: Boolean
                },
                obj: {
                    type: Object
                },
                arr: {
                    type: Array
                },
                name: {
                    type: String,
                    default: "田所浩二"
                },
                a: {
                    type: Number,
                    default: 100
                },
                b: {
                    type: Number,
                    default: 200
                },
                age: {
                    type: Number,
                    default: 23,
                    validator(value) {
                        return value === 24;
                    }
                }
            },
            data() {
                return {
                    c: this.a + this.b
                };
            }
        }
    ],
    mounted: function () {
        console.log("默认值");
        console.log(this.$props);
        console.log(this.$data);
    }
}