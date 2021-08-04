import OptionInstaller from "./OptionInstaller";
import EventEmitter from "./EventEmitter";

const EVTSign = Symbol("__wxEVT__");

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
                            const $emit = (event, data, options) => {
                                let p = this.$parent;
                                while (p) {
                                    const emitter = Reflect.get(p, EVTSign);
                                    emitter.emit(event, data);
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