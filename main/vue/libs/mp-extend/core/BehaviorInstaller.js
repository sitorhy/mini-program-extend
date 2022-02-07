import FrameworkInstaller from "./FrameworkInstaller";

export default class BehaviorInstaller extends FrameworkInstaller {
    /**
     * 自定义组件扩展
     *
     * @param extender
     * @param context
     * @param options
     * @param defFields
     * @param definitionFilterArr
     * @returns {void}
     */
    definitionFilter(extender, context, options, defFields, definitionFilterArr) {

    }

    behaviors() {
        return [];
    }

    properties() {
        return {};
    }

    observers(extender, context, options) {
        return null;
    }

    data() {
        return null;
    }

    methods() {
        return null;
    }

    ready() {

    }

    moved() {

    }

    options() {
        return null;
    }

    /**
     * 重载该方法创建的回调函数，使用的this对象为代理对象
     *
     * @param extender
     * @param context
     * @param options
     * @returns {{}}
     */
    lifetimes(extender, context, options) {
        return null;
    }

    pageLifetimes(extender, context, options) {
        return null;
    }

    externalClasses() {
        return [];
    }

    relations(extender, context, options) {
        return null;
    }
}