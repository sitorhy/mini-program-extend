import BehaviorInstaller from './BehaviorInstaller';
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import {Singleton} from "../libs/Singleton";
import equal from "../libs/fast-deep-equal/index";

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
     * @param {object} computed - 计算属性配置
     * @param {Function} fnSetData - 自定义setData函数，可传入原生setData函数，提高效率
     * @returns {*}
     */
    createRuntimeCompatibleContext(context, computed, fnSetData) {
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];
        const setters = isPlainObject(computed) ? Object.keys(computed).filter(i => isPlainObject(computed[i]) && isFunction(computed[i].set)) : [];
        let runtimeContext;
        let runtimeDataContext;

        runtimeDataContext = new Proxy(context.data, {
            get(target, p, receiver) {
                const obj = Reflect.get(target, p);
                if (Array.isArray(obj)) {
                    return new Proxy(obj, {
                        get(arr, arrProp, receiver) {
                            switch (arrProp) {
                                case 'push':
                                case 'pop':
                                case 'shift':
                                case 'unshift':
                                case 'splice':
                                case 'sort':
                                case 'reverse': {
                                    return new Proxy(Reflect.get(arr, arrProp), {
                                        apply(target, thisArg, argArray) {
                                            const result = Reflect.apply(target, thisArg, argArray);
                                            if (isFunction(fnSetData)) {
                                                fnSetData({[p]: obj});
                                            } else {
                                                Reflect.get(runtimeContext, 'setData').call(runtimeContext, {[p]: obj});
                                            }
                                            return result;
                                        }
                                    });
                                }
                            }
                            return Reflect.get(arr, arrProp);
                        }
                    });
                }
                return obj;
            },
            set(target, p, value, receiver) {
                target[p] = value;
                if (isFunction(fnSetData)) {
                    fnSetData({[p]: value});
                } else {
                    Reflect.get(runtimeContext, 'setData').call(runtimeContext, {[p]: value});
                }
                if (setters.includes(p)) {
                    computed[p].set.call(runtimeContext, value);
                }
                getters.forEach((p) => {
                    const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                    const curVal = Reflect.get(runtimeContext, p);
                    const pValue = getter.call(runtimeContext);
                    if (!equal(curVal, pValue)) {
                        Reflect.set(runtimeDataContext, p, pValue);
                    }
                });
                return true;
            }
        });

        runtimeContext = new Proxy(
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
                        if (Reflect.has(runtimeDataContext, p)) {
                            return Reflect.get(runtimeDataContext, p);
                        }
                        return Reflect.get(target, p);
                    }
                },
                set(target, p, value, receiver) {
                    if (Reflect.has(runtimeDataContext, p)) {
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
     * 扩展运行时上下文
     * @returns {Singleton}
     */
    createRuntimeContextSingleton() {
        return new Singleton((thisArg, properties, computed, fnSetData) => {
            const runtimeContext = this.createRuntimeCompatibleContext(thisArg, computed, fnSetData);
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
                    return Reflect.get(target, p);
                }
            });
        });
    }

    /**
     * 创建临时上下文
     * @param obj - 注入对象，只读形式可传入null
     * @param data - 小程序格式，不能传函数
     * @param properties - 小程序格式，不能使用生成函数
     * @param methods - 依赖方法
     * @param onMissingHandler - 参数命中失败时回调
     * @returns {any}
     */
    createInitializationCompatibleContext(obj, data, properties, methods, onMissingHandler) {
        let state;
        const refreshState = () => {
            state = Object.assign(
                {},
                isPlainObject(properties) ? Stream.of(
                    Object.entries(properties)
                ).map(([prop, constructor]) => [prop, constructor.value]).collect(Collectors.toMap()) : null,
                isPlainObject(data) ? data : null,
            );
        };

        const compatibleDataContext = new Proxy(
            (obj || {}).data || {},
            {
                has(target, p) {
                    return Reflect.has(target, p) || Reflect.has(state, p);
                },
                get(target, p) {
                    // 优先注入对象读写
                    if (Reflect.has(target, p)) {
                        return Reflect.get(target, p);
                    }
                    if (!Reflect.has(state, p)) {
                        if (isFunction(onMissingHandler)) {
                            onMissingHandler.call(undefined, p);
                        }
                    }
                    return Reflect.get(state, p);
                },
                set(target, p, value, receiver) {
                    // 优先注入对象读写
                    if (Reflect.has(target, p)) {
                        return Reflect.set(target, p, value, receiver);
                    } else if (isPlainObject(properties) && Reflect.has(properties, p)) {
                        return Reflect.set(properties[p], 'value', value);
                    } else {
                        return Reflect.set(data, p, value);
                    }
                }
            }
        );

        return new Proxy(
            (obj || {}),
            {
                get(target, p, receiver) {
                    refreshState();
                    // 小程序形式读取状态 const a = this.data.a;
                    if (!Reflect.has(state, p)) {
                        if (p === 'data') {
                            return compatibleDataContext;
                        }
                    }
                    // 重定向到methods
                    if (isPlainObject(methods) && Reflect.has(methods, p)) {
                        const method = Reflect.get(methods, p);
                        if (isFunction(method)) {
                            return method.bind(receiver);
                        }
                        return method;
                    }
                    // Vue形式读取 const a = this.a;
                    if (Reflect.has(compatibleDataContext, p)) {
                        return Reflect.get(compatibleDataContext, p);
                    }
                    // 读取 data 外的其他属性
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    refreshState();
                    // 尝试重定向到 compatibleDataContext
                    if (Reflect.has(compatibleDataContext, p)) {
                        return Reflect.set(compatibleDataContext, p, value);
                    }
                    return Reflect.set(target, p, value, receiver);
                }
            }
        );
    }

    createInitializationContextSingleton() {
        return new Singleton((obj, data, properties, methods, onMissingHandler) => {
            const compileTimeContext = this.createInitializationCompatibleContext(obj, data, properties, methods, onMissingHandler)
            const props = Object.keys(properties);
            return new Proxy(compileTimeContext, {
                get(target, p, receiver) {
                    if (p === '$props') {
                        return Stream.of(props.map(prop => {
                            return [prop, Reflect.get(compileTimeContext, prop)];
                        })).collect(Collectors.toMap());
                    }
                    if (p === '$data') {
                        return Stream.of(
                            Object.entries(Object.assign({}, (obj || {}).data, data))
                        ).filter(([name]) => !props.includes(name)).collect(Collectors.toMap());
                    }
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    return Reflect.set(target, p, value, receiver);
                }
            });
        });
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