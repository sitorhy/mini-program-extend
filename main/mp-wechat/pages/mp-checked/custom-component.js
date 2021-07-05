import MPExtender from "../../libs/mp-extend/core/MPExtender";

Component(new MPExtender().extends(
    {
        properties: {
            word: {
                type: String
            },
            myProperty: { // 属性名
                type: String,
                optionalTypes: [Number, String],
                value: 114514,
                observer: function (newVal, oldVal) {
                    this._propertyChange(newVal, oldVal);
                }
            },
            myProperty2: String // 简化的定义方式
        },

        observers: {
            myProperty: function (val) {
                console.log(val);
            }
        },

        data: {
            A: [{B: 'A[0].B'}]
        }, // 私有数据，可用于模板渲染

        lifetimes: {
            // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
            attached: function () {
                console.log('Component lifetimes.attached');
            },
            moved: function () {
                console.log('Component lifetimes.moved');
            },
            detached: function () {
                console.log('Component lifetimes.detached');
            }
        },

        // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
        attached: function () {
            console.log('Component attached');
        }, // 此处attached的声明会被lifetimes字段中的声明覆盖
        ready: function () {
            console.log('Component ready');
        },

        pageLifetimes: {
            // 组件所在页面的生命周期函数
            show: function () {
                console.log('Component pageLifetimes.show');
            },
            hide: function () {
                console.log('Component pageLifetimes.hide');
            },
            resize: function () {
                console.log('Component pageLifetimes.resize');
            }
        },

        methods: {
            onMyButtonTap: function () {
                this._myPrivateMethod();
            },
            // 内部方法建议以下划线开头
            _myPrivateMethod: function () {
                // 这里将 data.A[0].B 设为 'myPrivateData'
                this.setData({
                    'A[0].B': 'myPrivateData',
                    myProperty: '1919'
                })
            },
            _propertyChange: function (newVal, oldVal) {
                console.log(`${oldVal} => ${newVal}`)
            }
        }
    }
));
