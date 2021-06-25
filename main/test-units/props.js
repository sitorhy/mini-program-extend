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
                    type: Object,
                    default() {
                        return {
                            createTime: Date.now()
                        };
                    }
                },
                arr: {
                    type: Array
                },
                name: {
                    type: String,
                    required: true
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
                    default: 24,
                    validator(value) {
                        return value === 24;
                    }
                },
                d: {
                    type: Number,
                    default() {
                        return this.a * this.b;
                    }
                },
                foods: {
                    type: Array,
                    default() {
                        return ["Orange"];
                    }
                }
            },
            data() {
                return {
                    c: this.a + this.b,
                    e: 114514
                };
            },
            mounted() {
                this.e = 1919810;
                console.log(this.e);
                this.foods.push("Apple");
                this.$data.e = 1145141919;

                console.log(this.$props);
                console.log(this.$data);
            }
        }
    ]
}