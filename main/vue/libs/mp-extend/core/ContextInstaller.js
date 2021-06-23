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

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const installer = this;

        Deconstruct(defFields, {
            methods: () => {
                if (isPlainObject(context.get('methods'))) {
                    return Stream.of(Object.entries(context.get('methods')))
                        .map(([name, func]) => {
                            return [name, function () {
                                if (isFunction(func)) {
                                    func.apply(this[RCTSign].get(this, context.get('properties'), context.get('computed')), arguments);
                                }
                            }];
                        }).collect(Collectors.toMap());
                } else {
                    return null;
                }
            },
            behaviors: (o) => {
                return [
                    Behavior({
                        lifetimes: {
                            created() {
                                console.log('created')
                                Object.defineProperty(this, RCTSign, {
                                    configurable: false,
                                    enumerable: false,
                                    value: installer.createRuntimeContextSingleton(),
                                    writable: false
                                });
                                this[RCTSign].get(this, context.get('properties'), context.get('computed'));
                            }
                        }
                    }),
                    ...(o.behaviors || []),
                    Behavior({
                        lifetimes: {
                            detached() {
                                this[RCTSign].release();
                                Reflect.deleteProperty(this, RCTSign);
                                console.log('RCTSign Release')
                            }
                        }
                    })
                ]
            }
        });
    }

    install(extender, context, options) {
        ['lifetimes', 'pageLifetimes'].forEach(prop => {
            if (context.has(prop) && isPlainObject(context.get(prop))) {
                context.set(prop,
                    Stream.of(Object.entries(context.get(prop)))
                        .filter(([, func]) => isFunction(func))
                        .map(([name, func]) => {
                            return [name, function () {
                                func.apply(this[RCTSign].get(this, context.get('properties'), context.get('computed')), arguments);
                            }];
                        }).collect(Collectors.toMap())
                );
            }
        });

        [...context.keys()]
            .filter(i => !['data', 'beforeCreate'].includes(i) && isFunction(context.get(i)))
            .forEach(i => {
                context.set(i, (() => {
                        const func = context.get(i);
                        return function () {
                            func.apply(this[RCTSign].get(this, context.get('properties'), context.get('computed')), arguments);
                        }
                    })()
                );
            });
    }
}