import OptionInstaller from './OptionInstaller';
import {Invocation} from "../libs/Invocation";
import {isFunction, isNullOrEmpty, isPlainObject, isPrimitive, isString} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

class CompatibleWatcher {
    _oldValue = [];
    _callback = undefined;
    _immediate = false;
    _deep = false;
    _path = "";

    constructor(path, callback, immediate, deep, oldValue = []) {
        this._callback = callback;
        this._immediate = immediate;
        this._deep = deep;
        this._path = path;
        this._oldValue = oldValue;
    }

    call(thisArg, args) {
        if (this._callback) {
            this._callback.apply(thisArg, args.concat(this._oldValue));
        }
        this._oldValue = args;
    }

    get immediate() {
        return this._immediate;
    }

    set immediate(value) {
        this._immediate = value;
    }

    get deep() {
        return this._deep;
    }

    set deep(value) {
        this._deep = value;
    }

    get path() {
        return this._path;
    }

    set path(value) {
        this._path = value;
    }

    get oldValue() {
        return this._oldValue;
    }

    set oldValue(value) {
        this._oldValue = value;
    }
}

/**
 * immediate - 拦截 mounted/attached 前置执行
 * deep - 加上 '.**' 后缀
 */
export default class WatcherInstaller extends OptionInstaller {

    /**
     * Vue 形式侦听器格式只包含数字字母和点运算符
     * @param data
     * @param path
     * @returns {any|undefined}
     */
    selectData(data, path) {
        if (!/[\w\.]+/.test(path)) {
            throw new Error(`Failed watching path: "${path}" Watcher only accepts simple dot-delimited paths. For full control, use a function instead.`);
        }
        if ((data === null || data === undefined || isPrimitive(data)) && path) {
            return undefined;
        }
        const iDot = path.indexOf('.');
        const prop = path.substring(0, iDot < 0 ? path.length : iDot);
        const right = path.substring(prop.length + 1);
        if (!right) {
            return Reflect.get(data, prop);
        } else {
            return this.selectData(Reflect.get(data, prop), right);
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {

    }

    /**
     * 统一 Vue 格式的侦听器
     * @param extender
     * @param context
     * @param options
     */
    install(extender, context, options) {
        const watchers = Object.assign.apply(
            undefined,
            [
                {},
                ...extender.installers.map(i => i.watch()),
                options.watch
            ]
        );
        const watch = Stream.of(Object.entries(watchers)).map(([path, watcher]) => {
            return [
                path,
                [].concat(watcher).map(w => {
                    const normalize = {
                        handler: null,
                        deep: false,
                        immediate: false
                    };
                    if (isString(w)) {
                        normalize.handler = function () {
                            const method = this[w];
                            if (isFunction(method)) {
                                method.apply(this, arguments);
                            }
                        };
                    } else if (isFunction(w)) {
                        normalize.handler = w;
                    } else if (isPlainObject(w)) {
                        const {immediate, deep, handler} = w;
                        normalize.immediate = immediate === true;
                        normalize.deep = deep === true;
                        normalize.handler = handler;
                    }
                    return normalize;
                }).filter(w => isFunction(w.handler))
            ];
        }).filter(([, watchers]) => watchers.length > 0).collect(Collectors.toMap());

        context.set('watch', watch);
    }
}