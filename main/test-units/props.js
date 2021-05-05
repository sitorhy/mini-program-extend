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
                }
            }
        }
    ],
    mounted() {
        console.log("默认值");
    }
}