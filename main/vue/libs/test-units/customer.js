export default {
    inject: {
        num: {
            from: 'num'
        },
        num2: {
            from: 'num2'
        },
        num3: {
            default() {
                console.log(this.num4);
                return this.num4 || 1919810;
            }
        },
        timestamp: {
            from: 'timestamp'
        },
        updateTime: {
            from: 'updateTime'
        }
    },
    data() {
        console.log('data init');
        return {
            num4: 114514
        };
    },
    methods: {
        update() {
            this.updateTime();
        }
    }
}