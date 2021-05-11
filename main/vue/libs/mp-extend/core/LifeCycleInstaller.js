import OptionInstaller from "./OptionInstaller";
import {Blend} from "../libs/Blend";
import {isFunction} from "../utils/common";

export default class LifeCycleInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const {
            beforeCreate,
            created,
            attached,
            show,
            onShow,
            ready,
            onReady,
            beforeMount,
            mounted,
            beforeDestroy,
            detached,
            destroyed
        } = options;

        const data = context.get('data');
        const methods = context.get('methods') || {};
        const properties = context.get('properties');

        const behavior = {
            created: created,
            ready: Blend(ready, null, onReady),
            lifetime: {
                attached: Blend(attached, beforeMount, mounted),
                detached: Blend(detached, beforeDestroy, destroyed)
            },
            pageLifetimes: {
                show: Blend(show, null, onShow)
            }
        };

        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior(behavior)
        ]);

        if (isFunction(beforeCreate)) {
            beforeCreate.call(this.createInitializationCompatibleContext(data, properties, methods, null));
        }
    }

    build(extender, context, options) {
        const {
            onLoad
        } = options;

        return {
            onLoad
        };
    }
}