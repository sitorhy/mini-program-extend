import OptionInstaller from "./OptionInstaller";
import {isFunction, uuid} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

const PARENT_TAG_OBS = `parent-${uuid()}`;
const CHILD_TAG_OBS = `child-${uuid()}`;
const MATCH_PARENTS = new Map();
const RelationSign = Symbol("__wxREL__");

function injectParentInstance(target, parent) {
    Object.defineProperty(target, "$parent", {
        configurable: true,
        enumerable: false,
        get() {
            return parent;
        }
    });
}

function deleteParentProperty(target) {
    Reflect.deleteProperty(target, "$parent");
}

function appendChildInstance(target, child) {
    if (!Reflect.has(target, "$children")) {
        Object.defineProperty(target, "$children", {
            configurable: false,
            enumerable: false,
            value: []
        });
    }
    const id = Reflect.get(child, "__wxExparserNodeId__");
    if (!target.$children.some(i => Reflect.get(i, "__wxExparserNodeId__") === id)) {
        target.$children.push(child);
    }
}

function removeChildInstance(target, child) {
    if (Reflect.has(target, "$children")) {
        const id = Reflect.get(child, "__wxExparserNodeId__");
        const index = target.$children.findIndex(i => Reflect.get(i, "__wxExparserNodeId__") === id);
        if (index >= 0) {
            target.$children.splice(index, 1);
        }
    }
}

/**
 * 资源释放，实现任意一个即可
 * Page必定最后进行释放
 * **/
const ParentBehavior = Behavior({
    attached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        // 默认绑定到Page
        if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
            if (!this.$parent) {
                injectParentInstance(this, root);
            }
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
            deleteParentProperty(root, this);
        }
    }
});
const ChildBehavior = Behavior({
    attached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
            appendChildInstance(root, this);
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
            removeChildInstance(root, this);
        }
    }
});

export default class RelationsInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            ParentBehavior, ChildBehavior
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
    relations() {
        return {
            [PARENT_TAG_OBS]: {
                type: "parent",
                target: ParentBehavior,
                linked(target) {
                    const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
                    if (!this.$parent || Reflect.get(this.$parent, "__wxExparserNodeId__") === Reflect.get(root, "__wxExparserNodeId__")) {
                        injectParentInstance(this, target);
                    }

                    const relations = Reflect.get(this, RelationSign);
                    if (relations && Array.isArray(relations["parent"])) {
                        relations["parent"].forEach(([key, relation]) => {
                            if (isFunction(relation.linked)) {
                                relation.linked.call(this, target, key);
                            }
                        });
                    }
                },
                unlinked() {
                    if (this.$parent) {
                        removeChildInstance(this.$parent, this);
                    }
                    deleteParentProperty(this);

                    const relations = Reflect.get(this, RelationSign);
                    if (relations && Array.isArray(relations["parent"])) {
                        relations["parent"].forEach(([key, relation]) => {
                            if (isFunction(relation.unlinked)) {
                                relation.unlinked.call(this, key);
                            }
                        });
                    }
                }
            },
            [CHILD_TAG_OBS]: {
                type: "child",
                target: ChildBehavior,
                linked(target) {
                    const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
                    if (!target.$parent || Reflect.get(target.$parent, "__wxExparserNodeId__") === Reflect.get(root, "__wxExparserNodeId__")) {
                        appendChildInstance(this, target);
                    }
                    // 从根节点排除掉
                    removeChildInstance(root, target);

                    const relations = Reflect.get(this, RelationSign);
                    if (relations && Array.isArray(relations["child"])) {
                        relations["child"].forEach(([key, relation]) => {
                            if (isFunction(relation.linked)) {
                                relation.linked.call(this, target, key);
                            }
                        });
                    }
                },
                unlinked(target) {
                    if (target.$parent) {
                        removeChildInstance(target.$parent, target);
                    }
                    removeChildInstance(this, target);

                    const relations = Reflect.get(this, RelationSign);
                    if (relations && Array.isArray(relations["child"])) {
                        relations["child"].forEach(([key, relation]) => {
                            if (isFunction(relation.unlinked)) {
                                relation.unlinked.call(this, target, key);
                            }
                        });
                    }
                }
            }
        };
    }

    configuration(extender, context, options) {
        let {parent = null} = options;
        if (parent) {
            if (parent.startsWith("/")) {
                context.set("parent", parent.slice(1));
            } else {
                context.set("parent", parent);
            }
            parent = context.get("parent");
            if (!MATCH_PARENTS.has(parent)) {
                MATCH_PARENTS.set(parent, []);
            }
        }
        return null;
    }

    lifetimes(extender, context, options) {
        const parent = context.get("parent");
        return {
            created() {
                if (options.relations) {
                    const relationsGroup = Stream.of(Object.entries(options.relations)).filter(([, relation]) => relation.type === "parent" || relation.type === "child")
                        .collect(
                            Collectors.groupingBy(([, relation]) => {
                                return relation.type;
                            })
                        );
                    Reflect.set(this, RelationSign, relationsGroup);
                }

                if (MATCH_PARENTS.size > 0) {
                    const components = MATCH_PARENTS.get(this.is);
                    if (Array.isArray(components)) {
                        components.push(this);
                    }
                    if (parent) {
                        if (MATCH_PARENTS.has(parent)) {
                            const parents = MATCH_PARENTS.get(parent);
                            if (Array.isArray(parents) && parents.length > 0) {
                                const near = parents[parents.length - 1];
                                injectParentInstance(this, near);
                                appendChildInstance(near, this);
                            }
                        }
                    }
                }
            },
            attached() {
                if (MATCH_PARENTS.size > 0) {
                    const components = MATCH_PARENTS.get(this.is);
                    if (Array.isArray(components)) {
                        const index = components.indexOf(this);
                        if (index >= 0) {
                            components.splice(index, 1);
                        }
                        if (components.length <= 0) {
                            MATCH_PARENTS.delete(this.is);
                        }
                    }
                }
            }
        };
    }

    install(extender, context, options) {
        if (options.relations) {
            const relationsGroup = Stream.of(Object.entries(options.relations)).filter(([, relation]) => relation.type === "ancestor" || relation.type === "descendant")
                .collect(
                    Collectors.groupingBy(([, relation]) => {
                        return relation.type;
                    })
                );
            // descendant 已被被内置 child 优先级覆盖
            const ancestor = relationsGroup.ancestor;
            const descendant = relationsGroup.descendant;
            // ancestor descendant 暂不作干预
            context.set("relations", Object.assign(
                this.relations(),
                ancestor ? Stream.of(ancestor).collect(Collectors.toMap()) : null,
                descendant ? Stream.of(descendant).collect(Collectors.toMap()) : null,
            ));
        } else {
            context.set("relations", this.relations());
        }
    }

    build(extender, context, options) {
        return {relations: context.get("relations")};
    }
}