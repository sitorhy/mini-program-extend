import {createReactiveObject, selectPathRoot, setData} from "../utils/object";
import {isPlainObject, isString} from "../utils/common";

const StateSign = Symbol("__state__");
const ConfigSign = Symbol("__config__");
const InterceptorsSign = Symbol("__interceptors__");
const LinkAgeSign = Symbol("__linkAge__");
const ConnectorsSign = Symbol("__connectors__");

const Configuration = {
    __stores: [],

    getConfig(observer) {
        return Reflect.get(observer, ConfigSign);
    },

    getState(observer) {
        return Reflect.get(observer, StateSign);
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
        if (!onStateGetting || !onStateGetting) {
            return null;
        }
        const interceptors = this.getInterceptors(observer);
        if (interceptors.findIndex(i => i.get === onStateGetting || i.set === onStateSetting) >= 0) {
            return null;
        }
        interceptors.push({get: onStateGetting, set: onStateSetting});
        return () => {
            this.cancelIntercept(observer, onStateGetting, onStateSetting);
        };
    },

    cancelIntercept(observer, onStateGetting, onStateSetting) {
        const interceptors = this.getInterceptors(observer);
        const index = interceptors.findIndex(i => i.get === onStateGetting || i.set === onStateSetting);
        if (index >= 0) {
            interceptors.splice(index, 1);
        }
    },

    getComponentLinkAge(observer) {
        return Reflect.get(observer, LinkAgeSign);
    },

    registerComponentLinkAge(observer, instance, map) {
        const linkAge = this.getComponentLinkAge(observer);
        if (!linkAge.has(!instance.is)) {
            linkAge.set(instance.is, map);
        }
    },

    unregisterComponentLinkAge(observer, instance) {
        const linkAge = this.getComponentLinkAge(observer);
        linkAge.delete(instance.is);
    },

    hasComponentLinkAgeRegistered(observer, instance) {
        const linkAge = this.getComponentLinkAge(observer);
        return linkAge.has(instance.is);
    },

    getConnectors(observer) {
        return Reflect.get(observer, ConnectorsSign);
    },

    connectComponent(observer, instance) {
        const connectors = this.getConnectors(observer);
        if (connectors.findIndex(i => i["__wxExparserNodeId__"] === instance["__wxExparserNodeId__"]) < 0) {
            connectors.push(instance);
        }
    },

    disconnectComponent(observer, instance) {
        const connectors = this.getConnectors(observer);
        const index = connectors.findIndex(i => i["__wxExparserNodeId__"] === instance["__wxExparserNodeId__"]);
        if (index >= 0) {
            connectors.splice(index, 1);
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
    [LinkAgeSign] = new Map();
    [ConnectorsSign] = [];

    /**
     * @param { StoreDefinition } config
     */
    constructor(config) {
        Configuration.__stores.push(this);
        Reflect.set(this, ConfigSign, config);
        Reflect.set(this, StateSign, createReactiveObject(
            config.state,
            config.state,
            (path, value) => {
                setData(config.state, {[path]: value});
                const src = selectPathRoot(path);
                const linkAge = Configuration.getComponentLinkAge(this);
                const connectors = Configuration.getConnectors(this);
                if (linkAge.size) {
                    for (const instance of connectors) {
                        const cl = linkAge.get(instance.is);
                        const targets = cl.get(src);
                        if (targets) {
                            console.log(targets)
                        }
                    }
                }
            },
            "",
            (path, value, level) => {
                const interceptors = Configuration.getInterceptors(this);
                for (const {get} of interceptors) {
                    get(path, value, level);
                }
            },
            (path, value, level) => {
                const interceptors = Configuration.getInterceptors(this);
                for (const {set} of interceptors) {
                    set(path, value, level);
                }
            }
        ));
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

    intercept(onStateGetting, onStateSetting) {
        return Configuration.intercept(this, onStateGetting, onStateSetting);
    }

    cancelIntercept(onStateGetting, onStateSetting) {
        return Configuration.cancelIntercept(this, onStateGetting, onStateSetting);
    }

    registerComponentLinkAge(instance, map) {
        Configuration.registerComponentLinkAge(this, instance, map);
    }

    unregisterComponentLinkAge(instance) {
        Configuration.unregisterComponentLinkAge(this, instance);
    }

    hasComponentLinkAgeRegistered(instance) {
        return Configuration.hasComponentLinkAgeRegistered(this, instance);
    }

    connectComponent(instance) {
        Configuration.connectComponent(this, instance);
    }

    disconnectComponent(instance) {
        Configuration.disconnectComponent(this, instance);
    }

    get state() {
        return Configuration.getState(this);
    }
}