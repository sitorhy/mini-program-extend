import OptionInstaller from './OptionInstaller';

import {isFunction} from '../utils/common';

/**
 * 混合数据生成
 */
export default class DataInstaller extends OptionInstaller {
    _data = [];

    install(extender, context, options) {
        this._data = extender.installers.map(
            i => i.data()
        ).concat(options.data);
        context.set('data', ((installer) => {
            return function () {
                return installer._data.reduce((obj, i) => {
                    return Object.assign(obj, isFunction(i) ? i.call(this) : i);
                }, {});
            }
        })(this));
    }
}