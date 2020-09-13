---
sidebar: auto
---

# 深入理解 - Vue组件之间传值

`Vue`的核心理念就是组件化，那么组件之间传值和修改值就成了一个很大的考量。

以下我们将列举`Vue2.x`中组件之间传值的所有方法

## props/$emit 父子组件传值

### 父传子

1. 创建子组件，在`src/components/`文件夹下新建一个`Child.vue`

2. 在`Child.vue`中创建`props`并创建一个名为`name`的属性

```vue
<template>
  <div>child - {{name}}</div>
</template>

<script>
export default {
  name: "child",
  props: {
    name: String,
  },
};
</script>

```

3. 在`Parent`组件中引入`Child`组件并注册，然后在`template`中加入`child`标签，标签中添加`name`属性并赋值。

```vue
<template>
  <div id="app">
    <child :name="name"></child>
  </div>
</template>

<script>
import child from "./components/Child";
export default {
  data() {
    return {
      name: "Vue",
    };
  },
  components: {
    child,
  },
};
</script>
```

4. 保存文件，查看浏览器，我们会发现浏览器已经渲染出`child - Vue`了。

### 子传父

在 `Vue` 中使用的是单向数据流，所以在 `child component` 中无法直接使用 `parent component` 的值，只能通过触发 `parent component` 上的事件修改 `parent component` 上的值。子组件可以通过调用内建的 `$emit` 方法并传入事件名称来触发事件

1. 在 `parent component` 的 `methods` 中写入一个可以修改 `name` 值的方法，并把这个事件绑定在 `child component` 上

```vue
<template>
  <div id="app">
    <child :name="name" @nameChange="nameChange"></child>
  </div>
</template>

<script>
import child from "./components/Child";
export default {
  data() {
    return {
      name: "Vue",
    };
  },
  components: {
    child,
  },
  methods: {
    nameChange() {
      this.name = "Vue是我最目前最喜欢的前端框架";
    },
  },
};
</script>
```

2. 在 `child component` 中创建一个按钮，给按钮添加一个点击事件。然后在事件中使用 `$emit` 触发 `parent component` 传递的事件。

```vue
<template>
  <div>
    <p>child - {{name}}</p>
    <button @click="prantNameChange">修改父组件的name值</button>
  </div>
</template>

<script>
export default {
  name: "Child",
  props: {
    name: String,
  },
  methods: {
    prantNameChange() {
      this.$emit("nameChange");
    },
  },
};
</script>
```

3. 当我们点击按钮时就会发现，`name` 变成了 `Vue是我最目前最喜欢的前端框架`

但是通常我们修改 `parent component` 上某一个属性值时，我们希望自己传递值去修改。

此时我们只需要在 `child component` 触发 `parent component` 事件时，传入参数，然后在 `parent component` 的方法中接收即可。

```vue {16}
<template>
  <div>
    <p>child - {{name}}</p>
    <button @click="prantNameChange">修改父组件的name值</button>
  </div>
</template>

<script>
export default {
  name: "Child",
  props: {
    name: String,
  },
  methods: {
    prantNameChange() {
      this.$emit("nameChange", "我喜欢Vue框架");
    },
  },
};
</script>
```

```vue {20}
<template>
  <div id="app">
    <child :name="name" @nameChange="nameChange"></child>
  </div>
</template>

<script>
import child from "./components/Child";
export default {
  data() {
    return {
      name: "Vue",
    };
  },
  components: {
    child,
  },
  methods: {
    nameChange(name) {
      this.name = name;
    },
  },
};
</script>
```

当我们点击按钮后，就会发现，`name` 值已经变成我们传入的文案了。

## provide/inject 隔代组件传值

[provide/inject 官方链接](https://cn.vuejs.org/v2/api/#provide-inject)

::: warning
provide 和 inject 主要在开发高阶插件/组件库时使用。并不推荐用于普通应用程序代码中。
:::

这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深，并在其上下游关系成立的时间里始终生效。如果你熟悉 React，这与 React 的上下文特性很相似。

::: tip
provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的 property 还是可响应的。
:::

provide: 选项应该是一个对象或返回一个对象的函数。该对象包含可注入其子孙的property。

inject: 可以是一个字符串数组、也可以是一个对象.

下面我们就来实践下

1. 在最外层组件中传入provide参数，并在provide中写好我们要传递给子孙组件的对象值。

```vue
<template>
  <div id="app">
    <p>爷爷层 ： 爷爷叫{{name}}，今年{{age}}岁了</p>
    <child></child>
    <button @click="ageChange">改变年纪</button>
  </div>
</template>

<script>
import child from "./components/Child";
export default {
  data() {
    return {
      name: "Vue",
      age: 18,
    };
  },
  provide() {
    return {
      name: this.name,
      age: this.age,
    };
  },
  components: {
    child,
  },
  methods: {
    ageChange() {
      this.age = 12;
    },
  },
};
</script>
```

2. 在子孙组件中用inject接受值。

```vue
<template>
  <div>
    <p>孙子层：爷爷叫{{name}}，今年{{age}}岁了</p>
  </div>
</template>

<script>
export default {
  name: "Child",
  inject: ["name", "age"],
};
</script>
```

3. 最后在浏览器中显示

![An image](/img/vue/1599995560.jpg)

4. 当我们点击按钮时，会发现祖先层的数据已经更改，而子孙层的数据却未得到响应。

![An image](/img/vue/1599995969.jpg)

假设我们在项目中经常需要他是响应式的，那么改如何操作呢？

1. 把所传的值改成函数式返回值就可以了

```vue


```

#### 使用 provide/inject 有什么好处呢

1. 在日常开发中，我们经常会使用 Vuex 做状态管理。但是，Vuex 为了保持状态可被回溯追踪，使用起来太过繁琐；而且项目功能较少时，使用Vuex意义不大。那么，有没有方便快捷的实现全局状态的方法呢？当然有，这就是 provide/inject 这个黑科技 API 的一种使用方法。


## Events 兄弟组件传值

## Vuex