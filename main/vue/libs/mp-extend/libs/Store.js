import {createReactiveObject, setData} from "../utils/object";
import {isPlainObject, isString} from "../utils/common";

const StateSign = Symbol("__state__");
const ConfigSign = Symbol("__config__");

const Configuration = {
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

    /**
     * @param { StoreDefinition } config
     */
    constructor(config) {
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
                console.log(`${level}/${path} : ${JSON.stringify(value)}`);
            },
            (path, value, level) => {

            }
        ));
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

    get state() {
        return Configuration.getState(this);
    }
}