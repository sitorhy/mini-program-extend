import OptionInstaller from "./OptionInstaller";
import EventEmitter from "./EventEmitter";

const EVTSign = Symbol("__wxEVT__");

export default class EventBusInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            Behavior(
                {
                    created() {
                        const emitter = new EventEmitter();

                        Object.defineProperty(this, EVTSign, {
                            configurable: false,
                            enumerable: false,
                            value: emitter
                        });

                        if (!Object.hasOwnProperty.call(this, "$emit")) {
                            const $emit = (event, data, retainOption) => {
                                return emitter.emit(event, data, retainOption);
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
                                return emitter.on(event, callback);
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
                                return emitter.off(event, callback);
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
                                return emitter.once(event, callback);
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