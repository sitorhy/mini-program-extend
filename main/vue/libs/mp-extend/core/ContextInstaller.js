import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isPlainObject} from '../utils/common';
import RESERVED_OPTIONS_WORDS from "../utils/options";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

const RTCSign = Symbol('__wxRTC__');

const LIFECYCLES_WORDS = new Set(RESERVED_LIFECYCLES_WORDS);
const OPTIONS_WORDS = new Set(RESERVED_OPTIONS_WORDS);

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
            return extender.createRuntimeContextSingleton((prop) => {
                return ["$options", "$root"].includes(prop);
            }, (prop, runtimeContext) => {
                switch (prop) {
                    case "$options": {
                        return Stream.of(Object.entries(options))
                            .filter(([p]) => !OPTIONS_WORDS.has(p) && !LIFECYCLES_WORDS.has(p))
                            .collect(Collectors.toMap());
                    }
                    case "$root": {
                        return getCurrentPages().find(p => p['__wxWebviewId__'] === runtimeContext['__wxWebviewId__']);
                    }
                }
                return undefined;
            });
        };

        const initContext = (thisArg, fnSetData) => {
            if (!thisArg.$set) {
                thisArg.$set = function (target, propertyName, value) {
                    Reflect.set(target, propertyName, value);
                    return value;
                }
            }
            if (!thisArg.$delete) {
                thisArg.$delete = function (target, propertyName) {
                    Reflect.deleteProperty(target, propertyName);
                }
            }
            if (!thisArg.$nextTick) {
                thisArg.$nextTick = function (callback) {
                    if (isFunction(callback)) {
                        wx.nextTick(callback);
                    }
                }
            }
            return this.getRuntimeContext(thisArg, context, fnSetData);
        };

        const releaseContext = (thisArg) => {
            this.releaseRuntimeContext(thisArg);
        };

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