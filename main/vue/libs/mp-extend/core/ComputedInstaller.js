import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject, removeEmpty} from "../utils/common";
import {Optional} from "../libs/Optional";
import {Collectors, Stream} from "../libs/Stream";

import equal from "../libs/fast-deep-equal/index";
import {Singleton} from "../libs/Singleton";

/**
 * 为防止闭环，计算属性初始化在data,props初始化之后
 */
export default class ComputedInstaller extends OptionInstaller {
    attemptToInstantiateCalculated(extender, context, options, defFields, definitionFilterArr) {
        const computed = context.get('computed');
        const methods = context.get('methods');
        const state = Object.assign({}, context.get('state')); // 复制结果集，避免修改原值

        const computedContext = Object.create(new Proxy(
            {},
            {
                get(target, p, receiver) {
                    if (Reflect.has(state, p)) {
                        return Reflect.get(state, p);
                    }
                    if (Reflect.has(computed, p)) {
                        const expr = Reflect.get(computed, p);
                        if (isFunction(expr)) {
                            return expr.call(computedContext);
                        } else if (isPlainObject(expr) && isFunction(expr.get)) {
                            return (expr.get).call(computedContext);
                        } else if (Reflect.has(methods, p)) {
                            const method = Reflect.get(methods, p);
                            if (isFunction(method)) {
                                return method.bind(computedContext);
                            }
                        }
                    }
                    return undefined;
                }
            }
        ));

        const calculated = Stream.of(Object.entries(computed)).map(([name, calc]) => {
            const expr = isPlainObject(calc) && isFunction(calc.get) ? calc.get : (isFunction(calc) ? calc : null);
            if (isFunction(expr)) {
                return [name, expr.call(computedContext)];
            }
            return null;
        }).filter(i => !!i).collect(Collectors.toMap());

        return calculated;
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const state = context.get('state');
        const computed = context.get('computed');

        // 检查是否安装StateInstaller
        if (isPlainObject(state)) {
            const calculated = this.attemptToInstantiateCalculated(extender, context, options, defFields, definitionFilterArr);
            const setters = Object.keys(computed).filter(i => isPlainObject(computed[i]) && isFunction(computed[i].set));
            const runtimeContext = new Singleton((context) => {
                return this.createRuntimeCompatibleContext(context, computed);
            });
            Object.assign(defFields, {
                behaviors: (defFields.behaviors || []).concat(
                    Behavior({
                        data: calculated,
                        created() {
                            const originalSetData = this.setData;

                            // 当已setData形式触发计算属性时
                            this.setData = function (data, callback) {
                                const setterIncludes = Object.keys(data).filter(i => setters.includes(i));
                                if (setterIncludes.length) {
                                    setterIncludes.forEach((i) => {
                                        (computed[i].set).call(runtimeContext.get(this), data[i]);
                                    });
                                }
                                originalSetData.call(this, data, function () {
                                    if (isFunction(callback)) {
                                        callback.call(runtimeContext.get(this));
                                    }
                                });
                            };
                        }
                    })
                )
            });
        }
    }

    install(extender, context, options) {
        const {computed = null} = options;
        context.set('computed', Object.assign.apply(
            undefined,
            [
                {},
                ...extender.installers.map(i => i.computed()),
                computed
            ]
        ));
    }
}