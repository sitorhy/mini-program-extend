import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isPlainObject} from '../utils/common';
import {Singleton} from "../libs/Singleton";

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    lifetimes(extender, context, options) {
        return {
            detached: () => {
                this.compatibleContext.release();
                console.log('detached custom')
            }
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const compatibleContext = this.compatibleContext;

        if (isPlainObject(context.get('methods'))) {
            Object.assign(defFields, {
                methods: Stream.of(Object.entries(context.get('methods')))
                    .map(([name, func]) => {
                        return [name, function () {
                            if (isFunction(func)) {
                                func.apply(compatibleContext.get(this, context.get('properties'), context.get('computed')), arguments);
                            }
                        }];
                    }).collect(Collectors.toMap()),
                behaviors: [
                    Behavior({
                        lifetimes: {
                            created() {
                                console.log(this)
                            }
                        }
                    }),
                    ...(defFields.behaviors || []),
                    Behavior({
                        lifetimes: {
                            detached() {
                                console.log('销毁测试');
                            }
                        }
                    })
                ]
            });
        }
    }

    install(extender, context, options) {
        const compatibleContext = this.compatibleContext;

        ['lifetimes', 'pageLifetimes'].forEach(prop => {
            if (context.has(prop) && isPlainObject(context.get(prop))) {
                context.set(prop,
                    Stream.of(Object.entries(context.get(prop)))
                        .filter(([, func]) => isFunction(func))
                        .map(([name, func]) => {
                            return [name, function () {
                                func.apply(compatibleContext.get(this, context.get('properties'), context.get('computed')), arguments);
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
                            func.apply(compatibleContext.get(this, context.get('properties'), context.get('computed')), arguments);
                        }
                    })()
                );
            });
    }
}