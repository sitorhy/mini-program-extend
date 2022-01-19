import BehaviorInstaller from "./BehaviorInstaller";

export default class OptionInstaller extends BehaviorInstaller {
    constructor() {
        super();
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
     * @param extender
     * @param context
     * @param options
     * @param instance Page / Component实例
     * @param data setData 提交数据
     */
    beforeUpdate(extender, context, options, instance, data) {

    }

    /**
     * Installer 内部使用，作为保留字已被排除出 Options
     * @param extender
     * @param context
     * @param options
     * @param instance Page / Component实例
     * @param data 提交数据，已修改的状态自行从 this.data 获取
     */
    updated(extender, context, options, instance, data) {

    }

    beforeDestroy() {

    }

    destroyed() {

    }

    provide() {
        return null;
    }

    inject() {
        return null;
    }
}