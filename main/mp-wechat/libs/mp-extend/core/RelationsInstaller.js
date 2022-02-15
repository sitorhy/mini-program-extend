import OptionInstaller from "./OptionInstaller";
import {isFunction, uuid} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";
import MPExtender from "./MPExtender";

const PARENT_TAG_OBS = `parent-${uuid()}`;
const CHILD_TAG_OBS = `child-${uuid()}`;
const RelationSign = Symbol("__wxREL__");
const ExecutedDescendantSign = Symbol("__wxEXE_DESC__");

const RelationInjection = {
    injectParent: function (target, parent) {
        Object.defineProperty(target, "$parent", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: parent
        });
    },

    deleteParent: function (target) {
        Reflect.deleteProperty(target, "$parent");
    },

    appendChild: function (target, child) {
        if (!Reflect.has(target, "$children")) {
            Object.defineProperty(target, "$children", {
                configurable: true,
                enumerable: false,
                writable: false,
                value: []
            });
        }
        const id = Reflect.get(child, "__wxExparserNodeId__");
        if (!target.$children.some(i => Reflect.get(i, "__wxExparserNodeId__") === id)) {
            target.$children.push(child);
        }
    },

    removeChild: function (target, child) {
        if (Reflect.has(target, "$children")) {
            const id = Reflect.get(child, "__wxExparserNodeId__");
            const index = target.$children.findIndex(i => Reflect.get(i, "__wxExparserNodeId__") === id);
            if (index >= 0) {
                target.$children.splice(index, 1);
            }
            if (!target.$children.length) {
                Reflect.deleteProperty(target, "$children");
            }
        }
    }
};

const RelationshipManager = {
    get(thisArg) {
        return Reflect.get(thisArg, RelationSign);
    },

    set(thisArg, relations) {
        Object.defineProperty(thisArg, RelationSign, {
            value: relations,
            configurable: true,
            enumerable: false,
            writable: false
        });
    },

    delete(thisArg) {
        Reflect.deleteProperty(thisArg, RelationSign);
    },

    exists(thisArg) {
        return Reflect.has(thisArg, RelationSign);
    },

    call: function (thisArg, target, type, reverseType, callback) {
        const targetRelations = RelationshipManager.get(target);
        if (targetRelations && targetRelations[type]) {
            if (
                targetRelations[type].some(([, relation]) => {
                    return !!(relation.target && thisArg.hasBehavior(relation.target)) && relation.target !== ParentBehavior && relation.target !== ChildBehavior;
                })
            ) {
                const selfRelations = RelationshipManager.get(thisArg);
                if (selfRelations[reverseType]) {
                    selfRelations[reverseType].forEach(([key, relation]) => {
                        if (relation.target !== ParentBehavior && relation.target !== ChildBehavior && target.hasBehavior(relation.target)) {
                            if (isFunction(relation[callback])) {
                                relation[callback].call(MPExtender.getRuntimeContext(thisArg), MPExtender.getRuntimeContext(target), key);
                            }
                        }
                    });
                }
            }
        }
    },

    callOnce: function (excludeKeys, thisArg, target, type, reverseType, callback) {
        const executedRelationKeys = [];
        const selfRelations = RelationshipManager.get(thisArg);
        if (selfRelations && selfRelations[reverseType]) {
            if (
                selfRelations[reverseType].some(([, relation]) => {
                    return !!(relation.target && target.hasBehavior(relation.target)) && relation.target !== ParentBehavior && relation.target !== ChildBehavior;
                })
            ) {
                const targetRelations = RelationshipManager.get(target);
                if (targetRelations[type]) {
                    targetRelations[type].forEach(([key, relation]) => {
                        if (!excludeKeys.includes(key)) {
                            if (relation.target !== ParentBehavior && relation.target !== ChildBehavior && thisArg.hasBehavior(relation.target)) {
                                if (isFunction(relation[callback])) {
                                    executedRelationKeys.push(key);
                                    relation[callback].call(MPExtender.getRuntimeContext(target), MPExtender.getRuntimeContext(thisArg), key);
                                }
                            }
                        }
                    });
                }
            }
        }
        return executedRelationKeys;
    }
};

const ExecutedRelationsInstallBehavior = Behavior({
    created() {
        Object.defineProperty(this, ExecutedDescendantSign, {
            configurable: true,
            enumerable: false,
            value: [],
            writable: false
        });
    },
    detached() {
        const executedDescendantSign = Reflect.get(this, ExecutedDescendantSign);
        if (Array.isArray(executedDescendantSign)) {
            executedDescendantSign.splice(0);
        }
        Reflect.deleteProperty(this, ExecutedDescendantSign);
    }
});

const ExecutedRelationCollection = {
    get(thisArg) {
        return Reflect.get(thisArg, ExecutedDescendantSign)
    },

    push(thisArg, keys) {
        Array.prototype.push.apply(this.get(thisArg), keys);
    }
};

/**
 * 资源释放，实现任意一个即可
 * Page必定最后进行释放
 * **/
const ParentBehavior = Behavior({
    attached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        // 默认绑定到Page
        if (RelationshipManager.exists(this)) {
            if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
                RelationInjection.injectParent(this, MPExtender.getRuntimeContext(this));
            }
        } else {
            // 没有使用PageEx构建
            if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
                RelationInjection.injectParent(this, root);
            }
        }
    },
    detached() {
        RelationInjection.deleteParent(this);
    }
});

const ChildBehavior = Behavior({
    attached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
            RelationInjection.appendChild(root, MPExtender.getRuntimeContext(this));
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        RelationInjection.removeChild(root, this);
    }
});

export default class RelationsInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            ExecutedRelationsInstallBehavior, ParentBehavior, ChildBehavior
        ].concat(defFields.behaviors || []);
    }

    /**
     * 触发顺序
     * ↑ CHILD
     * ↓ PARENT
     *
     * A
     * ① ↑ ↓ ②
     *     B
     *    ③  ↑ ↓ ④
     *         C
     * linkChanged - 列表节点增删时触发
     */
    lifetimes(extender, context, options) {
        return {
            created() {
                if (options.relations) {
                    const relationsGroup = Stream.of(Object.entries(options.relations)).collect(
                        Collectors.groupingBy(([, relation]) => {
                            return relation.type;
                        })
                    );
                    RelationshipManager.set(this, relationsGroup);
                }
            },
            attached() {
                const executedDescendantSign = ExecutedRelationCollection.get(this);
                if (Array.isArray(executedDescendantSign)) {
                    executedDescendantSign.splice(0);
                }
            }
        };
    }

    install(extender, context, options) {
        const relations = {};
        extender.installers.forEach(installer => {
            Object.assign(relations, installer.relations(extender, context, options));
        });

        Object.assign(relations, options.relations);

        const relationsGroup = Stream.of(Object.entries(relations)).filter(([, relation]) => relation.type === "ancestor" || relation.type === "descendant")
            .collect(
                Collectors.groupingBy(([, relation]) => {
                    return relation.type;
                })
            );
        const ancestor = relationsGroup.ancestor;
        const descendant = relationsGroup.descendant;

        // 修正当 parent child ancestor 关系存在，descendant 并不会触发，
        if (Array.isArray(ancestor)) {
            ancestor.forEach(([key, relation]) => {
                const linked = relation.linked;
                const linkChanged = relation.linkChanged;
                const unlinked = relation.unlinked;
                if (isFunction(linked)) {
                    relation.linked = function (target) {
                        // target.relations 存在 type = descendant 且 relation.target 在本组件包含
                        // 本组件 relations 存在 type = ancestor 且 relation.target 在 target 包含
                        const executedRelationKeys = ExecutedRelationCollection.get(this);
                        const keys = RelationshipManager.callOnce(executedRelationKeys, this, target, "descendant", "ancestor", "linked");
                        if (keys.length) {
                            // 存在多个 ancestor 配置时 descendant 会被多次遍历反复执行
                            // 需要在 ancestor 执行期间标记执行过的 descendant 并作为下一个 ancestor 的执行依据
                            // 该过程直至 attached 执行为止 linkChanged 同理
                            ExecutedRelationCollection.push(this, keys);
                        }
                        linked.call(extender.getRuntimeContextSingleton(this).get(), extender.getRuntimeContextSingleton(target).get(), key);
                    };
                }
                if (isFunction(linkChanged)) {
                    relation.linkChanged = function (target) {
                        linkChanged.call(extender.getRuntimeContextSingleton(this).get(), extender.getRuntimeContextSingleton(target).get(), key);
                        const executedRelationKeys = ExecutedRelationCollection.get(this);
                        const keys = RelationshipManager.callOnce(executedRelationKeys, this, target, "descendant", "ancestor", "linkChanged");
                        if (keys.length) {
                            ExecutedRelationCollection.push(this, keys);
                        }
                    };
                }
                if (isFunction(unlinked)) {
                    relation.unlinked = function (target) {
                        unlinked.call(extender.getRuntimeContextSingleton(this).get(), extender.getRuntimeContextSingleton(target).get(), key);
                        const executedRelationKeys = ExecutedRelationCollection.get(this);
                        const keys = RelationshipManager.callOnce(executedRelationKeys, this, target, "descendant", "ancestor", "linkChanged");
                        if (keys.length) {
                            ExecutedRelationCollection.push(this, keys);
                        }
                    };
                }
            });
        }

        context.set("relations", Object.assign(
            relations,
            ancestor ? Stream.of(ancestor).collect(Collectors.toMap()) : null,
            descendant ? Stream.of(descendant).collect(Collectors.toMap()) : null,
            {
                [PARENT_TAG_OBS]: {
                    type: "parent",
                    target: ParentBehavior,
                    linked(target) {
                        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
                        RelationInjection.removeChild(root, this);
                        // 父节点从 Page 变更为 Component 实例
                        RelationInjection.injectParent(this, extender.getRuntimeContextSingleton(target).get());
                        // target.relations 包含 type = child 且 relation.target 在本组件包含
                        // 本组件 relations 包含 type = parent 且 relation.target 在 target包含
                        RelationshipManager.call(this, target, "child", "parent", "linked");
                    },
                    linkChanged(target) {
                        RelationshipManager.call(this, target, "child", "parent", "linkChanged");
                    },
                    unlinked(target) {
                        RelationshipManager.call(this, target, "child", "parent", "unlinked");
                        RelationInjection.deleteParent(this);
                    }
                },
                [CHILD_TAG_OBS]: {
                    type: "child",
                    target: ChildBehavior,
                    linked(target) {
                        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
                        RelationInjection.appendChild(this, extender.getRuntimeContextSingleton(target).get());
                        // 从根节点排除掉
                        RelationInjection.removeChild(root, target);
                        RelationshipManager.call(this, target, "parent", "child", "linked");
                    },
                    linkChanged(target) {
                        RelationshipManager.call(this, target, "parent", "child", "linkChanged");
                    },
                    unlinked(target) {
                        RelationshipManager.call(this, target, "parent", "child", "unlinked");
                        RelationInjection.removeChild(this, target);
                    }
                }
            }
        ));
    }

    build(extender, context, options) {
        // Page 不注入 relations
        if (typeof __wxAppCurrentFile__ === "string" && __wxConfig) {
            const page = __wxAppCurrentFile__.replace(/.js$/, "");
            if (__wxConfig.pages.indexOf(page) >= 0) {
                return null;
            }
        }
        return {relations: context.get("relations")};
    }
}