import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isNullOrEmpty} from '../utils/common';
import {Singleton} from "../libs/Singleton";

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    compatibleContext = new Singleton((thisArg) => {
        return this.createRuntimeCompatibleContext(thisArg);
    });

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const {methods = {}} = defFields;
        const computed = context.get('computed');
        const compatibleContext = this.compatibleContext;

        const behavior = {
            created: function () {
                Object.entries(
                    Stream.of(
                        Object.entries(context.get('properties') || {})
                    ).filter(i => !isNullOrEmpty(i[1]) && isFunction(i[1].validator)).collect(Collectors.toMap())
                ).forEach(([name, constructor]) => {
                    constructor.validator.call(compatibleContext.get(this), compatibleContext.get(this).data[name], undefined);
                });
            }
        };

        if (Object.keys(methods).length) {
            Object.assign(defFields, {
                methods: Stream.of(
                    Object.entries(defFields.methods)
                ).map(([name, method]) => {
                    return [name, isFunction(method) ? function () {
                        return method.apply(compatibleContext.get(this), arguments);
                    } : method];
                }).collect(Collectors.toMap())
            });
        }

        if (computed && Object.keys(computed).length) {
            Object.keys(computed).forEach(i => {
                const c = computed[i];
                computed[i] = isFunction(c) ? function () {
                    return c.apply(compatibleContext.get(this), arguments);
                } : c;
            });
        }

        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior(behavior)
        ]);
    }

    install(extender, context, options) {
        const {
            onLoad,
            onReady,
            onUnload,
            onPullDownRefresh,
            onReachBottom,
            onShareAppMessage,
            onShareTimeline,
            onAddToFavorites,
            onPageScroll,
            onTabItemTap,
            beforeCreate,
            created,
            beforeMount,
            mounted,
            beforeUpdate,
            updated,
            beforeDestroy,
            destroyed,
            onShow,
            onHide,
            onResize,
            pageLifetimes = {},
            lifetimes = {},
            ...members
        } = options;

        const compatibleContext = this.compatibleContext;

        Object.assign(
            options,
            {
                pageLifetimes: {
                    show: function () {
                        if (isFunction(pageLifetimes.show)) {
                            pageLifetimes.show.apply(compatibleContext.get(this), arguments);
                        }
                    },
                    hide: function () {
                        if (isFunction(pageLifetimes.hide)) {
                            pageLifetimes.hide.apply(compatibleContext.get(this), arguments);
                        }
                    },
                    resize: function (size) {
                        if (isFunction(pageLifetimes.resize)) {
                            pageLifetimes.resize.apply(compatibleContext.get(this), arguments);
                        }
                    }
                },
                lifetimes: {
                    attached: function () {
                        if (isFunction(lifetimes.attached)) {
                            lifetimes.attached.apply(compatibleContext.get(this), arguments);
                        }
                    },
                    detached: function () {
                        if (isFunction(lifetimes.detached)) {
                            lifetimes.detached.apply(compatibleContext.get(this), arguments);
                        }
                    }
                }
            },
            Stream.of(Object.entries({
                onLoad,
                onReady,
                onUnload,
                onPullDownRefresh,
                onReachBottom,
                onShareAppMessage,
                onShareTimeline,
                onAddToFavorites,
                onPageScroll,
                onTabItemTap,
                beforeCreate,
                created,
                beforeMount,
                mounted,
                beforeUpdate,
                updated,
                beforeDestroy,
                destroyed,
                onShow,
                onHide,
                onResize,
                ...Stream.of(Object.entries(members || {})).filter(([, v]) => isFunction(v)).collect(Collectors.toMap())
            })).map(([name, func]) => {
                return [name, function () {
                    if (isFunction(func)) {
                        func.apply(compatibleContext.get(this), arguments);
                    }
                }];
            }).collect(Collectors.toMap())
        );
    }
}