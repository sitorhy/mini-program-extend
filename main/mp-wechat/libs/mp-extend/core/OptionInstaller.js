import BehaviorInstaller from './BehaviorInstaller';
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
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
     * @returns {*}
     */
    createRuntimeCompatibleContext(context, computed) {
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
                                            Reflect.get(runtimeContext, 'setData').call(runtimeContext, {[p]: obj});
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
                Reflect.get(runtimeContext, 'setData').call(runtimeContext, {[p]: value});
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