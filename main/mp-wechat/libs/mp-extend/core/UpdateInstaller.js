import OptionInstaller from "./OptionInstaller";
import {isFunction} from "../utils/common";

const SetDataSign = Symbol("__wxSetData__");

export class UpdateInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const beforeUpdate = context.get('beforeUpdate');
        const updated = context.get('updated');

        defFields.behaviors = [
            Behavior({
                lifetimes: {
                    created() {
                        const originalSetData = this.setData;
                        Object.defineProperty(this, SetDataSign, {
                            get() {
                                return originalSetData;
                            },
                            enumerable: false,
                            configurable: false
                        });
                        this.setData = function (data, callback) {
                            beforeUpdate.call(this);
                            return originalSetData.call(this, data, function () {
                                updated.call(this);
                                if (isFunction(callback)) {
                                    callback.call(this);
                                }
                            });
                        };
                    },
                    detached() {
                        this.setData = Reflect.get(this, SetDataSign);
                        Reflect.deleteProperty(this, SetDataSign);
                    }
                }
            })
        ].concat(defFields.behaviors || []);
    }

    install(extender, context, options) {
        const beforeUpdateChain = extender.installers.map(i => i.beforeUpdate).concat(options.beforeUpdate).filter(i => !!i);
        const updatedChain = extender.installers.map(i => i.updated).concat(options.updated).filter(i => !!i);
        context.set('beforeUpdate', function () {
            beforeUpdateChain.forEach(i => i.call(this));
        });
        context.set('updated', function () {
            updatedChain.forEach(i => i.call(this));
        });
    }
}