import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isPlainObject} from '../utils/common';
import RESERVED_OPTIONS_WORDS from "../utils/options";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

const RTCSign = Symbol('__wxRTC__');

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    getRuntimeContext(thisArg, context, fnSetData) {
        if (Reflect.has(thisArg, RTCSign)) {
            return Reflect.get(thisArg, RTCSign).get(thisArg, context.get('properties'), context.get('computed'), fnSetData);
        }
        return thisArg;
    }

    releaseRuntimeContext(thisArg) {
        if (Reflect.has(thisArg, RTCSign)) {
            Reflect.get(thisArg, RTCSign).release();
            Reflect.deleteProperty(this, RTCSign);
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const createContext = () => {
            return extender.createRuntimeContextSingleton();
        };

        const initContext = (thisArg, fnSetData) => {

            if (!Object.hasOwnProperty.call(thisArg, '$set')) {
                const $set = function (target, propertyName, value) {
                    Reflect.set(target, propertyName, value);
                    return value;
                };

                Object.defineProperty(thisArg, '$set', {
                    configurable: false,
                    enumerable: false,
                    get() {
                        return $set;
                    }
                });
            }

            if (!Object.hasOwnProperty.call(thisArg, '$delete')) {
                const $delete = function (target, propertyName) {
                    Reflect.deleteProperty(target, propertyName);
                };

                Object.defineProperty(thisArg, '$delete', {
                    configurable: false,
                    enumerable: false,
                    get() {
                        return $delete;
                    }
                });
            }

            if (!Object.hasOwnProperty.call(thisArg, '$nextTick')) {
                const $nextTick = function (callback) {
                    if (isFunction(callback)) {
                        wx.nextTick(callback);
                    }
                };

                Object.defineProperty(thisArg, '$nextTick', {
                    configurable: false,
                    enumerable: false,
                    get() {
                        return $nextTick;
                    }
                });
            }

            if (!Object.hasOwnProperty.call(thisArg, '$root')) {
                Object.defineProperty(thisArg, '$root', {
                    configurable: false,
                    enumerable: false,
                    get() {
                        return getCurrentPages().find(p => p['__wxWebviewId__'] === this['__wxWebviewId__']);
                    }
                });
            }

            if (!Object.hasOwnProperty.call(thisArg, '$options')) {
                Object.defineProperty(thisArg, '$options', {
                    configurable: false,
                    enumerable: false,
                    get() {
                        if (options) {
                            return Stream.of(Object.entries(options))
                                .filter(([p]) => !RESERVED_OPTIONS_WORDS.has(p) && !RESERVED_LIFECYCLES_WORDS.has(p))
                                .collect(Collectors.toMap());
                        } else {
                            return {};
                        }
                    }
                });
            }

            return this.getRuntimeContext(thisArg, context, fnSetData);
        };

        const releaseContext = (thisArg) => {
            this.releaseRuntimeContext(thisArg);
        };

        // 必须置顶该 behavior created 最先执行 而 detached 最后执行，使上下文最后释放
        defFields.behaviors = [
            Behavior({
                lifetimes: {
                    created() {
                        Object.defineProperty(this, RTCSign, {
                            configurable: false,
                            enumerable: false,
                            value: createContext(),
                            writable: false
                        });
                        initContext(this, this.setData.bind(this));
                    }
                }
            })
        ].concat(
            (defFields.behaviors || []),
            Behavior({
                lifetimes: {
                    detached() {
                        releaseContext(this);
                    }
                }
            })
        );
    }

    install(extender, context, options) {
        const getContext = (thisArg, fnSetData) => {
            return this.getRuntimeContext(thisArg, context, fnSetData);
        };

        const watch = context.get('watch');

        ['lifetimes', 'pageLifetimes', 'methods', 'observers', 'lifecycle'].forEach(prop => {
            if (context.has(prop) && isPlainObject(context.get(prop))) {
                context.set(prop,
                    Stream.of(Object.entries(context.get(prop)))
                        .filter(([, func]) => isFunction(func))
                        .map(([name, func]) => {
                            return [name, function () {
                                if (isFunction(func)) {
                                    return func.apply(getContext(this), arguments);
                                }
                                return undefined;
                            }];
                        }).collect(Collectors.toMap())
                );
            }
        });

        if (watch) {
            for (const handlers of Object.values(watch)) {
                handlers.forEach(i => {
                    const handler = i.handler;
                    if (isFunction(handler)) {
                        i.handler = function () {
                            handler.apply(getContext(this), arguments);
                        }
                    }
                });
            }
        }

        [...context.keys()]
            .filter(prop => !['data', 'beforeCreate'].includes(prop) && isFunction(context.get(prop)))
            .forEach(prop => {
                context.set(prop, (() => {
                        const func = context.get(prop);
                        return function () {
                            func.apply(getContext(this), arguments);
                        }
                    })()
                );
            });
    }
}