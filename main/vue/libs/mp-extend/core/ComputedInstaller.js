import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import clone from "../libs/rfdc/default";
import {getData, selectPathRoot, setData} from "../utils/object";

const CMPCLockSign = Symbol("__wxCMPCLock__");
const CMPCRTCLockSign = Symbol("__wxCMPCRTCLock__");
const CMPCSubmitSign = Symbol("__wxCMPCSubmit__");

const LockInstallBehavior = Behavior(
    {
        lifetimes: {
            created() {
                Object.defineProperty(this, CMPCLockSign, {
                    value: new Set(),
                    writable: false,
                    enumerable: false,
                    configurable: true
                });
                Object.defineProperty(this, CMPCSubmitSign, {
                    value: new Set(),
                    writable: false,
                    enumerable: false,
                    configurable: true
                });
            }
        }
    }
);

const PropertyMonitor = {
    lock: function (thisArg, prop) {
        Reflect.get(thisArg, CMPCLockSign).add(prop);
    },

    unlock: function (thisArg, prop) {
        Reflect.get(thisArg, CMPCLockSign).delete(prop);
    },

    isLocked: function (thisArg, prop) {
        return Reflect.get(thisArg, CMPCLockSign).has(prop);
    }
};

const RuntimeContextMonitor = {
    lock: function (thisArg, prop) {
        Object.defineProperty(thisArg, CMPCRTCLockSign, {
            configurable: true,
            value: true,
            writable: false,
            enumerable: false
        });
    },

    unlock: function (thisArg, prop) {
        Reflect.deleteProperty(thisArg, CMPCRTCLockSign);
    },

    isLocked: function (thisArg, prop) {
        return Reflect.has(thisArg, CMPCRTCLockSign);
    }
}

const PropertiesCollection = {
    add(thisArg, prop) {
        Reflect.get(thisArg, CMPCSubmitSign).add(prop);
    },

    delete(thisArg, prop) {
        Reflect.get(thisArg, CMPCSubmitSign).delete(prop);
    },

    clear(thisArg) {
        Reflect.get(thisArg, CMPCSubmitSign).clear();
    },

    all(thisArg) {
        return [...Reflect.get(thisArg, CMPCSubmitSign)];
    }
}

/**
 * 为防止闭环，计算属性初始化在data,props初始化之后
 */
export default class ComputedInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [LockInstallBehavior].concat(defFields.behaviors || []);
    }

    attemptToInstantiateCalculated(extender, context, options) {
        const computed = context.get("computed");
        const $options = context.has("constants") ? context.get("constants") : extender.createConstantsContext(options);
        const methods = context.get("methods");
        const properties = context.get("properties");
        const state = context.get("state");
        return extender.getComputedDependencies(state, properties, computed, methods, $options);
    }

    lifetimes(extender, context, options) {
        return {
            created() {
                // 锁定关联
                RuntimeContextMonitor.lock(this);
            },
            attached() {
                if (extender._initializationCompatibleContextEnabled === true) {
                    // 启用临时容器测试结果
                    RuntimeContextMonitor.unlock(this);
                    return;
                }

                // 初始化计算属性
                const computed = context.get("computed");
                const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];
                getters.forEach(p => {
                    const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                    if (isFunction(getter)) {
                        // 初始值直接提交
                        this[p] = getter.call(this);
                    }
                });
                // 解锁计算属性关联
                RuntimeContextMonitor.unlock(this);
            }
        }
    }

    beforeUpdate(extender, context, options, instance, data) {
        // 锁定关联 提交计算结果到组件 提交过程中的读写操作与框架无关
        if (RuntimeContextMonitor.isLocked(instance)) {
            return;
        }

        const computed = context.get("computed");
        const linkAge = context.get("linkAge");
        const runtimeContext = extender.getRuntimeContext(instance).get();

        for (const path in data) {
            const value = data[path];
            const src = selectPathRoot(path);

            // 依赖聚集
            PropertiesCollection.add(instance, src);

            // 移除已处理值
            delete data[path];

            if (PropertyMonitor.isLocked(instance, src)) {
                return;
            }
            PropertyMonitor.lock(instance, src);
            if (src !== path) {
                if (getData(instance.data, path) !== value) {
                    setData(instance.data, {[path]: value});
                }
            } else {
                const setter = computed[src] && isFunction(computed[src].set) ? computed[src].set : null;
                if (value !== instance.data[src]) {
                    if (isFunction(setter)) {
                        setter.call(runtimeContext, value);
                        const getter = computed[src] && isFunction(computed[src].get) ? computed[src].get : computed[src];
                        if (isFunction(getter)) {
                            instance.data[src] = getter.call(runtimeContext);
                        } else {
                            throw new Error(`Getter is missing for computed property "${src}".`);
                        }
                    } else {
                        setData(instance.data, {[path]: value});
                    }
                }
            }
            const targets = linkAge.get(src);
            if (targets) {
                targets.forEach(p => {
                    if (!PropertyMonitor.isLocked(instance, p)) {
                        const getter = computed[p] && isFunction(computed[p].get) ? computed[p].get : computed[p];
                        if (isFunction(getter)) {
                            runtimeContext[p] = getter.call(runtimeContext);
                        } else {
                            runtimeContext[p] = instance.data[p];
                        }
                    }
                });
            }
            PropertyMonitor.unlock(instance, src);
        }

        RuntimeContextMonitor.lock(instance);
        const payload = {};
        const props = PropertiesCollection.all(instance);
        for (const i of props) {
            payload[i] = instance.data[i];
        }
        PropertiesCollection.clear(instance);
        const originalSetData = context.get("originalSetData") || this.setData;
        if (isFunction(originalSetData)) {
            originalSetData(payload);
        }
        RuntimeContextMonitor.unlock(instance);
    }

    observers(extender, context, options) {
        const linkAge = context.get("linkAge");
        const properties = context.get("properties");
        const computed = context.get("computed");
        const observers = {};
        for (const p of linkAge.keys()) {
            if (Reflect.has(properties, p)) {
                observers[p] = function () {
                    const targets = linkAge.get(p);
                    if (targets) {
                        for (const t of targets) {
                            const getter = computed[t] && isFunction(computed[t].get) ? computed[t].get : computed[t];
                            if (isFunction(getter)) {

                            } else {
                                throw new Error(`Getter is missing for computed property "${t}".`);
                            }
                        }
                    }
                };
            }
        }
        return observers;
    }

    install(extender, context, options) {
        const properties = context.get("properties");
        const methods = context.get("methods");
        const state = context.get("state");
        const $options = context.has("constants") ? context.get("constants") : extender.createConstantsContext(options);
        const beforeCreate = context.get("beforeCreate");
        const originalState = clone(state);

        const {computed = null} = options;
        context.set("computed", Stream.of(
                Object.entries(
                    Object.assign.apply(
                        undefined,
                        [
                            {},
                            ...extender.installers.map(i => i.computed()),
                            computed
                        ]
                    )
                )
            ).map(([prop, handler]) => {
                const normalize = {
                    get: null,
                    set: null
                };
                if (handler) {
                    if (isFunction(handler)) {
                        normalize.get = handler;
                    } else if (isFunction(handler.get)) {
                        normalize.get = handler.get;
                    }
                    if (isFunction(handler.set)) {
                        normalize.set = handler.set;
                    }
                }
                return [prop, normalize];
            }).collect(Collectors.toMap())
        );

        const linkAge = this.attemptToInstantiateCalculated(extender, context, options);
        if (isFunction(beforeCreate)) {
            // 移除 beforeCreate 临时上下文
            // beforeCreate 回调中不可访问任何属性
            if (extender._initializationCompatibleContextEnabled === true) {
                const stateContext = extender.createInitializationContextSingleton();
                beforeCreate.call(stateContext.get(state, linkAge, properties, computed, methods, $options));
                stateContext.release();
            } else {
                beforeCreate.call(undefined);
            }
        }
        context.set("linkAge", linkAge);
        context.set("state", originalState);

        // 直接注入测试容器结果，options 配置中仅可配置 beforeCreate 回调
        if (extender._initializationCompatibleContextEnabled === true) {
            context.set("state", state);
        }
    }
}