import MPExtender from "./core/MPExtender";

export const Extension = {
    _installerClasses: new Map(),

    use: function (installerClass, priority = 100) {
        this._installerClasses.set(installerClass, priority);
    }
};

export function PageEx(options) {
    const extender = new MPExtender();
    if (Extension._installerClasses.size) {
        for (const [Installer, priority] of Extension._installerClasses) {
            extender.use(new Installer(), priority);
        }
    }
    Page(extender.extends(options));
}

export function ComponentEx(options) {
    const extender = new MPExtender();
    if (Extension._installerClasses.size) {
        for (const [Installer, priority] of Extension._installerClasses) {
            extender.use(new Installer(), priority);
        }
    }
    Component(extender.extends(options));
}