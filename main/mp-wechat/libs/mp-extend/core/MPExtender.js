import OptionInstaller from './OptionInstaller';
import MethodsInstaller from './MethodsInstaller';
import PropertiesInstaller from './PropertiesInstaller';
import DataInstaller from './DataInstaller';
import StateInstaller from './StateInstaller';
import WatcherInstaller from './WatcherInstaller';
import ContextInstaller from './ContextInstaller';
import ComputedInstaller from "./ComputedInstaller";
import MixinInstaller from "./MixinInstaller";
import LifeCycleInstaller from "./LifeCycleInstaller";

import {Singleton} from "../libs/Singleton";
import {isFunction, isPlainObject} from "../utils/common";
import equal from "../libs/fast-deep-equal/index";

class InstallersSingleton extends Singleton {
    /**
     * @type {Map<any, any>}
     * @private
     */
    _installers = new Map();

    constructor() {
        super(() => {
            return [...this._installers.entries()].sort((i, j) => i[1] - j[1]).map(i => i[0]);
        });
    }

    prepare(installer, priority = 50) {
        if (installer instanceof OptionInstaller) {
            if (!this._installers.has(installer)) {
                this._installers.set(installer, priority);
            }
        }
    }
}

export default class MPExtender {
    _installers = new InstallersSingleton();
    _context = new Map();

    constructor() {
        this.use(new MixinInstaller(), 10);
        this.use(new MethodsInstaller(), 15);
        this.use(new PropertiesInstaller(), 20);
        this.use(new DataInstaller(), 25);
        this.use(new StateInstaller(), 30);
        //    this.use(new WatcherInstaller(),60);
        this.use(new ComputedInstaller(), 35);
        this.use(new LifeCycleInstaller(), 40);
        this.use(new ContextInstaller(), 100);
    }

    /**
     * @returns {OptionInstaller[]}
     */
    get installers() {
        return this._installers.get();
    }

    use(installer, priority = 50) {
        this._installers.prepare(installer, priority);
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
                        const $props = {};
                        Object.keys(Reflect.get(target, 'data')).filter(i => props.includes(i)).forEach(i => {
                            Object.defineProperty($props, i, {
                                get() {
                                    return Reflect.get(target, i);
                                },
                                set(v) {
                                    return Reflect.set(target, i, v);
                                }
                            })
                        });
                        return $props;
                    }
                    if (p === '$data') {
                        const $data = {};
                        Object.keys(Reflect.get(target, 'data')).filter(i => !props.includes(i)).forEach(i => {
                            Object.defineProperty($data, i, {
                                get() {
                                    return Reflect.get(target, i);
                                },
                                set(v) {
                                    return Reflect.set(target, i, v);
                                }
                            })
                        });
                        return $data;
                    }
                    return Reflect.get(target, p);
                }
            });
        });
    }

    /**
     * 创建临时上下文
     * @param obj - 注入对象，只读形式可传入null
     * @param state - 小程序格式，不能传函数
     * @param properties - 小程序格式，不能使用生成函数
     * @param methods - 依赖方法
     * @param onMissingHandler - 参数命中失败时回调
     * @returns {any}
     */
    createInitializationCompatibleContext(obj, state, properties, methods, onMissingHandler) {
        const compatibleDataContext = new Proxy(
            (obj || {}),
            {
                has(target, p) {
                    // 检查是否存在对应状态
                    return (state && Reflect.has(state, p)) || (properties && Reflect.has(properties, p));
                },
                get(target, p) {
                    // 状态命中，返回 state 或 props 的值
                    if (state && Reflect.has(state, p)) {
                        return Reflect.get(state, p);
                    }
                    if (properties && Reflect.has(properties, p)) {
                        return properties[p].value;
                    } else {
                        if (isFunction(onMissingHandler)) {
                            onMissingHandler.call(undefined, p);
                        }
                    }
                    return undefined;
                },
                set(target, p, value, receiver) {
                    // 状态命中，检查是否命中静态的props
                    if (isPlainObject(properties) && Reflect.has(properties, p)) {
                        properties[p].value = value;
                        if (Reflect.has(state, p)) {
                            state[p] = value;
                        }
                        return true;
                    } else {
                        // 其余状态一律写入data
                        return Reflect.set(state, p, value);
                    }
                }
            }
        );

        return new Proxy(
            (obj || {}),
            {
                get(target, p, receiver) {
                    // 小程序形式读取状态 const a = this.state.a;
                    if (p === 'state') {
                        return compatibleDataContext;
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
                    // 读取 state 外的其他属性
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    // 尝试重定向到 compatibleDataContext, this.a = 100;
                    if (Reflect.has(compatibleDataContext, p)) {
                        return Reflect.set(compatibleDataContext, p, value);
                    }
                    return Reflect.set(target, p, value, receiver);
                }
            }
        );
    }

    /**
     * @returns {Singleton}
     */
    createInitializationContextSingleton() {
        return new Singleton((obj, data, properties, methods, onMissingHandler) => {
            const compileTimeContext = this.createInitializationCompatibleContext(obj, data, properties, methods, onMissingHandler)
            const props = Object.keys(properties);
            return new Proxy(compileTimeContext, {
                get(target, p, receiver) {
                    if (p === '$props') {
                        const $props = {};
                        Object.keys(properties).forEach(i => {
                            Object.defineProperty($props, i, {
                                get() {
                                    return Reflect.get(target, i);
                                },
                                set(v) {
                                    return Reflect.set(target, i, v);
                                }
                            });
                        });
                        return $props;
                    }
                    if (p === '$data') {
                        const $data = {};
                        Object.keys(Object.assign({}, (obj || {}).data, data)).filter(i => !props.includes(i)).forEach(i => {
                            Object.defineProperty($data, i, {
                                get() {
                                    return Reflect.get(target, i);
                                },
                                set(v) {
                                    return Reflect.set(target, i, v);
                                }
                            })
                        });
                        return $data;
                    }
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    return Reflect.set(target, p, value, receiver);
                }
            });
        });
    }

    extends(options) {
        const installers = this.installers;
        installers.forEach(installer => {
            installer.install(this, this._context, options);
        });

        const config = {
            behaviors: [
                Behavior({
                    definitionFilter: (defFields, definitionFilterArr) => {
                        installers.forEach(installer => {
                            installer.definitionFilter(this, this._context, options, defFields, definitionFilterArr);
                            defFields.behaviors = (defFields.behaviors || []).concat(installer.behaviors());
                        });
                    }
                })
            ]
        };
        installers.forEach(installer => {
            Object.assign(config, installer.build(this, this._context, options));
        });
        return config;
    }
}