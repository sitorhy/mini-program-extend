export const mixins_01 = {
    props: {
        str1: {
            type: String,
            default: '114'
        },
        str2: {
            type: Number,
            default: 514
        },
        str3: {
            type: String,
            default() {
                return this.str1 + this.str2
            }
        }
    },
    watch: {
        a(newVal, oldVal) {
            console.log(`a1 ${oldVal} => ${newVal}`);
        }
    },
    data() {
        return {
            a: 100
        };
    },
    mounted() {
        console.log("01 mounted triggered.");
    },
    methods: {
        method_01() {
            console.log(this.str3);
        }
    }
}

export const mixins_02 = {
    props: {
        createdTime: {
            type: String,
            default() {
                const time = new Date();
                return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
            }
        },
        str1: {
            type: String,
            default: 'test'
        }
    },
    data() {
        return {
            a: 200
        };
    },
    mounted() {
        console.log("02 mounted triggered.");
    },
    mixins: [
        {
            watch: {
                a(newVal, oldVal) {
                    console.log(`a2 ${oldVal} => ${newVal}`);
                }
            },
            methods: {
                method_01() {
                    console.log(this.createdTime);
                }
            }
        }
    ]
}

export const mixins_03 = {
    mounted() {
        console.log("03 mounted triggered.");
    },
    data() {
        return {
            b: 300
        };
    },
    methods: {
        method_03() {
            this.method_01();
        }
    }
}

export const mixins = {
    mixins: [mixins_01, mixins_02, mixins_03],
    created() {
        this.method_03();
    },
    watch: {
        a(newVal, oldVal) {
            console.log(`a3 ${oldVal} => ${newVal}`);
        }
    },
    mounted() {
        console.log((this.$data));
        console.log((this.$props));

        this.a = 999;
    }
};