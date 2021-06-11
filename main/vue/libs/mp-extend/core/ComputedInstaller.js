import OptionInstaller from "./OptionInstaller";
import {isFunction, isPlainObject} from "../utils/common";
import {Optional} from "../libs/Optional";
import {Collectors, Stream} from "../libs/Stream";

import equal from "../libs/fast-deep-equal/index";

export default class ComputedInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const computed = context.get('computed');
        const methods = context.get('methods');
        const state = context.get('state');

        if (state) {
            const readOnly = Object.keys(computed).filter(i => isFunction(computed[i]));
            const instContext = this.createInitializationCompatibleContext(state, null, methods);

            const readOnlyData = Stream.of(readOnly.map((name) => {
                const calc = computed[name];
                console.log('================')
                return [name, calc.call(instContext)];
            })).collect(Collectors.toMap());

            Object.assign(defFields, {
                behaviors: (defFields.behaviors || []).concat(
                    Behavior({
                        data: Object.assign({}, readOnlyData)
                    })
                )
            });
        }
    }

    install(extender, context, options) {
        const {computed = null} = options;
        context.set('computed', Object.assign.apply(
            undefined,
            [
                {},
                ...extender.installers.map(i => i.computed()),
                computed
            ]
        ));
    }
}