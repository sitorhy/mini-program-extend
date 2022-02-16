import OptionInstaller from "./OptionInstaller";
import Store from "../libs/Store";
import {selectPathRoot} from "../utils/object";

const LinkAge = {
    __linkAge: new Map(),

    getStoreLinkAge(store) {
        if (!this.__linkAge.has(store)) {
            this.__linkAge.set(store, new Map());
        }
        return this.__linkAge.get(store);
    },

    getComponentLinkAge(storeLinkAge, instance) {
        if (!storeLinkAge.has(instance.is)) {
            storeLinkAge.set(instance.is, new Map());
        }
        return storeLinkAge.get(instance.is);
    },

    getTargets(componentLinkAge, src) {
        if (!componentLinkAge.has(src)) {
            componentLinkAge.set(src, []);
        }
        return componentLinkAge.get(src);
    }
};

/**
 * StoreInstaller 依赖 ComputedInstaller
 */
export default class StoreInstaller extends OptionInstaller {
    lifetimes(extender, context, options) {
        let cancel;
        const dependencies = [];
        return {
            created() {
                const stores = Store.instances().filter(s => {
                    const sl = LinkAge.getStoreLinkAge(s);
                    return !sl.has(this.is);
                });
                if (stores.length) {
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
                            null
                        );
                    }
                    cancel = extender.getRuntimeContextSingleton(this).intercept(
                        null,
                        (path) => {
                            const src = selectPathRoot(path);
                            dependencies.splice(0).map(s => {
                                return {
                                    store: s.store,
                                    path: selectPathRoot(s.path)
                                };
                            }).forEach(s => {
                                const p = selectPathRoot(s.path);
                                const sl = LinkAge.getStoreLinkAge(s.store);
                                const cl = LinkAge.getComponentLinkAge(sl, this);
                                const targets = LinkAge.getTargets(cl, p);
                                targets.push(src);
                            });
                        }
                    );
                }
            },
            attached() {
                if (cancel) {
                    cancel();
                }
                const stores = Store.instances().filter(s => {
                    const sl = LinkAge.getStoreLinkAge(s);
                    return sl.has(this.is);
                });
                for (const store of stores) {
                    store.watch(
                        (state, getters) => {

                        },
                        (value, oldValue) => {

                        }
                    );
                }
            },
            detached() {

            }
        };
    }

    install(extender, context, options) {

    }
}