import OptionInstaller from "./OptionInstaller";
import {Blend} from "../libs/Blend";
import {Collectors, Stream} from "../libs/Stream";
import {Invocation} from "../libs/Invocation";
import {Optional} from "../libs/Optional";
import {isFunction} from "../utils/common";
import RESERVED_LIFECYCLES_WORDS from "../utils/lifecycle";
import RESERVED_OPTIONS_WORDS from "../utils/options";

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

    concatOptions(fields, collection) {
        return Stream.of((Array.isArray(fields) ? fields : [...fields]).filter(f => collection.has(f) && collection.get(f).length > 0)).map(field => {
            return [field, [...new Set(Stream.of(collection.get(field)).flat())]];
        }).collect(Collectors.toMap());
    }

    reduceConfiguration(options) {
        const config = {};
        if (options.extends) {
            const {extends: v, mixins, ...o} = options;
            return this.reduceConfiguration(Object.assign({
                mixins: [v].concat(mixins || [])
            }, o));
        }
        Object.assign(config, this.concatOptions(['behaviors', 'externalClasses'], this.collectOptions(['behaviors', 'externalClasses'], options)));
        Object.assign(config, this.overrideOptions(['methods', 'properties', 'props', 'relations', 'options', 'inject'], this.collectOptions(['methods', 'properties', 'props', 'relations', 'options', 'inject'], options)));
        Object.assign(config, this.overrideMembers(['computed', 'observers'], this.collectOptions(['computed', 'observers'], options)));
        Object.assign(config, this.combineOptions(['data', 'provide'], this.collectOptions(['data', 'provide'], options)));
        Object.assign(config, this.seriesMembers(['lifetimes', 'pageLifetimes'], this.collectOptions(['lifetimes', 'pageLifetimes'], options)));
        Object.assign(config, this.seriesOptions(['definitionFilter'], this.collectOptions(['definitionFilter'], options)));
        Object.assign(config, this.seriesOptions(RESERVED_LIFECYCLES_WORDS, this.collectOptions(RESERVED_LIFECYCLES_WORDS, options)));
        Optional.of(this.collectOptions(['watch'], options).get('watch')).ifPresent((watchers) => {
            const keys = Stream.of(Stream.of(watchers).map(i => Object.keys(i)).flat()).distinct().collect(Collectors.toList());
            Object.assign(config, {
                watch: Stream.of(keys).map(k => {
                    const handlers = watchers.map(i => i[k]);
                    return [k, handlers.length > 1 ? Invocation(Stream.of(handlers).flat()) : handlers[0]];
                }).collect(Collectors.toMap())
            })
        });
        const {methods, staticData} = Stream.of(
            Object.entries(options)
        ).filter(i => !RESERVED_LIFECYCLES_WORDS.has(i[0]) && !RESERVED_OPTIONS_WORDS.has(i[0])).collect(Collectors.groupingBy(i => isFunction(i[1]) ? 'methods' : 'staticData'));
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