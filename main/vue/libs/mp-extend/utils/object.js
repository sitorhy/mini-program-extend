import {isFunction, isPrimitive} from "./common";

/**
 * 解析路径根对象名称
 * @param path
 * @returns {string|null}
 */
function selectPathRoot(path) {
    const v = /^[\w]+/.exec(path);
    if (v) {
        return v[0];
    }
    const d = /^\[(\d+)\]+/.exec(path);
    if (d) {
        return d[1];
    }
    const i = /^\.(\d+)/.exec(path);
    if (i) {
        return i[1];
    }
    return null;
}

/**
 * 分解路径
 * @param path
 * @returns {*[]}
 */
function splitPath(path) {
    const paths = [];

    let pathRight = path;
    while (pathRight) {
        const root = selectPathRoot(pathRight);
        const tryNum = Number.parseInt(root);

        if (Number.isSafeInteger(tryNum)) {
            if (pathRight[0] === '.') {
                pathRight = pathRight.substring(root.length + 1).replace(/^\./, '');
            } else {
                pathRight = pathRight.substring(root.length + 2).replace(/^\./, '');
            }
        } else {
            pathRight = pathRight.substring(root.length).replace(/^\./, '');
        }

        paths.push(root);
    }
    return paths;
}

/**
 * 沿路径复制对象
 *
 * @param obj 根对象
 * @param path 路径 , 支持 a.b.c[0] 或 a.b.c.0
 * @param clone 是否重新创建对象引用
 * @param override 是否覆盖目标值
 * @param value 目标值
 * @returns {{}|*}
 */
export function traceObject(obj, path, clone, override, value) {
    if (!obj || isPrimitive(obj)) {
        return obj;
    }
    const paths = splitPath(path);
    const copy = {};
    let objPointer = obj;
    let copyPointer = copy;
    for (let i = 0; i < paths.length; ++i) {
        const p = paths[i];
        objPointer = Reflect.get(objPointer, p);
        const pointer = clone ? (!objPointer || isPrimitive(objPointer) ? objPointer : (
            Array.isArray(objPointer) ? [...objPointer] : {...objPointer}
        )) : objPointer;
        Reflect.set(copyPointer, p, i === paths.length - 1 ? (override ? value : pointer) : pointer);
        copyPointer = Reflect.get(copyPointer, p);
        if (!objPointer || isPrimitive(objPointer)) {
            break;
        }
    }
    return copy;
}

/**
 * 创建反应式对象
 *
 * @param root 根对象
 * @param target 目标对象
 * @param onChanged 拦截对象修改行为，只读可以不实现
 * @param path 目标对象相对根对象路径
 * @returns {boolean|any}
 */
export function createReactiveObject(root, target, onChanged = "", path = "") {
    return new Proxy(
        target,
        {
            get(target, p, receiver) {
                const value = Reflect.get(target, p, receiver);
                if (isPrimitive(value) || !value || (typeof p === "symbol")) {
                    // 不可枚举的值，直接返回
                    return value;
                } else if (isFunction(value)) {
                    if (value === target.constructor) {
                        return value;
                    } else {
                        if (Array.isArray(target)) {
                            // 数组 splice / push 执行后会自动 触发 set
                            // 例如 data = {a:[1,2,3]} a.push(4) , 会触发 data.a = [1,2,3,4]
                            return value;
                        } else {
                            return new Proxy(value, {
                                apply(func, thisArg, argumentsList) {
                                    const result = Reflect.apply(func, thisArg, argumentsList);
                                    if (isFunction(onChanged)) {
                                        onChanged(path, target);
                                    }
                                    return result;
                                }
                            });
                        }
                    }
                } else {
                    if (Number.isSafeInteger(Number.parseInt(p))) {
                        return createReactiveObject(root, value, onChanged, `${path}[${p}]`);
                    } else {
                        return createReactiveObject(root, value, onChanged, `${path ? path + '.' : ''}${p}`);
                    }
                }
            },
            set(target, p, value, receiver) {
                if (typeof p === "symbol") {
                    return Reflect.set(target, p, value, receiver);
                } else {
                    if (Number.isSafeInteger(Number.parseInt(p))) {
                        if (isFunction(onChanged)) {
                            onChanged(`${path}[${p}]`, value);
                        }
                    } else {
                        if (Array.isArray(target) && p === 'length') {
                            Reflect.set(target, p, value, receiver);
                        } else {
                            onChanged(`${path ? path + '.' : ''}${p}`, value);
                        }
                    }
                    return true;
                }
            },
            deleteProperty(target, p) {
                if (Array.isArray(target)) {
                    const tryNum = Number.parseInt(p);
                    if (Number.isSafeInteger(tryNum)) {
                        Array.prototype.splice.call(target, tryNum);
                        if (isFunction(onChanged)) {
                            onChanged(`${path}`, target);
                        }
                        return true;
                    }
                }
                if (Reflect.deleteProperty(target, p)) {
                    if (isFunction(onChanged)) {
                        onChanged(`${path}`, target);
                    }
                    return true;
                }
                return false;
            }
        }
    );
}
