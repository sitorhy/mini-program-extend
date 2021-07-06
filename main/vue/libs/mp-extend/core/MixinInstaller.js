import OptionInstaller from "./OptionInstaller";
import {Blend} from "../libs/Blend";
import {Collectors, Stream} from "../libs/Stream";
import {Invocation} from "../libs/Invocation";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";
import RESERVED_OPTIONS_WORDS from "../utils/options";
import {isFunction, removeEmpty} from "../utils/common";

/**
 * 混合策略
 * 默认行为：
 * methods : 覆盖
 * data: 覆盖
 * props: 覆盖
 * computed: 覆盖
 * watch: 复合
 * 生命周期: 复合
 */
export default class MixinInstaller extends OptionInstaller {
    optionMergeMethods(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return Object.assign(toValue, fromValue);
    }

    optionMergeData(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return Blend(toValue, fromValue);
    }

    optionMergeProps(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return Object.assign(toValue, fromValue);
    }

    optionMergeComputed(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return Object.assign(toValue, fromValue);
    }

    optionMergeWatch(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return Object.assign(toValue, fromValue);
    }

    optionMergeOptions(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return Object.assign(toValue, fromValue);
    }

    optionMergeExternalClasses(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return [...new Set([
            ...(Array.isArray(toValue) ? toValue : []),
            ...(Array.isArray(fromValue) ? fromValue : [])
        ])];
    }

    optionMergeRelations(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        return [...new Set([
            ...(Array.isArray(toValue) ? toValue : []),
            ...(Array.isArray(fromValue) ? fromValue : [])
        ])];
    }

    optionMergeLifeCycle(toValue, fromValue) {
        if (!toValue || !fromValue) {
            return toValue || fromValue;
        }
        const merge = {};
        for (const l in toValue) {
            merge[l] = Invocation(toValue[l], fromValue[l]);
        }
        return merge;
    }

    optionMergePageCustomMethods(options) {
        const methods = Stream.of(Object.entries(options)).filter(([name, func]) => {
            return isFunction(func) && !RESERVED_LIFECYCLES_WORDS.has(name) && !RESERVED_OPTIONS_WORDS.has(name);
        }).collect(Collectors.toMap());

        const methodKeys = Object.keys(methods);

        if (methodKeys.length > 0) {
            methodKeys.forEach(k => {
                delete options[k];
            });

            options.methods = this.optionMergeMethods(options.methods, methods);
        }
    }

    optionMergePageCustomData(options) {
        return Stream.of(Object.entries(options)).filter(([name, data]) => {
            return !isFunction(data) && !RESERVED_OPTIONS_WORDS.has(name) && !RESERVED_LIFECYCLES_WORDS.has(name);
        }).collect(Collectors.toMap());
    }

    install(extender, context, options) {
        const {mixins} = options;

        delete options['mixins'];

        if (Array.isArray(mixins)) {
            mixins.forEach(mixin => {
                Object.assign(
                    options,
                    {
                        methods: this.optionMergeMethods(mixin.methods, options.methods),
                        data: this.optionMergeData(mixin.data, options.data),
                        props: this.optionMergeProps(mixin.props, options.props),
                        properties: this.optionMergeProps(mixin.properties, options.properties),
                        computed: this.optionMergeComputed(mixin.computed, options.computed),
                        watch: this.optionMergeWatch(mixin.watch, options.watch),
                        relations: this.optionMergeRelations(mixin.relations, options.relations),
                        externalClasses: this.optionMergeExternalClasses(mixin.externalClasses, options.externalClasses),
                        options: this.optionMergeOptions(mixin.options, options.options)
                    },
                    this.optionMergeLifeCycle(
                        Stream.of(
                            [...RESERVED_LIFECYCLES_WORDS].map(i => [i, options[i]])
                        ).collect(Collectors.toMap()),
                        Stream.of(
                            [...RESERVED_LIFECYCLES_WORDS].map(i => [i, mixin[i]])
                        ).collect(Collectors.toMap())
                    )
                );
            });
        }

        this.optionMergePageCustomMethods(options);
    }

    build(extender, context, o) {
        const relations = extender.installers.reduce((s, i) => {
            return Object.assign(s, i.relations());
        }, {});

        const externalClasses = extender.installers.reduce((s, i) => {
            return s.concat(i.externalClasses() || []);
        }, []);

        const options = extender.installers.reduce((s, i) => {
            return Object.assign(s, i.options());
        }, {});

        const pageCustomData = this.optionMergePageCustomData(o);

        return removeEmpty(
            Object.assign(
                {
                    relations: this.optionMergeRelations(relations, o.relations),
                    externalClasses: this.optionMergeExternalClasses(externalClasses, o.externalClasses),
                    options: this.optionMergeOptions(options, o.options),
                },
                pageCustomData
            )
        );
    }
}