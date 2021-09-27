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
    data() {
        return {};
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
        }
    },
    mounted() {
        console.log("02 mounted triggered.");
    },
    methods: {
        method_01() {
            console.log(this.createdTime);
        }
    }
}

export const mixins_03 = {
    mounted() {
        console.log("03 mounted triggered.");
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
    }
};