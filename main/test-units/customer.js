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
                console.log('inject init');
                return this.num4 || 1919810;
            }
        },
        // Injection "num5" not found
        /*
        num5: {
            from: 'num5'
        },*/


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
            num4: 810
        };
    },
    methods: {
        update() {
            this.timestamp = Date.now();
            this.updateTime();
        }
    }
}