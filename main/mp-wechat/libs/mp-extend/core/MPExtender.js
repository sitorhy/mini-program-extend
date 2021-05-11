import OptionInstaller from './OptionInstaller';
import MethodsInstaller from './MethodsInstaller';
import PropertiesInstaller from './PropertiesInstaller';
import DataInstaller from './DataInstaller';
import StateInstaller from './StateInstaller';
import WatcherInstaller from './WatcherInstaller';
import ContextInstaller from './ContextInstaller';
import ComputedInstaller from "./ComputedInstaller";
import MixinInstaller from "./MixinInstaller";
import LifeCycleInstaller from "./LifeCycleInstaller";

export default class MPExtender {
    /**
     * @type {[OptionInstaller]}
     * @private
     */
    _installers = [];
    _context = new Map();

    constructor() {
        this.use(new MixinInstaller());
        this.use(new MethodsInstaller());
        this.use(new PropertiesInstaller());
        this.use(new DataInstaller());
        this.use(new StateInstaller());
        this.use(new WatcherInstaller());
        this.use(new ComputedInstaller());
        this.use(new ContextInstaller());
        this.use(new LifeCycleInstaller());
    }

    get installers() {
        return this._installers;
    }

    use(installer) {
        if (installer instanceof OptionInstaller) {
            if (this._installers.indexOf(installer) < 0) {
                this._installers.push(installer);
            }
        }
    }

    extends(options) {
        this._installers.forEach(installer => {
            installer.install(this, this._context, options);
        });
        const config = {
            behaviors: [
                Behavior({
                    definitionFilter: (defFields, definitionFilterArr) => {
                        this._installers.forEach(installer => {
                            installer.definitionFilter(this, this._context, options, defFields, definitionFilterArr);
                        });
                    }
                })
            ]
        };
        this._installers.forEach(installer => {
            Object.assign(config, installer.build(this, this._context, options));
        });
        return config;
    }
}