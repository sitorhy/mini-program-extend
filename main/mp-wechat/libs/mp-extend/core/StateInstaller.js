import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isPlainObject, isPrimitive, removeEmpty} from '../utils/common';
import {Optional} from "../libs/Optional";

/**
 * 实例化临时上下文属性和数据，转换为小程序可直接执行的形式
 */
export default class StateInstaller extends OptionInstaller {
    /**
     * 属性初始化不允许调用 methods, 不允许访问 data，可以访问props自身
     * @param extender
     * @param context
     * @param methods
     * @param options
     * @returns {{}}
     */
    attemptToInstantiateProps(extender, context, methods, options) {
        const properties = context.get('properties') || {};
        const props = {};

        const computedProps = Stream.of(Object.entries(properties))
            .filter(([, constructor]) => isPlainObject(constructor) && isFunction(constructor['default']))
            .map(([name]) => name)
            .collect(Collectors.toSet());

        const instanceProps = Stream.of(Object.entries(properties))
            .filter(([, constructor]) => (
                isPlainObject(constructor) && !isFunction(constructor['default']))
                || isFunction(constructor)
                || constructor === null
            )
            .map(([name, constructor]) => {
                if (constructor === null) {
                    props[name] = null;
                } else if (isFunction(constructor)) {
                    props[name] = constructor;
                } else {
                    const prop = removeEmpty({
                        type: constructor.type,
                        optionalTypes: constructor.optionalTypes,
                        observer: constructor.observer
                    });
                    props[name] = Object.assign(prop, {
                        value: constructor.value
                    });
                }
                return [name, constructor['value']];
            })
            .collect(Collectors.toMap());

        Object.entries(properties).forEach(([name, constructor]) => {
            if (isPrimitive(constructor)) {
                throw new Error(`The "${name}" property should be a constructor`);
            }
        });

        let crossReferenceOrEnd = true;
        let checkContextMissing = false;

        const instancePropsContext = extender.createInitializationContextSingleton();

        while (crossReferenceOrEnd) {
            const limit = computedProps.size;
            checkContextMissing = false;
            for (const name of computedProps) {
                const constructor = properties[name];
                const value = (constructor['default']).call(
                    instancePropsContext.get(
                        null,
                        instanceProps,
                        methods,
                        () => {
                            checkContextMissing = true;
                        }
                    )
                );
                instanceProps[name] = value;
                if (!checkContextMissing) {
                    computedProps.delete(name);
                    const prop = removeEmpty({
                        type: constructor.type,
                        optionalTypes: constructor.optionalTypes,
                        observer: constructor.observer
                    });
                    props[name] = Object.assign(prop, {
                        value
                    });
                }
            }
            crossReferenceOrEnd = limit !== computedProps.size;
        }

        return props;
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
        const data = context.get('data') || {};
        ``
        const instData = {};
        if (isFunction(data)) {
            const instanceDataContext = extender.createInitializationContextSingleton();
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

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const methods = context.get('methods');
        const properties = this.attemptToInstantiateProps(extender, context, methods, options);
        const data = this.attemptToInstantiateData(extender, properties, methods, context, options);

        const keys = new Set(Object.keys(properties));

        Optional.of(Object.keys(data).find(k => keys.has(k))).ifPresent((property) => {
            throw new Error(`The data property "${property}" is already declared as a prop. Use prop default value instead.`);
        });

        context.set('state', Object.assign
            (
                {},
                data,
                Stream.of(Object.entries(properties)).map(([prop, constructor]) => [prop, constructor.value]).collect(Collectors.toMap())
            )
        );

        const beforeCreate = context.get('beforeCreate');
        if (isFunction(beforeCreate)) {
            beforeCreate.call(
                extender.createInitializationContextSingleton().get(
                    defFields,
                    data,
                    properties,
                    methods
                )
            );
        }

        Object.assign(defFields, {
            behaviors: (defFields.behaviors || []).concat(
                Behavior({
                    data,
                    properties
                })
            )
        });
    }
}