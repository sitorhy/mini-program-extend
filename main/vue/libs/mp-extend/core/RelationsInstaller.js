import OptionInstaller from "./OptionInstaller";
import {isFunction, uuid} from "../utils/common";
import {Collectors, Stream} from "../libs/Stream";

const PARENT_TAG_OBS = `parent-${uuid()}`;
const CHILD_TAG_OBS = `child-${uuid()}`;
const RelationSign = Symbol("__wxREL__");
const RTCSign = Symbol("__wxRTC__");
const RTCGetterSign = Symbol("__wxRTC_Getter__");
const ExecutedDescendantSign = Symbol("__wxEXE_Descendant");

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
        if (Reflect.has(root, RTCGetterSign)) {
            if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
                injectParentInstance(this, Reflect.get(root, RTCGetterSign)());
            }
        } else {
            // 没有使用PageEx构建
            if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
                injectParentInstance(this, root);
            }
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        deleteParentProperty(root, this);
    }
});
const ChildBehavior = Behavior({
    attached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        if (Reflect.get(this, "__wxExparserNodeId__") !== Reflect.get(root, "__wxExparserNodeId__")) {
            appendChildInstance(root, Reflect.get(this, RTCGetterSign)());
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
        removeChildInstance(root, this);
    }
});

export default class RelationsInstaller extends OptionInstaller {
    getRuntimeContext(thisArg, context, fnSetData) {
        if (Reflect.has(thisArg, RTCSign)) {
            return Reflect.get(thisArg, RTCSign).get(thisArg, context.get("properties"), context.get("computed"), fnSetData);
        }
        return thisArg;
    }

    releaseRuntimeContext(thisArg) {
        if (Reflect.has(thisArg, RTCSign)) {
            Reflect.get(thisArg, RTCSign).release();
            Reflect.deleteProperty(this, RTCSign);
        }
    }

    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        const createContext = () => {
            return extender.createRuntimeContextSingleton();
        };

        const releaseContext = (thisArg) => {
            this.releaseRuntimeContext(thisArg);
        };

        const getContext = (thisArg, fnSetData) => {
            return this.getRuntimeContext(thisArg, context, fnSetData);
        };

        defFields.behaviors = [
            Behavior({
                created() {
                    Object.defineProperty(this, RTCSign, {
                        configurable: false,
                        enumerable: false,
                        value: createContext(),
                        writable: false
                    });

                    Object.defineProperty(this, RTCGetterSign, {
                        configurable: false,
                        enumerable: false,
                        value: () => {
                            return getContext(this, this.setData.bind(this));
                        },
                        writable: false
                    });

                    Object.defineProperty(this, ExecutedDescendantSign, {
                        configurable: false,
                        enumerable: false,
                        value: [],
                        writable: false
                    });
                },
                detached() {
                    releaseContext(this);
                }
            }),
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
        const getContextInstance = (thisArg) => {
            return Reflect.get(thisArg, RTCGetterSign)();
        };

        const callRelations = (thisArg, target, type, reverseType, callback) => {
            const targetRelations = Reflect.get(target, RelationSign);
            if (targetRelations && targetRelations[type]) {
                if (
                    targetRelations[type].some(([, relation]) => {
                        return !!(relation.target && thisArg.hasBehavior(relation.target)) && relation.target !== ParentBehavior && relation.target !== ChildBehavior;
                    })
                ) {
                    const selfRelations = Reflect.get(thisArg, RelationSign);
                    if (selfRelations[reverseType]) {
                        selfRelations[reverseType].forEach(([key, relation]) => {
                            if (relation.target !== ParentBehavior && relation.target !== ChildBehavior && target.hasBehavior(relation.target)) {
                                if (isFunction(relation[callback])) {
                                    relation[callback].call(getContextInstance(thisArg), getContextInstance(target), key);
                                }
                            }
                        });
                    }
                }
            }
        };

        return {
            [PARENT_TAG_OBS]: {
                type: "parent",
                target: ParentBehavior,
                linked(target) {
                    const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
                    removeChildInstance(root, this);
                    // 父节点从 Page 变更为 Component 实例
                    injectParentInstance(this, getContextInstance(target));
                    // target.relations 包含 type = child 且 relation.target 在本组件包含
                    // 本组件 relations 包含 type = parent 且 relation.target 在 target包含
                    callRelations(this, target, "child", "parent", "linked");
                },
                linkChanged(target) {
                    callRelations(this, target, "child", "parent", "linkChanged");
                },
                unlinked(target) {
                    callRelations(this, target, "child", "parent", "unlinked");
                    deleteParentProperty(this);
                }
            },
            [CHILD_TAG_OBS]: {
                type: "child",
                target: ChildBehavior,
                linked(target) {
                    const root = getCurrentPages().find(p => Reflect.get(p, "__wxWebviewId__") === Reflect.get(this, "__wxWebviewId__"));
                    appendChildInstance(this, getContextInstance(target));
                    // 从根节点排除掉
                    removeChildInstance(root, target);
                    callRelations(this, target, "parent", "child", "linked");
                },
                linkChanged(target) {
                    callRelations(this, target, "parent", "child", "linkChanged");
                },
                unlinked(target) {
                    callRelations(this, target, "parent", "child", "unlinked");
                    removeChildInstance(this, target);
                }
            }
        };
    }

    lifetimes(extender, context, options) {
        return {
            created() {
                if (options.relations) {
                    const relationsGroup = Stream.of(Object.entries(options.relations)).collect(
                        Collectors.groupingBy(([, relation]) => {
                            return relation.type;
                        })
                    );
                    Reflect.set(this, RelationSign, relationsGroup);
                }
            },
            attached() {
                const executedDescendantSign = Reflect.get(this, ExecutedDescendantSign);
                if (Array.isArray(executedDescendantSign)) {
                    executedDescendantSign.splice(0);
                }
            },
            detached() {
                Reflect.deleteProperty(this, RTCGetterSign);
                const executedDescendantSign = Reflect.get(this, ExecutedDescendantSign);
                if (Array.isArray(executedDescendantSign)) {
                    executedDescendantSign.splice(0);
                }
                Reflect.deleteProperty(this, ExecutedDescendantSign);
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
            const ancestor = relationsGroup.ancestor;
            const descendant = relationsGroup.descendant;

            const getContextInstance = (thisArg) => {
                return Reflect.get(thisArg, RTCGetterSign)();
            };

            const callTargetRelations = (excludeKeys, thisArg, target, type, reverseType, callback) => {
                const executedRelationKeys = [];
                const selfRelations = Reflect.get(thisArg, RelationSign);
                if (selfRelations && selfRelations[reverseType]) {
                    if (
                        selfRelations[reverseType].some(([, relation]) => {
                            return !!(relation.target && target.hasBehavior(relation.target)) && relation.target !== ParentBehavior && relation.target !== ChildBehavior;
                        })
                    ) {
                        const targetRelations = Reflect.get(target, RelationSign);
                        if (targetRelations[type]) {
                            targetRelations[type].forEach(([key, relation]) => {
                                if (!excludeKeys.includes(key)) {
                                    if (relation.target !== ParentBehavior && relation.target !== ChildBehavior && thisArg.hasBehavior(relation.target)) {
                                        if (isFunction(relation[callback])) {
                                            executedRelationKeys.push(key);
                                            relation[callback].call(getContextInstance(target), getContextInstance(thisArg), key);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
                return executedRelationKeys;
            };

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
                            const executedRelationKeys = Reflect.get(this, ExecutedDescendantSign);
                            const keys = callTargetRelations(executedRelationKeys, this, target, "descendant", "ancestor", "linked");
                            if (keys.length) {
                                Array.prototype.push.apply(executedRelationKeys, keys);
                            }
                            linked.call(getContextInstance(this), getContextInstance(target), key);
                        };
                    }
                    if (isFunction(linkChanged)) {
                        relation.linkChanged = function (target) {
                            linkChanged.call(getContextInstance(this), getContextInstance(target), key);
                            const executedRelationKeys = Reflect.get(this, ExecutedDescendantSign);
                            const keys = callTargetRelations(executedRelationKeys, this, target, "descendant", "ancestor", "linkChanged");
                            if (keys.length) {
                                Array.prototype.push.apply(executedRelationKeys, keys);
                            }
                        };
                    }
                    if (isFunction(unlinked)) {
                        relation.unlinked = function (target) {
                            unlinked.call(getContextInstance(this), getContextInstance(target), key);
                            const executedRelationKeys = Reflect.get(this, ExecutedDescendantSign);
                            const keys = callTargetRelations(executedRelationKeys, this, target, "descendant", "ancestor", "linkChanged");
                            if (keys.length) {
                                Array.prototype.push.apply(executedRelationKeys, keys);
                            }
                        };
                    }
                });
            }

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