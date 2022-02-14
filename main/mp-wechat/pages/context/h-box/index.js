import {ComponentEx} from "../../../libs/mp-extend/index";
import {Stream, Collectors} from "../../../libs/mp-extend/libs/Stream";

export function convertObjectToCSSString(obj) {
    return (Object.keys(
        Stream.of(Object.entries(obj).filter(([, v2]) => v2 !== 'null' && v2 !== 'undefined' && v2 !== "" && v2 !== null && v2 !== undefined)).collect(Collectors.toMap())
    ).map(i => {
        const marks = [];
        [...i].forEach((a, index) => {
            const k = a.charCodeAt(0);
            if (k <= 90 && k >= 65) {
                marks.push(index);
            }
        });
        return marks.concat([i.length]).map((ia, iai) => {
            return i.substring(iai > 0 ? marks[iai - 1] : 0, ia).toLowerCase();
        }).join("-") + ":" + obj[i];
    })).join(";");
}


ComponentEx({
    props: {
        justifyContent: {
            type: String,
            default: null
        }
    },
    computed: {
        baseStyle() {
            const style = {
                display: 'flex'
            };
            if (this.justifyContent) {
                style.justifyContent = this.justifyContent;
            }
            return convertObjectToCSSString(style);
        }
    }
})