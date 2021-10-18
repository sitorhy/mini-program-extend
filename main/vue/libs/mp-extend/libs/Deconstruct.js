import {isFunction, isNullOrEmpty} from "../utils/common";

export function Deconstruct(target, resolvers, copy = false) {
    const keys = Object.keys(resolvers);
    const source = Boolean(copy) ? {...target} : target;
    keys.forEach(function (key) {
        const resolver = resolvers[key];
        if (isFunction(resolver)) {
            source[key] = resolver(target);
        }
    });
    keys.filter(function (i) {
        return isNullOrEmpty(resolvers[i]);
    }).forEach(function (i) {
        delete source[i];
    });
    return source;
}