import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {Invocation} from '../libs/Invocation';
import {isPlainObject, isFunction, removeEmpty} from '../utils/common';

/**
 * 转换属性定义为小程序格式
 * 默认值为生成函数时，一律转为 default:Function
 *
 * Page启动参数的值会自动注入到属性中
 * /page?id=110，id会注入到value中，并触发并触发observer
 *
 * observer初始化时不会触发，只有再值变化时触发
 * validator针对当前值，因此初始化会触发一次
 */
export default class PropertiesInstaller extends OptionInstaller {
    lifetimes(extender, context, options) {
        const properties = context.get('properties');
        return {
            attached() {
                Object.entries(properties).filter(([, config]) => {
                    return isFunction(config.validator);
                }).forEach(([prop, constructor]) => {
                    constructor.validator.apply(this, [this.data[prop]]);
                });
            }
        };
    }

    install(extender, context, options) {
        const props = Object.assign.apply(
            undefined,
            [
                {},
                ...(extender.installers.map(i => i.properties())),
                options.props,
                options.properties
            ]
        );
        const properties = Stream.of(Object.entries(props)).map(function ([name, constructor]) {
            if (constructor === Number) {
                return [name, {
                    type: Number,
                    value: 0
                }];
            } else if (constructor === String) {
                return [name, {
                    type: String,
                    value: ''
                }];
            } else if (constructor === Boolean) {
                return [name, {
                    type: Boolean,
                    value: false
                }];
            } else if (constructor === Array) {
                return [name, {
                    type: Array,
                    value: []
                }];
            } else if (constructor === Object) {
                return [name, {
                    type: Object,
                    value: null
                }];
            } else if (constructor === null) {
                return [name, {
                    type: null,
                    value: null
                }];
            } else if (isPlainObject(constructor)) {
                const config = Object.assign({}, {
                        type: Array.isArray(constructor.type) ? (constructor.type[0] || null) : (constructor.type || Object)
                    },
                    removeEmpty({
                        optionalTypes: Array.isArray(constructor.type) ? [...constructor.type].concat(
                            Array.isArray(constructor.optionalTypes) ? (constructor.optionalTypes) : []
                        ) : (Array.isArray(constructor.optionalTypes) ? [...constructor.optionalTypes] : null)
                    }),
                    !Object.hasOwnProperty.call(constructor, 'value') ?
                        (
                            Object.hasOwnProperty.call(constructor, 'default') ?
                                (isFunction(constructor['default']) ? {'default': constructor['default']} : {value: constructor['default']}) : (
                                    [Number, String, Boolean, Array].includes(constructor.type) ? {
                                        value: constructor.type.call(undefined).valueOf()
                                    } : (
                                        Object === constructor.type ? {value: null} : null
                                    )
                                )
                        ) : (isFunction(constructor.value) ? {'default': constructor.value} : {value: constructor.value})
                );
                if (isFunction(constructor.observer) || isFunction(constructor.validator) || constructor.required === true) {
                    Object.assign(config, {
                        required: constructor.required,
                        validator: (function () {
                            const prop = name.toString();
                            const required = constructor.required;
                            const validator = constructor.validator;
                            return function (newVal, oldVal) {
                                if (required === true) {
                                    if (newVal === null || newVal === undefined || newVal === '') {
                                        console.warn(`Missing required prop: "${prop}"`);
                                        return;
                                    }
                                }
                                if (isFunction(validator)) {
                                    if (!validator.call(this, newVal, oldVal)) {
                                        console.warn(`${this.is}: custom validator failed for prop '${prop}'`);
                                    }
                                }
                            };
                        })(),
                        observer: Invocation(
                            constructor.observer,
                            function (newVal, oldVal) {
                                config.validator.call(this, newVal, oldVal);
                            }
                        )
                    });
                }
                return [name, config];
            } else {
                throw new Error(`Bad type definition ${constructor ? (constructor.name || constructor.toString()) : constructor} for ${constructor}`);
            }
        }).collect(Collectors.toMap());

        context.set('properties', Object.assign({}, properties));
    }
}