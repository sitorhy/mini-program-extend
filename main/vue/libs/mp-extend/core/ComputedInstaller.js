import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import equal from "../libs/fast-deep-equal/index";

const RTCSign = Symbol("__wxRTC__");

/**
 * 为防止闭环，计算属性初始化在data,props初始化之后
 */
export default class ComputedInstaller extends OptionInstaller {
    getRuntimeContext(thisArg, context, fnSetData) {
        if (Reflect.has(thisArg, RTCSign)) {
            return Reflect.get(thisArg, RTCSign).get(thisArg, context.get("properties"), context.get("computed"), fnSetData);
        }
        return thisArg;
    }

    releaseRuntimeContext(thisArg) {
        if (Reflect.has(thisArg, RTCSign)) {
            Reflect.get(thisArg, RTCSign).release();
            Reflect.deleteProperty(this, RTCSign);
        }
    }

    attemptToInstantiateCalculated(extender, context, options, defFields, definitionFilterArr) {
        const computed = context.get("computed");
        const methods = context.get("methods");
        const state = Object.assign({}, context.get("state")); // 复制结果集，避免修改原值
        const computedContext = new Proxy(
            {
                data: state
            },
            {
                get(target, p, receiver) {
                    // 兼容小程序格式
                    if (p === "data") {
                        return Reflect.get(target, p);
                    }
                    if (Reflect.has(state, p)) {
                        return Reflect.get(state, p);
                    }
                    if (Reflect.has(computed, p)) {
                        const calc = Reflect.get(computed, p);
                        if (isFunction(calc.get)) {
                            return (calc.get).call(receiver);
                        }
                    } else if (Reflect.has(methods, p)) {
                        const method = Reflect.get(methods, p);
                        if (isFunction(method)) {
                            return method.bind(receiver);
                        }
                    }
                    return undefined;
                }
            }
        );

        return Stream.of(Object.entries(computed)).map(([name, calc]) => {
            if (isFunction(calc.get)) {
                return [name, calc.get.call(computedContext)];
            }
            return undefined;
        }).filter(i => !!i).collect(Collectors.toMap());
    }

    beforeUpdate(extender, context, options, instance, data) {
        const computed = context.get("computed");
        const setterIncludes = Object.keys(data).filter(i => Reflect.has(computed, i) && isFunction(computed[i].set));
        // 是否安装 UpdateInstaller
        const originalSetData = context.has("originalSetData") ? context.get("originalSetData").bind(instance) : instance.setData.bind(instance);

        // setData数据是否包含计算属性，调用对应的setter触发器
        if (setterIncludes.length) {
            // this.setData(..) 形式 , 前置更新 state
            setterIncludes.forEach((i) => {
                (computed[i].set).call(
                    this.getRuntimeContext(instance, context, originalSetData),
                    data[i]
                );
            });
        }

        // 刷新计算属性的值
        const nextCalculated = {};
        Object.keys(computed).forEach((p) => {
            const getter = computed[p].get;
            // 获取当前值
            const curVal = Reflect.get(this.getRuntimeContext(instance, context, originalSetData), p);

            if (isFunction(getter)) {
                // 计算下一个值
                const pValue = getter.call(
                    this.getRuntimeContext(
                        instance, context, originalSetData
                    )
                );

                // 深度比较，必须，否则会死循环
                if (!equal(curVal, pValue)) {
                    nextCalculated[p] = pValue;
                }
            } else {
                throw new Error(`Getter is missing for computed property "${p}"`);
            }
        });

        // 合并新的计算属性值到data中
        Object.assign(data, nextCalculated);
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const state = context.get("state");

        // 检查是否安装StateInstaller
        if (isPlainObject(state)) {
            const calculated = this.attemptToInstantiateCalculated(extender, context, options, defFields, definitionFilterArr);

            const createContext = () => {
                return extender.createRuntimeContextSingleton();
            };

            const initContext = (thisArg, fnSetData) => {
                return this.getRuntimeContext(thisArg, context, fnSetData);
            };

            const releaseContext = (thisArg) => {
                this.releaseRuntimeContext(thisArg);
            };
            
            // 主动触发一次 setData，初始化计算属性，防止组件没有任何赋值操作
            const checkCalculated = (extender, context, options, instance) => {
                const calculated = {};
                this.beforeUpdate(extender, context, options, instance, calculated);
                const currentCalculated = Stream.of(Object.keys(calculated)).map(i => {
                    return [i, Reflect.get(instance, "data")[i]];
                }).collect(Collectors.toMap());
                if (!equal(calculated, currentCalculated)) {
                    const originalSetData = context.has("originalSetData") ? context.get("originalSetData").bind(instance) : instance.setData.bind(instance);
                    originalSetData(calculated);
                }
            };

            defFields.behaviors = [
                Behavior({
                    data: calculated,
                    lifetimes: {
                        created() {
                            Object.defineProperty(this, RTCSign, {
                                configurable: false,
                                enumerable: false,
                                value: createContext(),
                                writable: false
                            });
                            initContext(this, context.has("originalSetData") ? context.get("originalSetData") : this.setData.bind(this));
                        },
                        attached() {
                            checkCalculated(extender, context, options, this);
                        }
                    }
                })
            ].concat(
                (defFields.behaviors || []),
                Behavior({
                    lifetimes: {
                        detached() {
                            releaseContext(this);
                        }
                    }
                })
            );
        }
    }

    observers(extender, context, options) {
        const beforeUpdate = (instance, data) => {
            const copy = Object.assign({}, data);
            this.beforeUpdate(extender, context, options, instance, copy);
            const computed = context.get("computed");
            const nextCalculated = {};
            Object.keys(computed).forEach((key) => {
                if (!equal(copy[key], data[key])) {
                    nextCalculated[key] = copy[key];
                }
            });
            if (Object.keys(nextCalculated).length) {
                const originalSetData = context.has("originalSetData") ? context.get("originalSetData").bind(instance) : instance.setData.bind(instance);
                originalSetData(nextCalculated);
            }
        };
        const props = context.get("properties");
        return Stream.of(Object.keys(props)).map(name => {
            return [name, function (val) {
                beforeUpdate(this, {[name]: val});
            }];
        }).collect(Collectors.toMap());
    }

    install(extender, context, options) {
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
    }
}