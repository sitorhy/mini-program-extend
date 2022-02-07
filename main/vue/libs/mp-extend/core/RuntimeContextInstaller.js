import OptionInstaller from "./OptionInstaller";

const RTCSign = Symbol("__wxRTC__");

export default class RuntimeContextInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            Behavior({
                lifetimes: {
                    created() {
                        const properties = context.get("properties");
                        const computed = context.get("computed");
                        const runtimeContext = context.get("runtimeContext").get(this, properties, computed, context.get("originalSetData") || this.setData.bind(this));
                        Object.defineProperty(this, RTCSign, {
                            value: runtimeContext,
                            configurable: false,
                            enumerable: false
                        });
                    },
                    detached() {
                        Reflect.deleteProperty(this, RTCSign);
                    }
                }
            })
        ].concat(defFields.behaviors || []);
    }

    install(extender, context, options) {
        context.set("runtimeContext", extender.createRuntimeContextSingleton());
    }
}