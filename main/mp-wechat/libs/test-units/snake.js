/**
 * 贪吃蛇测试DEMO
 *
 * 注：
 * 小程序BUG（性能极差）：小程序的Canvas会越用越卡，不断触发重绘（60次左右）会引发严重卡顿
 *
 */

/**
 * min <= x < max
 * @param min
 * @param max
 * @returns {*}
 */
function randomNum(min, max) {
    const range = max - min;
    const rand = Math.random();
    return min + Math.floor(rand * range);
}

export default {
    props: {
        size: {
            type: Number,
            default: 15
        },
        width: {
            type: Number,
            default: 300
        },
        height: {
            type: Number,
            default: 300
        },
        backgroundColor: {
            type: String,
            default: '#aeb797'
        },
        color: {
            type: String,
            default: '#000'
        },
        bodyInitLength: {
            type: Number,
            default: 3
        },
        bodyPadding: {
            type: Number,
            default: 2
        },
        speed: {
            type: Number,
            default: 1000
        }
    },
    data() {
        const {width, height, size, bodyInitLength} = this;
        const cx = parseInt(width / size);
        const cy = parseInt(height / size);
        const body = [];
        for (let i = 0; i < bodyInitLength; ++i) {
            body.unshift([parseInt(cx / 2), parseInt(cy / 2) - i]);
        }
        const food = this.nextFood(body);
        return {
            body,
            food,
            direction: [0, -1],
            playing: true,

            mp_canvas_rebuild: true,
            mp_draw_time: 0 // 强制小程序重建 Canvas 防止卡顿
        };
    },
    computed: {
        backgroundStyle() {
            const {width, height, backgroundColor} = this;
            return `width:${width}px; height:${height}px; background-color:${backgroundColor};`
        }
    },
    mounted() {
        this.storeContext().then(({context, canvas}) => {
            this.__canvasContext = context;
            this.__canvas = canvas;
            this.start();
        });
    },
    methods: {
        storeContext() {
            return new Promise(resolve => {
                if (typeof getApp === "undefined") {
                    const context = document.getElementById('canvas').getContext('2d');
                    context.translate(0.5, 0.5);
                    resolve({
                        context,
                        canvas: null
                    });
                } else {
                    wx.createSelectorQuery()
                        .in(this)
                        .select('#canvas')
                        .fields({
                            node: true,
                            size: true
                        }).exec(res => {
                            const canvas = res[0].node
                            const ctx = canvas.getContext('2d');

                            const dpr = wx.getSystemInfoSync().pixelRatio;
                            canvas.width = res[0].width * dpr;
                            canvas.height = res[0].height * dpr;
                            ctx.scale(dpr, dpr);

                            resolve({
                                context: ctx,
                                canvas
                            });
                        }
                    );
                }
            });
        },

        /**
         * @returns {CanvasRenderingContext2D}
         */
        getContext() {
            return this.__canvasContext;
        },

        beginPaint(context) {
            context.save();
        },

        endPaint(context) {
            context.restore();
        },

        start() {
            const handler = (finish) => {
                const context = this.getContext();
                context.save();

                this.clean(context);
                this.beginPaint(context);
                this.drawBackground(context);
                this.drawFood(context);
                this.nextBody(this.direction[0], this.direction[1], false);
                if (this.checkHitWall()) {
                    this.end('撞墙');
                    return;
                }

                if (this.checkEatSelf()) {
                    this.end('打结');
                    return;
                }

                this.drawBody(context);
                this.endPaint(context);

                if (this.checkEating()) {
                    this.body.unshift([...this.food]);
                    try {
                        this.food = this.nextFood(this.body);
                    } catch (e) {
                        this.end(e.message);
                    }
                }

                if (typeof finish === "function") {
                    finish();
                }
            };

            const reqAF = window && window.requestAnimationFrame || this.__canvas.requestAnimationFrame;
            const requestAnimationFrame = (callback) => {
                this.reqFlag = reqAF(callback);
            };

            let last;
            const step = (timestamp) => {
                if (!this.playing || !this.getContext()) {
                    return;
                }
                if (last === undefined) {
                    last = timestamp;
                    requestAnimationFrame(step);
                    return;
                }
                const elapsed = timestamp - last;

                if (elapsed > this.speed) { // 在两秒后停止动画
                    last = timestamp;
                    handler(() => {
                        if (typeof getApp === "undefined") {
                            requestAnimationFrame(step);
                        } else {
                            if (this.mp_draw_time + 1 >= 60) {
                                this.mp_draw_time = 0;
                                this.mp_canvas_rebuild = false;
                                this.playing = false;
                                last = undefined;
                                this.$nextTick(() => {
                                    this.mp_canvas_rebuild = true;
                                    this.storeContext().then(({context, canvas}) => {
                                        this.__canvasContext = context;
                                        this.__canvas = canvas;
                                        setTimeout(() => {
                                            this.playing = true;
                                            requestAnimationFrame(step);
                                        }, 3000);
                                    });
                                });
                            } else {
                                this.mp_draw_time++;
                                requestAnimationFrame(step);
                            }
                        }
                    });
                } else {
                    requestAnimationFrame(step);
                }
            };

            requestAnimationFrame(step);
        },

        end(text) {
            const {width, height} = this;
            const fontSize = 48;
            const context = this.getContext();
            this.clean(context);
            context.save();

            context.font = `${fontSize}px serif`;
            context.textAlign = 'center';
            context.fillText(text, width / 2, height / 2);

            context.restore();

            this.playing = false;
        },

        replay() {
            if (!this.playing) {
                const {width, height, size, bodyInitLength} = this;
                const cx = parseInt(width / size);
                const cy = parseInt(height / size);

                const body = [];
                for (let i = 0; i < bodyInitLength; ++i) {
                    body.unshift([parseInt(cx / 2), parseInt(cy / 2) - i]);
                }
                const food = this.nextFood(body);
                this.body = body;
                this.food = food;
                this.direction = [0, -1];

                this.playing = true;
                this.start();
            }
        },

        /**
         * @param deltaX
         * @param deltaY
         * @param allowReset - 允许超出边缘后后重置坐标
         */
        nextBody(deltaX, deltaY, allowReset = true) {
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            const nextBody = [];

            for (let i = this.body.length - 1; i > 0; --i) {
                // 相当于 this.body[i][j]=this.body[i-1][j]; 小程序会多次触发setData
                nextBody.unshift([this.body[i - 1][0], this.body[i - 1][1]]);
            }

            let nextX = (this.body[0][0] + deltaX);
            let nextY = (this.body[0][1] + deltaY);

            if (allowReset) {
                if (nextY < 0) {
                    nextY = cy - 1;
                }
                if (nextY >= cy) {
                    nextY = 0;
                }
                if (nextX < 0) {
                    nextX = cx - 1;
                }
                if (nextX >= cy) {
                    nextX = 0;
                }
            }

            nextBody.unshift([nextX, nextY]);

            this.body = nextBody;
        },

        nextFood(body) {
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            let x, y;
            for (let i = 0; i < 10; ++i) {
                x = randomNum(0, cx);
                y = randomNum(0, cy);
                if (!body.some(([x1, y1]) => x1 === x && y1 === y)) {
                    return [x, y];
                }
            }

            throw new Error("压力马斯内");
        },

        checkEating() {
            const hx = this.body[0][0];
            const hy = this.body[0][1];
            const x = this.food[0];
            const y = this.food[1];
            if ([
                [x + 1, y],
                [x - 1, y],
                [x, y + 1],
                [x, y - 1]
            ].some(([fx, fy]) => fx === hx && fy === hy)) {
                return true;
            }
            return false;
        },

        /**
         * 检查撞墙
         */
        checkHitWall() {
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            const hx = this.body[0][0];
            const hy = this.body[0][1];

            if (hx < 0 || hx >= cx || hy < 0 || hy >= cy) {
                return true;
            }
            return false;
        },

        /**
         * 检查打结
         */
        checkEatSelf() {
            const hx = this.body[0][0];
            const hy = this.body[0][1];

            for (let i = 1; i < this.body.length; ++i) {
                if (this.body[i][0] === hx && this.body[i][1] === hy) {
                    return true;
                }
            }
            return false;
        },


        /**
         * @param {CanvasRenderingContext2D} context
         */
        clean(context) {
            const {width, height} = this;
            context.clearRect(0, 0, width, height);
        },

        /**
         * @param {CanvasRenderingContext2D} context
         */
        drawBody(context) {
            context.save();
            const {size, bodyPadding} = this;

            this.body.forEach(([x, y]) => {
                context.fillRect(
                    x * size + bodyPadding,
                    y * size + bodyPadding,
                    size - bodyPadding * 2,
                    size - bodyPadding * 2
                );
            });
            context.restore();
        },

        /**
         * @param {CanvasRenderingContext2D} context
         */
        drawFood(context) {
            context.save();
            const {size, bodyPadding} = this;
            context.fillStyle = '#FF0000';
            context.fillRect(
                this.food[0] * size + bodyPadding,
                this.food[1] * size + bodyPadding,
                size - bodyPadding * 2,
                size - bodyPadding * 2
            );
            context.restore();
        },

        /**
         * @param {CanvasRenderingContext2D} context
         */
        drawBackground(context) {
            context.save();
            const {width, height, size} = this;
            const cx = parseInt(width / size);
            const cy = parseInt(height / size);

            context.strokeStyle = this.color;
            context.lineWidth = 1;
            for (let i = 1; i < cx; ++i) {
                context.moveTo(i * size, 0);
                context.lineTo(i * size, height);
                context.stroke();
            }
            for (let i = 1; i < cy; ++i) {
                context.moveTo(0, i * size);
                context.lineTo(width, i * size);
                context.stroke();
            }
            context.strokeRect(0, 0, width, height);
            context.restore();
        },

        /**
         * 检查转向是否与自身冲突
         * @param deltaX
         * @param deltaY
         * @returns {boolean}
         */
        validateDirection(deltaX, deltaY) {
            const nextX = this.body[0][0] + deltaX;
            const nextY = this.body[0][1] + deltaY;
            if (this.body.some(([x, y]) => x === nextX && y === nextY)) {
                return false;
            }
            return true;
        },
        onUp() {
            if (this.validateDirection(0, -1)) {
                this.direction = [0, -1];
            }
        },
        onDown() {
            if (this.validateDirection(0, 1)) {
                this.direction = [0, 1];
            }
        },
        onLeft() {
            if (this.validateDirection(-1, 0)) {
                this.direction = [-1, 0];
            }
        },
        onRight() {
            if (this.validateDirection(1, 0)) {
                this.direction = [1, 0];
            }
        },

        stop() {
            (
                window && window.cancelAnimationFrame || this.__canvas.cancelAnimationFrame
            )(this.reqFlag);
        }
    },
    destroyed() {
        this.stop();
        this.__canvasContext = null;
        this.__canvas = null;
    }
};