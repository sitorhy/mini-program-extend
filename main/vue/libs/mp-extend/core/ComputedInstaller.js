import OptionInstaller from "./OptionInstaller";
import {isPlainObject} from "../utils/common";
import {Optional} from "../libs/Optional";
import {Collectors, Stream} from "../libs/Stream";

import equal from "../libs/fast-deep-equal/index";

export default class ComputedInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {

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