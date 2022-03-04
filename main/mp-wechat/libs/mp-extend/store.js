import Store, {Connector} from "./libs/Store";

function assertAppStore() {
    const {store} = getApp();
    if (!store) {
        throw new Error("Not found property 'store' on App.");
    }
}

export const mapState = function (...args) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapState(store, ...args);
};

export const mapGetters = function (...args) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapGetters(store, ...args);
};

export const mapActions = function (...args) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapActions(store, ...args);
};

export const mapMutations = function (...args) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapMutations(store, ...args);
};

export const createNamespacedHelpers = function (namespace) {
    assertAppStore();
    const {store} = getApp();
    return Connector.createNamespacedHelpers(store, namespace);
};

export function createStore(config) {
    return new Store(config);
}