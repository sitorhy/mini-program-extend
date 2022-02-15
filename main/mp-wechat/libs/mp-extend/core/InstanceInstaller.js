import OptionInstaller from "./OptionInstaller";
import {isFunction} from "../utils/common";

export default class InstanceInstaller extends OptionInstaller {
    lifetimes(extender, context, options) {
        return {
            created() {
                if (!Object.hasOwnProperty.call(this, "$set")) {
                    const $set = function (target, propertyName, value) {
                        Reflect.set(target, propertyName, value);
                        return value;
                    };

                    Object.defineProperty(this, "$set", {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $set;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, "$delete")) {
                    const $delete = function (target, propertyName) {
                        Reflect.deleteProperty(target, propertyName);
                    };

                    Object.defineProperty(this, "$delete", {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $delete;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, "$nextTick")) {
                    const $nextTick = function (callback) {
                        if (isFunction(callback)) {
                            wx.nextTick(callback);
                        }
                    };

                    Object.defineProperty(this, "$nextTick", {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return $nextTick;
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, "$root")) {
                    Object.defineProperty(this, "$root", {
                        configurable: false,
                        enumerable: false,
                        get() {
                            return getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
                        }
                    });
                }

                if (!Object.hasOwnProperty.call(this, "$options")) {
                    const $options = context.has("constants") ? context.get("constants") : extender.createConstantsContext(options);
                    Object.defineProperty(this, "$options", {
                        configurable: false,
                        enumerable: false,
                        get() {
                            if (options) {
                                return $options;
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