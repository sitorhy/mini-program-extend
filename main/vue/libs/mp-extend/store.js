import Store, {Connector} from "./libs/Store";

function assertAppStore() {
    const {store} = getApp();
    if (!store) {
        throw new Error("Not found property 'store' on App.");
    }
}

export const mapState = function (namespace, map) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapState(store, namespace, map);
};

export const mapGetters = function (namespace, map) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapGetters(store, namespace, map);
};

export const mapActions = function (namespace, map) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapActions(store, namespace, map);
};

export const mapMutations = function (namespace, map) {
    assertAppStore();
    const {store} = getApp();
    return Connector.mapMutations(store, namespace, map);
};

export const createNamespacedHelpers = function (namespace) {
    assertAppStore();
    const {store} = getApp();
    return Connector.createNamespacedHelpers(store, namespace);
};

export function createStore(config) {
    return new Store(config);
}