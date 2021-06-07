import OptionInstaller from './OptionInstaller';

import {isFunction} from '../utils/common';

/**
 * 混合数据生成
 */
export default class DataInstaller extends OptionInstaller {
    install(extender, context, options) {
        context.set('data', (() => {
            return function () {
                return extender.installers.map(i => i.data()).concat(options.data).reduce((obj, i) => {
                    return Object.assign(obj, isFunction(i) ? i.call(this) : i);
                }, {});
            }
        })());
    }
}