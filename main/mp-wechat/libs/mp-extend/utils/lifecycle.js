/**
 * 生命周期保留字，虽然小程序无法适配所有实现，但自定义方法应避免使用以下名称
 * @type {Set}
 */

const RESERVED_LIFECYCLES_WORDS = new Set(
    [
        "onLoad",
        "onShow",
        "onReady",
        "onHide",
        "onUnload",
        "onPullDownRefresh",
        "onReachBottom",
        "onShareAppMessage",
        "onAddToFavorites",
        "onShareTimeline",
        "onTabItemTap",
        "onPageScroll",
        "onResize",
        "definitionFilter",
        "attached",
        "moved",
        "detached",
        "beforeCreate",
        "created",
        "beforeMount",
        "mounted",
        "beforeUpdate",
        "updated",
        "activated",
        "deactivated",
        "beforeDestroy",
        "destroyed",
        "errorCaptured",
        "error"
    ]
);

export default RESERVED_LIFECYCLES_WORDS;