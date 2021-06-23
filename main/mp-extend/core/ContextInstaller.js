import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isPlainObject} from '../utils/common';
import {Singleton} from "../libs/Singleton";
import {Deconstruct} from "../libs/Deconstruct";

const RCTSign = Symbol('__wxRCT__');

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    createRuntimeContextSingleton() {
        return new Singleton((thisArg, properties, computed) => {
            const runtimeContext = this.createRuntimeCompatibleContext(thisArg, computed);
            const props = Object.keys(properties || {});
            return new Proxy(runtimeContext, {
                get(target, p, receiver) {
                    if (p === '$props') {
                        return Stream.of(
                            Object.entries(Reflect.get(target, 'data'))
                        ).filter(([name]) => props.includes(name)).collect(Collectors.toMap());
                    }
                    if (p === '$data') {
                        return Stream.of(
                            Object.entries(Reflect.get(target, 'data'))
                        ).filter(([name]) => !props.includes(name)).collect(Collectors.toMap());
                    }
                    return Reflect.get(target, p, receiver);
                }
            });
        });
    }

    getRuntimeContext(thisArg, context) {
        if (thisArg[RCTSign]) {
            return thisArg[RCTSign].get(thisArg, context.get('properties'), context.get('computed'));
        }
        return thisArg;
    }

    releaseRuntimeContext(thisArg) {
        if (thisArg[RCTSign]) {
            thisArg[RCTSign].release();
            Reflect.deleteProperty(this, RCTSign);
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const getContext = (thisArg) => {
            return this.getRuntimeContext(thisArg, context);
        };

        const createContext = () => {
            return this.createRuntimeContextSingleton();
        };

        const releaseContext = (thisArg) => {
            this.releaseRuntimeContext(thisArg);
        };

        defFields.behaviors = [
            Behavior({
                lifetimes: {
                    created() {
                        Object.defineProperty(this, RCTSign, {
                            configurable: false,
                            enumerable: false,
                            value: createContext(),
                            writable: false
                        });
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
        const getContext = (thisArg) => {
            return this.getRuntimeContext(thisArg, context);
        };

        ['lifetimes', 'pageLifetimes', 'methods'].forEach(prop => {
            if (context.has(prop) && isPlainObject(context.get(prop))) {
                context.set(prop,
                    Stream.of(Object.entries(context.get(prop)))
                        .filter(([, func]) => isFunction(func))
                        .map(([name, func]) => {
                            return [name, function () {
                                func.apply(getContext(this), arguments);
                            }];
                        }).collect(Collectors.toMap())
                );
            }
        });

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