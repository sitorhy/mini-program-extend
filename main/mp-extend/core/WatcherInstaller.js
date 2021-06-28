import OptionInstaller from './OptionInstaller';
import {Invocation} from "../libs/Invocation";
import {isFunction, isNullOrEmpty, isPlainObject, isString} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

const ARR_REG = /([\w\$]+)\[(\d+)\]/;

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
    selectData(data, path) {
        const iSp = path.indexOf('.');
        const target = iSp < 0 ? path : path.substring(0, iSp);
        if (iSp > 0) {
            return this.selectData(data[target], path.substring(iSp + 1));
        } else {
            if (target === '**') {
                return data;
            }
            if (ARR_REG.test(target)) {
                const [, arr, index] = ARR_REG.exec(target);
                return data[arr][parseInt(index)];
            } else {
                return data[target]
            }
        }
    }

    selectMultiData(data, paths = []) {
        if (isNullOrEmpty(data)) {
            return [];
        }
        return paths.map(path => {
            return this.selectData(data, path);
        });
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

        const testData = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: {
                f: {
                    g: 5
                }
            },
            f: [100, 200]
        }

        console.log(this.selectData(testData, 'f[1]'));
        console.log(this.selectData(testData, 'e.f'));
        console.log(this.selectData(testData, 'e.g'));
    }
}