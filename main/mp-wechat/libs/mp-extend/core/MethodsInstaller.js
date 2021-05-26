import OptionInstaller from './OptionInstaller';

export default class MethodsInstaller extends OptionInstaller {
    _methods = {};

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        Object.assign(defFields, {
            methods: Object.assign(defFields.methods || {}, this._methods)
        });
    }

    install(extender, context, options) {
        const {methods = null} = options;
        context.set('methods', Object.assign.apply(
            undefined,
            [
                this._methods,
                ...extender.installers.map(i => i.methods()),
                methods
            ]
        ));
    }
}