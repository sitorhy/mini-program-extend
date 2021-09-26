export const mixins_01 = {
    properties: {
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
        console.log("mounted triggered.");
    }
}

export const mixins_02 = {
    mounted() {
        console.log(this.is);
    }
}

export const mixins_03 = {
    mounted() {
        console.log(this.is);
    }
}