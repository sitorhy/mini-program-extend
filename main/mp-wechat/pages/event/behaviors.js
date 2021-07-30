export function printLevel(thisArg) {
    let p = thisArg;
    while (p) {
        console.log(p.is);
        p = p.$parent;
    }
}

export function printChildren(thisArg) {
    console.log(thisArg.$children);
}