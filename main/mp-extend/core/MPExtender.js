import OptionInstaller from "./OptionInstaller";
import MethodsInstaller from "./MethodsInstaller";
import PropertiesInstaller from "./PropertiesInstaller";
import DataInstaller from "./DataInstaller";
import StateInstaller from "./StateInstaller";
import ProviderInstaller from "./ProviderInstaller";
import WatcherInstaller from "./WatcherInstaller";
import ContextInstaller from "./ContextInstaller";
import ComputedInstaller from "./ComputedInstaller";
import MixinInstaller from "./MixinInstaller";
import LifeCycleInstaller from "./LifeCycleInstaller";
import InstanceInstaller from "./InstanceInstaller";
import RelationsInstaller from "./RelationsInstaller";
import EventBusInstaller from "./EventBusInstaller";
import UpdateInstaller from "./UpdateInstaller";

import {Singleton} from "../libs/Singleton";
import {isFunction, isNullOrEmpty, isPlainObject} from "../utils/common";
import {createReactiveObject} from "../utils/object";

import equal from "../libs/fast-deep-equal/index";
import {Collectors, Stream} from "../libs/Stream";

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

    prepare(installer, priority = 100) {
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
        this.use(new MixinInstaller(), 5);
        this.use(new MethodsInstaller(), 10);
        this.use(new PropertiesInstaller(), 15);
        this.use(new DataInstaller(), 20);
        this.use(new StateInstaller(), 25);
        this.use(new ComputedInstaller(), 30);
        this.use(new ProviderInstaller(), 35);
        this.use(new WatcherInstaller(), 40);
        this.use(new LifeCycleInstaller(), 45);
        this.use(new InstanceInstaller(), 95);
        this.use(new EventBusInstaller(), 150);
        this.use(new RelationsInstaller(), 200);
        this.use(new ContextInstaller(), 250);
        this.use(new UpdateInstaller(), 300);
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
     * @param {object} properties - 属性配置
     * @param {object} computed - 计算属性配置
     * @param {Function} fnSetData - 自定义setData函数，可传入原生setData函数，提高效率
     * @returns {*}
     */
    createRuntimeCompatibleContext(context, properties, computed, fnSetData) {
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];

        let runtimeContext;

        const runtimeDataContext = createReactiveObject(context.data, context.data, function (path, value) {
            if (computed[path]) {
                if (isFunction(computed[path].set)) {
                    // 计算属性赋值调用对应 setter 修改 state
                    computed[path].set.call(runtimeContext, value);
                } else {
                    throw new Error(`Computed property "${path}" was assigned to but it has no setter.`);
                }
            } else {
                // 非计算属性赋值
                // path 为空 可视为根对象
                if (isFunction(fnSetData)) {
                    fnSetData(!isNullOrEmpty(path) ? {[path]: value} : value);
                } else {
                    Reflect.get(runtimeContext, "setData").call(runtimeContext, !isNullOrEmpty(path) ? {[path]: value} : value);
                }
            }
            getters.forEach((p) => {
                const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                const curVal = Reflect.get(runtimeContext, p);
                const pValue = getter.call(runtimeContext);
                if (!equal(curVal, pValue)) {
                    if (isFunction(fnSetData)) {
                        fnSetData({[p]: pValue});
                    } else {
                        Reflect.get(runtimeContext, "setData").call(runtimeContext, {[p]: pValue});
                    }
                }
            });
        });

        runtimeContext = new Proxy(
            context,
            {
                get(target, p, receiver) {
                    if (p === "data") {
                        return runtimeDataContext;
                    }

                    if (p === "$props") {
                        const $props = {};
                        if (properties) {
                            Object.keys(runtimeDataContext).filter(i => Reflect.has(properties, i)).forEach(i => {
                                Object.defineProperty($props, i, {
                                    get() {
                                        return Reflect.get(runtimeDataContext, i);
                                    },
                                    set(v) {
                                        return Reflect.set(runtimeDataContext, i, v);
                                    }
                                })
                            });
                        }
                        return $props;
                    }

                    if (p === "$data") {
                        const $data = {};
                        Object.keys(runtimeDataContext).filter(i =>
                            (properties ? !Reflect.has(properties, i) : true) &&
                            (computed ? !Reflect.has(computed, i) : true)
                        ).forEach(i => {
                            Object.defineProperty($data, i, {
                                get() {
                                    return Reflect.get(runtimeDataContext, i);
                                },
                                set(v) {
                                    return Reflect.set(runtimeDataContext, i, v);
                                }
                            })
                        });
                        return $data;
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
     * @param { function (prop:string):boolean } predicate - 拦截属性
     * @param { function (prop:string,runtimeContext:Proxy):object } supplier - 返回拦截属性的值
     * @returns {Singleton}
     */
    createRuntimeContextSingleton(predicate = null, supplier = null) {
        return new Singleton((thisArg, properties, computed, fnSetData) => {
            const runtimeContext = this.createRuntimeCompatibleContext(thisArg, properties, computed, fnSetData);
            return new Proxy(runtimeContext, {
                get(target, p, receiver) {
                    if (isFunction(predicate) && isFunction(supplier) && predicate(p) === true) {
                        return supplier(p, runtimeContext);
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
     * @param computed - 计算属性配置
     * @param methods - 依赖方法
     * @returns {any}
     */
    createInitializationCompatibleContext(obj, state, properties, computed, methods) {
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
                    }
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    // 状态命中，检查是否命中静态的props
                    if (isPlainObject(properties) && Reflect.has(properties, p)) {
                        properties[p].value = value;
                        return true;
                    } else {
                        if (Reflect.has(state, p)) {
                            state[p] = value;
                            return true;
                        }
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
                    if (p === "data") {
                        return compatibleDataContext;
                    }

                    if (p === "$props") {
                        const $props = {};
                        if (properties) {
                            Object.keys(compatibleDataContext).filter(i => Reflect.has(properties, i)).forEach(i => {
                                Object.defineProperty($props, i, {
                                    get() {
                                        return Reflect.get(compatibleDataContext, i);
                                    },
                                    set(v) {
                                        return Reflect.set(compatibleDataContext, i, v);
                                    }
                                })
                            });
                        }
                        return $props;
                    }

                    if (p === "$data") {
                        const $data = {};
                        Object.keys(compatibleDataContext).filter(i =>
                            (properties ? !Reflect.has(properties, i) : true)
                        ).forEach(i => {
                            Object.defineProperty($data, i, {
                                get() {
                                    return Reflect.get(compatibleDataContext, i);
                                },
                                set(v) {
                                    return Reflect.set(compatibleDataContext, i, v);
                                }
                            })
                        });
                        return $data;
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
                        // 初始化过程直接修改配置，无需同步数据，不需要创建EffectObject
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
        return new Singleton((obj, data, properties, methods) => {
            return this.createInitializationCompatibleContext(obj, data, properties, methods);
        });
    }

    extends(configuration) {
        let options = configuration;
        const installers = this.installers;
        const reduceOptions = {};
        installers.forEach(installer => {
            const o = installer.configuration(this, this._context, options);
            if (o) {
                Object.assign(reduceOptions, o);
            }
        });
        installers.forEach(installer => {
            installer.install(this, this._context, reduceOptions);
        });

        const config = {
            behaviors: [
                Behavior({
                    definitionFilter: (defFields, definitionFilterArr) => {
                        installers.forEach(installer => {
                            installer.definitionFilter(this, this._context, options, defFields, definitionFilterArr);
                            const behaviors = installer.behaviors();
                            if (Array.isArray(behaviors) && behaviors.length) {
                                defFields.behaviors = Stream.of(
                                    (defFields.behaviors || []).concat(behaviors)
                                ).distinct().collect(Collectors.toList());
                            }
                        });
                    }
                })
            ]
        };
        installers.forEach(installer => {
            Object.assign(config, installer.build(this, this._context, reduceOptions));
        });
        return config;
    }
}