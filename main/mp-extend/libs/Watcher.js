import equal from "./fast-deep-equal/index";
import {isFunction, isString} from "../utils/common";

class ValueWatcher {
    name = null;
    watching = undefined;
    current = undefined;
    prev = undefined;

    constructor(name) {
        this.name = name;
    }

    prepare(value) {
        this.watching = value;
    }

    accept() {
        this.prev = this.current;
        this.current = this.watching;
        this.watching = undefined;
        return !equal(this.current, this.prev);
    }

    get value() {
        return this.current;
    }

    get previous() {
        return this.prev;
    }
}

export class Watcher {

    /**
     * @type {Map<String, ValueWatcher>}
     */
    watchers = new Map();

    constructor(subFields) {
        if (isString(subFields)) {
            subFields.split(",").forEach(i => {
                const name = i.trim();
                return this.watchers.set(name, new ValueWatcher(name));
            });
        } else {
            throw new Error(`Try subscribe invalid fields: ${subFields.toString()}`);
        }
    }

    /**
     * 比较多个值 传 object 比较单个值传 name / value
     * @param args
     */
    prepare(...args) {
        let obj;
        if (args.length === 1) {
            obj = args[0];
            if (obj) {
                Object.keys(obj).forEach((name) => {
                    const watcher = this.watchers.get(name);
                    if (watcher) {
                        watcher.prepare(obj[name]);
                    }
                });
            }
        } else {
            const name = args[0];
            const value = args[1];
            const watcher = this.watchers.get(name);
            if (watcher) {
                watcher.prepare(value);
            }
        }
    }

    accept(changed) {
        const watchers = [...this.watchers.values()];
        if (watchers.some(w => w.accept())) {
            if (isFunction(changed)) {
                (watchers.length > 1 ?
                        watchers.map(w => [w.value, w.previous]) :
                        [[watchers[0].value, watchers[0].previous]]
                ).forEach(args => {
                    changed(...args);
                });
            }
            return true;
        }
        return false;
    }

    get names() {
        return [...this.watchers.keys()];
    }

    get values() {
        return [...this.watchers.values()].map(i => i.value);
    }
}