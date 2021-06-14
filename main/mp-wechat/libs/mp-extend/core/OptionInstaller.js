import BehaviorInstaller from './BehaviorInstaller';
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

export default class OptionInstaller extends BehaviorInstaller {
    constructor(extender = null) {
        super();
        this.extender = extender;
    }

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
    createRuntimeCompatibleContext(context, computed) {
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];
        const setters = isPlainObject(computed) ? Object.keys(computed).filter(i => isPlainObject(computed[i]) && isFunction(computed[i].set)) : [];
        let runtimeContext;
        let runtimeDataContext;

        runtimeDataContext = new Proxy(context.data, {
            get(target, p, receiver) {
                if (getters.includes(p)) {
                    const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                    const pValue = getter.call(runtimeContext);
                    Reflect.set(runtimeDataContext, p, pValue);
                    return pValue;
                }
                return Reflect.get(target, p);
            },
            set(target, p, value, receiver) {
                target[p] = value;
                Reflect.get(runtimeContext, 'setData').call(runtimeContext, {[p]: value});
                if (setters.includes(p)) {
                    computed[p].set.call(runtimeContext, value);
                }
                return true;
            }
        });

        runtimeContext = new Proxy(
            context,
            {
                get(target, p, receiver) {
                    if (getters.includes(p)) {
                        const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                        const pValue = getter.call(runtimeContext);
                        Reflect.set(runtimeDataContext, p, pValue);
                        return pValue;
                    }
                    if (Reflect.has(target, p)) {
                        const prop = Reflect.get(target, p);
                        if (isFunction(prop)) {
                            return prop.bind(target);
                        }
                        return prop;
                    } else {
                        if (Reflect.has(runtimeDataContext, p)) {
                            return Reflect.get(runtimeDataContext, p);
                        }
                        return Reflect.get(target, p);
                    }
                },
                set(target, p, value, receiver) {
                    if (p === 'data') {
                        return Reflect.set(runtimeDataContext, p, value);
                    } else if (Reflect.has(runtimeDataContext, p)) {
                        return Reflect.set(runtimeDataContext, p, value);
                    } else {
                        return Reflect.set(context, p, value);
                    }
                }
            }
        );

        return runtimeContext;
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
        let state;
        const refreshState = () => {
            state = Object.assign(
                {},
                isPlainObject(data) ? data : null,
                isPlainObject(properties) ? Stream.of(
                    Object.entries(properties)
                ).map(([prop, constructor]) => [prop, constructor.value]).collect(Collectors.toMap()) : null
            );
        };

        const compatibleDataContext = Object.create(
            new Proxy(
                (data || {}),
                {
                    get(target, p) {
                        if (!Reflect.has(state, p)) {
                            if (isFunction(onMissingHandler)) {
                                onMissingHandler.call(undefined, p);
                            }
                        }
                        return Reflect.get(state, p);
                    },
                    set(target, p, value, receiver) {
                        Reflect.set(target, p, value);
                    }
                }
            )
        );

        return Object.create(
            new Proxy(
                (data || {}),
                {
                    get(target, p) {
                        refreshState();
                        if (!Reflect.has(state, p)) {
                            if (p === 'data') {
                                return compatibleDataContext;
                            }
                        }
                        if (methods && Reflect.has(methods, p)) {
                            return Reflect.get(methods, p);
                        }
                        return Reflect.get(state, p);
                    },
                    set(target, p, value, receiver) {
                        if (p === 'data') {
                            Reflect.set(compatibleDataContext, p, value);
                        } else {
                            Reflect.set(target, p, value);
                        }
                    }
                }
            )
        );
    }

    computed() {

    }

    beforeCreate() {

    }

    beforeMount() {

    }

    mounted() {

    }

    beforeDestroy() {

    }

    destroyed() {

    }
}