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

        const readyChain = context.get("ready");
        const movedChain = context.get("moved");
        const lifetimesSet = context.get("lifetimes");
        const pageLifetimesSet = context.get("pageLifetimes");

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
            },
            ready: function () {
                readyChain.forEach(i => i.apply(this, arguments));
            },
            moved: function () {
                movedChain.forEach(i => i.apply(this, arguments));
            }
        };

        defFields.behaviors = (defFields.behaviors || []).concat([
            Behavior(behavior)
        ]);
    }

    install(extender, context, options) {
        const lifetimes = extender.installers.map(i => i.lifetimes()).filter(i => !!i);
        const pageLifetimes = extender.installers.map(i => i.pageLifetimes()).filter(i => !!i);

        const createdChain = lifetimes.map(i => i.created).concat(extender.installers.map(i => i.created)).filter(i => isFunction(i));
        const attachedChain = lifetimes.map(i => i.attached).concat(extender.installers.map(i => i.attached)).filter(i => isFunction(i));
        const detachedChain = lifetimes.map(i => i.detached).concat(extender.installers.map(i => i.detached)).filter(i => isFunction(i));

        const showChain = pageLifetimes.map(i => i.show).filter(i => isFunction(i));
        const hideChain = pageLifetimes.map(i => i.hide).filter(i => isFunction(i));
        const resizeChain = pageLifetimes.map(i => i.resize).filter(i => isFunction(i));

        const readyChain = extender.installers.map(i => i.ready);
        const movedChain = extender.installers.map(i => i.moved);

        context.set("ready", function () {
            readyChain.forEach(i => i.apply(this, arguments));
        });

        context.set("moved", function () {
            movedChain.forEach(i => i.apply(this, arguments));
        });

        context.set("lifetimes", {
            created: function () {
                createdChain.forEach(i => i.apply(this, arguments));
            },
            attached: function () {
                attachedChain.forEach(i => i.apply(this, arguments));
            },
            detached: function () {
                detachedChain.forEach(i => i.apply(this, arguments));
            }
        });
        context.set("pageLifetimes", {
            show: function () {
                showChain.forEach(i => i.apply(this, arguments));
            },
            hide: function () {
                hideChain.forEach(i => i.apply(this, arguments));
            },
            resize: function () {
                resizeChain.forEach(i => i.apply(this, arguments));
            }
        });
    }
}