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
import {Singleton} from "../libs/Singleton";
import {isFunction} from "../utils/common";

class InstallersSingleton extends Singleton {
    /**
     * @type {Map<any, any>}
     * @private
     */
    _installers = new Map();

    constructor() {
        super(() => {
            return [...this._installers.entries()].sort((i, j) => i[1] - j[1]).map(i => i[0]);
        });
    }

    prepare(installer, priority = 50) {
        if (installer instanceof OptionInstaller) {
            if (!this._installers.has(installer)) {
                this._installers.set(installer, priority);
            }
        }
    }
}

export default class MPExtender {
    _installers = new InstallersSingleton();
    _context = new Map();

    constructor() {
        this.use(new MixinInstaller(), 10);
        this.use(new MethodsInstaller(), 15);
        this.use(new PropertiesInstaller(), 20);
        this.use(new DataInstaller(), 25);
        this.use(new StateInstaller(), 30);
        //    this.use(new WatcherInstaller(),60);
        this.use(new ComputedInstaller(), 35);
        this.use(new LifeCycleInstaller(), 40);
        this.use(new ContextInstaller(), 100);
    }

    get installers() {
        return this._installers.get();
    }

    use(installer, priority = 50) {
        this._installers.prepare(installer, priority);
    }

    extends(options) {
        const installers = this.installers;
        installers.forEach(installer => {
            installer.install(this, this._context, options);
        });
/*
        if (isFunction(this._context.get('beforeCreate'))) {
            const initContext = this.createInitializationContextSingleton();
            const options = {};
            // 检查是否安装ContextInstaller，methods被修改过
            const methods = context.get('originalMethods') || context.get('methods');
            context.get('beforeCreate').call(
                initContext.get(
                    options,
                    context.get('state'),
                    context.get('properties'),
                    methods
                )
            );
            (function () {
                this.$props.age = 99;
                console.log(this.$data);
                console.log(this.$props)
                this.test = 999;
                this.$data.x = 777;
            }).call(
                initContext.get(
                    options,
                    context.get('state'),
                    context.get('properties'),
                    methods
                )
            )
            console.log(options)
            if (Object.keys(options).length) {
                defFields.behaviors = (defFields.behaviors || []).concat(Behavior(options));
            }
        }
        */
        const config = {
            behaviors: [
                Behavior({
                    definitionFilter: (defFields, definitionFilterArr) => {
                        installers.forEach(installer => {
                            installer.definitionFilter(this, this._context, options, defFields, definitionFilterArr);
                            defFields.behaviors = (defFields.behaviors || []).concat(installer.behaviors());
                        });
                    }
                })
            ]
        };
        installers.forEach(installer => {
            Object.assign(config, installer.build(this, this._context, options));
        });
        return config;
    }
}