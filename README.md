# mini-program-extend

小程序扩展框架，兼容部分 `Vue.js` 常用特性。

> 此框架依赖开发工具的 npm 构建。具体详情可查阅[官方 npm 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。

## 使用说明

### 安装

> npm install mini-program-extend

### 引入

> import { PageEx, ComponentEx } from "mini-program-extend/wechat/extend";

+ 页面扩展接口，替换 `Page`
> PageEx (Object object)

+ 组件扩展接口，替换 `Component`
> ComponentEx (Object object)

### 快速入门
举例说明：
```
PageEx({
  data: {
    num: 114514
  }
});
```
小程序修改状态必须使用`setData`，例如修改状态`num`：
```
this.setData({ num: 1919810 });
```
使用扩展接口，可简化为赋值形式：
```
this.data.num = 1919810;
```
赋值时也可以把`data`引用省略掉：
```
this.num = 1919810;
```
在页面中可以直接观察出效果：
```
<view>{{num}}</view>
```
在访问状态时，可以把`data`引用省略掉：
```
console.log(this.data.num);

console.log(this.num);
```
通常情况推荐使用`Page`(`Component`) 原生接口。<br>
如果需要提高工作效率，或者要使用到扩展特性，只需要把接口替换为`PageEx`(`ComponentEx`) 即可。

## API

### 选项 / 数据

+ data

类型：`Object | Function`

同小程序的`data`选项， 因此推荐使用`Object`类型，接口回退时不会有影响。<br>
有特殊需求，如初始值需要引用`props`的`property`，可以使用`Function`。

示例：
```
PageEx({
  data: {
    a: 100
  }
});
```

使用`Function`：
```
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

<hr>

+ props

类型：`Array<string> | Object`

同小程序`properties`选项，格式定义上不变，在小程序定义格式上做了扩展。<br>
扩展接口下面的定义是等效的，框架对 `Vue.js` 的格式进行了兼容：
```
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
```
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
默认值`default`支持`Function`类型：
```
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
当页面的启动参数传入`props`的`property`时，对应的`property`的值会被启动参数的值覆盖。<br>
当然，启动参数的值类型不要超出小程序的支持范围，例如不要企图传入`Object`类型数据。

示例：
访问页面`pages/index/index?a=1919810`。
```
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
如此便不再需要在`onLoad (Object options)`中把启动参数再写入状态中，建议把外部参数提取到
`props`中。

<hr>

+ computed 
  
类型：`{ [key: string]: Function | { get: Function, set: Function } }`

定义格式参考 `Vue.js`。
需要注意的是，当计算属性用于标签样式`style`计算时，返回值请务必转为`String`,`Vue.js`支持`Object`类型的样式转换，但小程序只认识字符串，

示例：
```
PageEx({
  props: {
    num: {
      type: Number,
      value: 114514
    }
  },
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
```
<view style="{{numStyle}}">{{num}}</view>
```

+ methods

类型：`{ [key: string]: Function }`

现在`PageEx`支持把方法定义在`methods`中了。

<hr>a# Mini Program Extend

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

* 🟩 **data**

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



+ 🟩 **props**

  同小程序`properties`选项，属性命名使用`props`或者`properties`皆可，只是遵守小程序的`properties`定义规范方便接口回退。

  🔴 使用扩展接口时，下面两种定义是等效的：

  ```javascript
  PageEx({  properties: {    a: {      type: Number,      value: 100    },    b: {      type: Number,      default: 200    }  }})
  ```

  ```javascript
  PageEx({  props: {    a: {      type: Number,      default: 100    },    b: {      type: Number,      default: 200    }  }})
  ```

  🔴 默认值`default`支持`Function`类型：

  ```javascript
  PageEx({  props: {    a: {      type: Number,      value: 100    },    b: {      type: Number,      default: 200    },    c: {      type: Number,      default() {        return this.a + this.b;      }    }  }});
  ```

  小程序的`properties`只对`Component`生效，框架对其扩展到了`PageEx`接口上。
  当页面启动参数与`props`的`property`匹配时，小程序会在页面初始化时把启动参数的值注入到`props`的`property`中。当然，注入参数的类型不要超出小程序的处理范围，例如意图传入`Object`类型。

  🔴 示例，访问页面`pages/index/index?a=1919810`。

  ```javascript
  PageEx({  props: {    a: {      type: Number,      value: 100    }  },  onLoad() {    console.log(this.a); // 1919810  }})
  ```



* 🟩  **computed**

  需要注意的是，当用于计算标签样式`style`时，返回值请务必转为`String`，`Vue.js`支持`Object`类型的样式转换，但小程序只认识字符串。

  🔴 示例：

  ```javascript
  PageEx({  data: {    color: 'red'  },  computed: {    numStyle() {      return `color:${this.color}`; // String    }  }});
  ```

  WXML：

  ```xml
  <view style="{{numStyle}}">{{num}}</view>
  ```



* 🟩 **methods**

  类型：`{ [key: string]: string | Function | Object | Array }`

  🔴 小程序只有`Component`接口定义了`methods`选项，现在扩展到了`PageEx`接口中，可以把方法定义在`methods`中。

  ```javascript
  PageEx({  onLoad() {    this.print('onLoad');  },  mounted() {    this.print('mounted');  },  methods: {    print(lifecycle) {      console.log(lifecycle);    }  }});
  ```



* 🟩 **watch**

  参考`Vue.js`的格式，注意不要和小程序`observers`混淆，字段定义仅包含点运算符和标识符，例如监听数组的第一个元素`arr[0]`，正确的格式为`"arr.0"`。

  至于使用上一句话总结就是，引用类型用深度侦听，基本类型引用侦听。

  🔴 深度监听器（`deep = true`）适用于引用类型（`Object`，`Array`），引用类型非深度监听情况下，只有引用变化才会触发回调，就是需要整个对象替换掉。

  监听引用类型，可以无脑加上`deep = true`，缺点是会有额外计算消耗。

  监听基本类型可以加上`deep = true`，但会增加计算量，是无谓之举。

  ```javascript
  PageEx({  data: {    arr: [{ num: 114 }],    arr2: [{ num: 1919 }]  },  watch: {    'arr.0': function (newVal, oldVal) {      console.log(`arr ${JSON.stringify(oldVal)} => ${JSON.stringify(newVal)}`);    },    'arr.0.num': function (newVal, oldVal) {      console.log(`arr[0].num ${JSON.stringify(oldVal)} => ${JSON.stringify(newVal)}`);    },    'arr2': {      handler: function (newVal, oldVal) {        console.log(`arr2 ${JSON.stringify(oldVal)} => ${JSON.stringify(newVal)}`);      },      deep: true    }  },  mounted() {    this.arr[0].num = 514;    this.arr2[0].num = 810;  }});
  ```

  输出：

  ```javascript
  arr[0].num 114 => 514arr2 [{"num":1919}] => [{"num":810}]
  ```

  

