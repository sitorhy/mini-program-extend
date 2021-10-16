import OptionInstaller from "./OptionInstaller";
import {Blend} from "../libs/Blend";
import {Collectors, Stream} from "../libs/Stream";
import {Invocation} from "../libs/Invocation";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";
import {isFunction} from "../utils/common";
import RESERVED_OPTIONS_WORDS from "../utils/options";
import {Optional} from "../libs/Optional";

/**
 * 混合策略
 * 默认行为：
 * methods : 合并
 * data: 合并
 * props: 合并
 * computed: 覆盖
 * watch: 复合
 * 生命周期: 复合
 */
export default class MixinInstaller extends OptionInstaller {
    collectOptions(fields = [], options = {}, collection = new Map()) {
        if (Array.isArray(options.mixins)) {
            options.mixins.forEach(m => this.collectOptions(fields, m, collection));
        }
        for (const field of fields) {
            if (Reflect.has(options, field)) {
                if (!collection.has(field)) {
                    collection.set(field, []);
                }
                collection.get(field).push(options[field]);
            }
        }
        return collection;
    }

    overrideOptions(fields, collection) {
        return Stream.of((Array.isArray(fields) ? fields : [...fields]).filter(f => collection.has(f) && collection.get(f).length > 0)).map(field => {
            return [field, Object.assign.apply(undefined, [{}].concat(collection.get(field)))];
        }).collect(Collectors.toMap());
    }

    overrideMembers(fields, collection) {
        return Stream.of((Array.isArray(fields) ? fields : [...fields]).filter(f => collection.has(f) && collection.get(f).length > 0)).map(field => {
            return [
                field,
                Object.assign.apply(undefined, [{}].concat(collection.get(field)))
            ];
        }).collect(Collectors.toMap());
    }

    combineOptions(fields, collection) {
        return Stream.of((Array.isArray(fields) ? fields : [...fields]).filter(f => collection.has(f) && collection.get(f).length > 0)).map(field => {
            return [field, Blend({}, collection.get(field))];
        }).collect(Collectors.toMap());
    }

    seriesOptions(fields, collection) {
        return Stream.of((Array.isArray(fields) ? fields : [...fields]).filter(f => collection.has(f) && collection.get(f).length > 0)).map(field => {
            return [field, Invocation(collection.get(field))];
        }).collect(Collectors.toMap());
    }

    seriesMembers(fields, collection) {
        return Stream.of((Array.isArray(fields) ? fields : [...fields]).filter(f => collection.has(f) && collection.get(f).length > 0)).map(field => {
            const keys = Stream.of(Stream.of(collection.get(field)).map(i => Object.keys(i)).flat()).distinct().collect(Collectors.toList());
            const props = collection.get(field);
            return [
                field,
                this.seriesOptions(
                    keys,
                    Stream.of(keys).map(i => [i, props.map(j => j[i])]).collect(Collectors.toMap(true))
                )
            ];
        }).collect(Collectors.toMap());
    }

    reduceConfiguration(options) {
        const config = {};
        Object.assign(config, this.overrideOptions(['methods', 'properties', 'props', 'relations', 'options'], this.collectOptions(['methods', 'properties', 'props', 'relations', 'options'], options)));
        Object.assign(config, this.overrideMembers(['computed', 'observers'], this.collectOptions(['computed', 'observers'], options)));
        Object.assign(config, this.combineOptions(['data'], this.collectOptions(['data'], options)));
        Object.assign(config, this.seriesMembers(['watch', 'lifetimes', 'pageLifetimes'], this.collectOptions(['watch', 'lifetimes', 'pageLifetimes'], options)));
        Object.assign(config, this.seriesOptions(RESERVED_LIFECYCLES_WORDS, this.collectOptions(RESERVED_LIFECYCLES_WORDS, options)));
        const {methods, staticData} = Stream.of(
            Object.entries(options)
        ).filter(i => !RESERVED_OPTIONS_WORDS.has(i[0])).collect(Collectors.groupingBy(i => isFunction(i[1]) ? 'methods' : 'staticData'));
        if (Array.isArray(methods)) {
            const pageMethods = Stream.of(methods).collect(Collectors.toMap());
            Optional.of(config.methods).ifPresentOrElse((methods) => {
                Object.assign(methods, pageMethods);
            }, () => {
                Object.assign(config, {
                    methods: pageMethods
                });
            })
        }
        if (Array.isArray(staticData)) {
            Object.assign(config, Stream.of(staticData).collect(Collectors.toMap()));
        }
        return config;
    }

    configuration(extender, context, options) {
        return this.reduceConfiguration(options);
    }

    build(extender, context, options) {
        const pageStaticData = Stream.of(Object.entries(options)).filter(([name, data]) => {
            return !isFunction(data) && !RESERVED_OPTIONS_WORDS.has(name) && !RESERVED_LIFECYCLES_WORDS.has(name);
        }).collect(Collectors.toMap());
        return Object.assign({}, pageStaticData);
    }
}