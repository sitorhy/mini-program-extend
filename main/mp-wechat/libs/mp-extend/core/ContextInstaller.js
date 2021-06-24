import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isPlainObject} from '../utils/common';

const RTCSign = Symbol('__wxRTC__');

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    getRuntimeContext(thisArg, context) {
        if (Reflect.has(thisArg, RTCSign)) {
            return Reflect.get(thisArg, RTCSign).get(thisArg, context.get('properties'));
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
            return this.createRuntimeContextSingleton();
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
        context.set('originalMethods', context.get('methods'));
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