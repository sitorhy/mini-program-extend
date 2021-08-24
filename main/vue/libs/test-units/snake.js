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
            playing: true
        };
    },
    computed: {
        backgroundStyle() {
            const {width, height, backgroundColor} = this;
            return `width:${width}px;height:${height}px;background-color: ${backgroundColor};`
        }
    },
    mounted() {
        this.storeContext().then(context => {
            this.__canvasContext = context;
            this.start();
        });
    },
    methods: {
        storeContext() {
            return new Promise(resolve => {
                if (typeof getApp === "undefined") {
                    const context = document.getElementById('canvas').getContext('2d');
                    context.translate(0.5, 0.5);
                    resolve(context);
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
                            ctx.scale(dpr, dpr)

                            resolve(ctx);
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
            const context = this.getContext();
            context.save();

            this.timer = setInterval(() => {
                this.clean(context);

                this.beginPaint(context);
                this.drawBackground(context);
                this.drawFood(context);
                this.nextBody(this.direction[0], this.direction[1], false);

                if (this.checkHitWall()) {
                    this.end('撞墙');
                    clearInterval(this.timer);
                    return;
                }

                if (this.checkEatSelf()) {
                    this.end('打结');
                    clearInterval(this.timer);
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
                        clearInterval(this.timer);
                    }
                }
            }, this.speed);
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

            for (let i = this.body.length - 1; i > 0; --i) {
                this.body[i][0] = this.body[i - 1][0];
                this.body[i][1] = this.body[i - 1][1];
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
            this.body[0][0] = nextX;
            this.body[0][1] = nextY;
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
            clearInterval(this.timer);
            this.timer = null;
        }
    },
    destroyed() {
        this.stop();
        this.__canvasContext = null;
    }
};