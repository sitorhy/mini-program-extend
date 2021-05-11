import OptionInstaller from './OptionInstaller';

import {Stream, Collectors} from '../libs/Stream';
import {isFunction, isNullOrEmpty} from '../utils/common';
import {Singleton} from "../libs/Singleton";

/**
 * 兼容从this直接访问data的语法
 * this.data.id === this.id (true)
 */
export default class ContextInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const {methods = {}} = defFields;
        const computed = context.get('computed');
        const compatibleContext = new Singleton((thisArg) => {
            return this.createRuntimeCompatibleContext(thisArg);
        });

        const behavior = {
            created: function () {
                Object.entries(
                    Stream.of(
                        Object.entries(context.get('properties') || {})
                    ).filter(i => !isNullOrEmpty(i[1]) && isFunction(i[1].validator)).collect(Collectors.toMap())
                ).forEach(([name, constructor]) => {
                    constructor.validator.call(compatibleContext.get(this), compatibleContext.get(this).data[name], undefined);
                });
            }
        };

        if (Object.keys(methods).length) {
            Object.assign(defFields, {
                methods: Stream.of(
                    Object.entries(defFields.methods)
                ).map(([name, method]) => {
                    return [name, isFunction(method) ? function () {
                        return method.apply(compatibleContext.get(this), arguments);
                    } : method];
                }).collect(Collectors.toMap())
            });
        }

        if (computed && Object.keys(computed).length) {
            Object.keys(computed).forEach(i => {
                const c = computed[i];
                computed[i] = isFunction(c) ? function () {
                    return c.apply(compatibleContext.get(this), arguments);
                } : c;
            });
        }

        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior(behavior)
        ]);
    }
}