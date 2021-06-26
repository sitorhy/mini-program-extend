import OptionInstaller from "./OptionInstaller";
import {Deconstruct} from "../libs/Deconstruct";
import {Blend} from "../libs/Blend";

export default class MixinInstaller extends OptionInstaller {
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