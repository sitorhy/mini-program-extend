import OptionInstaller from "./OptionInstaller";
import {uuid} from "../utils/common";

const PARENT_TAG_OBFS = `parent-${uuid()}`;
const CHILD_TAG_OBFS = `child-${uuid()}`;

const ParentBehavior = Behavior({});
const ChildBehavior = Behavior({});
const LinkBehavior = Behavior({
    relations: {
        [PARENT_TAG_OBFS]: {
            type: 'parent',
            target: ParentBehavior,
            linked(target) {
                Object.defineProperty(this, '$parent', {
                    configurable: false,
                    enumerable: false,
                    value: target
                });
                if(!target.$parent){
                    console.log(target.is)
                }
            },
            unlinked() {
                Reflect.deleteProperty(this, '$parent');
            }
        },
        [CHILD_TAG_OBFS]: {
            type: 'child',
            target: ChildBehavior,
            linked(target) {
                if (!Reflect.has(this, '$children')) {
                    Object.defineProperty(this, '$children', {
                        configurable: false,
                        enumerable: false,
                        value: []
                    });
                }
                if (!this.$children.some(i => i === target)) {
                    this.$children.push(target);
                }
            },
            unlinked(target) {
                if (Reflect.has(this, '$children')) {
                    const index = this.$children.findIndex(i => i === target);
                    if (index >= 0) {
                        this.$children.splice(index, 1);
                    }
                }
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