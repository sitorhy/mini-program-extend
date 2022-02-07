import OptionInstaller from "./OptionInstaller";

import {Collectors, Stream} from "../libs/Stream";
import {removeEmpty} from "../utils/common";
import clone from "../libs/rfdc/default";

/**
 * 实例化临时上下文属性和数据，转换为小程序可直接执行的形式
 */
export default class StateInstaller extends OptionInstaller {

    /**
     * 属性初始化不允许调用 methods, 不允许访问 data，可以访问props自身但不允许交叉引用
     * @param extender
     * @param propertiesInstance
     * @param properties
     * @param constants
     * @returns {*}
     */
    attemptToInstantiateProps(extender, propertiesInstance, properties, constants) {
        extender.createPropertiesCompatibleContext(propertiesInstance, properties, constants);

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
     * @param stateReceiver
     * @param properties
     * @param data
     * @param methods
     * @param constants
     * @returns {{}}
     */
    attemptToInstantiateData(extender, stateReceiver, properties, data, methods, constants) {
        return extender.createDataCompatibleContext(stateReceiver, properties, data, null, methods, constants);
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const state = clone(context.get("state"));
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
        const state = {};
        const methods = context.get("methods");
        // 筛选出常量
        const $options = context.has("constants") ? context.get("constants") : extender.createConstantsContext(options);
        // 规格化属性
        const properties = this.attemptToInstantiateProps(extender, state, context.get("properties") || {}, $options);
        // 实例化状态
        this.attemptToInstantiateData(extender, state, properties, context.get("data") || {}, methods, $options);
        context.set("state", state);
    }
}