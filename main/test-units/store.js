const auth = {
    state: {
        token: "",
        username: ""
    },
    getters: {
        isLogin(state) {
            return !!state.token;
        }
    },
    mutations: {
        login(state, token) {
            state.token = token;
        }
    }
};

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
        },
        todos: [
            {id: 1, text: 'Eat', done: true},
            {id: 2, text: 'Sleep', done: false},
            {id: 3, text: 'Game', done: false}
        ]
    },
    mutations: {
        increment(state) {
            state.count++;
        }
    },
    getters: {
        doneTodos: (state) => {
            return state.todos.filter(todo => todo.done);
        }
    },
    actions: {},
    modules: {
        auth
    }
}