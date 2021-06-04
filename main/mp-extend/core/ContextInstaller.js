import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isNullOrEmpty} from '../utils/common';
import {Singleton} from "../libs/Singleton";

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    compatibleContext = new Singleton((thisArg, properties) => {
        const runtimeContext = this.createRuntimeCompatibleContext(thisArg);
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

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const compatibleContext = this.compatibleContext;

        const behavior = {
            created: function () {
                Object.entries(
                    Stream.of(
                        Object.entries(context.get('properties') || {})
                    ).filter(i => !isNullOrEmpty(i[1]) && isFunction(i[1].validator)).collect(Collectors.toMap())
                ).forEach(([name, constructor]) => {
                    constructor.validator.call(
                        compatibleContext.get(this, context.get('properties')),
                        compatibleContext.get(this).data[name],
                        undefined
                    );
                });
            }
        };
    }

    install(extender, context, options) {
        const {
            pageLifetimes = {},
            lifetimes = {},
            ...members
        } = options;

        const compatibleContext = this.compatibleContext;
        const methods = context.get('methods') || {};
        const computed = context.get('computed') || {};

        Object.assign(
            options,
            {
                methods: Stream.of(Object.entries(methods)).map(([name, func]) => {
                    return [name, function () {
                        if (isFunction(func)) {
                            func.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    }];
                }).collect(Collectors.toMap()),
                computed: Stream.of(Object.entries(computed)).map(([name, func]) => {
                    return [name, function () {
                        if (isFunction(func)) {
                            func.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    }];
                }).collect(Collectors.toMap())
            },
            {
                pageLifetimes: {
                    show: function () {
                        if (isFunction(pageLifetimes.show)) {
                            pageLifetimes.show.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    },
                    hide: function () {
                        if (isFunction(pageLifetimes.hide)) {
                            pageLifetimes.hide.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    },
                    resize: function (size) {
                        if (isFunction(pageLifetimes.resize)) {
                            pageLifetimes.resize.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    }
                },
                lifetimes: {
                    attached: function () {
                        if (isFunction(lifetimes.attached)) {
                            lifetimes.attached.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    },
                    detached: function () {
                        if (isFunction(lifetimes.detached)) {
                            lifetimes.detached.apply(compatibleContext.get(this, context.get('properties')), arguments);
                        }
                    }
                }
            },
            Stream.of(Object.entries(members)).map(([name, func]) => {
                return [name, function () {
                    if (isFunction(func)) {
                        func.apply(compatibleContext.get(this, context.get('properties')), arguments);
                    }
                }];
            }).collect(Collectors.toMap())
        );
    }
}