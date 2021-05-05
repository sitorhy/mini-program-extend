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
            this._callback.apply(thisArg, args.concat(this._oldValue || []));
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

class OnceCompatibleWatcher extends CompatibleWatcher {
    _queue = [];
    _emitted = false;
    _immediateWatchers = undefined;

    constructor(queue, path, callback = undefined) {
        super(path, callback, true, false, []);
        this._queue = queue;
        this._immediateWatchers = queue.filter(w => w.immediate);
    }

    call(thisArg, args) {
        if (this._emitted === false) {
            super.call(thisArg, args);
            this._emitted = true;
        }
    }

    run(thisArg, args = []) {
        if (this._immediateWatchers && this._immediateWatchers.length) {
            this._immediateWatchers.forEach(function (w) {
                w.call(thisArg, args);
            });
        }
    }

    release() {
        this._queue.splice(this._queue.indexOf(this), 1);
        this._queue = null;
    }

    get emitted() {
        return this._emitted;
    }
}

function collectObservers(path, handler, immediate, deep, instanceState, collection = new Map()) {
    let callbacks = collection.get(path);
    if (!callbacks) {
        callbacks = [];
        collection.set(path, callbacks);
    }
    if (isFunction(handler)) {
        callbacks.push(new CompatibleWatcher(path, handler, immediate, deep));
    } else if (isString(handler)) {
        callbacks.push(new CompatibleWatcher(
            path,
            function () {
                if (isFunction(this[handler])) {
                    (this[handler]).apply(this, arguments);
                }
            },
            immediate,
            deep
        ));
    } else if (isPlainObject(handler)) {
        const {deep = false, immediate = false} = handler;
        if (deep === true) {
            collectObservers(path + '.**', handler['handler'], immediate, false, instanceState, collection);
        } else {
            collectObservers(path, handler['handler'], immediate, false, instanceState, collection);
        }
    } else if (Array.isArray(handler)) {
        handler.forEach(i => {
            collectObservers(path, i, immediate, deep, instanceState, collection);
        });
    }
}

/**
 * immediate - 拦截 mounted/attached 前置执行
 * deep - 加上 '.**' 后缀
 */
export default class WatcherInstaller extends OptionInstaller {
    _observers = {};

    watch(expOfFn, callback, options) {

    }

    dynamicObserver() {

    }

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
        const observers = context.get('observers') || {};
        const watch = context.get('watch');
        const data = context.get('data');
        const properties = context.get('properties');
        const installer = this;

        const instanceState = this.createInitializationCompatibleContext(data, properties, null);

        Object.assign(observers, Object.hasOwnProperty.call(observers, '**') ? {
            '**': Invocation(observers['**'], this.dynamicObserver)
        } : {
            '**': this.dynamicObserver
        });

        const paths = Object.keys(watch).filter(i => i !== '**');
        if (paths.length > 0) {
            const collection = new Map();
            paths.forEach((i) => {
                collectObservers(i, watch[i], false, false, instanceState, collection);
            });

            const onceWatchers = [];

            Object.assign.apply(undefined, [
                observers,
                Stream.of([...collection]).filter(([, watchers]) => {
                    return watchers.length > 0;
                }).map(([path, watchers]) => {
                    const oldValue = installer.selectMultiData(instanceState, path.split(','));
                    const once = new OnceCompatibleWatcher(
                        watchers,
                        path,
                        function () {
                            watchers.forEach(w => {
                                w.oldValue = oldValue;
                            });
                        }
                    );
                    watchers.unshift(once);
                    onceWatchers.push(once);

                    const observer = observers[path];
                    return [path, function (...args) {
                        if (isFunction(observer)) {
                            observer.call(this, args);
                        }
                        watchers.forEach(w => {
                            w.call(this, args);
                        });
                    }];
                }).collect(Collectors.toMap())
            ]);

            Object.assign(defFields, {
                behaviors: (defFields.behaviors || []).concat(
                    Behavior(
                        {
                            lifetimes: {
                                attached() {
                                    const currentState = installer.createRuntimeCompatibleContext(this);
                                    onceWatchers.filter(w => w.emitted === false).forEach(w => {
                                        if (w.path) {
                                            const paths = w.path.split(',');
                                            if (paths.length) {
                                                const currentValues = installer.selectMultiData(currentState, paths);
                                                w.run(this, currentValues);
                                                w.call(this, currentValues);
                                            }
                                        }
                                    });
                                    onceWatchers.splice(0).forEach(w => w.release());
                                }
                            }
                        }
                    )
                )
            });
        }

        Object.assign(defFields, {
            observers
        });
    }

    install(extender, context, options) {
        const {observers = null} = options;
        context.set('observers', Object.assign.apply(
            undefined,
            [
                this._observers,
                ...extender.installers.map(i => i.observers()),
                observers
            ]
        ));
        context.set('watch', options.watch || {});
    }
}