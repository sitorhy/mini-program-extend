import OptionInstaller from './OptionInstaller';
import {Invocation} from "../libs/Invocation";
import {isFunction, isNullOrEmpty, isPlainObject, isPrimitive, isString} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

const WatchSign = Symbol('__wxWatch__');

class CompatibleWatcher {
    _oldValue = [];
    _callback = undefined;
    _immediate = false;
    _deep = false;
    _path = "";

    /**
     *
     * @param path - 使用Vue格式
     * @param callback - 自定义回调
     * @param immediate - 创建后是否立即执行，静态监听器必定为true
     * @param deep - 深度监听
     * @param oldValue - 初始值
     */
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
 *
 * 对于 properties 默认值 与 查询串值同时存在时，created执行后会被查询串的值覆盖：
 * properties = { a:{ value:114,observer:ob1 } } , observers:{ a:ob2 }，同时页面传入page?a=514
 * 在 attached 执行前，在created取得的值是a=114，attached后取得的值变为a=514，并且触发ob1 (114=>514)  ,ob2(514)，优先级ob1>ob2
 * 并且 触发器触发时机在 created 与 attached 之间
 *
 * 由于垃圾小程序新增的 observers配置 并不会传入旧值，想要兼容Vue获取旧值并保存，可以拦截created获取旧值，此时的属性值还没有被查询串值覆盖
 * 并且created执行时所有侦听器还没有被执行，当侦听器执行时，可以顺利将传入的新值与旧值比对
 *
 */
export default class WatcherInstaller extends OptionInstaller {

    /**
     * Vue 形式侦听器格式只包含数字字母下划线和点运算符
     * @param data
     * @param path
     * @returns {any|undefined}
     */
    selectData(data, path) {
        if (!path) {
            return undefined;
        }
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

    /**
     * 转换Vue的格式为小程序格式
     * @param rule
     * @returns {*}
     */
    transformToCompactField(rule) {
        return rule.replace(/\.(\d+)/g, function () {
            return `[${arguments[1]}]`;
        });
    }

    /**
     * 对于静态监听器，编译期间便可确定旧值
     * @param extender
     * @param context
     * @param options
     * @param defFields
     */
    staticWatchersDefinition(extender, context, options, defFields) {
        const watch = context.get('watch');
        const state = context.get('state');

        const staticWatchers = new Map();

        // 依赖StateInstaller
        if (state) {
            const observers = Stream.of(Object.entries(watch)).map(([path, watchers]) => {
                const oldValue = this.selectData(state, path);
                const compactPath = this.transformToCompactField(path);

                // 创建后立即执行（代理执行）,检查是否存在immediate为true的侦听器
                staticWatchers.set(compactPath, new CompatibleWatcher(path, function () {

                }, true, false, oldValue));

                return [compactPath, watchers];
            }).collect(Collectors.toMap());
            console.log(observers);
            console.log(staticWatchers)

            const behavior = {
                lifetimes: {
                    created() {
                        Object.defineProperty(this, WatchSign, {
                            configurable: false,
                            enumerable: false,
                            value: staticWatchers,
                            writable: false
                        });
                    }
                },
                observers: Stream.of(
                    Object.keys(observers).map(path => {
                        return [
                            path,
                            function (newValue) {
                                console.log(`${path} => ${JSON.stringify(newValue)}`);
                            }
                        ];
                    })
                ).collect(Collectors.toMap())
            };

            console.log(behavior)

            defFields.behaviors = (defFields.behaviors || []).concat(Behavior(behavior));
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const watch = context.get('watch');
        if (watch && Object.keys(watch).length) {
            this.staticWatchersDefinition(extender, context, options, defFields);
        }
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