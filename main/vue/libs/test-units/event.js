export default {
    mounted() {
        this.$on('self', () => {
            console.log(this.is || this.$options._componentTag);
        });
    },
    methods: {
        onSendEvent() {
            this.$emit('self');
        },
        onReceiveEvent() {

        }
    }
}