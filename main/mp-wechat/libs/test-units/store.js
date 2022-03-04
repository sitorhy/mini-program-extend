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
                avatar: "",
                nickName: "田所浩二"
            }),
            getters: {
                profile(state) {
                    return state.nickName;
                } // -> getters['account/profile']
            },
            mutations: {
                showAvatar(state, img) {
                    state.avatar = img;
                }
            }
        },

        // 进一步嵌套命名空间
        posts: {
            namespaced: true,

            state: () => ({
                address: ''
            }),
            getters: {
                address(state) {
                    return state.address;
                },
                popular(state, getters) {
                    return getters.address;
                } // -> getters['account/posts/popular']
            },
            actions: {
                setAddress({state}, address) {
                    state.address = address;
                }
            }
        }
    }
};

const task = {
    namespaced: true,
    state: () => {
        return {
            txt1: "",
            txt2: ""
        };
    },
    mutations: {
        setText1(state, txt) {
            state.txt1 = txt;
        },
        setText2(state, txt) {
            state.txt2 = txt;
        }
    },
    getters: {
        text1(state) {
            return state.txt1;
        },
        text2(state) {
            return state.txt2;
        }
    },
    actions: {
        asyncAction() {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve("I would happily sacrifice my life if my death can bring any good to country.");
                }, 1000);
            });
        },
        async asyncTask({commit, dispatch, state}) {
            const txt1 = await dispatch("asyncAction");
            commit("setText1", txt1);
            const txt2 = await (() => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve("nothing can waver my devotion, be it personal misfortune or other temptations.");
                    }, 1000);
                });
            })();
            commit("setText2", txt2);
        },
        rejectTest() {
            return new Promise((r, j) => {
                j("rejected test");
            });
        },
        throwTest() {
            // 同步方法抛异常不会被监听器捕获
            throw new Error("error test1");
        },
        throwTest2() {
            // 可捕获
            return new Promise(() => {
                throw new Error("error test2");
            });
        },
        throwTest3() {
            // 可捕获
            return new Promise((r, j) => {
                j(new Error("error test3"));
            });
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
        ],
        mpBoxColor: "red" // 小程序专用测试项
    },
    mutations: {
        increment(state) {
            state.count++;
        },
        setBoxColor(state, color) {
            state.mpBoxColor = color;
        }
    },
    getters: {
        doneTodos: (state) => {
            return state.todos.filter(todo => todo.done);
        },
        boxColor(state) {
            return state.mpBoxColor;
        }
    },
    actions: {
        increment(context) {
            context.commit('increment');
        },
        setBoxColor({commit}, color) {
            commit("setBoxColor", color);
        }
    },
    modules: {
        auth,
        account,
        task
    }
}