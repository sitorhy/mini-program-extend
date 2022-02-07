import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject, isString, isSymbol, uuid} from "../utils/common";
import {Blend} from "../libs/Blend";

const ANCESTOR_TAG_OBS = `ancestor-${uuid()}`;
const DESCENDANT_TAG_OBS = `descendant-${uuid()}`;

const ProvideSign = Symbol("__wxProvide__");
const InjectSign = Symbol("__wxInject__");

const ProvideBehavior = Behavior({});
const InjectBehavior = Behavior({});
const LinkBehavior = Behavior({
    relations: {
        [ANCESTOR_TAG_OBS]: {
            type: "ancestor",
            target: ProvideBehavior,
            linked(target) {
                const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
                const provider = Reflect.get(target, ProvideSign);
                const inject = Reflect.get(this, InjectSign);
                const mergeProvider = Object.assign(
                    {},
                    Reflect.get(root, ProvideSign),
                    Reflect.get(this, ProvideSign),
                    provider
                );
                Reflect.defineProperty(
                    this,
                    ProvideSign,
                    mergeProvider
                );
                if (inject) {
                    const injection = {};
                    Object.entries(inject).forEach(([k, v]) => {
                        Object.assign(injection, {
                            [k]: Reflect.get(mergeProvider, v.from) || (isFunction(v.default) ? v.default.call(this) : v.default)
                        });
                    });
                    if (Object.keys(injection).length) {
                        this.setData(injection);
                    }
                }
            },
            unlinked() {
                Reflect.deleteProperty(this, ProvideSign);
                Reflect.deleteProperty(this, InjectSign);
            }
        },
        [DESCENDANT_TAG_OBS]: {
            type: "descendant",
            target: InjectBehavior
        }
    }
});

/**
 * provide / inject
 * 由于无法在编译时获取层级关系 无法完全实现
 * 仅用于跨层传值 合并到 data 中
 */
export default class ProviderInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior({
                attached() {
                    const provide = context.get("provide");
                    const inject = context.get("inject");
                    const runtimeContext = extender.getRuntimeContext(this).get();
                    if (isFunction(provide)) {
                        const provider = provide.call(runtimeContext);
                        Object.defineProperty(this, ProvideSign, {
                            enumerable: false,
                            configurable: true,
                            value: provider
                        });
                    }
                    if (inject) {
                        Object.defineProperty(this, InjectSign, {
                            enumerable: false,
                            configurable: true,
                            value: inject
                        });
                    }
                }
            }),
            ProvideBehavior,
            InjectBehavior,
            LinkBehavior
        ]);
    }

    install(extender, context, options) {
        try {
            const staticProvide = {};
            const fnProvides = [];
            extender.installers.map(i => i.provide()).concat((options || {}).provide).forEach(i => {
                if (i) {
                    if (!isFunction(i)) {
                        Object.assign(staticProvide, i);
                    } else {
                        fnProvides.push(i);
                    }
                }
            });
            const generator = function () {
                return fnProvides.reduce((s, i) => {
                    return Object.assign(s, i.call(this));
                }, {});
            }
            if (fnProvides.length || Object.keys(staticProvide).length) {
                context.set("provide", Blend(staticProvide, generator));
            }
        } catch (e) {
            throw e;
        }

        try {
            const inject = {};
            extender.installers.map(i => i.inject()).concat((options || {}).inject).forEach(i => {
                if (i) {
                    if (Array.isArray(i)) {
                        i.forEach(j => {
                            if (isString(j) || isSymbol(j)) {
                                Object.assign(inject, {
                                    [j]: {
                                        from: j,
                                        default: undefined
                                    }
                                });
                            } else {
                                Object.entries(j).forEach(([k, v]) => {
                                    Object.assign(inject, {
                                        [k]: {
                                            from: k,
                                            default: isPlainObject(v) ? v.default : undefined
                                        }
                                    });
                                });
                            }
                        });
                    } else {
                        Object.entries(i).forEach(([k, v]) => {
                            Object.assign(inject, {
                                [k]: {
                                    from: k,
                                    default: isPlainObject(v) ? v.default : undefined
                                }
                            });
                        });
                    }
                }
            });
            if (Object.keys(inject).length) {
                context.set("inject", inject);
            }
        } catch (e) {
            throw e;
        }
    }
}