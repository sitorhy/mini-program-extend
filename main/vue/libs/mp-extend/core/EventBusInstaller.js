import OptionInstaller from "./OptionInstaller";
import EventEmitter from "../libs/EventEmitter";

const EVTSign = Symbol("__wxEVT__");

const OriginalSourceSign = Symbol("_originalSource");
const SourceSign = Symbol("_source");
const EventSign = Symbol("_event");
const DataSign = Symbol("_data");
const HandledSign = Symbol("_handled");

class EventArgs {
    constructor(originalSource, event, data) {
        Object.defineProperty(this, OriginalSourceSign, {
            enumerable: false,
            configurable: false,
            value: originalSource
        });

        Object.defineProperty(this, SourceSign, {
            enumerable: false,
            configurable: false,
            writable: true,
            value: null
        });

        Object.defineProperty(this, EventSign, {
            enumerable: false,
            configurable: false,
            value: event
        });

        Object.defineProperty(this, DataSign, {
            enumerable: false,
            configurable: false,
            value: data
        });
    }

    get originalSource() {
        return Reflect.get(this, OriginalSourceSign);
    }

    get event() {
        return Reflect.get(this, EventSign);
    }

    get data() {
        return Reflect.get(this, DataSign);
    }

    get source() {
        return Reflect.get(this, SourceSign);
    }

    set source(value) {
        Reflect.set(this, SourceSign, value);
    }
}

class RoutedEventArgs extends EventArgs {
    constructor(originalSource, event, data) {
        super(originalSource, event, data);
        Object.defineProperty(this, HandledSign, {
            enumerable: false,
            configurable: true,
            value: false,
            writable: true
        });
    }

    get handled() {
        return Reflect.get(this, HandledSign);
    }

    set handled(value) {
        Reflect.set(this, HandledSign, value);
    }
}

const BusInstallBehavior = Behavior({
    created() {
        Object.defineProperty(this, EVTSign, {
            configurable: false,
            enumerable: false,
            value: new EventEmitter()
        });

        if (!Object.hasOwnProperty.call(this, "$emit")) {
            const $emit = (event, data) => {
                const e = new RoutedEventArgs(this, event, data);
                let p = this;
                while (p) {
                    const emitter = Reflect.get(p, EVTSign);
                    if (emitter) {
                        emitter.emit(e.event, e);
                        if (e.handled === true) {
                            break;
                        }
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
                if (emitter) {
                    emitter.on(event, callback);
                }
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
                if (emitter) {
                    emitter.off(event, callback);
                }
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
                if (emitter) {
                    emitter.once(event, callback);
                }
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
                const e = new RoutedEventArgs(this, event, data);
                let p = this;
                while (p) {
                    targets.push(p);
                    p = p.$parent;
                }
                targets.reverse();
                for (const i of targets) {
                    const emitter = Reflect.get(i, EVTSign);
                    if (emitter) {
                        emitter.emit(e.event, e);
                        if (e.handled === true) {
                            break;
                        }
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
            const $broadcast = (event, data) => {
                const e = new EventArgs(this, event, data);

                let s = this;
                while (s.$parent) {
                    s = s.$parent;
                }

                const q = [s];
                const targets = [];
                while (q.length) {
                    const c = q.pop();
                    if (c !== this) {
                        targets.push(c);
                    }
                    if (Array.isArray(c["$children"]) && c["$children"].length) {
                        Array.prototype.push.apply(q, c["$children"]);
                    }
                }
                targets.forEach(i => {
                    const emitter = Reflect.get(i, EVTSign);
                    if (emitter) {
                        emitter.emit(e.event, e);
                    }
                });
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
});

export default class EventBusInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [BusInstallBehavior].concat(defFields.behaviors || []);
    }
}