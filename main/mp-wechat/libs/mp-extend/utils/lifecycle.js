/**
 * 声明周期保留字，自定义方法避免使用以下名称
 * @type {string[]}
 */

const RESERVED_LIFECYCLES_WORDS = [
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
    "errorCaptured"
];

export default RESERVED_LIFECYCLES_WORDS;