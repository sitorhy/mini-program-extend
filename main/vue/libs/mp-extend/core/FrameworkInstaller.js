export default class FrameworkInstaller {
    /**
     * 执行一些初始化操作，插件释放 <br>
     * 例： <br>
     * 释放内部插件 <br>
     * extender.use(new OtherInstaller()); <br>
     * 移除自身 <br>
     * extender.unset(this);
     * @param extender
     * @param options
     */
    use(extender, options) {

    }

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