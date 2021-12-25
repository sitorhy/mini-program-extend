export default class FrameworkInstaller {
    /**
     * 拦截，构建配置
     * @param extender
     * @param context
     * @param {{[key:string]:any}} options
     * @returns {{[key:string]:any}|null}
     */
    configuration(extender, context, options) {
        return null;
    }

    /**
     * 处理配置上下文，修改、规格化配置
     *
     * @param {MPExtender} extender
     * @param {Map<any,any>} context
     * @param {{[key:string]:any}} options
     */
    install(extender, context, options) {
        return options;
    }

    /**
     * 返回值将直接注入最终配置
     * @param {MPExtender} extender
     * @param {Map<any,any>} context
     * @param {{[key:string]:any}} options
     * @returns {{}}
     */
    build(extender, context, options) {
        return {};
    }
}