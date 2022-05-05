import {isFunction, isPrimitive, isString, isSymbol} from "./common";

/**
 * 解析路径根对象名称
 * @param path
 * @returns {string|null}
 */
export function selectPathRoot(path) {
    const v = /^\$?[\w]+/.exec(path);
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

export function selectPathParent(path) {
    let i = path.lastIndexOf("[");
    if (i < 0) {
        i = path.lastIndexOf(".");
    }
    if (i >= 0) {
        return path.substring(0, i);
    }
    return path;
}

/**
 * 分解路径
 * @param path
 * @returns {*[]}
 */
export function splitPath(path) {
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

const OBSign = Symbol("_ob_");

function signObject(obj, callback) {
    if (isPrimitive(obj)) {
        return obj;
    }
    if (!Reflect.has(obj, OBSign)) {
        const p = callback(obj);
        Object.defineProperty(p, OBSign, {
            enumerable: false,
            configurable: true,
            value: obj
        });
        return p;
    } else {
        const v = Reflect.get(obj, OBSign);
        Reflect.deleteProperty(obj, OBSign);
        return signObject(v, callback);
    }
}

function unmarkObject(obj) {
    if (isPrimitive(obj)) {
        return obj;
    }
    for (const k in obj) {
        const v = Reflect.get(obj, k);
        obj[k] = unmarkObject(v, obj);
    }
    if (Reflect.has(obj, OBSign)) {
        const plain = Reflect.get(obj, OBSign);
        Reflect.deleteProperty(obj, OBSign);
        return plain;
    }
    return obj;
}

/**
 * 创建反应式对象
 *
 * @param root - 根对象
 * @param target - 目标对象
 * @param onChanged - 实现对象修改行为，只读可以不实现
 * @param path - 目标对象相对根对象路径
 * @param {(path:string,value:any,level:number,parent:any)=>void} onGet - 解析对象回调，用于获取计算依赖
 * @param {(path:string,value:any,level:number,parent:any)=>void} onSet - 设置对象回调，用于获取赋值依赖
 * @param {(path:string,level:number,parent:object)=>void} onDelete - 删除回调
 * @param {(path:string,prop:string,fn:function,thisArg:object,argArray:any[],level:number,parent:object)=>void} before - 设置函数回调，对象函数即将调用
 * @param {(path:string,result:any,level:number,parent:object)=>void} after - 设置函数回调，对象函数调用完毕
 * @param level - 层级
 * @returns {boolean|any}
 */
export function createReactiveObject(
    root,
    target,
    onChanged = null,
    path = "",
    onGet = null,
    onSet = null,
    onDelete = null,
    before = null,
    after = null,
    level = 0) {
    return new Proxy(
        target,
        {
            get(target, p, receiver) {
                const value = Reflect.get(target, p, receiver);
                if (isFunction(value) || isPrimitive(value) || !value || isSymbol(p)) {
                    if (isFunction(onGet)) {
                        if (!isSymbol(p)) {
                            onGet(`${path ? path + '.' : ''}${p}`, value, level, target);
                        }
                        if (p !== 'constructor' && Array.isArray(target) && isFunction(value)) {
                            return function () {
                                let fn = value;
                                if (Array.isArray(target) && p === "forEach") {
                                    fn = function (fnCallback) {
                                        if (!isFunction(fnCallback)) {
                                            throw new Error(`${fnCallback} is not a function`);
                                        }
                                        for (let i = 0, len = target.length; i < len; ++i) {
                                            const nextPath = `${path}[${i}]`;
                                            const el = createReactiveObject(root, target[i], onChanged, nextPath, onGet, onSet, onDelete, before, after, level + 1);
                                            fnCallback(el, i);
                                        }
                                    };
                                }
                                const thisArg = target;
                                const argArray = [...arguments];
                                if (isFunction(before)) {
                                    before(path, p, fn, thisArg, argArray, level, target);
                                }
                                const result = fn.apply(thisArg, argArray);
                                if (isFunction(after)) {
                                    after(path, result, level, target);
                                }
                                return result;
                            }.bind(target);
                        }
                    }
                    // 不可枚举的值，直接返回
                    return value;
                } else {
                    if (Number.isSafeInteger(Number.parseInt(p))) {
                        const nextPath = `${path}[${p}]`;
                        if (isFunction(onGet)) {
                            onGet(nextPath, value, level, target);
                        }

                        if (!isPrimitive(value)) {
                            if (!Reflect.has(value, OBSign)) {
                                return signObject(value, (v) => {
                                    return createReactiveObject(root, v, onChanged, nextPath, onGet, onSet, onDelete, before, after, level + 1);
                                });
                            } else {
                                return signObject(value, (v) => {
                                    return createReactiveObject(root, v, onChanged, nextPath, onGet, onSet, onDelete, before, after, level + 1);
                                });
                            }
                        }

                        return createReactiveObject(root, value, onChanged, nextPath, onGet, onSet, onDelete, before, after, level + 1);
                    } else {
                        const nextPath = `${path ? path + '.' : ''}${p}`;
                        if (isFunction(onGet)) {
                            onGet(nextPath, value, level, target);
                        }
                        return createReactiveObject(root, value, onChanged, nextPath, onGet, onSet, onDelete, before, after, level + 1);
                    }
                }
            },
            set(target, p, value, receiver) {
                if (isSymbol(p)) {
                    return Reflect.set(target, p, value, receiver);
                } else {
                    const tryNum = Number.parseInt(p);
                    if (Number.isSafeInteger(tryNum)) {
                        if (Array.isArray(target)) {
                            if (isFunction(onChanged)) {
                                const success = Reflect.set(target, p, value, receiver);
                                if (success) {
                                    const field = selectPathRoot(path);
                                    const v = Reflect.get(root, field);
                                    if (isFunction(onSet)) {
                                        onSet(field, v, level, target);
                                    }
                                    onChanged(field, v);
                                }
                                return success;
                            } else {
                                return Reflect.set(target, p, value, receiver);
                            }
                        } else {
                            if (isFunction(onChanged)) {
                                const nextPath = `${path}[${p}]`;
                                if (isFunction(onSet)) {
                                    onSet(nextPath, value, level, target);
                                }
                                onChanged(nextPath, value);
                            } else {
                                return Reflect.set(target, p, value, receiver);
                            }
                        }
                    } else {
                        if (Array.isArray(target) && p === 'length') {
                            return Reflect.set(target, p, value, receiver);
                        } else {
                            if (Array.isArray(value)) {
                                value = value.map(i => {
                                    return unmarkObject(i);
                                });
                            }
                            if (isFunction(onChanged)) {
                                const nextPath = `${path ? path + '.' : ''}${p}`;
                                if (isFunction(onSet)) {
                                    onSet(nextPath, value, level, target);
                                }
                                onChanged(nextPath, value);
                            } else {
                                return Reflect.set(target, p, value, receiver);
                            }
                        }
                    }
                    return true;
                }
            },
            deleteProperty(target, p) {
                if (isString(p) && /^\d+$/.test(p)) {
                    if (Array.isArray(target)) {
                        const num = Number.parseInt(p);
                        if (Reflect.deleteProperty(target, num)) {
                            const nextPath = `${path}[${num}]`;
                            if (isFunction(onDelete)) {
                                onDelete(nextPath, level, target);
                            }
                            return true;
                        }
                        return false;
                    }
                }
                if (Reflect.deleteProperty(target, p)) {
                    if (!isSymbol(p)) {
                        const nextPath = `${path ? path + '.' : ''}${p}`;
                        if (isFunction(onDelete)) {
                            onDelete(nextPath, level, target);
                        }
                    }
                    return true;
                }
                return false;
            }
        }
    );
}

export function getData(target, path) {
    const paths = splitPath(path);
    let parent = target;
    let v = undefined;
    paths.forEach(function (p) {
        if (/\d+/.test(p)) {
            if (Array.isArray(parent)) {
                const index = parseInt(p);
                if (Number.isSafeInteger(index)) {
                    v = parent[index];
                } else {
                    throw new Error(`Unexpected range index "${index}".`);
                }
            } else {
                v = parent[p];
            }
        } else {
            v = parent[p];
        }
        parent = v;
    });
    return v;
}

export function setData(target, payload) {
    Object.keys(payload).forEach(function (path) {
        const paths = splitPath(path);
        const v = payload[path];
        let o = target;
        paths.forEach(function (p, pi) {
            if (pi === paths.length - 1) {
                o[p] = v;
            } else {
                if (/\d+/.test(p)) {
                    if (Array.isArray(o)) {
                        const index = parseInt(p);
                        if (Number.isSafeInteger(index)) {
                            o = o[index];
                        } else {
                            throw new Error(`Unexpected range index "${index}".`);
                        }
                    } else {
                        o = o[p];
                    }
                } else {
                    o = o[p];
                }
            }
        });
    });
}