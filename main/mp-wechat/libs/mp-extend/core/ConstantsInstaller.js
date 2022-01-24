import OptionInstaller from "./OptionInstaller";

export default class ConstantsInstaller extends OptionInstaller {
    install(extender, context, options) {
        const $options = extender.createConstantsContext(options);
        context.set("constants", $options);
    }
}