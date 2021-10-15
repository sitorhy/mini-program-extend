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
 * data: 合并
 * props: 合并
 * computed: 覆盖
 * watch: 复合
 * 生命周期: 复合
 */
export default class MixinInstaller extends OptionInstaller {
    collectOptions(fields = [], options = {}, collection = new Map()) {
        if (Array.isArray(options.mixins)) {
            options.mixins.forEach(m => this.collectOptions(collection, fields, m));
        } else {
            fields.forEach(field => {
                if (!collection.has(field)) {
                    collection.set(field, []);
                }
                collection.get(field).push(options[field]);
            });
        }
    }

    overrideOptions(fields, collection) {
        Stream.of(fields).map(field=>{
            return [field,Object.assign.apply(undefined,[
                {},

            ])];
        })
    }

    combineOptions(fields, collection) {

    }

    seriesOptions(fields, collection) {

    }

    reduceConfiguration(options) {

    }

    configuration(extender, context, options) {
        return this.reduceConfiguration(options);
    }
}