import OptionInstaller from './OptionInstaller';

export default class MethodsInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        Object.assign(defFields, {
            behaviors: (defFields.behaviors || []).concat(
                Behavior(
                    {
                        methods: context.get('methods')
                    }
                )
            )
        });
    }

    install(extender, context, options) {
        const {methods = null} = options;
        context.set('methods', Object.assign.apply(
            undefined,
            [
                {},
                ...extender.installers.map(i => i.methods()),
                methods
            ]
        ));
    }
}