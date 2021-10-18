import {isFunction} from "../utils/common";

function applyFunctions(functions, args) {
    functions.forEach((func) => {
        if (isFunction(func)) {
            func.apply(this, args);
        }
    });
}

export function Invocation(target, before, after) {
    return function (...args) {
        if (isFunction(before)) {
            before.apply(this, args);
        } else if (Array.isArray(before)) {
            applyFunctions.call(this, before, args);
        }
        if (isFunction(target)) {
            target.apply(this, args);
        } else if (Array.isArray(target)) {
            applyFunctions.call(this, target, args);
        }
        if (isFunction(after)) {
            after.apply(this, args);
        } else if (Array.isArray(after)) {
            applyFunctions.call(this, after, args);
        }
    }
}