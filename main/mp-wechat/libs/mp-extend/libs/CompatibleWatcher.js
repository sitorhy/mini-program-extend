export default class CompatibleWatcher {
    _oldValue = [];
    _callback = undefined;
    _once = undefined;
    _immediate = false;
    _deep = false;
    _path = "";
    _getter = undefined;

    /**
     *
     * @param path - 使用 Vue格式
     * @param callback - 必须，自定义回调
     * @param once - 必须，初始化函数，传入初始值，仅执行一次
     * @param immediate - 非必须，仅标记作用，创建后是否立即执行，取决于once实现
     * @param deep - 深度监听
     * @param oldValue - 在call未调用完毕前为当前值
     * @param {function (...args):any} getter - 值生成器，自定义值的获取逻辑
     */
    constructor(path, callback, once, immediate, deep, oldValue = [], getter = null) {
        this._callback = callback;
        this._immediate = immediate;
        this._once = once;
        this._deep = deep;
        this._path = path;
        this._oldValue = oldValue;
        this._getter = getter;
    }

    call(thisArg, args) {
        if (this._callback) {
            this._callback.apply(thisArg, args.concat(this.oldValue));
        }
        this.oldValue = args;
    }

    once(thisArg, args) {
        if (this._once) {
            this._once.apply(thisArg, args.concat(this.oldValue));
            this.oldValue = args;
            this._once = undefined;
        }
    }

    update(thisArg, ...args) {
        if (this._getter) {
            this.call(thisArg, [this._getter.call(thisArg, ...args)]);
        }
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

    get getter() {
        return this._getter;
    }

    set getter(value) {
        this._getter = value;
    }
}