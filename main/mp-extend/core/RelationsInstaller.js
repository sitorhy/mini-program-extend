import OptionInstaller from "./OptionInstaller";
import {uuid} from "../utils/common";

const PARENT_TAG_OBFS = `parent-${uuid()}`;
const CHILD_TAG_OBFS = `child-${uuid()}`;

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
    if (!target.$children.some(i => i === child)) {
        target.$children.push(child);
    }
}

function removeChildInstance(target, child) {
    if (Reflect.has(target, '$children')) {
        const index = target.$children.findIndex(i => i === child);
        if (index >= 0) {
            target.$children.splice(index, 1);
        }
    }
}

/**
 * 资源释放，实现任意一个即可
 * 页面必定最后进行释放
 * **/
const ParentBehavior = Behavior({
    created() {
        console.log(`${this.is} created.`);
    },
    attached() {
        const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
        if (this !== root) {
            injectParentInstance(this, root);
        }
    },
    detached() {
        const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
        if (this !== root) {
            deleteParentProperty(root, this);
        }
    }
});
const ChildBehavior = Behavior({
    attached() {
        console.log(`${this.is} attached.`);
        const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
        if (this !== root) {
            appendChildInstance(root, this);
        }
    },
    detached() {
        const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
        if (this !== root) {
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
 */
const LinkBehavior = Behavior({
    relations: {
        [PARENT_TAG_OBFS]: {
            type: 'parent',
            target: ParentBehavior,
            linked(target) {
                injectParentInstance(this, target);
            },
            unlinked() {
                deleteParentProperty(this);
            }
        },
        [CHILD_TAG_OBFS]: {
            type: 'child',
            target: ChildBehavior,
            linked(target) {
                console.log(`${this.is} child linked.`);
                appendChildInstance(this, target);
                const root = getCurrentPages().find(p => p["__wxWebviewId__"] === this["__wxWebviewId__"]);
                removeChildInstance(root, target);
            },
            unlinked(target) {
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