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
                            beforeUpdate(data);
                            return originalSetData.call(this, data, function () {
                                updated();
                                if (isFunction(callback)) {
                                    callback();
                                }
                            });
                        };
                    },
                    detached() {
                        this.setData = Reflect.get(this, SetDataSign);
                        Object.deleteProperty(this, SetDataSign);
                    }
                }
            })
        ].concat(defFields.behaviors || []);
    }

    install(extender, context, options) {
        const beforeUpdateChain = extender.installers.map(i => i.beforeUpdate);
        const updatedChain = extender.installers.map(i => i.updated);
        context.set('beforeUpdate', function (state) {
            beforeUpdateChain.forEach(i => i(state));
        });
        context.set('updated', function () {
            updatedChain.forEach(i => i());
        });
    }
}