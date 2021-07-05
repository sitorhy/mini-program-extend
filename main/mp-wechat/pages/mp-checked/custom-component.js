import MPExtender from "../../libs/mp-extend/core/MPExtender";

Component(new MPExtender().extends(
    {
        properties: {
            word: {
                type: String
            }
        }
    }
));
