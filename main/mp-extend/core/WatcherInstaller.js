import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject, isPrimitive, isString} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import CompatibleWatcher from "../libs/CompatibleWatcher";
import equal from "../libs/fast-deep-equal/index";
import {Invocation} from "../libs/Invocation";
import clone from "../libs/rfdc/default";

const SWATSign = Symbol("__wxSWAT__");
const DWATSign = Symbol("__wxDWAT__");

/**
 * immediate - 拦截 mounted/attached 前置执行
 * deep - 加上 ".**" 后缀
 *
 * 对于 properties 默认值 与 查询串值同时存在时，created执行后会被查询串的值覆盖：
 * properties = { a:{ value:114,observer:ob1 } } , observers:{ a:ob2 }，同时页面传入page?a=514
 * 在 attached 执行前，在created取得的值是a=114，attached后取得的值变为a=514，并且触发ob1 (114=>514)  ,ob2(514)，优先级ob1>ob2
 * 并且 触发器触发时机在 created 与 attached 之间
 *
 * 由于小程序新增的 observers配置 并不会传入旧值，想要兼容Vue获取旧值并保存，可以拦截created获取旧值，此时的属性值还没有被查询串值覆盖
 * 并且created执行时所有侦听器还没有被执行，当侦听器执行时，可以顺利将传入的新值与旧值比对
 *
 */
export default class WatcherInstaller extends OptionInstaller {

    /**
     * Vue 形式侦听器格式只包含数字字母下划线和点运算符
     * @param data
     * @param path
     * @returns {any|undefined}
     */
    selectData(data, path) {
        if (!path) {
            return undefined;
        }
        if (!/[\w\.]+/.test(path)) {
            throw new Error(`Failed watching path: "${path}" Watcher only accepts simple dot-delimited paths. For full control, use a function instead.`);
        }
        if ((data === null || data === undefined || isPrimitive(data)) && path) {
            return undefined;
        }
        const iDot = path.indexOf(".");
        const prop = path.substring(0, iDot < 0 ? path.length : iDot);
        const right = path.substring(prop.length + 1);
        if (!right) {
            return Reflect.get(data, prop);
        } else {
            return this.selectData(Reflect.get(data, prop), right);
        }
    }

    /**
     * 转换Vue的格式为小程序格式
     * @param rule
     * @returns {*}
     */
    transformToObserverField(rule) {
        return rule.replace(/\.(\d+)/g, function () {
            return `[${arguments[1]}]`;
        });
    }

    getStaticWatcher(thisArg, path) {
        return Reflect.get(thisArg, SWATSign).get(path);
    }

    getDynamicWatchers(thisArg) {
        return Reflect.get(thisArg, DWATSign);
    }

    dynamicWatchersDefinition(thisArg) {
        const selectRuntimeState = (data, path) => {
            return this.selectData(data, path);
        };

        if (!Object.hasOwnProperty.call(thisArg, "$watch")) {
            const $watch = function (expOrFn, callback, options) {
                if (isFunction(expOrFn)) {
                    const watcher = new CompatibleWatcher(
                        undefined,
                        function (newValue, oldValue) {
                            if (!equal(newValue, oldValue)) {
                                callback.call(this, newValue, oldValue);
                            }
                        },
                        function (newValue, oldValue) {
                            if (watcher.immediate) {
                                callback.call(this, newValue, oldValue);
                            }
                        },
                        options && options.immediate === true,
                        true,
                        undefined,
                        function () {
                            return expOrFn.call(this);
                        }
                    );
                    watcher.once(thisArg, [expOrFn.call(thisArg)]);
                    const sign = Symbol("expOrFn");
                    Reflect.get(thisArg, DWATSign).set(
                        sign,
                        watcher
                    );
                    return function () {
                        Reflect.get(thisArg, DWATSign).delete(sign);
                    };
                } else if (isString(expOrFn)) {
                    const watcher = new CompatibleWatcher(
                        expOrFn,
                        function (newValue, oldValue) {
                            if (!equal(newValue, oldValue)) {
                                callback.call(this, newValue, oldValue);
                            }
                        },
                        function (newValue, oldValue) {
                            if (watcher.immediate) {
                                callback.call(this, newValue, oldValue);
                            }
                        },
                        options && options.immediate === true,
                        true,
                        undefined
                    );
                    watcher.once(thisArg, [selectRuntimeState(thisArg.data, expOrFn)]);
                    const sign = Symbol("expOrFn");
                    Reflect.get(thisArg, DWATSign).set(
                        sign,
                        watcher
                    );
                    return function () {
                        Reflect.get(thisArg, DWATSign).delete(sign);
                    };
                } else {
                    throw new Error(`"${expOrFn}" is neither a string nor a function.`);
                }
            };

            Object.defineProperty(thisArg, "$watch", {
                configurable: false,
                enumerable: false,
                get() {
                    return $watch;
                }
            })
        }
    }

    /**
     * 对于静态监听器，编译期间便可确定旧值
     * @param extender
     * @param context
     * @param options
     * @param defFields
     */
    staticWatchersDefinition(extender, context, options, defFields) {
        const watch = context.get("watch");
        const observers = context.get("observers");
        const computed = context.get("computed");

        const createStaticWatchers = () => {
            const staticWatchers = new Map();

            Object.entries(watch).forEach(([path, watchers]) => {
                const observerPath = this.transformToObserverField(path);

                const deepWatchers = watchers.filter(w => w.deep === true);
                const shallowWatchers = watchers.filter(w => w.deep !== true);

                if (deepWatchers.length) {
                    const compatibleWatcher = new CompatibleWatcher(
                        path,
                        function (newValue, oldValue) {
                            if (!equal(newValue, oldValue)) {
                                deepWatchers.forEach(w => {
                                    w.handler.call(this, newValue, oldValue);
                                });
                            }
                        },
                        function (newValue, oldValue) {
                            deepWatchers.forEach(w => {
                                if (!w.enabled) {
                                    w.enabled = true;
                                } else if (w.immediate === true) {
                                    w.handler.call(this, newValue, oldValue);
                                }
                            });
                            compatibleWatcher.enabled = true;
                        }, true, true, undefined);
                    compatibleWatcher.enabled = !Reflect.has(computed, compatibleWatcher.path);
                    staticWatchers.set(`${observerPath}.**`, compatibleWatcher);
                }

                if (shallowWatchers.length) {
                    const compatibleWatcher = new CompatibleWatcher(
                        path,
                        function (newValue, oldValue) {
                            if (newValue !== oldValue) {
                                shallowWatchers.forEach(w => {
                                    w.handler.call(this, newValue, oldValue);
                                });
                            }
                        },
                        function (newValue, oldValue) {
                            shallowWatchers.forEach(w => {
                                if (!w.enabled) {
                                    w.enabled = true;
                                } else if (w.immediate === true) {
                                    w.handler.call(this, newValue, oldValue);
                                }
                            });
                            compatibleWatcher.enabled = true;
                        }, true, false, undefined);
                    compatibleWatcher.enabled = !Reflect.has(computed, compatibleWatcher.path);
                    staticWatchers.set(observerPath, compatibleWatcher);
                }
            });

            return staticWatchers;
        };

        const getStaticWatcher = (thisArg, path) => {
            return this.getStaticWatcher(thisArg, path);
        };

        const selectRuntimeState = (data, path) => {
            return this.selectData(data, path);
        };

        const behavior = {
            lifetimes: {
                created() {
                    const staticWatchers = createStaticWatchers();

                    Object.defineProperty(this, SWATSign, {
                        configurable: false,
                        enumerable: false,
                        value: staticWatchers,
                        writable: false
                    });

                    Object.defineProperty(this, DWATSign, {
                        configurable: false,
                        enumerable: false,
                        value: new Map(),
                        writable: false
                    });
                },
                detached() {
                    Reflect.deleteProperty(this, SWATSign);
                    Reflect.deleteProperty(this, DWATSign);
                }
            }
        };

        defFields.behaviors = [Behavior(behavior)].concat((defFields.behaviors || []));
        defFields.behaviors.push(Behavior({
            created() {
                const staticWatchers = Reflect.get(this, SWATSign);
                for (const observerPath of staticWatchers.keys()) {
                    const watcher = getStaticWatcher(this, observerPath);
                    if (watcher) {
                        // 设置侦听器初始值，并触发 immediate 侦听器
                        // 计算属性还没有计算初始值，排除掉
                        if (watcher.enabled) {
                            const curValue = selectRuntimeState(this.data, watcher.path);
                            watcher.once(this, [curValue]);
                        }
                    }
                }
            },
            observers: Stream.of(
                [...new Set(
                    [
                        ...Object.keys(observers),
                        ...Stream.of(Object.entries(watch)).flatMap(([path, watchers]) => {
                            const deepWatchers = watchers.filter(w => w.deep === true);
                            const shallowWatchers = watchers.filter(w => w.deep !== true);
                            const observerPath = this.transformToObserverField(path);

                            const paths = [];

                            if (deepWatchers.length) {
                                paths.push(`${observerPath}.**`);
                            }

                            if (shallowWatchers.length) {
                                paths.push(`${observerPath}`);
                            }

                            return paths;
                        })
                    ]
                )].map((observerPath) => {
                    return [
                        observerPath,
                        Invocation(observers[observerPath], null, function (newValue) {
                            const watcher = getStaticWatcher(this, observerPath);
                            if (watcher) {
                                if (!watcher.enabled) {
                                    // 初始化计算属性监听器 启用计算属性监听器 跳过第一次 undefined -> any
                                    // once 中启动监听器
                                    watcher.once(this, [newValue]);
                                } else {
                                    watcher.call(this, [newValue]);
                                }
                            }
                        })
                    ];
                })
            ).collect(Collectors.toMap())
        }));
    }

    updateDeepWatcherRef(instance, watchers) {
        for (const [, watcher] of watchers) {
            if (watcher.deep) {
                watcher.oldValue = clone(watcher.oldValue);
            }
        }
    }

    beforeUpdate(extender, context, options, instance, data) {
        const staticWatchers = Reflect.get(instance, SWATSign);
        this.updateDeepWatcherRef(instance, staticWatchers, data);
        const dynamicWatchers = Reflect.get(instance, DWATSign);
        this.updateDeepWatcherRef(instance, dynamicWatchers, data);
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const watch = context.get("watch");
        const state = context.get("state");
        const observers = context.get("observers");

        if (state && watch && (Object.keys(watch).length || Object.keys(observers).length)) {
            this.staticWatchersDefinition(extender, context, options, defFields);
        }
    }

    lifetimes(extender, context, options) {
        const injectDynamicWatchers = (thisArg) => {
            this.dynamicWatchersDefinition(thisArg);
        };

        return {
            created() {
                injectDynamicWatchers(this);
            }
        };
    }

    /**
     * 统一 Vue 格式的侦听器
     * @param extender
     * @param context
     * @param options
     */
    install(extender, context, options) {
        const computed = context.get("computed");

        const getDynamicWatchers = (thisArg) => {
            return this.getDynamicWatchers(thisArg);
        };

        const selectRuntimeState = (data, path) => {
            return this.selectData(data, path);
        };

        const combineWatch = {...options.watch};

        for (const i of extender.installers.map(i => i.watch())) {
            if (i) {
                for (const k in i) {
                    const w = i[k];
                    if (w) {
                        combineWatch[k] = [w].concat(combineWatch[k] || []);
                    }
                }
            }
        }

        const watch = Stream.of(Object.entries(combineWatch)).map(([path, watcher]) => {
            return [
                path,
                [].concat(watcher).map(w => {
                    const normalize = {
                        handler: null,
                        deep: false,
                        immediate: false,
                        enabled: !computed || (computed && !Reflect.has(computed, path)) || w.immediate === true
                    };
                    if (isString(w)) {
                        normalize.handler = function () {
                            const method = this[w];
                            if (isFunction(method)) {
                                method.apply(this, arguments);
                            }
                        };
                    } else if (isFunction(w)) {
                        normalize.handler = w;
                    } else if (isPlainObject(w)) {
                        const {immediate, deep, handler} = w;
                        normalize.immediate = immediate === true;
                        normalize.deep = deep === true;
                        normalize.handler = isFunction(handler) ? handler : function () {
                            const method = this[handler];
                            if (isFunction(method)) {
                                method.apply(this, arguments);
                            }
                        };
                    }
                    return normalize;
                }).filter(w => isFunction(w.handler))
            ];
        }).filter(([, watchers]) => watchers.length > 0).collect(Collectors.toMap());

        const observers = Object.assign.apply(
            undefined,
            [
                {},
                ...extender.installers.map(i => i.observers(extender, context, options)),
                options.observers
            ]
        );

        Object.assign(observers, {
            "**": Invocation(observers["**"], null, function () {
                const watchers = getDynamicWatchers(this);
                if (watchers && watchers.size) {
                    for (const [, watcher] of watchers) {
                        if (!watcher.path) {
                            watcher.update(this);
                        } else {
                            const newValue = selectRuntimeState(this.data, watcher.path);
                            watcher.call(this, [newValue]);
                        }
                    }
                }
            })
        });

        context.set("watch", watch);
        context.set("observers", observers);
    }
}