import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import {Singleton} from "../libs/Singleton";
import equal from "../libs/fast-deep-equal/index";

class ComputedSourceSingleton extends Singleton {
    _source = undefined;

    get source() {
        return this._source;
    }

    set source(value) {
        this._source = value;
    }

    constructor() {
        super((runtimeContext) => {
            const self = this;
            return new Proxy(runtimeContext, {
                get(target, p, receiver) {
                    if (isPlainObject(self.source) && Reflect.has(self.source, p)) {
                        return Reflect.get(self.source, p);
                    }
                    return Reflect.get(target, p);
                },
                set(target, p, value, receiver) {
                    return Reflect.set(target, p, value);
                }
            });
        });
    }

    get(runtimeContext, source) {
        this.source = source;
        return super.get(runtimeContext);
    }
}

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
            const getters = isPlainObject(computed) ? Object.keys(computed).filter(i => (isPlainObject(computed[i]) && isFunction(computed[i].get)) || isFunction(computed[i])) : [];
            const runtimeContext = new Singleton((context) => {
                return this.createRuntimeCompatibleContext(context, computed)
            });
            const computedContext = new ComputedSourceSingleton();

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
                                const nextCalculated = {};
                                getters.forEach((p) => {
                                    const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                                    const curVal = Reflect.get(computedContext.get(runtimeContext.get(this), data), p);
                                    const pValue = getter.call(computedContext.get(runtimeContext.get(this), data));
                                    if (!equal(curVal, pValue)) {
                                        nextCalculated[p] = pValue;
                                    }
                                });
                                Object.assign(data, nextCalculated);
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