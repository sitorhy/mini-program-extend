import {isFunction} from "../utils/common";

function applyFunctions(functions, args) {
    let result;
    let validResult;
    functions.forEach((func) => {
        if (isFunction(func)) {
            validResult = func.apply(this, args);
            if (validResult !== undefined) {
                result = validResult;
            }
        }
    });
    return result;
}

export function Invocation(target, before, after) {
    return function (...args) {
        let result;
        let validResult;
        if (isFunction(before)) {
            validResult = before.apply(this, args);
        } else if (Array.isArray(before)) {
            validResult = applyFunctions.call(this, before, args);
        }
        if (validResult !== undefined) {
            result = validResult;
        }
        if (isFunction(target)) {
            validResult = target.apply(this, args);
        } else if (Array.isArray(target)) {
            validResult = applyFunctions.call(this, target, args);
        }
        if (validResult !== undefined) {
            result = validResult;
        }
        if (isFunction(after)) {
            validResult = after.apply(this, args);
        } else if (Array.isArray(after)) {
            validResult = applyFunctions.call(this, after, args);
        }
        if (validResult !== undefined) {
            result = validResult;
        }
        return result;
    }
}