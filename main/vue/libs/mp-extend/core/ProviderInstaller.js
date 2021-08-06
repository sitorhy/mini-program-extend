import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject, isString, isSymbol, uuid} from "../utils/common";
import {Blend} from "../libs/Blend";

const ANCESTOR_TAG_OBFS = `ancestor-${uuid()}`;
const DESCENDANT_TAG_OBFS = `descendant-${uuid()}`;

const ProvideSign = Symbol('__wxProvide__');

const ProvideBehavior = Behavior({});

const InjectBehavior = Behavior({});

const LinkBehavior = Behavior({
    relations: {
        [ANCESTOR_TAG_OBFS]: {
            type: 'ancestor',
            target: ProvideBehavior,
            linked(target) {
                const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
                const provider = Reflect.get(target, ProvideSign);
                Reflect.defineProperty(
                    this,
                    ProvideSign,
                    Object.assign(
                        {},
                        Reflect.get(root, ProvideSign),
                        Reflect.get(this, ProvideSign),
                        provider
                    )
                );
            },
            unlinked() {
                Reflect.deleteProperty(this, ProvideSign);
            }
        },
        [DESCENDANT_TAG_OBFS]: {
            type: 'descendant',
            target: InjectBehavior
        }
    }
});

/**
 * provide 初始化 优先于 data/props
 * provide 不能访问 data/props，并且数据为非响应式
 */
export default class ProviderInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior({
                attached() {
                    const provide = context.get('provide');
                    if (isFunction(provide)) {
                        const provider = provide.call(
                            extender.createRuntimeContextSingleton().get(
                                this,
                                context.get("properties"),
                                context.get("computed"),
                                this.setData.bind(this)
                            )
                        );
                        Object.defineProperty(this, ProvideSign, {
                            enumerable: false,
                            configurable: true,
                            value: provider
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
                context.set('provide', Blend(staticProvide, generator));
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
            context.set('inject', inject);
        } catch (e) {
            throw e;
        }
    }
}