import OptionInstaller from "./OptionInstaller";
import {isPlainObject} from "../utils/common";
import {Optional} from "../libs/Optional";
import {Collectors, Stream} from "../libs/Stream";

import equal from "../libs/fast-deep-equal/index";

export default class ComputedInstaller extends OptionInstaller {
    _computed = [];

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const data = context.get('data');
        const methods = context.get('methods') || {};
        const properties = context.get('properties');
        const computed = context.get('computed') || {};
        const installer = this;

        if (isPlainObject(data)) {
            const keys = new Set(Object.keys(data));
            Optional.of(Object.keys(computed).find(k => keys.has(k))).ifPresent((property) => {
                throw new Error(`The computed property "${property}" is already defined in data.`);
            });
        }

        if (isPlainObject(properties)) {
            const keys = new Set(Object.keys(properties));
            Optional.of(Object.keys(computed).find(k => keys.has(k))).ifPresent((property) => {
                throw new Error(`The computed property "${property}" is already declared as a prop.`);
            });
        }
        const instanceComputedContext = this.createInitializationCompatibleContext(data, properties, methods);

        const instComputed = Stream.of(
            Object.entries(computed)
        ).map(([name, constructor]) => {
            return [name, constructor.call(instanceComputedContext)];
        }).collect(Collectors.toMap());

        Object.assign(defFields, {
            behaviors: (defFields.behaviors || []).concat(
                Behavior(
                    {
                        data: instComputed
                    }
                )
            ),
            lifetimes: {
                created() {
                    const computedKeys = Object.keys(computed);
                    const originalSetData = this.setData;
                    let nextData = {};
                    const currentComputedContext = installer.createDynamicCompatibleContext(
                        this,
                        nextData,
                        null,
                        null
                    );
                    this.setData = function (data, callback) {
                        if (isPlainObject(data)) {
                            if (computedKeys.length) {
                                computedKeys.forEach(i => {
                                    delete data[i];
                                });
                            }
                            nextData = data;
                            const nextInstComputed = {};
                            if (computedKeys.length) {
                                computedKeys.forEach(i => {
                                    const next = computed[i].call(currentComputedContext);
                                    if (!equal(next, this.data[i])) {
                                        nextInstComputed[i] = next;
                                    }
                                });
                                Object.assign(data, nextInstComputed);
                            }
                            originalSetData.call(this, data, callback);
                        } else {
                            originalSetData.call(this, data, callback);
                        }
                    }
                }
            }
        });
    }

    install(extender, context, options) {
        context.set('computed', Object.assign(this._computed, options.computed || {}));
    }
}