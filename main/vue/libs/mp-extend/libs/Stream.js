export const Collectors = {
    toList: function () {
        return (arr) => {
            return [...arr];
        };
    },

    toMap: function (...args) {
        let v1 = v => v[0], v2 = v => v[1], useCollection = false;
        if (args.length === 1 && args[0] === true) {
            useCollection = true;
        } else if (args.length >= 3) {
            v1 = args[0];
            v2 = args[1];
            useCollection = Boolean(args[2]);
        }
        return (entries = []) => {
            let o;
            if (!useCollection) {
                o = {};
                entries.forEach(i => o[v1(i)] = v2(i));
            } else {
                o = new Map();
                entries.forEach(i => o.set(v1(i), v2(i)));
            }
            return o;
        };
    },

    toSet: function () {
        return arr => new Set(arr);
    },

    reducing: function (v1, v2) {
        return arr => arr.reduce(v1, v2);
    },

    counting: function () {
        return arr => arr.length;
    },

    maxBy: function (v1 = () => 0) {
        return arr => {
            let m = arr[0];
            arr.forEach((i, j) => {
                if (j > 0) {
                    if (v1(arr[j - 1], arr[j]) > 0) {
                        m = i;
                    }
                }
            });
            return m;
        };
    },

    minBy: function (v1 = () => 0) {
        return arr => {
            let m = arr[0];
            arr.forEach((i, j) => {
                if (j > 0) {
                    if (v1(arr[j - 1], arr[j]) < 0) {
                        m = i;
                    }
                }
            });
            return m;
        };
    },

    joining: function (sp) {
        return arr => arr.join(sp);
    },


    groupingBy: function (v1, useCollection = false) {
        return arr => this.reducing((s, i) => {
            const k = v1(i);
            if (useCollection) {
                if (!s.has(k)) {
                    s.set(k, [i]);
                } else {
                    s.get(k).push(i);
                }
            } else {
                if (!Object.hasOwnProperty.call(s, k)) {
                    s[k] = [i];
                } else {
                    s[k].push(i);
                }
            }
            return s;
        }, useCollection ? new Map() : {})(arr);
    }
};

export class Stream {
    static of(arr = []) {
        return new Stream(arr);
    }

    constructor(arr = []) {
        this.arr = arr;
    }

    flat() {
        return this.arr.reduce((s, i) => {
            if (Array.isArray(i))
                return s.concat(i);
            s.push(i);
            return s;
        }, []);
    }

    flatMap(mapper = (i) => i) {
        return Stream.of(
            this.arr.map(mapper)
        ).flat();
    }

    map(mapper = (i) => i) {
        return Stream.of(this.arr.map(mapper));
    }

    collect(collector) {
        if (typeof collector === "function") {
            return collector(this.arr);
        }
        return null;
    }

    distinct() {
        return Stream.of([...(new Set([...this.arr]))]);
    }

    filter(fn = () => true) {
        return Stream.of(this.arr.filter(fn));
    }
}