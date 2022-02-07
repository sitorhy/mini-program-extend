import OptionInstaller from "./OptionInstaller";

import {Stream, Collectors} from "../libs/Stream";
import {isFunction, isPlainObject} from "../utils/common";

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class HookInstaller extends OptionInstaller {
    install(extender, context, options) {
        const watch = context.get("watch");

        ["lifetimes", "pageLifetimes", "methods", "observers", "lifecycle"].forEach(prop => {
            if (context.has(prop) && isPlainObject(context.get(prop))) {
                context.set(prop,
                    Stream.of(Object.entries(context.get(prop)))
                        .filter(([, func]) => isFunction(func))
                        .map(([name, func]) => {
                            return [name, function () {
                                if (isFunction(func)) {
                                    return func.apply(extender.getRuntimeContext(this).get(), arguments);
                                }
                                return undefined;
                            }];
                        }).collect(Collectors.toMap())
                );
            }
        });

        if (watch) {
            for (const handlers of Object.values(watch)) {
                handlers.forEach(i => {
                    const handler = i.handler;
                    if (isFunction(handler)) {
                        i.handler = function () {
                            handler.apply(extender.getRuntimeContext(this).get(), arguments);
                        }
                    }
                });
            }
        }

        for (const prop of context.keys()) {
            if (!["data", "beforeCreate", "provide"].includes(prop) && isFunction(context.get(prop))) {
                const func = context.get(prop);
                context.set(prop, function () {
                    func.apply(extender.getRuntimeContext(this).get(), arguments);
                });
            }
        }
    }
}