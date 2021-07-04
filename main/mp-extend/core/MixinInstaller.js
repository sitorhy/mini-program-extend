import OptionInstaller from "./OptionInstaller";
import {Deconstruct} from "../libs/Deconstruct";
import {Blend} from "../libs/Blend";
import {Collectors, Stream} from "../libs/Stream";
import {Invocation} from "../libs/Invocation";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";

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
                        methods: this.optionMergeMethods(options.methods, mixin.methods),
                        data: this.optionMergeData(options.data, mixin.data),
                        props: this.optionMergeProps(options.props, mixin.props),
                        properties: this.optionMergeProps(options.properties, mixin.properties),
                        computed: this.optionMergeComputed(options.computed, mixin.computed),
                        watch: this.optionMergeWatch(options.watch, mixin.watch)
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
}