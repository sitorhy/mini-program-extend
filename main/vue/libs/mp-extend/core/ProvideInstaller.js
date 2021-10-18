import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject, isString, isSymbol} from "../utils/common";
import {Blend} from "../libs/Blend";

/**
 * provide 初始化 优先于 data/props
 * provide 不能访问 data/props，并且数据为非响应式
 */
export default class ProvideInstaller extends OptionInstaller {
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
                        
                    }
                }
            })
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