import OptionInstaller from "./OptionInstaller";
import Store from "../libs/Store";
import {selectPathRoot} from "../utils/object";

const NOOP = function () {

};

export default class StoreInstaller extends OptionInstaller {
    lifetimes(extender, context, options) {
        let cancel;
        let stores;
        const linkAge = new Map();
        const dependencies = [];
        return {
            created() {
                stores = Store.instances().filter(s => !s.hasComponentLinkAgeRegistered(this));
                if (!stores.length) {
                    return;
                }
                for (const store of stores) {
                    store.intercept(
                        (path, value, level) => {
                            if (!dependencies.findIndex(s => s.store === store && s.path === path) >= 0 && level === 0) {
                                dependencies.push({
                                    store,
                                    path
                                });
                            }
                        },
                        NOOP
                    );
                }
                cancel = extender.getRuntimeContextSingleton(this).intercept(
                    NOOP,
                    (path) => {
                        const src = selectPathRoot(path);
                        dependencies.splice(0).map(s => {
                            return {
                                store: s.store,
                                path: selectPathRoot(s.path)
                            };
                        }).forEach(s => {
                            const store = s.store;
                            if (!linkAge.has(store)) {
                                linkAge.set(store, new Map());
                            }
                            const sl = linkAge.get(store);
                            if (!sl.has(s.path)) {
                                sl.set(s.path, []);
                            }
                            const targets = sl.get(s.path);
                            if (!targets.includes(src)) {
                                targets.push(src);
                            }
                        });
                    }
                );
            },
            attached() {
                if (linkAge.size && stores && stores.length) {
                    for (const store of stores) {
                        store.registerComponentLinkAge(this, linkAge.get(store));
                        store.connectComponent(this);
                    }
                }
                if (cancel) {
                    cancel();
                }
            },
            detached() {
                for (const store of Store.instances()) {
                    store.disconnectComponent(this);
                }
            }
        };
    }

    install(extender, context, options) {

    }
}