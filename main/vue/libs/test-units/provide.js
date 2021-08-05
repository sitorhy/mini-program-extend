export default {
    props: {
        num: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            num2: 1919,
            timestamp: Date.now()
        };
    },
    methods: {
        updateTime() {
            this.timestamp = Date.now();
        }
    },
    provide() {
        return {
            num: this.num,
            num2: this.num2,
            timestamp: this.timestamp,
            updateTime: this.updateTime
        };
    }
};