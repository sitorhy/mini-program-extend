import OptionInstaller from "./OptionInstaller";
import {isPlainObject, isString, isSymbol} from "../utils/common";

export default class InjectInstaller extends OptionInstaller {
    install(extender, context, options) {
        try {
            const inject = {};
            extender.installers.map(i => i.inject()).concat((options || {}).inject).forEach(i => {
                if (i) {
                    if (Array.isArray(i)) {
                        i.forEach(j => {
                            if (isString(j) || isSymbol(j)) {
                                Object.assign(inject, {
                                    [j]: {
                                        from: j,
                                        default: undefined
                                    }
                                });
                            } else {
                                Object.entries(j).forEach(([k, v]) => {
                                    Object.assign(inject, {
                                        [k]: {
                                            from: k,
                                            default: isPlainObject(v) ? v.default : undefined
                                        }
                                    });
                                });
                            }
                        });
                    } else {
                        Object.entries(i).forEach(([k, v]) => {
                            Object.assign(inject, {
                                [k]: {
                                    from: k,
                                    default: isPlainObject(v) ? v.default : undefined
                                }
                            });
                        });
                    }
                }
            });
            context.set('inject', inject);
        } catch (e) {
            throw e;
        }
    }
}