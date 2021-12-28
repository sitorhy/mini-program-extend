import OptionInstaller from "./OptionInstaller";
import {uuid} from "../utils/common";

const PARENT_TAG_OBS = `parent-${uuid()}`;
const CHILD_TAG_OBS = `child-${uuid()}`;
const MATCH_PARENTS = new Map();

function injectParentInstance(target, parent) {
    Object.defineProperty(target, '$parent', {
        configurable: true,
        enumerable: false,
        get() {
            return parent;
        }
    });
}

function deleteParentProperty(target) {
    Reflect.deleteProperty(target, '$parent');
}

function appendChildInstance(target, child) {
    if (!Reflect.has(target, '$children')) {
        Object.defineProperty(target, '$children', {
            configurable: false,
            enumerable: false,
            value: []
        });
    }
    const id = Reflect.get(child, '__wxExparserNodeId__');
    if (!target.$children.some(i => Reflect.get(i, '__wxExparserNodeId__') === id)) {
        target.$children.push(child);
    }
}

function removeChildInstance(target, child) {
    if (Reflect.has(target, '$children')) {
        const id = Reflect.get(child, '__wxExparserNodeId__');
        const index = target.$children.findIndex(i => Reflect.get(i, '__wxExparserNodeId__') === id);
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
        const root = getCurrentPages().find(p => Reflect.get(p, '__wxWebviewId__') === Reflect.get(this, '__wxWebviewId__'));
        // 默认绑定到Page
        if (Reflect.get(this, '__wxExparserNodeId__') !== Reflect.get(root, '__wxExparserNodeId__')) {
            if (!this.$parent) {
                injectParentInstance(this, root);
            }
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, '__wxWebviewId__') === Reflect.get(this, '__wxWebviewId__'));
        if (Reflect.get(this, '__wxExparserNodeId__') !== Reflect.get(root, '__wxExparserNodeId__')) {
            deleteParentProperty(root, this);
        }
    }
});
const ChildBehavior = Behavior({
    attached() {
        const root = getCurrentPages().find(p => Reflect.get(p, '__wxWebviewId__') === Reflect.get(this, '__wxWebviewId__'));
        if (Reflect.get(this, '__wxExparserNodeId__') !== Reflect.get(root, '__wxExparserNodeId__')) {
            appendChildInstance(root, this);
        }
    },
    detached() {
        const root = getCurrentPages().find(p => Reflect.get(p, '__wxWebviewId__') === Reflect.get(this, '__wxWebviewId__'));
        if (Reflect.get(this, '__wxExparserNodeId__') !== Reflect.get(root, '__wxExparserNodeId__')) {
            removeChildInstance(root, this);
        }
    }
});

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
const LinkBehavior = Behavior({
    relations: {
        [PARENT_TAG_OBS]: {
            type: 'parent',
            target: ParentBehavior,
            linked(target) {
                console.log('P ' + this.is);
                const root = getCurrentPages().find(p => Reflect.get(p, '__wxWebviewId__') === Reflect.get(this, '__wxWebviewId__'));
                if (!this.$parent || Reflect.get(this.$parent, '__wxExparserNodeId__') === Reflect.get(root, '__wxExparserNodeId__')) {
                    injectParentInstance(this, target);
                }
            },
            unlinked() {
                if (this.$parent) {
                    removeChildInstance(this.$parent, this);
                }
                deleteParentProperty(this);
            }
        },
        [CHILD_TAG_OBS]: {
            type: 'child',
            target: ChildBehavior,
            linked(target) {
                console.log('C ' + this.is);
                const root = getCurrentPages().find(p => Reflect.get(p, '__wxWebviewId__') === Reflect.get(this, '__wxWebviewId__'));
                if (!target.$parent || Reflect.get(target.$parent, '__wxExparserNodeId__') === Reflect.get(root, '__wxExparserNodeId__')) {
                    appendChildInstance(this, target);
                }
                // 从根节点排除掉
                removeChildInstance(root, target);
            },
            unlinked(target) {
                if (target.$parent) {
                    removeChildInstance(target.$parent, target);
                }
                removeChildInstance(this, target);
            }
        }
    }
});

export default class RelationsInstaller extends OptionInstaller {
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {
        defFields.behaviors = [
            ParentBehavior, ChildBehavior, LinkBehavior
        ].concat(defFields.behaviors || []);
    }

    configuration(extender, context, options) {
        const {parent = null} = options;
        if (parent) {
            if (!MATCH_PARENTS.has(parent)) {
                MATCH_PARENTS.set(parent, []);
            }
            if (parent.startsWith("/")) {
                context.set('parent', parent.slice(1));
            } else {
                context.set('parent', parent);
            }
        }
        return null;
    }

    lifetimes(extender, context, options) {
        const parent = context.get('parent');
        return {
            created() {
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
        const {relations = null} = options;
        context.set("relations", Object.assign.apply(
            undefined,
            [
                {},
                ...extender.installers.map(i => i.relations()),
                relations
            ]
        ));
    }

    build(extender, context, options) {
        return {relations: context.get('relations')};
    }
}