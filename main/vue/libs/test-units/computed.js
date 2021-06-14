export default {
    mixins: [
        {
            data: function () {
                return {
                    a: 1
                };
            },
            computed: {
                // 仅读取
                aDouble: function () {
                    return this.a * 2
                },
                // 读取和设置
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
                }
            },
            mounted() {
                console.log(this.aPlus);   // => 2
                this.aPlus = 3;
                console.log(this.aPlus);   // => 3
                console.log(this.a);       // => 2
                console.log(this.aDouble); // => 4

                console.log(this.cPlus);

            }
        }
    ]
}