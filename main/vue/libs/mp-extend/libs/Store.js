import {createReactiveObject, selectPathRoot, setData} from "../utils/object";
import {isPlainObject, isString} from "../utils/common";

const StateSign = Symbol("__state__");
const ConfigSign = Symbol("__config__");
const InterceptorsSign = Symbol("__interceptors__");

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
                console.log(`${path} => ${JSON.stringify(value)}`);
                setData(config.state, {[path]: value});
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

    watch(fn, callback, options = null) {

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
}