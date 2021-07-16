import BehaviorInstaller from './BehaviorInstaller';

export default class OptionInstaller extends BehaviorInstaller {
    constructor() {
        super();
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

    /**
     * Installer 内部使用，作为保留字已被排除出 Options
     * 响应 setData 执行前的行为
     * @param runtimeContext 运行时上下文，Page / Component实例
     * @param data setData 提交数据
     */
    beforeUpdate(runtimeContext, data) {

    }

    /**
     * Installer 内部使用，作为保留字已被排除出 Options
     * @param runtimeContext 运行时上下文，Page / Component实例
     * @param data 提交数据，已修改的状态自行从 this.data 获取
     */
    updated(runtimeContext, data) {

    }

    beforeDestroy() {

    }

    destroyed() {

    }
}