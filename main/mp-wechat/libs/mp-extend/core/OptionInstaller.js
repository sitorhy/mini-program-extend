import BehaviorInstaller from './BehaviorInstaller';

export default class OptionInstaller extends BehaviorInstaller {
    constructor(extender = null) {
        super();
        this.extender = extender;
    }

    /**
     * 处理配置上下文，修改、规格化配置
     *
     * @param {MPExtender} extender
     * @param {Map<any,any>} context
     * @param {Map<string,any>} options
     */
    install(extender, context, options) {
        return options;
    }

    /**
     * 返回值将直接注入最终配置
     * @param {MPExtender} extender
     * @param {Map<any,any>} context
     * @param {Map<string,any>} options
     * @returns {{}}
     */
    build(extender, context, options) {
        return {};
    }

    computed() {
        return null;
    }

    watch() {
        return null;
    }

    beforeCreate() {

    }

    created() {

    }

    beforeMount() {

    }

    mounted() {

    }

    beforeUpdate() {

    }

    updated() {

    }

    beforeDestroy() {

    }

    destroyed() {

    }
}