import OptionInstaller from "./OptionInstaller";
import EventEmitter from "./EventEmitter";

const EVTSign = Symbol("__wxEVT__");

class EventArgs {
    constructor(originalSource, event, data) {
        Object.defineProperty(this, '_originalSource', {
            enumerable: false,
            configurable: false,
            value: originalSource
        });

        Object.defineProperty(this, '_event', {
            enumerable: false,
            configurable: false,
            value: event
        });

        Object.defineProperty(this, '_data', {
            enumerable: false,
            configurable: false,
            value: data
        });

        Object.defineProperty(this, '_handled', {
            enumerable: false,
            configurable: true,
            value: false
        });
    }

    get handled() {
        return this._handled;
    }

    set handled(value) {
        this._handled = value;
    }

    get originalSource() {
        return this._originalSource;
    }

    get event() {
        return this._event;
    }

    get data() {
        return this._data;
    }
}

export default class EventBusInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            Behavior(
                {
                    created() {
                        Object.defineProperty(this, EVTSign, {
                            configurable: false,
                            enumerable: false,
                            value: new EventEmitter()
                        });

                        if (!Object.hasOwnProperty.call(this, "$emit")) {
                            const $emit = (event, data) => {
                                const e = new EventArgs(this, event, data);
                                let p = this.$parent;
                                while (p) {
                                    const emitter = Reflect.get(p, EVTSign);
                                    emitter.emit(e.event, e);
                                    if (e.handled === true) {
                                        break;
                                    }
                                    p = p.$parent;
                                }
                            };

                            Object.defineProperty(this, "$emit", {
                                configurable: false,
                                enumerable: false,
                                get() {
                                    return $emit;
                                }
                            });
                        }

                        if (!Object.hasOwnProperty.call(this, "$on")) {
                            const $on = (event, callback) => {
                                const emitter = Reflect.get(this, EVTSign);
                                emitter.on(event, callback);
                            };

                            Object.defineProperty(this, "$on", {
                                configurable: false,
                                enumerable: false,
                                get() {
                                    return $on;
                                }
                            });
                        }

                        if (!Object.hasOwnProperty.call(this, "$off")) {
                            const $off = (event, callback) => {
                                const emitter = Reflect.get(this, EVTSign);
                                emitter.off(event, callback);
                            };

                            Object.defineProperty(this, "$off", {
                                configurable: false,
                                enumerable: false,
                                get() {
                                    return $off;
                                }
                            });
                        }

                        if (!Object.hasOwnProperty.call(this, "$once")) {
                            const $once = (event, callback) => {
                                const emitter = Reflect.get(this, EVTSign);
                                emitter.once(event, callback);
                            };

                            Object.defineProperty(this, "$once", {
                                configurable: false,
                                enumerable: false,
                                get() {
                                    return $once;
                                }
                            });
                        }

                        // 扩展方法

                        if (!Object.hasOwnProperty.call(this, "$dispatch")) {
                            const $dispatch = (event, data) => {
                                const targets = [];
                                const e = new EventArgs(this, event, data);
                                let p = this;
                                while (p) {
                                    targets.push(p);
                                    p = p.$parent;
                                }
                                targets.reverse();
                                for (const i of targets) {
                                    const emitter = Reflect.get(i, EVTSign);
                                    emitter.emit(e.event, e);
                                    if (e.handled === true) {
                                        break;
                                    }
                                }
                            };

                            Object.defineProperty(this, "$dispatch", {
                                configurable: false,
                                enumerable: false,
                                get() {
                                    return $dispatch;
                                }
                            });
                        }

                        if (!Object.hasOwnProperty.call(this, "$broadcast")) {
                            function collect() {

                            }

                            const $broadcast = (event, data) => {
                                const e = new EventArgs(this, event, data);
                                const targets = [];

                            };

                            Object.defineProperty(this, "$broadcast", {
                                configurable: false,
                                enumerable: false,
                                get() {
                                    return $broadcast;
                                }
                            });
                        }
                    },
                    detached() {
                        const emitter = Reflect.get(this, EVTSign);
                        if (emitter) {
                            emitter.off();
                        }
                        Reflect.deleteProperty(this, EVTSign);
                    }
                }
            )
        ].concat(defFields.behaviors || []);
    }
}