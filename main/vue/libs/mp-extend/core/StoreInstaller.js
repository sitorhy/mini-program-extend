import OptionInstaller from "./OptionInstaller";
import {Connector} from "../libs/Store";
import {selectPathRoot} from "../utils/object";
import {isFunction} from "../utils/common";

const UnwatchSign = ("__wxUnWAT__");

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
    },

    watchStore(store, runtimeContext, computed) {
        const sl = LinkAge.getStoreLinkAge(store);
        if (sl.has(runtimeContext.is)) {
            for (const [path, targets] of sl.get(runtimeContext.is)) {
                const unwatch = store.watch(
                    path,
                    () => {
                        if (targets && targets.length) {
                            for (const p of targets) {
                                const getter = isFunction(computed[p].get) ? computed[p].get : computed[p];
                                if (isFunction(getter)) {
                                    runtimeContext[p] = getter.call(runtimeContext);
                                } else {
                                    throw new Error(`Getter is missing for computed property "${p}".`);
                                }
                            }
                        }
                    },
                    {
                        immediate: false,
                        deep: true
                    }
                );
                if (unwatch) {
                    Reflect.get(runtimeContext, UnwatchSign).push(unwatch);
                }
            }
        }
    },

    unwatchStore(runtimeContext) {
        const unwatch = Reflect.get(runtimeContext, UnwatchSign);
        if (unwatch && unwatch.length) {
            unwatch.forEach(i => i());
        }
    }
};

const WatchInstallBehavior = Behavior({
    lifetimes: {
        created() {
            Object.defineProperty(this, UnwatchSign, {
                value: [],
                writable: false,
                configurable: true,
                enumerable: false
            });
        },
        detached() {
            LinkAge.unwatchStore(this);
        }
    }
});

/**
 * StoreInstaller 依赖 ComputedInstaller
 */
export default class StoreInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [WatchInstallBehavior].concat(defFields.behaviors || []);
    }

    lifetimes(extender, context, options) {
        let unwatchState;
        let unwatchStore;
        const dependencies = [];
        return {
            created() {
                const stores = Connector.instances().filter(s => {
                    const sl = LinkAge.getStoreLinkAge(s);
                    return !sl.has(this.is);
                });
                if (stores.length) {
                    for (const store of stores) {
                        unwatchStore = Connector.intercept(
                            store,
                            (path, value, level) => {
                                if (!dependencies.findIndex(s => s.store === store && s.path === path) >= 0 && level === 0) {
                                    dependencies.push({
                                        store,
                                        path
                                    });
                                }
                                return true;
                            },
                            null
                        );
                    }
                    unwatchState = extender.getRuntimeContextSingleton(this).intercept(
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
                const computed = context.get("computed");
                Connector.instances().forEach(s => {
                    LinkAge.watchStore(s, this, computed);
                });

                if (unwatchStore) {
                    unwatchStore();
                }

                if (unwatchState) {
                    unwatchState();
                }
            }
        };
    }
}