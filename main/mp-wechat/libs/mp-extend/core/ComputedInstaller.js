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

    attemptToInstantiateCalculated(extender, context, options) {
        const computed = context.get("computed");
        const $options = context.has("constants") ? context.get("constants") : extender.createConstantsContext(options);
        const methods = context.get("methods");
        const properties = context.get("properties");
        const state = context.get("state");
        return extender.getComputedDependencies(state, properties, computed, methods, $options);
    }

    beforeUpdate(extender, context, options, instance, data) {
        const computed = context.get("computed");
        const pendingSetters = [];

        const originalSetData = context.has("originalSetData") ? context.get("originalSetData").bind(instance) : instance.setData.bind(instance);

        Object.keys(data).forEach(p => {
            if (computed[p]) {
                pendingSetters.push([p, data[p]]);
                delete data[p];
            }
        });

        if (pendingSetters.length) {
            pendingSetters.forEach(([p, param]) => {
                if (computed[p] && isFunction(computed[p].set)) {
                    computed[p].set.call(
                        this.getRuntimeContext(
                            instance, context, originalSetData
                        ),
                        param
                    );
                } else {
                    throw new Error(`Computed property "${p}" was assigned to but it has no setter.`);
                }
            });
        }
    }

    updated(extender, context, options, instance, data) {
        const computed = context.get("computed");
        const originalSetData = context.has("originalSetData") ? context.get("originalSetData").bind(instance) : instance.setData.bind(instance);

        const nextComputedValues = [];

        Object.keys(computed).forEach(p => {
            if (computed[p] && (isFunction(computed[p].get) || isFunction(computed[p]))) {
                const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                const pValue = getter.call(
                    this.getRuntimeContext(
                        instance, context, originalSetData
                    )
                );
                if (!equal(pValue, instance.data[p])) {
                    nextComputedValues.push([p, pValue]);
                }
            } else {
                throw new Error(`Getter is missing for computed property "${p}".`);
            }
        });

        if (nextComputedValues.length) {
            const next = Stream.of(nextComputedValues).collect(Collectors.toMap());
            originalSetData(next);
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const state = context.get("state");

        // 检查是否安装StateInstaller
        if (isPlainObject(state)) {
            const createContext = () => {
                return extender.createRuntimeContextSingleton();
            };

            const initContext = (thisArg, fnSetData) => {
                return this.getRuntimeContext(thisArg, context, fnSetData);
            };

            const releaseContext = (thisArg) => {
                this.releaseRuntimeContext(thisArg);
            };

            defFields.behaviors = [
                Behavior({
                    lifetimes: {
                        created() {
                            Object.defineProperty(this, RTCSign, {
                                configurable: false,
                                enumerable: false,
                                value: createContext(),
                                writable: false
                            });
                            initContext(this, context.has("originalSetData") ? context.get("originalSetData") : this.setData.bind(this));
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
        const props = context.get("properties");
        const onPropertyChanged = (instance, data) => {
            this.updated(extender, context, options, instance, data);
        };
        return Stream.of(Object.keys(props)).map(p => {
            return [p, function (val) {
                onPropertyChanged(this, {[p]: val});
            }];
        }).collect(Collectors.toMap());
    }

    install(extender, context, options) {
        const properties = context.get("properties");
        const methods = context.get("methods");
        const state = context.get("state");
        const $options = context.has("constants") ? context.get("constants") : extender.createConstantsContext(options);
        const beforeCreate = context.get("beforeCreate");

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
        const stateContext = extender.createInitializationCompatibleContext(state, linkAge, properties, computed, methods, $options);
        if (isFunction(beforeCreate)) {
            beforeCreate.call(stateContext);
        }
    }
}