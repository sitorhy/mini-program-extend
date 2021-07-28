import {isFunction} from "../utils/common";

class EventHandler {
    /**
     * @type {Function|null}
     * @private
     */
    _callback = null;

    _count = -1;

    /**
     * @type { function(event:string,callback:function):void } | null}
     * @private
     */
    _release = null;

    /**
     * @type {string}
     * @private
     */
    _name = "";

    /**
     * @param {any[]} args
     */
    apply(args) {
        if (isFunction(this._callback)) {
            if (this._count === -1) {
                this._callback.apply(undefined, args);
            } else if (this._count > 0) {
                this._callback.apply(undefined, args);
                if (!(--this._count)) {
                    if (isFunction(this._release)) {
                        this._release.call(undefined, this._name, this._callback);
                        this._release = null;
                        this._callback = null;
                    }
                }
            }
        }
    }

    equal(callback) {
        return this._callback === callback;
    }

    constructor(name, callback, count = -1, release = null) {
        this._name = name;
        this._callback = callback;
        this._count = count;
        this._release = release;
    }
}

export default class EventEmitter {
    _listeners = null;

    /**
     * @returns {Map<string,EventHandler[]>}
     */
    get listeners() {
        if (!this._listeners) {
            this._listeners = new Map();
        }
        return this._listeners;
    }

    /**
     * @param {String|String[]} events
     * @param {Function} callback
     */
    on(events, callback) {
        (Array.isArray(events) ? events : [events]).forEach(event => {
            /* EventHandler[] */
            let cbs;
            if (!this.listeners.has(event)) {
                cbs = [];
                this.listeners.set(event, cbs);
            } else {
                cbs = this.listeners.get(event);
            }
            if (!cbs.some(i => i.equal(callback))) {
                cbs.push(new EventHandler(event, callback));
            }
        });
    }

    /**
     * @param {String} event
     * @param {Function} callback
     */
    once(event, callback) {
        /* EventHandler[] */
        let cbs;
        if (!this.listeners.has(event)) {
            cbs = [];
            this.listeners.set(event, cbs);
        } else {
            cbs = this.listeners.get(event);
        }
        if (!cbs.some(i => i.equal(callback))) {
            cbs.push(new EventHandler(event, callback, 1, (e, cb) => {
                this.off(e, cb);
            }));
        }
    }

    /**
     * 如果没有提供参数，则移除所有的事件监听器；
     * 如果只提供了事件，则移除该事件所有的监听器；
     * 如果同时提供了事件与回调，则只移除这个回调的监听器。
     * @param {String?} event
     * @param {Function?} callback
     */
    off(event, callback) {
        if (!event) {
            this.listeners.clear();
        } else if (!callback) {
            const cbs = this.listeners.get(event);
            if (Array.isArray(cbs)) {
                cbs.splice(0);
            }
        } else {
            const cbs = this.listeners.get(event);
            if (Array.isArray(cbs)) {
                const index = cbs.findIndex(i => i.equal(callback));
                if (index >= 0) {
                    cbs.splice(index, 1);
                }
            }
        }
    }

    /**
     * @param {String} event
     * @param {any[]} ...args
     */
    emit(event, ...args) {
        const cbs = this.listeners.get(event);
        if (Array.isArray(cbs)) {
            cbs.forEach(i => {
                i.apply(args);
            });
        }
    }


    /**
     * on别名
     * @param events
     * @param callback
     */
    $on(events, callback) {
        return this.on(events, callback);
    }

    $once(event, callback) {
        return this.once(event, callback);
    }

    $off(event, callback) {
        return this.off(event, callback);
    }

    $emit(event, ...args) {
        return this.emit(event, ...args);
    }
}