import {createReactiveObject, getData, setData, traceObject} from "../utils/object";
import {isFunction, isString, isPlainObject} from "../utils/common";
import CompatibleWatcher from "./CompatibleWatcher";
import equal from "./fast-deep-equal/index";
import clone from "./rfdc/default";

const StateSign = Symbol("__state__");
const ConfigSign = Symbol("__config__");
const InterceptorsSign = Symbol("__interceptors__");
const WATSign = Symbol("__WAT__");
const FiltersSign = Symbol("__getters__");

const Configuration = {
    __stores: [],

    getConfig(observer) {
        return Reflect.get(observer, ConfigSign);
    },

    getState(observer) {
        return Reflect.get(observer, StateSign);
    },

    getFilters(observer) {
        return Reflect.get(observer, FiltersSign);
    },

    defineFilter(observer, p, fn) {
        Object.defineProperty(this.getFilters(observer), p, {
            enumerable: true,
            configurable: false,
            get() {
                if (isFunction(fn)) {
                    return fn.call(undefined);
                }
            },
            set(v) {
                throw new Error(`Cannot set property ${p} of #<${Object.prototype.toString.call(v)}> which has only a getter"`);
            }
        })
    },

    getMutation(observer, name) {
        const config = this.getConfig(observer);
        if (config) {
            const mutations = config.mutations;
            if (mutations && mutations[name]) {
                return mutations[name];
            }
        }
        throw new Error(`unknown mutation type: ${name}`);
    },

    getInterceptors(observer) {
        return Reflect.get(observer, InterceptorsSign);
    },

    intercept(observer, onStateGetting, onStateSetting) {
        if (!onStateGetting && !onStateGetting) {
            return null;
        }
        const interceptors = this.getInterceptors(observer);
        if (interceptors.findIndex(i => i.get === onStateGetting && i.set === onStateSetting) >= 0) {
            return null;
        }
        interceptors.push({get: onStateGetting, set: onStateSetting});
        return () => {
            this.cancelIntercept(observer, onStateGetting, onStateSetting);
        };
    },

    cancelIntercept(observer, onStateGetting, onStateSetting) {
        const interceptors = this.getInterceptors(observer);
        const index = interceptors.findIndex(i => i.get === onStateGetting && i.set === onStateSetting);
        if (index >= 0) {
            interceptors.splice(index, 1);
        }
    },

    getWatchers(observer) {
        return Reflect.get(observer, WATSign);
    },

    /**
     * @param observer
     * @param fnOrPath 提高效率，对比Vuex增加路径支持
     * @param callback
     * @param options
     * @returns {(function(): void)|*}
     */
    watch(observer, fnOrPath, callback, options = null) {
        const watchers = this.getWatchers(observer);
        const watcher = new CompatibleWatcher(
            isFunction(fnOrPath) ? undefined : fnOrPath,
            function (newValue, oldValue) {
                if (watcher.deep) {
                    if (!equal(newValue, oldValue)) {
                        callback.call(this, newValue, oldValue);
                    }
                } else {
                    if (newValue !== oldValue) {
                        callback.call(this, newValue, oldValue);
                    }
                }
            },
            (newValue, oldValue) => {
                if (watcher.immediate) {
                    callback.call(this, newValue, oldValue);
                }
            },
            options && options.immediate === true,
            options && options.deep === true,
            undefined,
            isFunction(fnOrPath) ? (state) => {
                return fnOrPath.call(undefined, state);
            } : null
        );
        watchers.push(watcher);
        if (isFunction(fnOrPath)) {
            watcher.once(observer, [fnOrPath.call(undefined, this.getState(observer))]);
        } else {
            watcher.once(observer, [getData(this.getState(observer), fnOrPath)]);
        }
        return () => {
            this.unwatch(observer, watcher);
        };
    },

    unwatch(observer, watcher) {
        const watchers = this.getWatchers(observer);
        const index = watchers.findIndex(i => i === watcher);
        if (index >= 0) {
            watchers.splice(index, 1);
        }
    }
};

/**
 * @typedef { {
 * state:object,
 * getters?:{[key:string]:(state:object)=>any},
 * mutations?:{[key:string]:(state:object)=>void},
 * actions?:{[key:string]:(state:object)=>(Promise|any)},
 * modules?:{[name:string]:StoreDefinition}
 * } } StoreDefinition
 */
export default class Store {
    [StateSign] = null;
    [ConfigSign] = null;
    [InterceptorsSign] = [];
    [WATSign] = [];
    [FiltersSign] = {};

    /**
     * @param { StoreDefinition } config
     */
    constructor(config) {
        Configuration.__stores.push(this);
        const pending = [];
        const calling = [];
        const state = clone(config.state);
        Reflect.set(this, ConfigSign, config);
        Reflect.set(this, StateSign, createReactiveObject(
            state,
            state,
            (path, value) => {
                setData(state, {[path]: value});
                pending.splice(0).forEach(watcher => {
                    watcher.call(undefined, [getData(state, watcher.path)]);
                });
                const watchers = Configuration.getWatchers(this);
                for (const watcher of watchers) {
                    if (isFunction(watcher.getter)) {
                        watcher.update(undefined, [state]);
                    }
                }
            },
            "",
            (path, value, level) => {
                const interceptors = Configuration.getInterceptors(this);
                for (const {get} of interceptors) {
                    if (get) {
                        get(path, value, level);
                    }
                }
            },
            (path, value, level) => {
                const interceptors = Configuration.getInterceptors(this);
                for (const {set} of interceptors) {
                    if (set) {
                        set(path, value, level);
                    }
                }
                const watchers = Configuration.getWatchers(this);
                for (const watcher of watchers) {
                    if (!calling.includes(watcher)) {
                        if (watcher.deep) {
                            if (watcher.path && path.startsWith(watcher.path)) {
                                const traceObj = traceObject(state, path, true, false, undefined);
                                watcher.oldValue = [getData(traceObj, watcher.path)];
                                pending.push(watcher);
                            } else if (isFunction(watcher.getter)) {
                                watcher.oldValue = [clone(watcher.getter.call(undefined, state))];
                            }
                        }
                    }
                }
            },
            (path, fn, thisArg, args, level, parent) => {
                // 仅支持数组 不要定义奇怪的类型
                if (Array.isArray(parent)) {
                    const watchers = Configuration.getWatchers(this);
                    for (const watcher of watchers) {
                        if (watcher.deep) {
                            if (watcher.path && path.startsWith(watcher.path)) {
                                const traceObj = traceObject(state, path, true, false, undefined);
                                watcher.oldValue = [clone(getData(traceObj, watcher.path))];
                                calling.push(watcher);
                            } else if (isFunction(watcher.getter)) {
                                const traceObj = traceObject(state, path, true, false, undefined);
                                watcher.oldValue = [watcher.getter.call(undefined, traceObj)];
                                calling.push(watcher);
                            }
                        }
                    }
                }
            },
            (path, result, level, parent) => {
                calling.splice(0).forEach(watcher => {
                    if (watcher.path) {
                        watcher.call(undefined, [getData(state, watcher.path)]);
                    }
                });
            }
        ));

        if (config.getters) {
            for (const getter in config.getters) {
                Configuration.defineFilter(this, getter, function () {
                    if (isFunction(config.getters[getter])) {
                        return config.getters[getter].call(this, state);
                    }
                });
            }
        }
    }

    static instances() {
        return Configuration.__stores;
    }

    commit(...args) {
        const type = args.length > 0 ? args[0] : undefined;
        const payload = args.length > 1 ? args[1] : undefined;
        if (!isString(type)) {
            if (isPlainObject(type)) {
                const t = type.type;
                const m = Configuration.getMutation(this, t);
                if (m) {
                    m.call(this, this.state, type);
                    return;
                }
            }
            throw new Error("expects string as the type, but found object");
        } else {
            const m = Configuration.getMutation(this, type);
            if (m) {
                m.call(this, this.state, payload);
            }
        }
    }

    watch(fn, callback, options = null) {
        return Configuration.watch(this, fn, callback, options);
    }

    intercept(onStateGetting, onStateSetting) {
        return Configuration.intercept(this, onStateGetting, onStateSetting);
    }

    cancelIntercept(onStateGetting, onStateSetting) {
        return Configuration.cancelIntercept(this, onStateGetting, onStateSetting);
    }

    get state() {
        return Configuration.getState(this);
    }

    get getters() {
        return Configuration.getFilters(this);
    }
}