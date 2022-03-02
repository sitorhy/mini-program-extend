import {createReactiveObject, getData, setData, splitPath} from "../utils/object";
import {isFunction, isString} from "../utils/common";
import CompatibleWatcher from "./CompatibleWatcher";
import equal from "./fast-deep-equal/index";
import clone from "./rfdc/default";
import {Collectors, Stream} from "./Stream";

const OriginalState = Symbol("__originalState__");
const StateSign = Symbol("__state__");
const InterceptorsSign = Symbol("__interceptors__");
const WATSign = Symbol("__WAT__");
const GetterSign = Symbol("__getters__");
const ActionSign = Symbol("__actions__");
const MutationSign = Symbol("__mutations__");
const ModulesSign = Symbol("__modules__");
const RootModuleSign = Symbol("__root__");

const Configuration = {
    stores: [],

    getState(observer, path = null) {
        const root = Reflect.get(observer, StateSign);
        if (path === null || path === undefined || path === RootModuleSign) {
            return root;
        }
        return getData(root, path);
    },

    getOriginalState(observer) {
        return Reflect.get(observer, OriginalState);
    },

    setOriginalState(observer, state) {
        Reflect.set(observer, OriginalState, state);
    },

    getSpace(observer, scopeSign, path = null) {
        const scope = Reflect.get(observer, scopeSign);
        if (path === null || path === undefined || path === RootModuleSign) {
            return scope.get(RootModuleSign);
        }
        return scope.get(path);
    },

    defineSpace(observer, config, scopeName, scopeSign, defineProperty, path = null, namespace = null) {
        if (config[scopeName]) {
            const spacePath = path === null || path === undefined || path === RootModuleSign ? RootModuleSign : path;
            const scope = Reflect.get(observer, scopeSign);
            if (!scope.has(spacePath)) {
                scope.set(spacePath, {});
            }
            const space = scope.get(spacePath);
            if (!scope.has(RootModuleSign)) {
                scope.set(RootModuleSign, {});
            }
            const rootSpace = scope.get(RootModuleSign);
            for (const definition in config[scopeName]) {
                const attrs = defineProperty(config, spacePath, definition);
                Object.defineProperty(space, definition, attrs);
                Object.defineProperty(rootSpace, `${namespace ? namespace + '/' : ''}${definition}`, attrs);
            }
        }
        if (config.modules) {
            for (const subPath in config.modules) {
                const nextPath = `${!path ? '' : path + '.'}${subPath}`;
                this.defineSpace(observer, config.modules[subPath], scopeName, scopeSign, defineProperty, nextPath, [namespace || "", config.modules[subPath].namespaced ? subPath : ""].filter(i => !!i).join("/"));
            }
        }
    },

    deleteSpace(observer, scopeSign, path) {
        const scope = this.getSpace(observer, scopeSign, path);
        const space = scope.get(path);
        const rootSpace = scope.get(RootModuleSign);
        if (path && path !== RootModuleSign) {
            scope.delete(path);
        }
        if (space !== rootSpace) {
            for (const definition of space.keys()) {
                rootSpace.delete(definition);
            }
        }
    },

    defineGetters(observer, config) {
        this.defineSpace(observer, config, "getters", GetterSign, (moduleConfig, spacePath, definition) => {
            return {
                enumerable: true,
                configurable: true,
                get: () => {
                    const fn = moduleConfig.getters[definition];
                    if (isFunction(fn)) {
                        return fn.call(
                            observer,
                            this.getState(observer, spacePath),
                            this.getSpace(observer, GetterSign, spacePath)
                        );
                    }
                },
                set: (v) => {
                    throw new Error(`Cannot set property ${definition} of #<${Object.prototype.toString.call(v)}> which has only a getter"`);
                }
            };
        });
    },

    defineMutations(observer, config) {
        this.defineSpace(observer, config, "mutations", MutationSign, (moduleConfig, spacePath, definition) => {
            return {
                enumerable: true,
                configurable: true,
                writable: false,
                value: (payload) => {
                    const fn = moduleConfig.mutations[definition];
                    if (isFunction(fn)) {
                        fn.call(
                            observer,
                            this.getState(observer, spacePath),
                            payload
                        );
                    }
                }
            };
        });
    },

    defineActions(observer, config) {
        this.defineSpace(observer, config, "actions", ActionSign, (moduleConfig, spacePath, definition) => {
            return {
                enumerable: true,
                configurable: true,
                writable: false,
                value: (payload) => {
                    const fn = moduleConfig.actions[definition];
                    if (isFunction(fn)) {
                        fn.call(
                            observer,
                            {
                                commit: (...args) => {
                                    this.commit(observer, spacePath, ...args);
                                },
                                dispatch: (...args) => {
                                    return this.dispatch(observer, spacePath, ...args);
                                },
                                getters: this.getSpace(observer, GetterSign, spacePath),
                                state: this.getState(observer, spacePath),
                                rootGetters: this.getSpace(observer, GetterSign),
                                rootState: this.getState(observer)
                            },
                            payload
                        );
                    }
                }
            };
        });
    },

    commit(observer, spacePath, ...args) {
        if ((!isString(args[0]) && !args[0].type) || !args[0]) {
            throw new Error(`expects string as the type, but found ${Object.prototype.toString.call(args[0])}`);
        }
        const type = isString(args[0]) ? args[0] : args[0].type;
        const payload = isString(args[0]) ? args[1] : args[0];
        const rootSpace = this.getSpace(observer, MutationSign, spacePath);
        const mutation = rootSpace[type];
        if (isFunction(mutation)) {
            mutation(payload);
        } else {
            throw new Error(`unknown mutation type: ${type}`);
        }
    },

    dispatch(observer, spacePath, ...args) {
        if ((!isString(args[0]) && !args[0].type) || !args[0]) {
            throw new Error(`expects string as the type, but found ${Object.prototype.toString.call(args[0])}`);
        }
        const type = isString(args[0]) ? args[0] : args[0].type;
        const payload = isString(args[0]) ? args[1] : args[0];
        const rootSpace = this.getSpace(observer, ActionSign, spacePath);
        const action = rootSpace[type];
        if (isFunction(action)) {
            return action(payload);
        } else {
            throw new Error(`unknown action type: ${type}`);
        }
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

    registerInstance(observer) {
        if (!this.stores.includes(observer)) {
            this.stores.push(observer);
        }
    },

    unregisterInstance(observer) {
        const index = this.stores.findIndex(i => i === observer);
        if (index >= 0) {
            this.stores.splice(index, 1);
        }
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

export const Connector = {
    instances() {
        return Configuration.stores;
    },

    /**
     * 拦截Store读取操作/写入操作，并返回注销拦截的函数，触发顺序为输入优先，返回 true 取消后续拦截器操作
     * @param observer
     * @param onStateGetting
     * @param onStateSetting
     * @returns {function(): void}
     */
    intercept(observer, onStateGetting, onStateSetting) {
        return Configuration.intercept(observer, onStateGetting, onStateSetting);
    },

    /**
     * 注销拦截操作
     * @param observer
     * @param onStateGetting
     * @param onStateSetting
     */
    cancelIntercept(observer, onStateGetting, onStateSetting) {
        return Configuration.cancelIntercept(observer, onStateGetting, onStateSetting);
    },

    mapState: function (observer, ...args) {
        const namespace = args.length > 1 ? args[0] : null;
        const map = args.length > 1 ? args[1] : args[0];
        const state = Configuration.getState(observer, namespace ? namespace.replaceAll("/", ".") : null);
        const mapStateToProps = Array.isArray(map) ? Stream.of(map).map(i => [i, i]).collect(Collectors.toMap()) : map;
        return Stream.of(Object.keys(mapStateToProps)).map((prop) => {
            const to = mapStateToProps[prop];
            if (isString(to)) {
                return [mapStateToProps[prop], function () {
                    return state[to];
                }];
            } else if (isFunction(to)) {
                return [mapStateToProps[prop], function () {
                    return to(state);
                }];
            }
            return [mapStateToProps[prop], function () {
                return undefined;
            }];
        }).collect(Collectors.toMap());
    },

    mapGetters: function (observer, ...args) {
        const namespace = args.length > 1 ? args[0] : '';
        const map = args.length > 1 ? args[1] : args[0];
        const getters = Configuration.getSpace(observer, GetterSign);
        const mapGettersToProps = Array.isArray(map) ? Stream.of(map).map(i => [i, i]).collect(Collectors.toMap()) : map;
        return Stream.of(Object.keys(mapGettersToProps)).map(prop => {
            const to = mapGettersToProps[prop];
            return [to, function () {
                return getters[`${namespace ? namespace + '/' : ''}${prop}`];
            }];
        }).collect(Collectors.toMap());
    },

    mapActions: function (observer, ...args) {
        const namespace = args.length > 1 ? args[0] : '';
        const map = args.length > 1 ? args[1] : args[0];
        const actions = Configuration.getSpace(observer, ActionSign);
        const mapActionsToProps = Array.isArray(map) ? Stream.of(map).map(i => [i, i]).collect(Collectors.toMap()) : map;
        return Stream.of(Object.keys(mapActionsToProps)).map(prop => {
            const to = mapActionsToProps[prop];
            return [to, function (payload) {
                return actions[`${namespace ? namespace + '/' : ''}${prop}`](payload);
            }];
        }).collect(Collectors.toMap());
    },

    mapMutations: function (observer, ...args) {
        const namespace = args.length > 1 ? args[0] : '';
        const map = args.length > 1 ? args[1] : args[0];
        const mutations = Configuration.getSpace(observer, MutationSign);
        const mapMutationsToProps = Array.isArray(map) ? Stream.of(map).map(i => [i, i]).collect(Collectors.toMap()) : map;
        return Stream.of(Object.keys(mapMutationsToProps)).map(prop => {
            const to = mapMutationsToProps[prop];
            return [to, function (payload) {
                mutations[`${namespace ? namespace + '/' : ''}${prop}`](payload);
            }];
        }).collect(Collectors.toMap());
    },

    createNamespacedHelpers: function (observer, namespace) {
        const mapNamespaceState = (map) => {
            return this.mapState(observer, namespace, map);
        };
        const mapNamespaceGetters = (map) => {
            return this.mapGetters(observer, namespace, map);
        };
        const mapNamespaceMutations = (map) => {
            return this.mapMutations(observer, namespace, map);
        };
        const mapNamespaceActions = (map) => {
            return this.mapActions(observer, namespace, map);
        };
        return {
            mapState: mapNamespaceState,
            mapGetters: mapNamespaceGetters,
            mapMutations: mapNamespaceMutations,
            mapActions: mapNamespaceActions
        };
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
    [OriginalState] = null;
    [StateSign] = null;
    [InterceptorsSign] = [];
    [WATSign] = [];
    [GetterSign] = new Map();
    [ModulesSign] = new Map();
    [ActionSign] = new Map();
    [MutationSign] = new Map();

    /**
     * @param { StoreDefinition } config
     */
    constructor(config) {
        const pending = [];
        const calling = [];
        const state = Configuration.mergeState(isFunction(config.state) ? config.state() : config.state, config);
        Configuration.setOriginalState(this, state);
        Configuration.defineGetters(this, config);
        Configuration.defineMutations(this, config);
        Configuration.defineActions(this, config);

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

                const watchers = Configuration.getWatchers(this);
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
                const interceptors = Configuration.getInterceptors(this);
                for (const {get} of interceptors) {
                    if (get) {
                        if (get(path, value, level) === true) {
                            break;
                        }
                    }
                }
            },
            (path, value, level) => {
                const interceptors = Configuration.getInterceptors(this);
                for (const {set} of interceptors) {
                    if (set) {
                        if (set(path, value, level) === true) {
                            break;
                        }
                    }
                }
                const watchers = Configuration.getWatchers(this);
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
                const watchers = Configuration.getWatchers(this);
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
                    const watchers = Configuration.getWatchers(this);
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

        Configuration.registerModule(this, RootModuleSign, config);
        Configuration.registerInstance(this);
    }

    registerModule(path, module) {
        const spacePath = Array.isArray(path) ? path.join('.') : path;
        Configuration.mergeState(Configuration.getOriginalState(this), module, spacePath);
        Configuration.defineGetters(this, module);
        Configuration.defineMutations(this, module);
        Configuration.defineActions(this, module);
        Configuration.registerModule(this, path, module);
    }

    unregisterModule(path) {
        const module = Configuration.getModules(this).get(path);
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
                Configuration.deleteSpace(this, GetterSign, path);
                Configuration.deleteSpace(this, MutationSign, path);
                Configuration.deleteSpace(this, ActionSign, path);
                Configuration.unregisterModule(this, path);
            }
        }
    }

    watch(fn, callback, options = null) {
        return Configuration.watch(this, fn, callback, options);
    }

    commit(...args) {
        Configuration.commit(this, RootModuleSign, ...args);
    }

    dispatch(...args) {
        return Configuration.dispatch(this, RootModuleSign, ...args);
    }

    get state() {
        return Configuration.getState(this);
    }

    get getters() {
        return Configuration.getSpace(this, GetterSign);
    }
}