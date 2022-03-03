import _MPExtender from "./core/MPExtender";
import _OptionInstaller from "./core/OptionInstaller";

import MixinInstaller from "./core/MixinInstaller";

export const Extension = {
    _installerClasses: new Map(),
    _globalStore: null,

    use: function (installerClass, priority = 100) {
        this._installerClasses.set(installerClass, priority);
    },

    mixin: function (mixin) {
        MixinInstaller.addGlobalMixin(mixin);
    }
};

export function PageEx(options) {
    const extender = new _MPExtender();
    if (Extension._installerClasses.size) {
        for (const [Installer, priority] of Extension._installerClasses) {
            extender.use(new Installer(), priority);
        }
    }
    Page(extender.extends(options));
}

export function ComponentEx(options) {
    const extender = new _MPExtender();
    if (Extension._installerClasses.size) {
        for (const [Installer, priority] of Extension._installerClasses) {
            extender.use(new Installer(), priority);
        }
    }
    Component(extender.extends(options));
}

export const MPExtender = _MPExtender;

export const OptionInstaller = _OptionInstaller;