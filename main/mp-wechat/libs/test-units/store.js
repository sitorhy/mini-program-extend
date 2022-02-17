export default {
    state: {
        count: 0,
        obj: {
            arr: [114, 514, 1919, 810],
            a: {
                b: {
                    c: 100
                },
                d: 666
            }
        }
    },
    mutations: {
        increment(state) {
            state.count++;
        }
    },
    actions: {},
    modules: {}
}