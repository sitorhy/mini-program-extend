export default {
    mixins: [
        {
            props: {
                base: {
                    type: Number,
                    default: 0
                }
            },
            properties: {
                base: {
                    type: Number,
                    value: 0
                }
            },
            data: function () {
                return {
                    a: 1,
                    timestamp: 0,
                    propThroughNum: 114514
                };
            },
            computed: {
                squarePropThroughNum: {
                    get() {
                        return this.propThroughNum * this.propThroughNum;
                    },
                    set(v) {
                        this.propThroughNum = Math.sqrt(v);
                    }
                },
                doubleBase: function () {
                    return this.base * 2;
                },
                // 仅读取
                aDouble: function () {
                    return this.a * 2
                },
                // 读取和设置（触发器）
                aPlus: {
                    get: function () {
                        return this.a + 1
                    },
                    set: function (v) {
                        this.a = v - 1
                    }
                },
                bPlus: {
                    get() {
                        return 100;
                    }
                },
                cPlus: {
                    get() {
                        return this.bPlus + 200;
                    }
                },
                formatTime: function () {
                    if (!this.timestamp) {
                        return '';
                    }
                    const date = new Date(this.timestamp);
                    return `${date.getFullYear()}年${date.getMonth()}月${date.getDate()}日${date.getHours()}时${date.getMinutes()}分${date.getSeconds()}秒`;
                }
            },
            mounted() {
                console.log(this.aPlus);   // => 2
                this.aPlus = 3;
                console.log(this.aPlus);   // => 3
                console.log(this.a);       // => 2
                console.log(this.aDouble); // => 4
                console.log(this.cPlus);

                this.timer = setInterval(() => {
                    this.timestamp = Date.now();
                }, 1000);
            },
            destroyed() {
                clearInterval(this.timer);
            },
            methods: {
                changePropNum() {
                    this.propThroughNum = 1919;
                },
                changeSquarePropNum() {
                    this.squarePropThroughNum = 144;
                }
            }
        }
    ]
}