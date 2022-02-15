// pages/context/index.js
import {MPExtender} from "../../libs/mp-extend/index";
import {OptionInstaller} from "../../libs/mp-extend/index";
import {compatibleContext} from "../../libs/test-units/context"

// 启用临时上下文
class ContextDebugInstaller extends OptionInstaller {
    install(extender, context, options) {
        extender._initializationCompatibleContextEnabled = true;
    }
}

const extender = new MPExtender();
extender.use(new ContextDebugInstaller(), -1);

Page(extender.extends(compatibleContext));