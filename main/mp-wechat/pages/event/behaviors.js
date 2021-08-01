export function printLevel(thisArg) {
    let p = thisArg;
    while (p) {
        console.log(p.is);
        p = p.$parent;
    }
}

export function printChildren(thisArg) {
    if (thisArg.$children instanceof Set) {
        console.log([...thisArg.$children]);
        return;
    }
    console.log(thisArg.$children ? thisArg.$children.map(i => i.is) : []);
}