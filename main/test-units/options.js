export default {
    customOption: 'custom data',
    customNum: 57257,
    props: {
        str: {
            type: String,
            default() {
                return this.$options.customOption;
            }
        }
    },
    data() {
        return {
            num: this.$options.customNum * 2
        }
    },
    mounted() {
        console.log(this.$options.customOption);
        console.log(this.$options.customNum);
    }
};