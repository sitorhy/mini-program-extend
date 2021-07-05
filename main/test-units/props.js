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
                    e: 114514,
                    f: [{
                        num: 114,
                        obj: {
                            num: 514
                        }
                    }, {
                        num: 1919
                    }]
                };
            },
            mounted() {
                this.e = 1919810;
                console.log(`e = ${this.e}`);
                this.foods.push("Apple");
                this.$data.e = 1145141919;

                // 修改数组元素
                this.f[0].num = 1919810;
                this.f[0].obj.num = 114514;

                // 动态添加属性
                this.f[0].obj.num2 = 1919;

                console.log(this.$props);
                console.log(this.$data);
            }
        }
    ]
}