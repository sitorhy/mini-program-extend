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
        return {};
    }

    data() {
        return {};
    }

    methods() {
        return {};
    }

    ready() {

    }

    moved() {

    }

    options() {
        return {};
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
        return {};
    }

    pageLifetimes(extender, context, options) {
        return {};
    }

    externalClasses() {
        return [];
    }

    relations() {
        return {};
    }
}