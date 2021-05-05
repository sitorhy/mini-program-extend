import {isFunction} from '../utils/common';

export function Blend(target, blender) {
    return function (...args) {
        if (isFunction(blender)) {
            return Object.assign({}, target, blender.apply(this, args));
        } else if (Array.isArray(blender)) {
            return Object.assign.apply(
                undefined, [{}, target].concat(
                    blender.map(i => {
                        if (isFunction(i)) {
                            return i.apply(this, args);
                        } else {
                            return i;
                        }
                    })
                )
            )
        } else {
            return Object.assign({}, target, blender);
        }
    }
}