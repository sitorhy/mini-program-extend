# wechat-mini-program-extend

小程序扩展框架，依赖开发者工具的 npm 构建。<br>具体详情可查阅[官方 npm 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。
基础库版本 >= 2.9.5，建议最新。

<img src="https://github.com/sitorhy/wechat-mini-program-extend/blob/main/main/mp-wechat/pages/index/logo.svg" width="100" height="100" />

<br>

## 使用说明

### 安装

> npm install wechat-mini-program-extend

### 引入

> import { PageEx, ComponentEx } from "wechat-mini-program-extend";
>
> 或者
>
> import { PageEx, ComponentEx } from "wechat-mini-program-extend/index";

* 页面扩展接口，替换 `Page`

> PageEx (Object object)

* 组件扩展接口，替换 `Component`

> ComponentEx (Object object)

### 基本使用

使用`PageEx`接口替换`Page`，指定如下的页面：

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

通常情况下使用`Page` / `Component` 原生接口，要使用到扩展特性的时候，只需要把接口替换为`PageEx` / `ComponentEx` 即可。

<br>

### 小程序生命周期

```
Page.created > Component.created
             > Page.attached = PageEx.beforeMount
             > Component.attached = ComponentEx.beforeMount
             > Component.relations
             > Page.onLoad
             > Page.onShow
             > Component.lifetimes.show or ComponentEx.onShow
             > ComponentEx.mounted = Component.ready = ComponentEx.onReady
             > PageEx.mounted
             > Page.onReady
```
+ 组件树内`Component`触发顺序。 <br>`A(parent)` ← `B(child) `<br>`A.attached` > `B.attached` > `relations.child(A,B)` > `relations.parent(A,B)` <br>
+ `onShow` `onHide` / `pageLifetimes.show` `pageLifetimes.hide` 互斥，不要同时配置。
+ 如果关闭掉开发工具的模拟器，`Page.onReady`不会触发，但`Page.onShow`会触发，再次打开模拟器，`Page.onReady`触发。

## API

### 选项 / 数据

* **data**

  使用`Object`类型在接口回退（`PageEx`→`Page`）时不会有影响。

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

<br>

* **props**

  同小程序`properties`选项，选项名称使用`props`或者`properties`皆可，只是遵守小程序的定义规范方便接口回退。

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
  当页面启动参数与`props`的`property`匹配时，小程序会在页面初始化时把启动参数的值注入到`props`的`property`中。注入参数的类型不要超出小程序的处理范围，例如不要意图传入`Object`类型。

  🔴 示例，访问页面`pages/index/index?a=1919810`。

  ```javascript
  PageEx({
    props: {
      a: {
        type: Number,
        value: 100
      }
    },
    onLoad(options) {
      // this.setData({a:options.a}); // 不再需要
        
      console.log(this.a); // 1919810
    }
  })
  ```

<br>

* **computed**

  需要注意的是，当用于计算标签样式`style`时，返回值请务必转为`String`，小程序只认识字符串。

  🔴 示例：
  ```javascript
  PageEx({
      data: {
          color: 'red',
          num: 100
      },
      computed: {
          numStyle() {
              const styles = [`color:${this.color}`];
              return styles.join(";");
          },
          classes() {
              const classes = ["class1", "class2"];
              return classes.join(" ");
          }
      }
  });
  ```
  WXML：
  ```xml
  <view style="{{numStyle}}">{{num}}</view>
  ```

<br>

* **methods**

  🔴 `methods`选项扩展到了`PageEx`接口中，可以把方法定义在`methods`中。

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

<br>

* **watch**

  侦听器字段定义仅包含点运算符和标识符，例如监听数组的第一个元素`arr[0]`，正确的格式为`"arr.0"`，注意不要和小程序`observers`混淆。

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

  ```
  arr[0].num 114 => 514
  arr2 [{"num":1919}] => [{"num":810}]
  ```

  🔴 指定`immediate = true`，侦听器初始化时会触发一次回调。

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
  onLoad
  mounted
  ```

<br>

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

  <br>

* **$props**

  🔴 代理组件外部状态访问，而实际上小程序会将`properties`同步到`data`中。

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

  <br>

* **$options**

  返回非接口内建保留字的字段，`mounted`、`data`等框架内建的保留字会被排除。

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

  <br>

* **$root**

  指向当前组件所处的`Page`实例。

  <br>

* **$parent**

  指向父组件或页面。
  小程序`relations`执行在`attached`回调之后，在`mounted`，`onReady`，`ready`生命周期中进行首次访问。<br>
  `mounted`执行前默认绑定`Page`，任何时候可以向页面发送事件。

  <br>

* **$children**

  与当前实例有直接关系的子组件，`$children`不保证任何方式顺序的排列。
  在`ready`，`onReady`，`onLoad`，`mounted`中获取。

  <br>

### 选项 / 组合

* **relations**

  🔴 该配置通常用不上，`$parent`，`$children`不完整，应避免在回调中使用。

```javascript
// behaviors.js 导出
const ParentBehavior = Behavior({});
const ChildBehavior = Behavior({});

// 子组件
ComponentEx({
  behaviors: [ChildBehavior],
  relations: {
    'getParent': {
      type: 'parent',
      target: ParentBehavior,
      linked: function (target, key) {
        console.log(key); // getParent
      },
      unlinked: function (target, key) {

      }
    }
  }
});

// 父组件
ComponentEx({
  behaviors: [ParentBehavior],
  relations: {
    'getChild': {
      type: 'child',
      target: ChildBehavior,
      linked: function (target, key) {
        console.log(key); // getChild
      },
      unlinked: function (target, key) {

      }
    }
  }
});
```



* **mixins**

  🔴 主要用于混入生命周期或数据，方法每一次重定义都会覆盖上一次定义。

```javascript
  const Mixin = {
  data: {
    b: 200
  },
  methods: {
    test() {
      console.log('test');
    }
  },
  mounted() {
    console.log('mounted 1');
  }
};

PageEx({
  mixins: [Mixin],
  data: {
    a: 100
  },
  methods: {
    test() {
      console.log(this.a + this.b);
    }
  },
  mounted() {
    this.test();
  }
});
```

输出

  ```
  mounted 1
  300
  ```
* **全局混入**

  在`app.js`注入。

```javascript
import {Extension} from "wechat-mini-program-extend";

Extension.mixin({
  methods: {
    getUserInfo() {
      console.log('114514')
    }
  }
});

App({
  onLaunch(options) {
    // ...
  }
});
```




### 实例方法 / 数据

* **$watch**

  🔴 注册一个数据侦听器，并返回一个取消侦听的函数。

  ```javascript
  PageEx({
    data() {
      return {
        m: {
          n: 1000
        }
      }
    },
    async mounted() {
      const unwatch = this.$watch('m.n', function (val, oldVal) {
        console.log(`${oldVal} => ${val}`);
        if (val >= 3000) {
          unwatch();
        }
      });
      await this.change();
      await this.change();
      await this.change();
    },
    methods: {
      async change() {
        this.m.n += 1000;
        return new Promise(resolve => {
          setTimeout(resolve, 1000);
        });
      }
    }
  });
  ```

  <br>

* **$set**

  🔴 添加对象属性。

  ```javascript
  this.$set(this.m, 'n', 300);
  this.$set(this.arr, '1', 200);
  ```

  <br>

* **$delete**

  🔴 删除对象属性。

  ```javascript
  this.$delete(this.m, 'n');
  this.$delete(this.arr, '1');
  ```

<br>

### 实例方法 / 总线

避免频繁使用`$parrent`,`$children`进行数据交互。<br>
事件总线为框架内建通讯机制，与小程序的事件机制无直接关系。<br>

* **$emit**

  🔴 以自身为起点，祖先组件为终点的方向（冒泡顺序）触发一个总线事件，冒泡事件可被拦截。

  ```javascript
  this.$emit('event', `来自${this.is}组件`);
  ```

  <br>

* **$on**

  🔴 注册一个事件监听器。

  ```javascript
  this.$on('event', (e) => {
  	console.log(e.data);
  });
  ```

  🔴 拦截其他事件处理器。

  ```javascript
  this.$on('event', (e) => {
  	e.handled = true;
  });
  ```

  <br>

* **$off**

  🔴 注销事件监听器。

  ```javascript
  this.$off('event', callback);
  ```

  * 如果没有提供参数，则移除所有的事件监听器；
  * 如果只提供了事件，则移除该事件所有的监听器；
  * 如果同时提供了事件与回调，则只移除这个回调的监听器。

  <br>

* **$once**

  🔴 注册一个事件监听器，触发一次后自动注销。

  ```javascript
  this.$once('event', (e) => {
  	console.log(e.data);
  });
  ```

  <br>

* **$dispatch**

  🔴 以祖先组件为起点，自身为终点的方向（捕获顺序）触发一个总线事件，捕获事件可被拦截。页面使用`PageEx`构建，使事件可以从页面往下传递。

  ```javascript
  this.$dispatch('event', `来自${this.is}组件`);
  ```

  <br>

* **$broadcast**

  🔴 向自身有直接或间接关联的组件发送事件，通常情况下接收目标为页面内除自身外所有组件，广播事件不可被拦截。

  ```javascript
  this.$broadcast('broadcast', `来自${this.is}组件`);
  ```





## 状态管理模式

接口标准移植自`Vuex`，可参考`Vuex`文档，此处不再复述。

### **基本使用**

🔴 `state`一般建议使用函数定义，如果多个状态管理共用一套配置会产生不可预料的冲突。目录结构上可参考`Vue`的脚手架，单独建立一个`store`文件夹。

```javascript
import { createStore } from "wechat-mini-program-extend/store";

const store = createStore({
    state() {
        return {
            count: 0
        };
    },
    mutations: {
        increment(state) {
            state.count++;
        }
    },
    actions: {
        increment({commit}) {
            commit('increment');
        }
    }
});

export default store; // 导出 src/store/index.js
```

```javascript
import { ComponentEx } from "wechat-mini-program-extend";
import store from "path/store"; // 引入 store

ComponentEx({
    computed: {
        count: () => store.state.count;
    },
    increment() {
        store.state.count++;
    }
});
```

```xml
<view>
    <text>{{ count }}</text>
    <view>
        <button bind:tap="increment">increment</button>
    </view>
</view>
```



### **组件绑定辅助函数**

辅助函数针对全局状态管理容器，只需要在`App`对象中配置一个`store`对象，全局容器会挂载到组件的`$store`属性。

```javascript
// app.js
import store from "path/store";

App({
    store,
    onLaunch() {
        // ...
    },
    globalData: {
        // ...
    }
});
```

```javascript
import {mapActions} from "wechat-mini-program-extend/store";

ComponentEx({
    methods: {
        ...mapActions(["increment"])
    }
})
```



