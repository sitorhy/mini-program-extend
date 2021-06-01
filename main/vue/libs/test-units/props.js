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
                str1: {
                    type: String,
                    default: "田所"
                }
            }
        }
    ],
    mounted: function () {
        console.log("默认值");
        console.log(this.$props);
        console.log(this.$data);
    }
}