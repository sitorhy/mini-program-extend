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

<hr>

+ watch

类型：`{ [key: string]: string | Function | Object | Array }`
