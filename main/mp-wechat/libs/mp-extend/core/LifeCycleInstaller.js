import OptionInstaller from "./OptionInstaller";
import {Invocation} from "../libs/Invocation";
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
            ready: Invocation(ready, null, onReady),
            lifetimes: {
                attached: Invocation(attached, beforeMount, mounted),
                detached: Invocation(detached, beforeDestroy, destroyed)
            },
            pageLifetimes: {
                show: Invocation(show, null, onShow)
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