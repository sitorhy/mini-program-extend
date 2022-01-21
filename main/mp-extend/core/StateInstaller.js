import OptionInstaller from "./OptionInstaller";

import {Stream, Collectors} from "../libs/Stream";
import {isFunction, removeEmpty} from "../utils/common";
import {Optional} from "../libs/Optional";
import {Singleton} from "../libs/Singleton";
import RESERVED_OPTIONS_WORDS from "../utils/options";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

/**
 * 实例化临时上下文属性和数据，转换为小程序可直接执行的形式
 */
export default class StateInstaller extends OptionInstaller {
    /**
     * 属性初始化不允许调用 methods, 不允许访问 data，可以访问props自身但不允许交叉引用
     * @param extender
     * @param context
     * @param methods
     * @param options
     * @returns {{}} - 规格化后的配置，替换原配置
     */
    attemptToInstantiateProps(extender, context, methods, options) {
        const properties = context.get("properties") || {};
        const $options = Stream.of(Object.entries(options))
            .filter(([p]) => !RESERVED_OPTIONS_WORDS.has(p) && !RESERVED_LIFECYCLES_WORDS.has(p))
            .collect(Collectors.toMap());
        const propertiesInstance = {};

        extender.createPropertiesCompatibleContext(propertiesInstance, properties, $options);

        return Stream.of(Object.entries(properties)).map(([prop, constructor]) => {
            const normalize = {
                type: constructor.type,
                optionalTypes: constructor.optionalTypes,
                observer: constructor.observer,
                value: propertiesInstance[prop]
            };
            return [prop, normalize];
        }).collect(Collectors.toMap());
    }


    /**
     * data 初始化可以访问 props，不允许访问计算属性，不允许访问data自身
     * @param extender
     * @param properties
     * @param methods
     * @param context
     * @param options
     * @returns {{}}
     */
    attemptToInstantiateData(extender, properties, methods, context, options) {
        const data = context.get("data") || {};
        const instData = {};
        if (isFunction(data)) {
            const instanceDataContext = this.createExtensionInitializationContextSingleton(extender, options);
            Object.assign(instData, data.call(
                instanceDataContext.get(
                    null,
                    null,
                    properties,
                    methods
                ))
            );
        } else {
            Object.assign(instData, data);
        }
        return instData;
    }

    attemptToInstantiateState(extender, properties, data, methods, context, options) {
        const keys = new Set(Object.keys(properties));
        Optional.of(Object.keys(data).find(k => keys.has(k))).ifPresent((property) => {
            throw new Error(`The data property "${property}" is already declared as a prop. Use prop default value instead.`);
        });

        const beforeCreate = context.get("beforeCreate");
        if (isFunction(beforeCreate)) {
            beforeCreate.call(
                this.createExtensionInitializationContextSingleton(extender, options).get(
                    options,
                    data,
                    properties,
                    methods
                )
            );
        }

        return Object.assign
        (
            {},
            data,
            Stream.of(Object.entries(properties)).map(([prop, constructor]) => [prop, constructor.value]).collect(Collectors.toMap())
        );
    }

    createExtensionInitializationContextSingleton(extender, options) {
        const contextSingleton = extender.createInitializationContextSingleton();
        return new Singleton((obj, data, properties, methods) => {
            const $options = Stream.of(Object.entries(options))
                .filter(([p]) => !RESERVED_OPTIONS_WORDS.has(p) && !RESERVED_LIFECYCLES_WORDS.has(p))
                .collect(Collectors.toMap());
            return new Proxy(
                contextSingleton.get(obj, data, properties, null, methods), {
                    get(target, p, receiver) {
                        if (p === "$options") {
                            return $options;
                        } else {
                            return Reflect.get(target, p);
                        }
                    }
                }
            );
        });
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const state = context.get("state");
        const properties = Stream.of(Object.entries(context.get("properties")))
            .map(([name, constructor]) => {
                return [name, Object.assign(
                    removeEmpty({
                        type: constructor.type,
                        optionalTypes: constructor.optionalTypes,
                        observer: constructor.observer
                    }),
                    {
                        value: state[name]
                    }
                )];
            })
            .collect(Collectors.toMap());

        const keys = Object.keys(properties);

        const data = Stream.of(Object.entries(state)).filter(([name]) => !keys.includes(name)).collect(Collectors.toMap());

        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior({
                properties,
                data
            })
        ]);
    }

    install(extender, context, options) {
        const methods = context.get("methods");
        const properties = this.attemptToInstantiateProps(extender, context, methods, options);
        const data = this.attemptToInstantiateData(extender, properties, methods, context, options);
        const state = this.attemptToInstantiateState(extender, properties, data, methods, context, options);
        context.set("state", state);
    }
}