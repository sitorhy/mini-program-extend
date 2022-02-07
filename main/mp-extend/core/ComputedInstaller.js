import OptionInstaller from "./OptionInstaller";
import {isFunction} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import equal from "../libs/fast-deep-equal/index";

/**
 * 为防止闭环，计算属性初始化在data,props初始化之后
 */
export default class ComputedInstaller extends OptionInstaller {
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
                        extender.getRuntimeContext(instance).get(),
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
                    extender.getRuntimeContext(instance).get()
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
        const stateContext = extender.createInitializationContextSingleton();
        if (isFunction(beforeCreate)) {
            // beforeCreate 暂不移除上下文
            beforeCreate.call(stateContext.get(state, linkAge, properties, computed, methods, $options));
        }
        stateContext.release();
    }
}