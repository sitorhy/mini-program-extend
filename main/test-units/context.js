export function randomNumber(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}

function beforeCreate() {
    this.p3.a = 999;
    this.p3 = {a: 1000};
    this.p3.a++;
    this.p3.a++;
    this.push();
    this.push();
    this.pop();
}

const common = {
    staticData: 100,
    computed: {
        p1() {
            return 666;
        },
        p2() {
            return this.p1 + 200;
        },
        p3: {
            get() {
                this.p3RefreshTime++;
                return this.p4;
            },
            set(v) {
                this.p4 = v;
            }
        },
        p5() {
            return JSON.stringify(this.p3);
        },
        p5History() {
            this.arr.push(this.p5);
            return this.arr;
        }
    },
    data() {
        return {
            p4: {
                a: 100
            },
            p3RefreshTime: 0,
            arr: [],
            arrayObserver: [],
            objectArray: [
                {
                    num: 57
                },
                {
                    num: 257
                },
                {
                    num: 959.5
                },
                {
                    num: 405
                }
            ]
        };
    },
    methods: {
        test() {
            if (typeof wx === "undefined") {
                console.log(this)
            } else {
                console.log(this.data)
            }
        },
        push() {
            this.arrayObserver.push(randomNumber(1, 100));
        },
        pop() {
            this.arrayObserver.pop();
        },
        doubleObjectArray() {
            const mid = Math.floor(this.objectArray.length / 2);
            /*
            this.objectArray.forEach(i => {
                i.num *= 2;
            });*/
            this.objectArray.slice(0, mid).forEach(i => {
                i.num *= 2;
            });
            for (let i = mid; i < this.objectArray.length; ++i) {
                this.objectArray[i].num *= 2;
            }
        },
        reverseObjectArray() {
            this.objectArray.reverse();
        },
        resetObjectArray() {
            this.objectArray = [
                {
                    num: 57
                },
                {
                    num: 257
                },
                {
                    num: 959.5
                },
                {
                    num: 405
                }
            ];
        },
        destructObjectArray() {
            this.objectArray = [...this.objectArray];
        }
    },
};

export const compatibleContext = {
    ...common,
    ...typeof wx === "undefined" ? {
        mounted: beforeCreate
    } : {beforeCreate}
};

export const runtimeContext = {
    ...common,
    mounted: beforeCreate
};