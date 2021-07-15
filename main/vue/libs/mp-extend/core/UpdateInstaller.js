import OptionInstaller from "./OptionInstaller";
import {isFunction} from "../utils/common";

const SetDataSign = Symbol("__wxSetData__");

export default class UpdateInstaller extends OptionInstaller {
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
                            beforeUpdate.call(this, data);
                            return originalSetData.call(this, data, function () {
                                updated.call(this, data);
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
        const beforeUpdateChain = extender.installers.map(i => i.beforeUpdate).filter(i => !!i);
        const updatedChain = extender.installers.map(i => i.updated).filter(i => !!i);
        context.set('beforeUpdate', function (data) {
            beforeUpdateChain.forEach(i => i.call(this, data));
        });
        context.set('updated', function (data) {
            updatedChain.forEach(i => i.call(this, data));
        });
    }
}