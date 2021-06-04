import BehaviorInstaller from './BehaviorInstaller';
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

export default class OptionInstaller extends BehaviorInstaller {
    /**
     * 处理配置上下文
     *
     * @param {MPExtender} extender
     * @param {Map<any,any>} context
     * @param {[key:string]:any} options
     */
    install(extender, context, options) {
        return options;
    }

    /**
     * 返回值将直接注入最终配置
     * @param {MPExtender} extender
     * @param {Map<any,any>} context
     * @param {[key:string]:any} options
     * @returns {{}}
     */
    build(extender, context, options) {
        return {};
    }

    /**
     * 创建运行时上下文
     * @param {object} context - 传入this
     * @returns {*}
     */
    createRuntimeCompatibleContext(context,data, properties, methods, onMissingHandler) {
        return new Proxy(
            context,
            {
                get(target, p, receiver) {
                    if (Reflect.has(target, p)) {
                        const prop = Reflect.get(target, p);
                        if (isFunction(prop)) {
                            return prop.bind(target);
                        }
                        return prop;
                    } else {
                        if (Reflect.has(target, 'data')) {
                            const data = Reflect.get(target, 'data');
                            if (Reflect.has(data, p)) {
                                return Reflect.get(data, p);
                            }
                        }
                        if (p === '$props') {
                            return Reflect.get(target, 'properties');
                        } else if (p === '$data') {
                            const $props = Reflect.get(target, 'properties') || {};
                            return Stream.of(Object.entries(Reflect.get(target, 'data'))).filter(([prop]) => !Reflect.has($props, prop)).collect(Collectors.toMap())
                        }
                        return Reflect.get(target, p);
                    }
                }
            }
        );
    }

    /**
     * 运行时临时上下文，允许拦截部分数据
     * @param context
     * @param data
     * @param properties
     * @param methods
     * @param onMissingHandler
     * @returns {null|any}
     */
    createDynamicCompatibleContext(context, data, properties, methods, onMissingHandler) {
        let curState = null;
        let curProps = null;

        const compatibleDataContext = Object.create(
            new Proxy(
                {},
                {
                    get(target, p) {
                        if (!Reflect.has(curState, p) && !Reflect.has(curProps, p)) {
                            if (isFunction(onMissingHandler)) {
                                onMissingHandler.call(undefined, p);
                            }
                        }
                        if (Reflect.has(curProps, p)) {
                            return Reflect.get(curProps, p);
                        }
                        return Reflect.get(curState, p);
                    }
                }
            )
        );

        return Object.create(
            new Proxy(
                context,
                {
                    get(target, p) {
                        curState = isPlainObject(data) ? data : {};
                        curProps = isPlainObject(properties) ? Stream.of(
                            Object.entries(properties)
                        ).map(([name, constructor]) => [name, constructor.value]).collect(Collectors.toMap()) : {};

                        if (!Reflect.has(curState, p) && !Reflect.has(curProps, p)) {
                            if (p === 'data') {
                                return compatibleDataContext;
                            }
                        } else {
                            if (methods && Reflect.has(methods, p)) {
                                return Reflect.get(methods, p);
                            } else if (Reflect.has(target, p)) {
                                const prop = Reflect.get(target, p);
                                if (isFunction(prop)) {
                                    return prop.bind(target);
                                }
                                return prop;
                            }
                        }
                        if (Reflect.has(curProps, p)) {
                            return Reflect.get(curProps, p);
                        }
                        return Reflect.get(curState, p);
                    }
                }
            )
        );
    }

    /**
     * 创建临时上下文
     * @param data - 小程序格式
     * @param properties - 小程序格式
     * @param methods
     * @param onMissingHandler - 参数命中失败时回调
     * @returns {any}
     */
    createInitializationCompatibleContext(data, properties, methods, onMissingHandler) {
        const initialState = Object.assign(
            {},
            isPlainObject(data) ? data : null,
            isPlainObject(properties) ? Stream.of(
                Object.entries(properties)
            ).map(([name, constructor]) => [name, constructor.value]).collect(Collectors.toMap()) : null
        );

        const compatibleDataContext = Object.create(
            new Proxy(
                initialState,
                {
                    get(target, p) {
                        if (!Reflect.has(target, p)) {
                            if (isFunction(onMissingHandler)) {
                                onMissingHandler.call(undefined, p);
                            }
                        }
                        return Reflect.get(target, p);
                    }
                }
            )
        );

        return Object.create(
            new Proxy(
                initialState,
                {
                    get(target, p) {
                        if (!Reflect.has(target, p)) {
                            if (p === 'data') {
                                return compatibleDataContext;
                            }
                        } else {
                            if (methods && Reflect.has(methods, p)) {
                                return Reflect.get(methods, p);
                            }
                        }
                        return Reflect.get(target, p);
                    }
                }
            )
        );
    }

    beforeCreate() {

    }

    created() {

    }

    beforeMount() {

    }

    mounted() {

    }

    beforeUpdate() {

    }

    updated() {

    }

    activated() {

    }

    deactivated() {

    }

    beforeDestroy() {

    }

    destroyed() {

    }
}