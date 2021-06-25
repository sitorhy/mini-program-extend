import OptionInstaller from "./OptionInstaller";
import {Deconstruct} from "../libs/Deconstruct";
import {Blend} from "../libs/Blend";
import {isFunction} from "../utils/common";

export default class MixinInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        if (isFunction(context.get('beforeCreate'))) {
            const compileContext = extender.createInitializationContextSingleton();
            const options = {};
            // 检查是否安装ContextInstaller，methods被修改过
            const methods = context.get('originalMethods') || context.get('methods') || {};
            context.get('beforeCreate').call(
                compileContext.get(
                    options,
                    context.get('state') || {},
                    context.get('properties') || {},
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
                compileContext.get(
                    options,
                    context.get('state'),
                    context.get('properties'),
                    methods
                )
            )
            console.log(options)
            console.log(context.get('state'))
            console.log( context.get('properties'))
            if (Object.keys(options).length) {
                defFields.behaviors = (defFields.behaviors || []).concat(Behavior(options));
            }
        }
    }

    install(extender, context, options) {
        const {mixins} = options;

        if (Array.isArray(mixins) && mixins.length) {
            mixins.forEach(m => {
                if (m && Object.keys(m).length) {
                    const {
                        methods,
                        props,
                        properties,
                        data,
                        observers,
                        watch,
                        computed,
                        ...members
                    } = m;
                    Object.assign(
                        options,
                        Deconstruct(m, {
                            mixins: () => null,
                            methods: (o) => {
                                return Object.assign({}, methods, o.methods);
                            },
                            properties: (o) => {
                                return Object.assign({}, props, properties, o.props, o.properties);
                            },
                            props: null,
                            data: (o) => {
                                return Blend(o.data, data);
                            },
                            observers: (o) => {
                                return Object.assign({}, observers, o.observers);
                            },
                            watch: (o) => {
                                return Object.assign({}, watch, o.watch);
                            },
                            computed: (o) => {
                                return Object.assign({}, computed, o.computed);
                            }
                        }),
                        members
                    );
                }
            });
        }
    }
}