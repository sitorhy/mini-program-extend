import OptionInstaller from "./OptionInstaller";
import {Invocation} from "../libs/Invocation";
import {isFunction} from "../utils/common";

export default class LifeCycleInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const {
            beforeCreate,
            created,
            beforeMount,
            mounted,
            beforeUpdate,
            updated,
            beforeDestroy,
            destroyed,
            onShow,
            onHide,
            onResize,
            pageLifetimes = {},
            lifetimes = {}
        } = options;

        const data = context.get('data');
        const methods = context.get('methods') || {};
        const properties = context.get('properties');

        const behavior = {
            lifetimes: {
                created: Invocation(lifetimes.created, function () {
                    const originalSetData = this.setData;
                    this.setData = function (data, callback) {
                        if (isFunction(beforeUpdate)) {
                            beforeUpdate.call(this);
                        }
                        originalSetData.call(this, data, function () {
                            if (isFunction(callback)) {
                                callback.call(this);
                            }
                            if (isFunction(updated)) {
                                updated.call(this);
                            }
                        });
                    }
                }, null, created),
                attached: Invocation(lifetimes.attached, mounted, beforeMount),
                detached: Invocation(lifetimes.detached, destroyed, beforeDestroy)
            },
            pageLifetimes: {
                show: Invocation(pageLifetimes.show, null, onShow),
                hide: Invocation(pageLifetimes.hide, null, onHide),
                resize: Invocation(pageLifetimes.resize, null, onResize),
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
            onLoad,
            onReady,
            onUnload,
            onPullDownRefresh,
            onReachBottom,
            onShareAppMessage,
            onShareTimeline,
            onAddToFavorites,
            onPageScroll,
            onTabItemTap
        } = options;

        return {
            onLoad,
            onReady,
            onUnload,
            onPullDownRefresh,
            onReachBottom,
            onShareAppMessage,
            onShareTimeline,
            onAddToFavorites,
            onPageScroll,
            onTabItemTap
        };
    }
}