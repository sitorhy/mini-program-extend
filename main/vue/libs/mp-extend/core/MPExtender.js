import OptionInstaller from "./OptionInstaller";
import MethodsInstaller from "./MethodsInstaller";
import ConstantsInstaller from "./ConstantsInstaller";
import PropertiesInstaller from "./PropertiesInstaller";
import DataInstaller from "./DataInstaller";
import StateInstaller from "./StateInstaller";
import ProviderInstaller from "./ProviderInstaller";
import WatcherInstaller from "./WatcherInstaller";
import HookInstaller from "./HookInstaller";
import ComputedInstaller from "./ComputedInstaller";
import MixinInstaller from "./MixinInstaller";
import LifeCycleInstaller from "./LifeCycleInstaller";
import InstanceInstaller from "./InstanceInstaller";
import RelationsInstaller from "./RelationsInstaller";
import EventBusInstaller from "./EventBusInstaller";
import UpdateInstaller from "./UpdateInstaller";
import ContextInstaller from "./ContextInstaller";

import {Singleton} from "../libs/Singleton";
import {isFunction, isNullOrEmpty, isPlainObject} from "../utils/common";
import {createReactiveObject, selectPathRoot, getData, setData} from "../utils/object";

import equal from "../libs/fast-deep-equal/index";
import clone from "../libs/rfdc/default";
import {Collectors, Stream} from "../libs/Stream";
import RESERVED_OPTIONS_WORDS from "../utils/options";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

const RTCSign = Symbol("__wxRTC__");

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
        this.use(new LifeCycleInstaller(), 10);
        this.use(new MethodsInstaller(), 15);
        this.use(new ConstantsInstaller(), 20);
        this.use(new PropertiesInstaller(), 25);
        this.use(new DataInstaller(), 30);
        this.use(new StateInstaller(), 35);
        this.use(new ComputedInstaller(), 40);
        this.use(new ProviderInstaller(), 45);
        this.use(new WatcherInstaller(), 50);
        this.use(new InstanceInstaller(), 95);
        this.use(new EventBusInstaller(), 150);
        this.use(new RelationsInstaller(), 200);
        this.use(new HookInstaller(), 250);
        this.use(new UpdateInstaller(), 300);
        this.use(new ContextInstaller(), 350);
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
                    if (isFunction(fnSetData)) {
                        fnSetData({[path]: value});
                    } else {
                        Reflect.get(runtimeContext, "setData").call(runtimeContext, {[path]: value});
                    }
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
     * @returns {Singleton}
     */
    createRuntimeContextSingleton() {
        return new Singleton((thisArg, properties, computed, fnSetData) => {
            return this.createRuntimeCompatibleContext(thisArg, properties, computed, fnSetData);
        });
    }

    getRuntimeContext(context) {
        if (!Reflect.has(context, RTCSign)) {
            Object.defineProperty(context, RTCSign, {
                value: this.createRuntimeContextSingleton(),
                configurable: false,
                enumerable: false,
                writable: false
            });
        }
        return Reflect.get(context, RTCSign);
    }

    /**
     * 创建只读常量上下文，配置值不允许修改
     * @param options
     */
    createConstantsContext(options) {
        const $options = Stream.of(Object.keys(options).filter(p => !RESERVED_OPTIONS_WORDS.has(p) && !RESERVED_LIFECYCLES_WORDS.has(p)))
            .map(p => [p, options[p]])
            .collect(Collectors.toMap());

        return new Proxy($options, {
            set(target, p, value, receiver) {
                if (Reflect.set(target, p, value)) {
                    if (Reflect.has(options, p)) {
                        Reflect.set(options, p, value);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    /**
     * 创建只读属性临时上下文，实例化对象并合并到接收对象 receiver 中，混合格式以小程序格式优先
     * @param propertiesReceiver - 接收属性实例化后的值，禁止传入空值，传入非空集合则默认对应属性已实例化
     * @param properties - 属性配置，支持混合Vue和小程序格式
     * @param constants - 常量集合, $options
     * @returns {{}|undefined|*}
     */
    createPropertiesCompatibleContext(propertiesReceiver, properties, constants = {}) {
        const propsSingleton = new Singleton((receiver) => {
            const $props = {};
            Object.keys(properties).forEach(prop => {
                Object.defineProperty($props, prop, {
                    get() {
                        return Reflect.get(receiver, prop);
                    },
                    set(v) {
                        Reflect.set(receiver, prop, v);
                    }
                });
            });
        });

        const context = new Proxy(
            propertiesReceiver,
            {
                has(target, p) {
                    return Reflect.has(target, p) || ["$options", "$props"].includes(p);
                },
                ownKeys(target) {
                    return [
                        ...new Set(["$options", "$props"].concat(Object.keys(target)))
                    ];
                },
                get(target, p, receiver) {
                    if (p === "$options") {
                        return constants;
                    }
                    if (p === "$props") {
                        return propsSingleton.get(receiver);
                    }
                    if (Reflect.has(target, p)) {
                        // 属性已实例化
                        return Reflect.get(target, p);
                    } else if (Reflect.has(properties, p)) {
                        const prop = Reflect.get(properties, p);
                        if (Reflect.has(prop, "value")) {
                            return prop.value;
                        } else if (isFunction(prop.default)) {
                            return prop.default.call(receiver);
                        } else {
                            return prop.default;
                        }
                    }
                    return undefined;
                },
                set(target, p, value, receiver) {
                    if (["$options", "$props"].includes(p)) {
                        return false;
                    }
                    if (Reflect.has(properties, p)) {
                        Reflect.set(properties[p], "value", value);
                    }
                    return Reflect.set(target, p, value);
                }
            }
        );

        // 初始化默认值
        Object.keys(properties).forEach(prop => {
            const constructor = properties[prop];
            if (!Reflect.has(propertiesReceiver, prop)) {
                if (Reflect.has(constructor, "value")) {
                    propertiesReceiver[prop] = constructor.value;
                } else if (isFunction(constructor.default)) {
                    propertiesReceiver[prop] = constructor.default.call(context);
                } else {
                    propertiesReceiver[prop] = constructor.default;
                }
            }
        });

        return context;
    }


    /**
     * 创建状态实例化上下文，返回实例化结果
     * @param stateReceiver - 接收状态值
     * @param properties - 规格化后的属性配置，生成函数不依赖属性默认值可以传入null
     * @param data - 通常为状态生成函数，传入对象则直接合并到返回值
     * @param computed - 计算属性配置，提供字段即可
     * @param methods - 方法集合
     * @param constants - 常量集合, $options
     * @returns {{}}
     */
    createDataCompatibleContext(stateReceiver, properties, data, computed, methods, constants = {}) {
        const propertiesContext = this.createPropertiesCompatibleContext(stateReceiver, properties || {}, constants);

        const context = new Proxy(
            stateReceiver,
            {
                has(target, p) {
                    return Reflect.has(target, p)
                        || Reflect.has(propertiesContext, p)
                        || (methods ? false : Reflect.has(methods, p))
                        || (computed ? false : Reflect.has(computed, p))
                        || ["data", "$data"].includes(p);
                },
                ownKeys(target) {
                    const keys = [];
                    [methods, propertiesContext, computed, target].forEach(i => {
                        if (i) {
                            Array.prototype.push.apply(keys, Object.keys(i));
                        }
                    });
                    return [
                        ...new Set(["data", "$data"].concat(keys))
                    ];
                },
                get(target, p, receiver) {
                    if (p === "data") {
                        return target;
                    }
                    if (p === "$data") {
                        const keys = Object.keys(stateReceiver).filter(k => {
                            if (properties) {
                                if (Reflect.has(properties, k)) {
                                    return false;
                                }
                            }
                            if (computed) {
                                if (Reflect.has(computed, k)) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        const $data = {};
                        keys.forEach(k => {
                            Object.defineProperty($data, k, {
                                get() {
                                    return Reflect.get(receiver, k);
                                },
                                set(v) {
                                    Reflect.set(receiver, p, v);
                                }
                            })
                        });
                        return $data;
                    }
                    if (Reflect.has(propertiesContext, p)) {
                        return Reflect.get(propertiesContext, p);
                    }
                    if (methods && Reflect.has(methods, p)) {
                        const method = methods[p];
                        if (isFunction(method)) {
                            return method.bind(receiver);
                        }
                        return method; // 逻辑错误 直接返回
                    }
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    if (["data", "$data"].includes(p)) {
                        return false;
                    }
                    if (Reflect.has(propertiesContext, p)) {
                        return Reflect.set(propertiesContext, p, value);
                    }
                    if (methods && Reflect.has(methods, p)) {
                        return Reflect.set(methods, p, value);
                    }
                    return Reflect.set(target, p, value);
                }
            }
        );
        if (isFunction(data)) {
            const dataReceiver = data.call(context);
            Object.keys(dataReceiver).forEach(p => {
                if (Reflect.has(stateReceiver, p)) {
                    throw new Error(`The data property "${p}" is already declared as a prop. Use prop default value instead.`);
                }
            });
            Object.assign(stateReceiver, dataReceiver);
        } else {
            if (data) {
                Object.keys(data).forEach(p => {
                    if (Reflect.has(stateReceiver, p)) {
                        throw new Error(`The data property "${p}" is already declared as a prop. Use prop default value instead.`);
                    }
                });
            }
            Object.assign(stateReceiver, data);
        }
        return context;
    }

    /**
     * 获取计算属性依赖关系
     * @param state - 实例化状态，包含属性
     * @param properties - 规格化属性配置
     * @param computed - 规格化计算属性配置
     * @param methods
     * @param constants
     */
    getComputedDependencies(state, properties, computed, methods, constants = {}) {
        const plainState = clone(state);
        const linkAge = new Map();
        const dependencies = [];
        const reactiveState = createReactiveObject(plainState, plainState,
            (path, value) => {
                setData(plainState, {[path]: value});
            },
            "",
            (path, value, level) => {
                if (!dependencies.includes(path) && level === 0) {
                    dependencies.push(path);
                }
            },
            (path, value, level) => {
                const src = selectPathRoot(path);
                dependencies.splice(0).map(i => selectPathRoot(i)).filter(i => i !== src).forEach(p => {
                    if (!linkAge.has(p)) {
                        linkAge.set(p, []);
                    }
                    const targets = linkAge.get(p);
                    if (!targets.includes(src)) {
                        targets.push(src);
                    }
                });
            }
        );

        const context = this.createDataCompatibleContext(reactiveState, properties, null, computed, methods, constants);
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];

        getters.forEach(p => {
            if (!Reflect.has(plainState, p)) {
                const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                if (isFunction(getter)) {
                    context[p] = getter.call(context);
                }
            }
        });

        return linkAge;
    }

    /**
     * 创建临时上下文
     * @param state - 已实例化的状态对象，该对象包含实例化后的属性默认值
     * @param {Map} linkAge - 计算属性依赖关系,{ [被依赖属性:string]:依赖属性 }
     * @param properties - 规格化属性配置
     * @param computed - 计算属性配置
     * @param methods - 依赖方法
     * @param constants - 常量集合
     * @returns {any}
     */
    createInitializationCompatibleContext(state, linkAge, properties, computed, methods, constants = {}) {
        let context;
        const locking = new Set();
        const reactiveState = createReactiveObject(state, state,
            (path, value) => {
                // 获取根对象
                const src = selectPathRoot(path);
                if (locking.has(src)) {
                    // 对象已锁定，防止交叉引用无限递归
                    return;
                }
                // 锁定字段
                locking.add(src);
                if (src !== path) {
                    // 不规范修改，计算属性应该总是返回新对象
                    // 直接修改内部属性值，默认该对象已修改，锁定对象引用不再执行getter
                    if (getData(state, path) !== value) {
                        setData(state, {[path]: value});
                    }
                } else {
                    // 修改引用
                    const setter = computed[src] && isFunction(computed[src].set) ? computed[src].set : null;
                    if (value !== state[src]) {
                        if (isFunction(setter)) {
                            setter.call(context, value);
                            const getter = computed[src] && isFunction(computed[src].get) ? computed[src].get : computed[src];
                            if (isFunction(getter)) {
                                state[src] = getter.call(context);
                            } else {
                                throw new Error(`Getter is missing for computed property "${src}".`);
                            }
                        } else {
                            setData(state, {[path]: value});
                        }
                    }
                }
                const targets = linkAge.get(src);
                if (targets) {
                    targets.forEach(p => {
                        if (!locking.has(p)) {
                            // Vue 对短时间内赋值会进行防抖处理 对比框架可能会出现数据丢失的情况出现
                            // Vue 中 连续执行 a=100,a=200 对a进行 watch 只会输出 200
                            const getter = computed[p] && isFunction(computed[p].get) ? computed[p].get : computed[p];
                            if (isFunction(getter)) {
                                context[p] = getter.call(context);
                            } else {
                                context[p] = state[p]; // 依赖非计算属性字段，强制触发
                            }
                        }
                    });
                }
                // 解锁
                locking.delete(src);
            });

        context = this.createDataCompatibleContext(reactiveState, properties, null, computed, methods, constants);
        const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];

        getters.forEach(p => {
            if (!Reflect.has(state, p)) {
                const getter = computed[p] && isFunction(computed[p].get) ? computed[p].get : computed[p];
                if (isFunction(getter)) {
                    state[p] = getter.call(context);
                }
            }
        });

        return context;
    }

    /**
     * @returns {Singleton}
     */
    createInitializationContextSingleton() {
        return new Singleton((state, linkAge, properties, computed, methods, constants) => {
            return this.createInitializationCompatibleContext(state, linkAge, properties, computed, methods, constants);
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