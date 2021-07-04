import OptionInstaller from "./OptionInstaller";
import {Deconstruct} from "../libs/Deconstruct";
import {Blend} from "../libs/Blend";
import {Collectors, Stream} from "../libs/Stream";
import {Invocation} from "../libs/Invocation";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";
import {removeEmpty} from "../utils/common";

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

    install(extender, context, options) {
        const {mixins} = options;

        Deconstruct(options, {
            mixins: null
        });

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
                            RESERVED_LIFECYCLES_WORDS.map(i => [i, options[i]])
                        ).collect(Collectors.toMap()),
                        Stream.of(
                            RESERVED_LIFECYCLES_WORDS.map(i => [i, mixin[i]])
                        ).collect(Collectors.toMap())
                    )
                )
            });
        }
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

        return removeEmpty(
            {
                relations: this.optionMergeRelations(relations, o.relations),
                externalClasses: this.optionMergeExternalClasses(externalClasses, o.externalClasses),
                options: this.optionMergeOptions(options, o.options)
            }
        );
    }
}