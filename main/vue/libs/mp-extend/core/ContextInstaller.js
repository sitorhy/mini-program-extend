import OptionInstaller from "./OptionInstaller";

export default class ContextInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            Behavior({
                lifetimes: {
                    created() {
                        const properties = context.get("properties");
                        const computed = context.get("computed");
                        // originalSetData : 检查是否安装 UpdateInstaller
                        extender.getRuntimeContextSingleton(this).get(options, this, properties, computed, context.get("originalSetData")(this) || this.setData.bind(this));
                    }
                }
            })
        ].concat(defFields.behaviors);
    }
}