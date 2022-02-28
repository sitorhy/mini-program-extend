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
    },
    actions: {}
};

const account = {
    namespaced: true,

    state: () => ({
        role: '',
        name: ''
    }), // 模块内的状态已经是嵌套的了，使用 `namespaced` 属性不会对其产生影响
    getters: {
        isAdmin(state) {
            return state.role === 'admin';
        } // -> getters['account/isAdmin']
    },
    actions: {
        login({commit}, payload) {
            commit("login", payload);
        } // -> dispatch('account/login')
    },
    mutations: {
        login(state, payload) {
            state.role = payload.role;
            state.name = payload.name;
        } // -> commit('account/login')
    },

    // 嵌套模块
    modules: {
        // 继承父模块的命名空间
        myPage: {
            state: () => ({
                avatar: 10,
                nickName: 0
            }),
            getters: {
                profile() {
                } // -> getters['account/profile']
            }
        },

        // 进一步嵌套命名空间
        posts: {
            namespaced: true,

            state: () => ({
                address: ''
            }),
            getters: {
                popular() {
                } // -> getters['account/posts/popular']
            }
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
    actions: {
        increment(context) {
            context.commit('increment');
        }
    },
    modules: {
        auth,
        account
    }
}