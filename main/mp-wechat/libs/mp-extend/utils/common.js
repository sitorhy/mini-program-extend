export function isNullOrEmpty(input) {
    return (input === null || input === undefined || input === "");
}

export function isNull(value) {
    return (value === null || value === undefined);
}

export function isFunction(value) {
    return typeof value === "function";
}

export function isString(value) {
    return typeof value === "string";
}

export function isNumber(value) {
    return typeof value === "number";
}

export function isSymbol(value) {
    return typeof value === "symbol";
}

export function isPrimitive(value) {
    return (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "symbol" ||
        typeof value === "boolean"
    );
}

export function isPlainObject(obj) {
    return !Array.isArray(obj) && !isNullOrEmpty(obj) && !isPrimitive(obj);
}


export function removeEmpty(obj, options = {}) {
    if (!obj) {
        return obj;
    }
    const omitZero = !!options["omitZero"];
    const omitEmptyString = options["omitEmptyString"] === true;
    const ignore = options.ignore || [];
    const accepts = {};
    Object.keys(obj).forEach((key) => {
        if (ignore.includes(key)) {
            accepts[key] = obj[key];
        } else {
            if (!(obj[key] === null || obj[key] === undefined || (obj[key] === 0 && omitZero) || (obj[key] === "" && omitEmptyString))) {
                accepts[key] = obj[key];
            }
        }
    });
    return accepts;
}

export function randomNumber(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
            return 0;
    }
}

export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}