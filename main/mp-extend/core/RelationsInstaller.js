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
        console.log(this.is)
        if (this !== this.$root) {
            injectParentInstance(this, this.$root);
            console.log(this.$parent)
        }
    }
});
const ChildBehavior = Behavior({
    detached() {
        if (this.$parent) {
            removeChildInstance(this.$parent, this);
        }
        deleteParentProperty(this);
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
                appendChildInstance(this, target);
            },
            unlinked(target) {
                removeChildInstance(this, target);
            }
        }
    }
});

export default class RelationsInstaller extends OptionInstaller {
    behaviors() {
        return [ParentBehavior, ChildBehavior, LinkBehavior];
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