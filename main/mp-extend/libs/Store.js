import {createReactiveObject, getData, selectPathRoot, setData, splitPath, traceObject} from "../utils/object";
import {isFunction, isString, isPlainObject} from "../utils/common";
import CompatibleWatcher from "./CompatibleWatcher";
import equal from "./fast-deep-equal/index";
import clone from "./rfdc/default";

const StateSign = Symbol("__state__");
const InterceptorsSign = Symbol("__interceptors__");
const WATSign = Symbol("__WAT__");
const FiltersSign = Symbol("__getters__");
const ModulesSign = Symbol("__modules__");
const RootModuleSign = Symbol("__root__");

const PrivateConfiguration = {
    __stores: [],

    getState(observer, path = null) {
        const root = Reflect.get(observer, StateSign);
        if (path === null || path === undefined || path === RootModuleSign) {
            return root;
        }
        return getData(root, path);
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

    deleteFilter(observer, p) {
        Reflect.deleteProperty(this.getFilters(observer), p);
    },

    getMutation(observer, path, name) {
        const config = this.getModules(observer).get(path === null || path === undefined ? RootModuleSign : path);
        if (config) {
            const mutations = config.mutations;
            if (mutations && mutations[name]) {
                return mutations[name];
            }
        }
        return null;
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
     * @param fnOrPath 提高效率，对比Vuex增加路径支持，仅对内部开放
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
                    if (watcher.path) {
                        if (newValue !== oldValue || !equal(newValue, oldValue)) {
                            callback.call(this, newValue, oldValue);
                        }
                    } else {
                        if (!equal(newValue, oldValue)) {
                            callback.call(this, newValue, oldValue);
                        }
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
    },

    getModules(observer) {
        return Reflect.get(observer, ModulesSign);
    },

    registerModule(observer, path, module) {
        this.getModules(observer).set(path, module);
    },

    unregisterModule(observer, path) {
        this.getModules(observer).delete(path);
    }
};

export const Configuration = {
    instances() {
        return PrivateConfiguration.__stores;
    },

    intercept(observer, onStateGetting, onStateSetting) {
        return PrivateConfiguration.intercept(observer, onStateGetting, onStateSetting);
    },

    cancelIntercept(observer, onStateGetting, onStateSetting) {
        return PrivateConfiguration.cancelIntercept(observer, onStateGetting, onStateSetting);
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
    [InterceptorsSign] = [];
    [WATSign] = [];
    [FiltersSign] = {};
    [ModulesSign] = new Map();

    /**
     * @param { StoreDefinition } config
     */
    constructor(config) {
        const pending = [];
        const calling = [];
        const state = isFunction(config.state) ? config.state() : config.state;
        if (config.modules) {
            for (const path in config.modules) {
                const module = config.modules[path];
                const mState = module.state;
                setData(state, {[path]: isFunction(mState) ? mState() : mState});
                if (module.getters) {
                    for (const getter in module.getters) {
                        PrivateConfiguration.defineFilter(this, getter, () => {
                            if (isFunction(module.getters[getter])) {
                                return module.getters[getter].call(undefined, PrivateConfiguration.getState(this, path));
                            }
                        });
                    }
                }
                PrivateConfiguration.registerModule(this, path, module);
            }
        }
        Reflect.set(this, StateSign, createReactiveObject(
            state,
            state,
            (path, value) => {
                setData(state, {[path]: value});
                // 待执行路径观察器 组件计算属性依赖
                pending.splice(0).forEach(watcher => {
                    watcher.call(undefined, [getData(state, watcher.path)]);
                });

                // 自定义观察器
                const watchers = PrivateConfiguration.getWatchers(this);
                for (const watcher of watchers) {
                    if (isFunction(watcher.getter)) {
                        watcher.update(undefined, [this.state]);
                    }
                }
            },
            "",
            (path, value, level) => {
                const interceptors = PrivateConfiguration.getInterceptors(this);
                for (const {get} of interceptors) {
                    if (get) {
                        get(path, value, level);
                    }
                }
            },
            (path, value, level) => {
                const interceptors = PrivateConfiguration.getInterceptors(this);
                for (const {set} of interceptors) {
                    if (set) {
                        set(path, value, level);
                    }
                }
                const watchers = PrivateConfiguration.getWatchers(this);
                for (const watcher of watchers) {
                    // 非数组字段修改
                    if (!calling.includes(watcher)) {
                        if (watcher.deep) {
                            if (watcher.path && path.startsWith(watcher.path)) {
                                const traceObj = traceObject(state, path, true, false, undefined);
                                watcher.oldValue = [getData(traceObj, watcher.path)];
                                pending.push(watcher);
                            } else if (isFunction(watcher.getter)) {
                                watcher.oldValue = clone(watcher.oldValue);
                            }
                        }
                    }
                }
            },
            (path, fn, thisArg, args, level, parent) => {
                // 仅支持数组 不要定义奇怪的类型
                if (Array.isArray(parent)) {
                    const watchers = PrivateConfiguration.getWatchers(this);
                    for (const watcher of watchers) {
                        if (watcher.deep) {
                            if (watcher.path && path.startsWith(watcher.path)) {
                                const traceObj = traceObject(state, path, true, false, undefined);
                                watcher.oldValue = [getData(traceObj, watcher.path)];
                                calling.push(watcher);
                            } else if (isFunction(watcher.getter)) {
                                watcher.oldValue = clone(watcher.oldValue);
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

        PrivateConfiguration.registerModule(this, RootModuleSign, config);
        PrivateConfiguration.__stores.push(this);

        if (config.getters) {
            for (const getter in config.getters) {
                PrivateConfiguration.defineFilter(this, getter, function () {
                    if (isFunction(config.getters[getter])) {
                        return config.getters[getter].call(this, state);
                    }
                });
            }
        }
    }

    registerModule(path, module) {
        const {state, getters} = module;
        if (state) {
            setData(this.state, {
                [path]: isFunction(state) ? state() : state
            });
        }
        if (getters) {
            for (const getter in getters) {
                PrivateConfiguration.defineFilter(this, getter, () => {
                    if (isFunction(getters[getter])) {
                        return getters[getter].call(this, PrivateConfiguration.getState(this, path));
                    }
                });
            }
        }
        PrivateConfiguration.registerModule(this, path, module);
    }

    unregisterModule(path) {
        const module = PrivateConfiguration.getModules(path);
        if (module) {
            const paths = splitPath(path);
            if (paths.length > 1) {
                let i = path.lastIndexOf('.');
                if (i < 0) {
                    i = path.lastIndexOf('[');
                }
                if (i > 0) {
                    const parentPath = path.slice(0, i);
                    if (parentPath) {
                        Reflect.deleteProperty(getData(this.state, parentPath), paths[paths.length - 1]);
                    }
                }
            } else {
                Reflect.deleteProperty(this.state, path);
            }
            const {getters} = module;
            if (getters) {
                for (const getter in getters) {
                    PrivateConfiguration.deleteFilter(this, getter);
                }
            }
            PrivateConfiguration.unregisterModule(this, path);
        }
    }

    commit(...args) {
        const type = args.length > 0 ? args[0] : undefined;
        const payload = args.length > 1 ? args[1] : type;
        let mutationName = null;
        let path = null;
        let mutation = null;
        if (!isString(type)) {
            if (isPlainObject(type)) {
                mutationName = type.type;
            } else {
                throw new Error("expects string as the type, but found object");
            }
        } else {
            mutationName = type;
        }

        for (const p of PrivateConfiguration.getModules(this).keys()) {
            mutation = PrivateConfiguration.getMutation(this, p, mutationName);
            if (mutation) {
                path = p;
                break;
            }
        }

        if (isFunction(mutation)) {
            mutation.call(this, PrivateConfiguration.getState(this, path), payload);
        } else {
            throw new Error(`unknown mutation type: ${mutationName}`);
        }
    }

    watch(fn, callback, options = null) {
        return PrivateConfiguration.watch(this, fn, callback, options);
    }

    get state() {
        return PrivateConfiguration.getState(this);
    }

    get getters() {
        return PrivateConfiguration.getFilters(this);
    }
}