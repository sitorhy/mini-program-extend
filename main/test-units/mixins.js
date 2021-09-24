export default {
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
        return {

        };
    }
}