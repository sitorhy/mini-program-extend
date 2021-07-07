import OptionInstaller from "./OptionInstaller";
import {isFunction} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import RESERVED_OPTIONS_WORDS from "../utils/options";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

export default class InstanceInstaller extends OptionInstaller {
    lifetimes(extender, context, options) {
        return {
            created() {
                if (!Object.hasOwnProperty.call(this, '$emit')) {
                    const $emit = function (target, propertyName, value) {

                    };

                    Object.defineProperty(this, '$emit', {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $emit;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, '$set')) {
                    const $set = function (target, propertyName, value) {
                        Reflect.set(target, propertyName, value);
                        return value;
                    };

                    Object.defineProperty(this, '$set', {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $set;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, '$delete')) {
                    const $delete = function (target, propertyName) {
                        Reflect.deleteProperty(target, propertyName);
                    };

                    Object.defineProperty(this, '$delete', {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $delete;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, '$nextTick')) {
                    const $nextTick = function (callback) {
                        if (isFunction(callback)) {
                            wx.nextTick(callback);
                        }
                    };

                    Object.defineProperty(this, '$nextTick', {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $nextTick;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, '$root')) {
                    Object.defineProperty(this, '$root', {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return getCurrentPages().find(p => p['__wxWebviewId__'] === this['__wxWebviewId__']);
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, '$options')) {
                    Object.defineProperty(this, '$options', {
                        configurable: false,
                        enumerable: false,
                        get() {
                            if (options) {
                                return Stream.of(Object.entries(options))
                                    .filter(([p]) => !RESERVED_OPTIONS_WORDS.has(p) && !RESERVED_LIFECYCLES_WORDS.has(p))
                                    .collect(Collectors.toMap());
                            } else {
                                return {};
                            }
                        }
                    });
                }
            }
        }
    }
}