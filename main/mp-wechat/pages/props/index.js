import MPExtender from "../../libs/mp-extend/core/MPExtender";
import Props from "../../libs/test-units/props";

/*
arr: []
bool: false
num: 0
obj: null
str: ""
 */


/*
Page({
    behaviors: [
        Behavior({
            properties: {
                obj: {
                    type: Object
                }
            }
        })
    ],
    onLoad() {
        console.log(this.data);
    }
});
*/

Page(new MPExtender().extends(Props));