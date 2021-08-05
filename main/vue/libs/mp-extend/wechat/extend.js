import MPExtender from "./core/MPExtender";

export function PageEx(options) {
    Page(new MPExtender().extends(options));
}

export function ComponentEx(options) {
    Component(new MPExtender().extends(options));
}