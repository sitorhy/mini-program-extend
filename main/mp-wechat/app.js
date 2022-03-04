import store from "./store/index";

store.subscribe((mutation, state) => {
    console.log(`=== mutation ${mutation.type} ===`);
    console.log(mutation);
    console.log(state);
    console.log("======");
});

store.subscribeAction({
    before: (action, state) => {
        console.log(`before action ${action.type}`);
    },
    after: (action, state) => {
        console.log(`after action ${action.type}`);
    },
    error: (action, state, error) => {
        console.log(`error action ${action.type}`);
        console.error(error);
    }
});

// app.js
App({
    onLaunch() {
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)

        // 登录
        wx.login({
            success: res => {
                // 发送 res.code 到后台换取 openId, sessionKey, unionId
            }
        })
    },
    globalData: {
        userInfo: null
    },
    store
})
