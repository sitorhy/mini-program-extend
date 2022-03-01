import {createReactiveObject, getData, setData, splitPath} from "../utils/object";
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

    getFilters(observer, path = null) {
        const filters = Reflect.get(observer, FiltersSign);
        if (path === null || path === undefined || path === RootModuleSign) {
            return filters.get(RootModuleSign);
        }
        return filters.get(path);
    },

    defineFilters(observer, config, path = null, namespace = null) {
        if (config.getters) {
            const mPath = path === null || path === undefined || path === RootModuleSign ? RootModuleSign : path;
            const filters = Reflect.get(observer, FiltersSign);
            if (!filters.has(mPath)) {
                filters.set(mPath, {});
            }
            const mFilters = filters.get(mPath);
            if (!filters.has(RootModuleSign)) {
                filters.set(RootModuleSign, {});
            }
            const rootFilters = filters.get(RootModuleSign);
            for (const getter in config.getters) {
                const attrs = {
                    enumerable: true,
                    configurable: true,
                    get: () => {
                        const fn = config.getters[getter];
                        if (isFunction(fn)) {
                            return fn.call(undefined, this.getState(observer, mPath), this.getFilters(observer, mPath));
                        }
                    },
                    set: (v) => {
                        throw new Error(`Cannot set property ${getter} of #<${Object.prototype.toString.call(v)}> which has only a getter"`);
                    }
                };
                Object.defineProperty(mFilters, getter, attrs);
                Object.defineProperty(rootFilters, `${namespace ? namespace + '/' : ''}${getter}`, attrs);
            }
        }
        if (config.modules) {
            for (const subPath in config.modules) {
                const nextPath = `${!path ? '' : path + '.'}${subPath}`;
                this.defineFilters(observer, config.modules[subPath], nextPath, [namespace || "", config.modules[subPath].namespaced ? subPath : ""].filter(i => !!i).join("/"));
            }
        }
    },

    deleteFilters(observer, path) {
        const filters = this.getFilters(observer, path);
        const mFilters = filters.get(path);
        const rootFilters = filters.get(RootModuleSign);
        filters.delete(path);
        if (mFilters) {
            for (const getter of mFilters.keys()) {
                rootFilters.delete(getter);
            }
        }
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

    getAction(observer, path, name) {
        const config = this.getModules(observer).get(path === null || path === undefined || path === RootModuleSign ? RootModuleSign : path);
        if (config) {
            const actions = config.actions;
            if (actions && actions[name]) {
                return actions[name];
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
        if (module.modules) {
            for (const m in module.modules) {
                this.registerModule(observer, `${!path || path === RootModuleSign ? '' : path + '.'}${m}`, module.modules[m]);
            }
        }
    },

    unregisterModule(observer, path) {
        this.getModules(observer).delete(path);
    },

    mergeState(state, config, path = null) {
        if (config.modules) {
            for (const subPath in config.modules) {
                const module = config.modules[subPath];
                const mState = module.state;
                const nextPath = `${!path ? '' : path + '.'}${subPath}`;
                setData(state, {[nextPath]: isFunction(mState) ? mState() : mState});
                this.mergeState(state, module, nextPath);
            }
        }
        return state;
    }
};

export const Configuration = {
    instances() {
        return PrivateConfiguration.__stores;
    },

    /**
     * 拦截Store读取操作/写入操作，并返回注销拦截的函数，触发顺序为输入优先，返回 true 取消后续拦截器操作
     * @param observer
     * @param onStateGetting
     * @param onStateSetting
     * @returns {function(): void}
     */
    intercept(observer, onStateGetting, onStateSetting) {
        return PrivateConfiguration.intercept(observer, onStateGetting, onStateSetting);
    },

    /**
     * 注销拦截操作
     * @param observer
     * @param onStateGetting
     * @param onStateSetting
     */
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
    [FiltersSign] = new Map();
    [ModulesSign] = new Map();

    /**
     * @param { StoreDefinition } config
     */
    constructor(config) {
        const pending = [];
        const calling = [];
        const state = PrivateConfiguration.mergeState(isFunction(config.state) ? config.state() : config.state, config);
        PrivateConfiguration.defineFilters(this, config);

        // before -> set -> onChanged -> after
        Reflect.set(this, StateSign, createReactiveObject(
            state,
            state,
            (path, value) => {
                setData(state, {[path]: value});
                pending.splice(0).forEach(watcher => {
                    // ③ not array deep with path
                    // ⑧ not array shallow with path
                    // 路径侦听器直接获取新值 不需要传 this.state 触发拦截器
                    watcher.call(undefined, [getData(state, watcher.path)]);
                });

                const watchers = PrivateConfiguration.getWatchers(this);
                for (const watcher of watchers) {
                    if (isFunction(watcher.getter)) {
                        // ② array deep with getter
                        // ④ not array deep with getter
                        // ⑤ array shallow with getter
                        // ⑥ not array shallow with getter
                        watcher.update(undefined, [this.state]);
                    }
                }
            },
            "",
            (path, value, level) => {
                const interceptors = PrivateConfiguration.getInterceptors(this);
                for (const {get} of interceptors) {
                    if (get) {
                        if (get(path, value, level) === true) {
                            break;
                        }
                    }
                }
            },
            (path, value, level) => {
                const interceptors = PrivateConfiguration.getInterceptors(this);
                for (const {set} of interceptors) {
                    if (set) {
                        if (set(path, value, level) === true) {
                            break;
                        }
                    }
                }
                const watchers = PrivateConfiguration.getWatchers(this);
                for (const watcher of watchers) {
                    if (!calling.includes(watcher)) { // 4 排除深拷贝预处理
                        if (watcher.deep) {
                            // ④ not array deep with getter
                            watcher.oldValue = clone(watcher.oldValue);
                            if (watcher.path && path.startsWith(watcher.path)) {
                                // ③ not array deep with path
                                pending.push(watcher);
                            }
                        } else {
                            // ⑧ not array shallow with path
                            if (watcher.path) {
                                pending.push(watcher);
                            }
                        }
                    }
                }
            },
            (path, level, parent) => {
                const watchers = PrivateConfiguration.getWatchers(this);
                for (const watcher of watchers) {
                    if (watcher.deep) {
                        watcher.oldValue = clone(watcher.oldValue);
                    }
                    if (watcher.path) {
                        watcher.call(undefined, [getData(state, watcher.path)]);
                    } else if (isFunction(watcher.getter)) {
                        watcher.update(undefined, [this.state]);
                    }
                }
            },
            (path, p, fn, thisArg, args, level, parent) => {
                if (Array.isArray(parent) && ["push", "splice", "shift", "pop", "fill", "unshift", "reverse", "copyWithin"].includes(p)) {
                    const watchers = PrivateConfiguration.getWatchers(this);
                    for (const watcher of watchers) {
                        // 避免旧值引用一并被修改
                        if (watcher.deep) {
                            watcher.oldValue = clone(watcher.oldValue);
                            if (watcher.path && path.startsWith(watcher.path)) {
                                // ① array deep with path
                                calling.push(watcher);
                            } else if (isFunction(watcher.getter)) {
                                // ② array deep with getter
                                calling.push(watcher);
                            }
                        } else {
                            if (watcher.path) {
                                // ⑦ array shallow with path
                                calling.push(watcher);
                            }
                        }
                    }
                }
            },
            (path, result, level, parent) => {
                calling.splice(0).forEach(watcher => {
                    if (watcher.path) {
                        // ① array deep with path
                        // ⑦ array shallow with path
                        watcher.call(undefined, [getData(state, watcher.path)]);
                    }
                });
            }
        ));

        PrivateConfiguration.registerModule(this, RootModuleSign, config);
        PrivateConfiguration.__stores.push(this);
    }

    registerModule(path, module) {
        PrivateConfiguration.registerModule(this, path, module);
    }

    unregisterModule(path) {
        const module = PrivateConfiguration.getModules(this).get(path);
        if (module) {
            const paths = splitPath(path);
            try {
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
            } catch (e) {
                // 删除后触发 computed 可能会出现空指针错误
                throw e;
            } finally {
                PrivateConfiguration.deleteFilters(this, path);
                PrivateConfiguration.unregisterModule(this, path);
            }
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

    dispatch(...args) {
        const type = args.length > 0 ? args[0] : undefined;
        const payload = args.length > 1 ? args[1] : type;
        let actionName = null;
        let path = null;
        let action = null;
        if (!isString(type)) {
            if (isPlainObject(type)) {
                actionName = type.type;
            } else {
                throw new Error("expects string as the type, but found object");
            }
        } else {
            actionName = type;
        }

        if (actionName) {
            const iSp = actionName.lastIndexOf("/");
            if (iSp > 0) {
                const actionPath = actionName.substring(iSp + 1);
                path = actionName.substring(0, iSp).replaceAll("/", ".");
                action = PrivateConfiguration.getAction(this, path, actionPath);
            } else {
                for (const p of PrivateConfiguration.getModules(this).keys()) {
                    action = PrivateConfiguration.getAction(this, p, actionName);
                    if (action) {
                        path = p;
                        break;
                    }
                }
            }
        }

        if (isFunction(action)) {
            const moduleContext = {
                commit: null,
                dispatch: null,
                getters: null,
                state: null
            };
            const context = {
                rootGetters: this.getters,
                rootState: PrivateConfiguration.getFilters(this, path)
            };
            action.call(this, context, payload);
        } else {
            throw new Error(`unknown action type: ${actionName}`);
        }
    }

    get state() {
        return PrivateConfiguration.getState(this);
    }

    get getters() {
        return PrivateConfiguration.getFilters(this);
    }
}