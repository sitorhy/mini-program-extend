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
    const config = extender.extends(options);
    Page(config);
    return config;
}

export function ComponentEx(options) {
    const extender = new MPExtender();
    if (Extension._installerClasses.size) {
        for (const [Installer, priority] of Extension._installerClasses) {
            extender.use(new Installer(), priority);
        }
    }
    const config = extender.extends(options);
    Component(config);
    return config;
}