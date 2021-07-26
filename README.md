# Mini Program Extend

小程序扩展框架。



## 使用说明

### 安装

> npm install mini-program-extend

### 引入

> import { PageEx, ComponentEx } from "mini-program-extend/wechat/extend";

* 页面扩展接口，替换 `Page`

> PageEx (Object object)

* 组件扩展接口，替换 `Component`

> ComponentEx (Object object)

### 基本使用

举例说明，使用`PageEx`接口替换`Page`，指定如下的页面：

```javascript
PageEx({
  data: {
    num: 114514
  }
});
```

小程序通过`setData`函数修改状态，例如修改状态`num`：

```javascript
this.setData({ num: 1919810 });
```

使用扩展接口，可简化为赋值形式：

```javascript
this.data.num = 1919810;
```

也可以把`data`引用省略掉：

```javascript
this.num = 1919810;
```

在页面中可以直接观察出效果：

```xml
<view>{{num}}</view>
```

在访问状态时，可以把`data`引用省略掉：

```javascript
console.log(this.data.num);
console.log(this.num);
```

通常情况推荐使用`Page`(`Component`) 原生接口，要使用到扩展特性的时候，只需要把接口替换为`PageEx`(`ComponentEx`) 即可。



## API

### 选项 / 数据

* **data**

  同小程序的`data`选项， 使用`Object`类型在接口回退时不会有影响。

  🔴 示例：

  ```javascript
  PageEx({
    data: {
      a: 100
    }
  });
  ```

  🔴 使用`Function`定义初始数据：

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        default: 100
      }
    },
    data() {
      return {
        b: this.a * 2
      };
    }
  });
  ```



+ **props**

  同小程序`properties`选项，属性命名使用`props`或者`properties`皆可，只是遵守小程序的`properties`定义规范方便接口回退。

  🔴 使用扩展接口时，下面两种定义是等效的：

  ```javascript
  PageEx({
    properties: {
      a: {
        type: Number,
        value: 100
      },
      b: {
        type: Number,
        default: 200
      }
    }
  })
  ```

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        default: 100
      },
      b: {
        type: Number,
        default: 200
      }
    }
  })
  ```

  🔴 默认值`default`支持`Function`类型：

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        value: 100
      },
      b: {
        type: Number,
        default: 200
      },
      c: {
        type: Number,
        default() {
          return this.a + this.b;
        }
      }
    }
  });
  ```

  小程序的`properties`只对`Component`生效，框架对其扩展到了`PageEx`接口上。
  当页面启动参数与`props`的`property`匹配时，小程序会在页面初始化时把启动参数的值注入到`props`的`property`中。当然，注入参数的类型不要超出小程序的处理范围，例如意图传入`Object`类型。

  🔴 示例，访问页面`pages/index/index?a=1919810`。

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        value: 100
      }
    },
    onLoad() {
      console.log(this.a); // 1919810
    }
  })
  ```



* **computed**

  需要注意的是，当用于计算标签样式`style`时，返回值请务必转为`String`，`Vue.js`支持`Object`类型的样式转换，但小程序只认识字符串。

  🔴 示例：
  ```javascript
  PageEx({
    data: {
      color: 'red'
    },
    computed: {
      numStyle() {
        return `color:${this.color}`; // String
      }
    }
  });
  ```
  WXML：
  ```xml
  <view style="{{numStyle}}">{{num}}</view>
  ```



* **methods**

  类型：`{ [key: string]: string | Function | Object | Array }`

  🔴 小程序只有`Component`接口定义了`methods`选项，现在扩展到了`PageEx`接口中，可以把方法定义在`methods`中。

  ```javascript
  PageEx({
    onLoad() {
      this.print('onLoad');
    },
    mounted() {
      this.print('mounted');
    },
    methods: {
      print(lifecycle) {
        console.log(lifecycle);
      }
    }
  });
  ```



* **watch**

  参考`Vue.js`的格式，注意不要和小程序`observers`混淆，字段定义仅包含点运算符和标识符，例如监听数组的第一个元素`arr[0]`，正确的格式为`"arr.0"`。

  🔴 深度监听（`deep = true`）适用于引用类型（`Object`，`Array`）。引用类型非深度监听情况下，只有引用变化才会触发回调，就是需要整个对象替换掉，而深度监听则需要进行深度比对，计算量会比较大。

  监听引用类型，可以无脑加上`deep = true`，监听基本类型可以也加上`deep = true`，只是会增加无意义的计算量。

  ```javascript
    PageEx({
      data: {
        arr: [{ num: 114 }],
        arr2: [{ num: 1919 }]
      },
      watch: {
        'arr.0': function (newVal, oldVal) {
          console.log(`arr ${JSON.stringify(oldVal)} => ${JSON.stringify(newVal)}`);
        },
        'arr.0.num': function (newVal, oldVal) {
          console.log(`arr[0].num ${JSON.stringify(oldVal)} => ${JSON.stringify(newVal)}`);
        },
        'arr2': {
          handler: function (newVal, oldVal) {
            console.log(`arr2 ${JSON.stringify(oldVal)} => ${JSON.stringify(newVal)}`);
          },
          deep: true
        }
      },
      mounted() {
        this.arr[0].num = 514;
        this.arr2[0].num = 810;
      }
    });
  ```

  输出：

  ```javascript
  arr[0].num 114 => 514
  arr2 [{"num":1919}] => [{"num":810}]
  ```

  🔴 指定`immediate = true`，侦听器初始化时会触发一次回调，但此时组件还没有触发`mounted`生命周期回调，所以还不能修改状态。

  ```javascript
  PageEx({
    props: {
      num: {
        type: Number,
        value: 114
      }
    },
    watch: {
      num: {
        handler: 'numHandler',
        immediate: true
      }
    },
    methods: {
      numHandler(newVal) {
        console.log(`num = ${JSON.stringify(newVal)}`);
      }
    },
    created() {
      console.log('created');
    },
    mounted() {
      console.log('mounted');
    },
    onLoad() {
      console.log('onLoad');
    }
  });
  ```

  输出：

  ```
  num = 114
  created
  mounted
  onLoad
  ```



### 实例 property

* **$data**

  🔴 代理组件内部状态访问。

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        value: 114
      }
    },
    data() {
      return {
        b: 514
      };
    },
    mounted() {
      console.log(this.$data);
      this.$data.b = 1919810;
    }
  });
  ```



* **$props**

  🔴 代理组件外部状态访问，而实际上小程序会将`properties`合并到`data`中。

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        value: 114
      }
    },
    data() {
      return {
        b: 514
      };
    },
    mounted() {
      console.log(this.$props);
      this.$props.a = 114514;
    }
  });
  ```



* **$options**

  返回非接口内建保留字的字段。

  不要定义`Function`类型字段，页面接口会将`Function`合并到`methods`中。

  🔴 可以看作为静态字段，初始化时可能会有用。

  ```javascript
  function createOptions(customNum) {
    return {
      customOption: 'custom data',
      customNum,
      props: {
        str: {
          type: String,
          default() {
            return this.$options.customOption;
          }
        }
      },
      data() {
        return {
          num: this.$options.customNum * 2
        };
      }
    };
  }
  
  PageEx(createOptions(57257));
  ```



* **$root**

  当前组件所处`Page`实例。



### 实例方法 / 数据

