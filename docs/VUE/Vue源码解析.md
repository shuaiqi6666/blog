---
sidebar: auto
---
# Vue 源码解析

## Vue项目结构


    ├── scripts ------------------------------- 构建相关的文件，一般情况下我们不需要动
    │   ├── git-hooks ------------------------- 存放git钩子的目录
    │   ├── alias.js -------------------------- 别名配置
    │   ├── config.js ------------------------- 生成rollup配置的文件
    │   ├── build.js -------------------------- 对 config.js 中所有的rollup配置进行构建
    │   ├── ci.sh ----------------------------- 持续集成运行的脚本
    │   ├── release.sh ------------------------ 用于自动发布新版本的脚本
    ├── dist ---------------------------------- 构建后文件的输出目录
    ├── examples ------------------------------ 存放一些使用Vue开发的应用案例
    ├── flow ---------------------------------- 类型声明，使用开源项目 [Flow](https://flowtype.org/)
    ├── packages ------------------------------ 存放独立发布的包的目录
    ├── test ---------------------------------- 包含所有测试文件
    ├── src ----------------------------------- 这个是我们最应该关注的目录，包含了源码
    │   ├── compiler -------------------------- 编译器代码的存放目录，将 template 编译为 render 函数
    │   ├── core ------------------------------ 存放通用的，与平台无关的代码
    │   │   ├── observer ---------------------- 响应系统，包含数据观测的核心代码
    │   │   ├── vdom -------------------------- 包含虚拟DOM创建(creation)和打补丁(patching)的代码
    │   │   ├── instance ---------------------- 包含Vue构造函数设计相关的代码
    │   │   ├── global-api -------------------- 包含给Vue构造函数挂载全局方法(静态方法)或属性的代码
    │   │   ├── components -------------------- 包含抽象出来的通用组件
    │   ├── server ---------------------------- 包含服务端渲染(server-side rendering)的相关代码
    │   ├── platforms ------------------------- 包含平台特有的相关代码，不同平台的不同构建的入口文件也在这里
    │   │   ├── web --------------------------- web平台
    │   │   │   ├── entry-runtime.js ---------- 运行时构建的入口，不包含模板(template)到render函数的编译器，所以不支持 `template` 选项，我们使用vue默认导出的就是这个运行时的版本。大家使用的时候要注意
    │   │   │   ├── entry-runtime-with-compiler.js -- 独立构建版本的入口，它在 entry-runtime 的基础上添加了模板(template)到render函数的编译器
    │   │   │   ├── entry-compiler.js --------- vue-template-compiler 包的入口文件
    │   │   │   ├── entry-server-renderer.js -- vue-server-renderer 包的入口文件
    │   │   │   ├── entry-server-basic-renderer.js -- 输出 packages/vue-server-renderer/basic.js 文件
    │   │   ├── weex -------------------------- 混合应用
    │   ├── sfc ------------------------------- 包含单文件组件(.vue文件)的解析逻辑，用于vue-template-compiler包
    │   ├── shared ---------------------------- 公共的方法和工具
    ├── package.json -------------------------- 不解释
    ├── yarn.lock ----------------------------- yarn 锁定文件
    ├── .editorconfig ------------------------- 针对编辑器的编码风格配置文件
    ├── .flowconfig --------------------------- flow 的配置文件
    ├── .babelrc ------------------------------ babel 配置文件
    ├── .eslintrc ----------------------------- eslint 配置文件 

+ compiler：compiler 目录包含 Vue.js 所有编译相关的代码。它包括把模板解析成 ast 语法树，ast 语法树优化，代码生成等功能。
+ core：core 目录包含了 Vue.js 的核心代码，包括内置组件、全局 API 封装，Vue 实例化、观察者、虚拟 DOM、工具函数等等。
+ platform：Vue.js 是一个跨平台的 MVVM 框架，它可以跑在 web 上，也可以配合 weex 跑在 native 客户端上。platform 是 Vue.js 的入口，2 个目录代表 2 个主要入口，分别打包成运行在 web 上和 weex 上的 Vue.js。
+ server： Vue.js 2.0 支持了服务端渲染，所有服务端渲染相关的逻辑都在这个目录下。注意：这部分代码是跑在服务端的 Node.js，不要和跑在浏览器端的 Vue.js 混为一谈。
+ sfc ：常我们开发 Vue.js 都会借助 webpack 构建， 然后通过 .vue 单文件来编写组件。 这个目录下的代码逻辑会把 .vue 文件内容解析成一个 JavaScript 的对象
+ shared：Vue.js 会定义一些工具方法，这里定义的工具方法都是会被浏览器端的 Vue.js 和服务端的 Vue.js 所共享的。

熟悉每个模块具体的功能，对之后深入研究源码还是很有帮助的。 下次我们谈论的主题是Vue的构造函数，当new Vue实例的时候，会发生什么呢？生成的Vue实例又有哪些属性和方法呢？这些问题都会在下篇文章中进行详细的介绍。

## Vue构造函数

我们知道使用vue.js开发应用时，都是new Vue({}/*options*/)

那Vue构造函数上有哪些静态属性和方法呢？其原型上又有哪些方法呢? 

### Vue构造函数的原型

先进入项目中，找到package.json文件，这里面有项目的依赖，有开发环境、生产环境等编译的启动脚本，有项目的许可信息等。

然而我们使用npm run dev时，其实就是package.json文件中scripts属性中dev属性，它是这么写的

```json
"dev": "rollup -w -c build/config.js --environment TARGET:web-full-dev"
```

当我们执行 npm run dev 时，根据 scripts/config.js 文件中的配置：

```js
 // Runtime+compiler development build (Browser)
  'web-full-dev': {
    entry: resolve('web/entry-runtime-with-compiler.js'),
    dest: resolve('dist/vue.js'),
    format: 'umd',
    env: 'development',
    alias: { he: './entity-decoder' },
    banner
  },
```

我们可以发现入口文件是'web/entry-runtime-with-compiler.js，然而src目录下的那么文件夹和文件都会编译成dist目录下的vue.js。

但现在有一个问题 web/entry-runtime-with-compiler.js 中这个 web 指的是哪一个目录？这其实是一个别名配置，打开 scripts/alias.js 文件：

```js
const path = require('path')

const resolve = p => path.resolve(__dirname, '../', p)

module.exports = {
  vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
  compiler: resolve('src/compiler'),
  core: resolve('src/core'),
  shared: resolve('src/shared'),
  web: resolve('src/platforms/web'),
  weex: resolve('src/platforms/weex'),
  server: resolve('src/server'),
  sfc: resolve('src/sfc')
} 
```
由上可想而知 web 指向的应该是 src/platforms/web，除了 web 之外，alias.js 文件中还配置了其他的别名，大家在找对应目录的时候，可以来这里查阅，后面就不做这种目录寻找的说明了

我们分别打开相关目录下的文件

/src/entries/web-runtime-with-compiler.js   
--> /src/entries/web-runtime.js    
--> /src/core/index.js    
--> /src/core/instance/index.js

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue

```

在这里，我们终于看到了 Vue 的庐山真面目，它实际上就是一个用 Function 实现的类，我们只能通过 new Vue 去实例化它。

有些同学看到这不禁想问，为何 Vue 不用 ES6 的 Class 去实现呢？我们往后看这里有很多 xxxMixin 的函数调用，并把 Vue 当参数传入，它们的功能都是给 Vue 的 prototype 上扩展一些方法，Vue 按功能把这些扩展分散到多个模块中去实现，而不是在一个模块里实现所有，这种方式是用 Class 难以实现的。这么做的好处是非常方便代码的维护和管理，这种编程技巧也非常值得我们去学习。

可以看到Vue构造函数是如此简单，一个if分支加上一个原型上的_init方法。那么怎么往这个构造函数上混入原型方法和静态属性和静态方法呢？

在Vue的构造函数定义之后，有一系列方法会被调用，这些方法主要用来给Vue函数添加一些原型属性和方法的。 

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'

initMixin(Vue)      // 在Vue构造原型上添加了 _init 方法
stateMixin(Vue)     // 在Vue构造原型上添加了 $data $props  $set  $delete  $watch方法 
eventsMixin(Vue)    // 在Vue构造原型上添加了 $on  $once   $set  $emit    方法 
lifecycleMixin(Vue) // 在Vue构造原型上添加了 _update   $forceUpdate   $destroy  方法 
renderMixin(Vue)
```
initMixin

``` JS
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {   // Vue构造原型上添加了_init 方法
      ...
  }
}
```
stateMixin
```js
export function stateMixin (Vue: Class<Component>) { 
  const dataDef = {}
  dataDef.get = function () { return this._data }   // $data 属性实际上代理的是 _data 这个实例属性
  const propsDef = {}
  propsDef.get = function () { return this._props } // $props 代理的是 _props 这个实例属性
  ...
  Object.defineProperty(Vue.prototype, '$data', dataDef)    //Vue构造原型上添加了 $data 方法
  Object.defineProperty(Vue.prototype, '$props', propsDef)  //Vue构造原型上添加了 $props 方法

  Vue.prototype.$set = set  //Vue构造原型上添加了 $set 方法
  Vue.prototype.$delete = del   //Vue构造原型上添加了 $delete 方法

  Vue.prototype.$watch = function ( //Vue构造原型上添加了 $watch 方法
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    ...
  }
}
```
eventsMixin
```js
export function eventsMixin (Vue: Class<Component>) { 
    Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
        ...     //Vue构造原型上添加了 $on 方法
    }

    Vue.prototype.$once = function (event: string, fn: Function): Component {
        ...     //Vue构造原型上添加了 $once 方法
    }

    Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
        ...      //Vue构造原型上添加了 $off 方法
    }

    Vue.prototype.$emit = function (event: string): Component {
        ...      //Vue构造原型上添加了 $emit 方法
    }
}
```
lifecycleMixin
```js 
export function lifecycleMixin (Vue: Class<Component>) {
    Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
        ... //Vue构造原型上添加了 _update 方法
    }

    Vue.prototype.$forceUpdate = function () {
        ... //Vue构造原型上添加了 $forceUpdate 方法
    }

    Vue.prototype.$destroy = function () {
        ... //Vue构造原型上添加了 $destroy 方法
    }   
}
```
renderMixin
```JS
export function installRenderHelpers (target: any) {
  target._o = markOnce
  target._n = toNumber
  target._s = toString
  target._l = renderList
  target._t = renderSlot
  target._q = looseEqual
  target._i = looseIndexOf
  target._m = renderStatic
  target._f = resolveFilter
  target._k = checkKeyCodes
  target._b = bindObjectProps
  target._v = createTextVNode
  target._e = createEmptyVNode
  target._u = resolveScopedSlots
  target._g = bindObjectListeners
  target._d = bindDynamicKeys
  target._p = prependModifier
}
export function renderMixin (Vue: Class<Component>) { 
  installRenderHelpers(Vue.prototype)   // 在 Vue.prototype 上添加一系列方法

  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)   //Vue构造原型上添加了 $nextTick 方法
  }

  Vue.prototype._render = function (): VNode {
    ...      //Vue构造原型上添加了 _render 方法
  }
}
```

### Vue 构造函数的静态属性和方法（全局API）

接着沿刚才所提到的文件引入顺序一步步来看。/src/core/instance/index.js执行之后，是/src/core/index.js文件来看下源码

```JS
initGlobalAPI(Vue)  // 将 Vue 构造函数作为参数，传递给 initGlobalAPI 方法，该方法来自 ./global-api/index.js 文件

// 在 Vue.prototype 上添加 $isServer 属性，该属性代理了来自 core/util/env.js 文件的 isServerRendering 方法
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

// 在 Vue.prototype 上添加 $ssrContext 属性
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get () { 
    return this.$vnode && this.$vnode.ssrContext
  }
})
 
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

Vue.version = '__VERSION__'  // Vue.version 存储了当前 Vue 的版本号
```

可以看到initGlobalAPI方法给Vue构造函数添加了好多静态属性和方法(也就是官网api提到的全局api)。

```JS
export function initGlobalAPI (Vue: GlobalAPI) { 
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)  // 在 Vue 构造函数上添加 config 属性

  Vue.util = {  //在 Vue 上添加了 util 属性
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

//在 Vue 上添加了 set  delete nextTick observable属性
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  Vue.options = Object.create(null)
    /*  shared/constants.js
        export const ASSET_TYPES = [
        'component',
        'directive',
        'filter'
        ]
    */
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  }) 

  Vue.options._base = Vue
/* builtInComponents 来自于 core/components/index.js
    import KeepAlive from './keep-alive' 
    export default {
    KeepAlive
    }
*/
  extend(Vue.options.components, builtInComponents) // 将 builtInComponents 的属性混合到 Vue.options.components 中

  initUse(Vue)      // 给Vue构造函数添加 use方法
  initMixin(Vue)    // 给Vue构造函数添加 mixin方法
  initExtend(Vue)   // 给Vue构造函数添加 extend方法
  initAssetRegisters(Vue)   // 给Vue构造函数添加 component, directive, filter方法
  // 这三个静态方法大家都不陌生，分别用来全局注册组件，指令和过滤器。
}
```
initGlobalAPI 方法的全部功能我们就介绍完毕了，它的作用就像它的名字一样，是在 Vue 构造函数上添加全局的API，类似整理 Vue.prototype 上的属性和方法一样，

至此，对于 core/index.js 文件的作用我们也大概清楚了，在这个文件里，它首先将核心的 Vue，也就是在 core/instance/index.js 文件中的 Vue，也可以说是原型被包装(添加属性和方法)后的 Vue 导入，然后使用 initGlobalAPI 方法给 Vue 添加静态方法和属性，除此之外，在这个文件里，也对原型进行了修改，为其添加了两个属性：$isServer 和 $ssrContext，最后添加了 Vue.version 属性并导出了 Vue。

### Vue 平台化的包装

接着再看下/src/entries/web-runtime.js文件中的代码

在看这个文件之前，大家可以先打开 platforms 目录，可以发现有两个子目录 web 和 weex。这两个子目录的作用就是分别为相应的平台对核心的 Vue 进行包装的。而我们所要研究的 web 平台，就在 web 这个目录里。

接下来，我们就打开 platforms/web/runtime/index.js 文件，看一看里面的代码，这个文件的一开始，是一大堆 import 语句，其中就包括从 core/index.js 文件导入 Vue 的那句。

在 import 语句下面是这样一段代码
```JS
// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement
```
大家还记得 Vue.config 吗？其代理的值是从 core/config.js 文件导出的对象，这个对象最开始长成这样：

```JS
Vue.config = {
    optionMergeStrategies: Object.create(null),
    silent: false,
    productionTip: process.env.NODE_ENV !== 'production',
    devtools: process.env.NODE_ENV !== 'production',
    performance: false,
    errorHandler: null,
    warnHandler: null,
    ignoredElements: [],
    keyCodes: Object.create(null),
    isReservedTag: no,
    isReservedAttr: no,
    isUnknownElement: no,
    getTagNamespace: noop,
    parsePlatformTagName: identity,
    mustUseProp: no,
    _lifecycleHooks: LIFECYCLE_HOOKS
} 
```
其实这就是在覆盖默认导出的 config 对象的属性，注释已经写得很清楚了，安装平台特定的工具方法

安装平台运行时指令和组件
```JS
// install platform runtime directives & components 
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)
```

我们知道，这两个变量来自于 runtime/directives/index.js 文件和 runtime/components/index.js 文件，我们先打开 runtime/directives/index.js 文件，下面是其全部代码：

```JS
import model from './model'
import show from './show'

export default {
  model,
  show
}
```
所以，经过：extend(Vue.options.directives, platformDirectives) 这句代码之后，Vue.options 将变为：

```JS
Vue.options = {
	components: {
		KeepAlive
	},
	directives: {
		model,
		show
	},
	filters: Object.create(null),
	_base: Vue
}

```
也证明Vue最原始的指令只有v-model 和 v-show

同样的道理，下面是 runtime/components/index.js 文件全部的代码：
```JS
import Transition from './transition'
import TransitionGroup from './transition-group'

export default {
  Transition,
  TransitionGroup
}
```
经过：extend(Vue.options.components, platformComponents) 之后，Vue.options 将变为：
```JS
Vue.options = {
	components: {
		KeepAlive,
		Transition,
		TransitionGroup
	},
	directives: {
		model,
		show
	},
	filters: Object.create(null),
	_base: Vue
}
```

这样，这两句代码的目的我们就搞清楚了，其作用是在 Vue.options 上添加 web 平台运行时的特定组件和指令。

我们继续往下看代码，接下来是这段：

```JS
// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop  // 如果在浏览器环境运行的话，这个方法的值为 patch 函数

// public mount method
Vue.prototype.$mount = function (   // 在 Vue.prototype 上添加了 $mount 方法
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

可以看到

1. 根据不同的平台重写config对象中mustUseProp,  isReservedTag, getTagNamespace, isUnknowElement属性的值。 
2. 通过exend方法，扩展指令对象和组件对象 
3. 然后给Vue.prototype添加__patch__（虚拟dom相关） 和 $mount（挂载元素）方法

### with compiler
 
在看完 runtime/index.js 文件之后，其实 运行时 版本的 Vue 构造函数就已经“成型了”。

可以发现，运行时 版的入口文件，导出的 Vue 就到 ./runtime/index.js 文件为止。然而我们所选择的并不仅仅是运行时版，而是完整版的 Vue，入口文件是 entry-runtime-with-compiler.js，我们知道完整版和运行时版的区别就在于 compiler，所以其实在我们看这个文件的代码之前也能够知道这个文件的作用：就是在运行时版的基础上添加 compiler，对没错，这个文件就是干这个的，接下来我们就看看它是怎么做的，打开 entry-runtime-with-compiler.js 文件：

```JS 
// ...  import 语句
// 根据 id 获取元素的 innerHTML
const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})
// 使用 mount 变量缓存 Vue.prototype.$mount 方法
const mount = Vue.prototype.$mount
// 重写 Vue.prototype.$mount 方法
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
   ...
}


// 获取元素的 outerHTML 
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

// 在 Vue 上添加一个全局API `Vue.compile` 其值为上面导入进来的 compileToFunctions
Vue.compile = compileToFunctions

```

到这里，Vue 神秘面具下真实的样子基本已经展现出来了。现在深呼吸，继续我们的探索吧


## new Vue

在上一节中，我们整理了完整的 Vue 构造函数，包括原型的设计和全局API的设计，并且我们专门为其整理了附录，目的是便于查看相应的方法和属性是在哪里被添加的，同时也让我们对 Vue 构造函数有一个大局观的认识。

从这一章节开始，我们将逐渐走进 Vue，我们采用一种由浅入深，由宽到窄的思路，一开始我们会从宏观的角度来看 Vue 是如何设计的，然后再一点点“追究”进去，进而逐步搞清楚 Vue 为什么这么设计。

而这一节，我们就致力于搞清楚：Vue的思路。我们将会从一个例子开始，这个例子非常简单，如下：

我们有如下模板：

```HTML
  <div id="app"> 
        <p>name:{{name}}</p>
        <div v-if="show">123</div>
        <span style="color:red" @click="add_money">{{money}}</span> 
    </div>
```

和这样一段 js 代码：

```JS
 let app = new Vue({
    el: '#app', 
    data: {
        name: "肖琦",
        money: '123.444',
        show: false,
    }, 
    methods: {
        add_money() {
            ++this.money
        }
    }
})
```

当我们使用 new 操作符调用 Vue 的时候，第一句执行的代码就是 this._init(options) 方法，其中 options 是我们调用 Vue 构造函数时透传过来的，也就是说：

```JS
el: '#app', 
    data: {
        name: "肖琦",
        money: '123.444',
        show: false,
    }, 
    methods: {
        add_money() {
            ++this.money
        }
    }
```
既然如此，我们就找到 _init 方法。可知，_init 方法在 src/core/instance/init.js 文件被添加到 Vue 的原型上，下面我们就看看 _init 做了什么。

```JS
  const vm: Component = this
    // a uid
    vm._uid = uid++ 
```

首先声明了常量 vm，其值为 this 也就是当前这个 Vue 实例啦，然后在实例上添加了一个唯一标示：_uid，其值为 uid，uid 这个变量定义在 initMixin 方法的上面，初始化为 0，可以看到每次实例化一个 Vue 实例之后，uid 的值都会 ++。

所以实际 _uid 就是一个 Vue 实例的实例属性，在之后的分析中，我们将会在很多地方遇到很多的实例属性被逐渐添加到 Vue 实例上.

回过头来继续看代码，接下来是这样一段

```JS
let startTag, endTag
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    startTag = `vue-perf-start:${vm._uid}`
    endTag = `vue-perf-end:${vm._uid}`
    mark(startTag)
}
...
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    vm._name = formatComponentName(vm, false)
    mark(endTag)
    measure(`vue ${vm._name} init`, startTag, endTag)
}
```
意思是：在非生产环境下，并且 config.performance 和 mark 都为真，那么才执行里面的代码。

Vue 提供了全局配置 Vue.config.performance，我们通过将其设置为 true，即可开启性能追踪。这一块我们可以先不了解。


```js
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)   // 初始化生命周期
    initEvents(vm)      // 初始化事件中心
    initRender(vm)      // 初始化渲染
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)     // 初始化状态
    initProvide(vm) // resolve provide after data/props 
    callHook(vm, 'created') 
```

首先在 Vue 实例上添加 _isVue 属性，并设置其值为 true。目的是用来标识一个对象是 Vue 实例，即如果发现一个对象拥有 _isVue 属性并且其值为 true，那么就代表该对象是 Vue 实例。这样可以避免该对象被响应系统观测（其实在其他地方也有用到，但是宗旨都是一样的，这个属性就是用来告诉你：我不是普通的对象，我是Vue实例）。

再往下是这样一段代码：

```js
   if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
```

上面的代码是一段 if 分支语句，条件是：options && options._isComponent，其中 options 就是我们调用 Vue 时传递的参数选项，但 options._isComponent 是什么鬼？我们知道在本节的例子中我们的 options 对象只有两个属性 el 和 data，并且在 Vue 的官方文档中你也找不到关于 _isComponent 这个选项的介绍，其实我相信大部分同学都已经知道，这是一个内部选项。而事实也确实是这样，这个内部选项是在 Vue 创建组件的时候才会有的，为了不牵涉太多内容导致大家头晕，这里暂时不介绍其相关内容。

根据本节的例子，上面的代码必然会走 else 分支，也就是这段代码：

```JS
vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
    ) 
```

## Vue 选项的规范化

注意：本节讨论依旧沿用前文的例子

### 弄清楚传递给 mergeOptions 函数的三个参数

这一小节我们继续前面的讨论，看一看 mergeOptions 都做了些什么。根据 core/instance/init.js 顶部的引用关系可知，mergeOptions 函数来自于 core/util/options.js 文件，事实上不仅仅是 mergeOptions 函数，整个文件所做的一切都为了一件事：选项的合并。

不过在我们深入 core/util/options.js 文件之前，我们有必要搞清楚一件事，就是如下代码中：

```JS
vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
    ) 
```

传递给 mergeOptions 函数的三个参数到底是什么。

其中第一个参数是通过调用一个函数得到的，这个函数叫做 resolveConstructorOptions，并将 vm.constructor 作为参数传递进去。第二个参数 options 就是我们调用 Vue 构造函数时透传进来的对象，第三个参数是当前 Vue 实例，现在我们逐一去看。

resolveConstructorOptions 是一个函数，这个函数就声明在 core/instance/init.js 文件中，如下：

```JS
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}
```

在具体去看代码之前，大家能否通过这个函数的名字猜一猜这个函数的作用呢？其名字是 resolve Constructor Options 那么这个函数是不是用来 解析构造者的 options 的呢？答案是：对，就是干这个的。接下来我们就具体看一下它是怎么做的，首先第一句：

```JS
let options = Ctor.options
```

其中 Ctor 即传递进来的参数 vm.constructor，在我们的例子中他就是 Vue 构造函数，可能有的同学会问：难道它还有不是 Vue 构造函数的时候吗？当然，当你使用 Vue.extend 创造一个子类并使用子类创造实例时，那么 vm.constructor 就不是 Vue 构造函数，而是子类，比如：

```js
const Sub = Vue.extend()
const s = new Sub()
```

那么 s.constructor 自然就是 Sub 而非 Vue，大家知道这一点即可，但在我们的例子中，这里的 Ctor 就是 Vue 构造函数，而有关于 Vue.extend 的东西，我们后面会专门讨论的。

所以，Ctor.options 就是 Vue.options，然后我们再看 resolveConstructorOptions 的返回值是什么？如下：

```js
return options
```

也就是把 Vue.options 返回回去了，所以这个函数的确就像他的名字那样，是用来获取构造者的 options 的。不过同学们可能注意到了，resolveConstructorOptions 函数的第一句和最后一句代码中间还有一坨包裹在 if 语句块中的代码，那么这坨代码是干什么的呢？

我可以很明确地告诉大家，这里水稍微有那么点深，比如 if 语句的判断条件 Ctor.super，super 这是子类才有的属性，如下：

```js
const Sub = Vue.extend()
console.log(Sub.super)  // Vue
```

也就是说，super 这个属性是与 Vue.extend 有关系的，事实也的确如此。除此之外判断分支内的第一句代码：

```js
const superOptions = resolveConstructorOptions(Ctor.super)
```

我们发现，又递归地调用了 resolveConstructorOptions 函数，只不过此时的参数是构造者的父类，之后的代码中，还有一些关于父类的 options 属性是否被改变过的判断和操作，并且大家注意这句代码：

```js
// check if there are any late-modified/attached options (#4976)
const modifiedOptions = resolveModifiedOptions(Ctor)
```

我们要注意的是注释，有兴趣的同学可以根据注释中括号内的 issue 索引去搜一下相关的问题，这句代码是用来解决使用 vue-hot-reload-api 或者 vue-loader 时产生的一个 bug 的。

现在大家知道这里的水有多深了吗？关于这些问题，我们在讲 Vue.extend 时都会给大家一一解答，不过有一个因素从来没有变，那就是 resolveConstructorOptions 这个函数的作用永远都是用来获取当前实例构造者的 options 属性的，即使 if 判断分支内也不例外，因为 if 分支只不过是处理了 options，最终返回的永远都是 options。

所以根据我们的例子，resolveConstructorOptions 函数目前并不会走 if 判断分支，即此时这个函数相当于：

```js
export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  return options
}
```

所以，根据我们的例子，此时的 mergeOptions 函数的第一个参数就是 Vue.options，那么大家还记得 Vue.options 长成什么样子吗？

```js
Vue.options = {
	components: {
		KeepAlive
		Transition,
    	TransitionGroup
	},
	directives:{
	    model,
        show
	},
	filters: Object.create(null),
	_base: Vue
}
```
接下来，我们再看看第二个参数 options，这个参数实际上就是我们调用 Vue 构造函数的透传进来的选项，所以根据我们的例子 options 的值如下：

```js
{
    el: '#app', 
    data: {
        name: "肖琦",
        money: '123.444',
        show: false,
    }, 
    methods: {
        add_money() {
            ++this.money
        }
    }
}
```

而第三个参数 vm 就是 Vue 实例对象本身，综上所述，最终如下代码:

```js
vm.$options = mergeOptions(
  // resolveConstructorOptions(vm.constructor)
    {
        components: {
        KeepAlive
        Transition,
        TransitionGroup
        },
        directives:{
        model,
        show
        },
        filters: Object.create(null),
        _base: Vue
    },
    {
        el: '#app', 
        data: {
            name: "肖琦",
            money: '123.444',
            show: false,
        }, 
        methods: {
            add_money() {
                ++this.money
            }
        }
    },
  vm
)
```

现在我们已经搞清楚传递给 mergeOptions 函数的三个参数分别是什么了，那么接下来我们就打开 core/util/options.js 文件并找到 mergeOptions 方法，看一看都发生了什么

### 检查组件名称是否符合要求

打开 core/util/options.js 文件，找到 mergeOptions 方法，这个方法上面有一段注释：

```JS
/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
```

合并两个选项对象为一个新的对象，这个函数在实例化和继承的时候都有用到，这里要注意两点：第一，这个函数将会产生一个新的对象；第二，这个函数不仅仅在实例化对象(即_init方法中)的时候用到，在继承(Vue.extend)中也有用到，所以这个函数应该是一个用来合并两个选项对象为一个新对象的通用程序。

所以我们现在就看看它是怎么去合并两个选项对象的，找到 mergeOptions 函数，开始的一段代码如下：

```JS
if (process.env.NODE_ENV !== 'production') {
    checkComponents(child)   // 检查用户定义的私有组件名称是否规范
  }
```
在非生产环境下，会以 child 为参数调用 checkComponents 方法，我们看看 checkComponents 是做什么的，这个方法同样定义在 core/util/options.js 文件中，内容如下：

```JS
/**
 * Validate component names
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}
```

由注释可知，这个方法是用来校验组件的名字是否符合要求的，首先 checkComponents 方法使用一个 for in 循环遍历 options.components 选项，将每个子组件的名字作为参数依次传递给 validateComponentName 函数，所以 validateComponentName 函数才是真正用来校验名字的函数，该函数就定义在 checkComponents 函数下方，源码如下：

```JS
export function validateComponentName (name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}
```

validateComponentName 函数由两个 if 语句块组成，所以可想而知，对于组件的名字要满足这两条规则才行，这两条规则就是这两个 if 分支的条件语句：

+ ①：组件的名字要满足正则表达式：/^[a-zA-Z][\w-]*$/
+ ②：要满足：条件 isBuiltInTag(name) || config.isReservedTag(name) 不成立

对于第一条规则，Vue 限定组件的名字由普通的字符和中横线(-)组成，且必须以字母开头。

对于第二条规则，首先将 options.components 对象的 key 小写化作为组件的名字，然后以组件的名字为参数分别调用两个方法：isBuiltInTag 和 config.isReservedTag，其中 isBuiltInTag 方法的作用是用来检测你所注册的组件是否是内置的标签， 

于是我们可知：slot 和 component 这两个名字被 Vue 作为内置标签而存在的，你是不能够使用的，比如这样：

```JS
new Vue({
  components: {
    'slot': myComponent
  }
})
```

你将会得到一个警告，该警告的内容就是 checkComponents 方法中的 warn 文案：

除了检测注册的组件名字是否为内置的标签之外，还会检测是否是保留标签，即通过 config.isReservedTag 方法进行检测，大家是否还记得 config.isReservedTag 在哪里被赋值的？前面我们讲到过在 platforms/web/runtime/index.js 文件中有这样一段代码：

```JS {3}
// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement
```
```JS
export const isReservedTag = (tag: string): ?boolean => {
  return isHTMLTag(tag) || isSVG(tag)
}
export const isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
)
export const isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
)
```
可知在 Vue 中 html 标签和部分 SVG 标签被认为是保留的。所以这段代码是在保证选项被合并前的合理合法。最后大家注意一点，这些工作是在非生产环境下做的，所以在非生产环境下开发者就能够发现并修正这些问题，所以在生产环境下就不需要再重复做一次校验检测了。

另外要说一点，我们的例子中并没有使用 components 选项，但是这里还是给大家顺便介绍了一下。如果按照我们的例子的话，mergeOptions 函数中的很多代码都不会执行，但是为了保证让大家理解整个选项合并所做的事情，这里都会有所介绍。

### 允许合并另一个实例构造者的选项

我们继续看代码，接下来的一段代码同样是一个 if 语句块：

```JS
 if (typeof child === 'function') {
    child = child.options
  }
```

这说明 child 参数除了是普通的选项对象外，还可以是一个函数，如果是函数的话就取该函数的 options 静态属性作为新的 child，我们想一想什么样的函数具有 options 静态属性呢？现在我们知道 Vue 构造函数本身就拥有这个属性，其实通过 Vue.extend 创造出来的子类也是拥有这个属性的。所以这就允许我们在进行选项合并的时候，去合并一个 Vue 实例构造者的选项了。

### 规范化 props（normalizeProps）

接着看代码，接下来是三个用来规范化选项的函数调用：

```JS
normalizeProps(child, vm)
normalizeInject(child, vm)
normalizeDirectives(child)
```

这三个函数是用来规范选项的，什么意思呢？以 props 为例，我们知道在 Vue 中，我们在使用 props 的时候有两种写法，一种是使用字符串数组，如下：

```JS
const ChildComponent = {
  props: ['someData']
}
```

另外一种是使用对象语法：

```JS
const ChildComponent = {
  props: {
    someData: {
      type: Number,
      default: 0
    }
  }
}
```

其实不仅仅是 props，在 Vue 中拥有多种使用方法的选项有很多，这给开发者提供了非常灵活且便利的选择，但是对于 Vue 来讲，这并不是一件好事儿，因为 Vue 要对选项进行处理，这个时候好的做法就是，无论开发者使用哪一种写法，在内部都将其规范成同一种方式，这样在选项合并的时候就能够统一处理，这就是上面三个函数的作用。

现在我们就详细看看这三个规范化选项的函数都是怎么规范选项的，首先是 normalizeProps 函数，这看上去貌似是用来规范化 props 选项的，找到 normalizeProps 函数源码如下：

```JS
/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options: Object, vm: ?Component) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  if (Array.isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    for (const key in props) {
      val = props[key]
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}
```
根据注释我们知道，这个函数最终是将 props 规范为对象的形式了，比如如果你的 props 是一个字符串数组：

```JS
props: ["someData"]
```

那么经过这个函数，props 将被规范为：

```JS
props: {
  someData:{
    type: null
  }
}
```

如果你的 props 是对象如下：

```JS
props: {
  someData1: Number,
  someData2: {
    type: String,
    default: ''
  }
}
```

将被规范化为：

```JS
props: {
  someData1: {
    type: Number
  },
  someData2: {
    type: String,
    default: ''
  }
}
```

现在我们具体看一下代码，首先是一个判断，如果选项中没有 props 选项，则直接 return，什么都不做：

```JS
const props = options.props
if (!props) return
```

如果选项中有 props，那么就开始正式的规范化工作，首先声明了四个变量：

```JS
const res = {}
let i, val, name
```

其中 res 变量是用来保存规范化后的结果的，我们可以发现 normalizeProps 函数的最后一行代码使用 res 变量覆盖了原有的 options.props：

```JS
options.props = res
```

然后开始了判断分支，这个判断分支就是用来区分开发者在使用 props 时，到底是使用字符串数组的写法还是使用纯对象的写法的，我们先看字符串数组的情况：

```JS
if (Array.isArray(props)) {
    i = props.length
    while (i--) {
        val = props[i]
        if (typeof val === 'string') {
        name = camelize(val)
        res[name] = { type: null }
        } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.')
        }
    }
} else if (isPlainObject(props)) {
    ...
} else if (process.env.NODE_ENV !== 'production') {
    ...
}
```

如果 props 是一个字符串数组，那么就使用 while 循环遍历这个数组，我们看这里有一个判断：

```JS
if (typeof val === 'string') {
    name = camelize(val)
    res[name] = { type: null }
} else if (process.env.NODE_ENV !== 'production') {
    warn('props must be strings when using array syntax.')
}
```

也就是说 props 数组中的元素确确实实必须是字符串，否则在非生产环境下会给你一个警告。如果是字符串那么会执行这两句代码：

```JS
name = camelize(val)
res[name] = { type: null }
```

首先将数组的元素传递给 camelize 函数，这个函数来自于 shared/util.js 文件，这个函数的作用是将中横线转驼峰。

然后在 res 对象上添加了与转驼峰后的 props 同名的属性，其值为 { type: null }，这就是实现了对字符串数组的规范化，将其规范为对象的写法，只不过 type 的值为 null。

下面我们再看看当 props 选项不是数组而是对象时的情况：

```JS
if (Array.isArray(props)) {
    ...
} else if ((props)) {
    for (const key in props) {
        val = props[key]
        name = camelize(key)
        res[name] = isPlainObject(val)
            ? val
            : { type: val }
    }
} else if (process.env.NODE_ENV !== 'production') {
    ...
}
```

首先使用 isPlainObject 函数判断 props 是否是一个纯的对象，其中 isPlainObject 函数来自于 shared/util.js 文件，

如果是一个纯对象，也是需要规范化的，我们知道即使是纯对象也是有两种写法的，如下：


```js
props: {
  // 第一种写法，直接写类型
  someData1: Number,
  // 第二种写法，对象
  someData2: {
    type: String,
    default: ''
  }
```

最终第一种写法将被规范为对象的形式，具体实现是采用一个 for in 循环，检测 props 每一个键的值，如果值是一个纯对象那么直接使用，否则将值作为 type 的值：

```js
 res[name] = isPlainObject(val)
    ? val
    : { type: val }
```

这样就实现了对纯对象语法的规范化。

最后还有一个判断分支，即当你传递了 props 选项，但其值既不是字符串数组又不是纯对象的时候，会给你一个警告：

```js
if (Array.isArray(props)) {
  ...
} else if (isPlainObject(props)) {
  ...
} else if (process.env.NODE_ENV !== 'production') {
  warn(
    `Invalid value for option "props": expected an Array or an Object, ` +
    `but got ${toRawType(props)}.`,
    vm
  )
}
```

### 规范化 inject（normalizeInject）

现在我们已经了解了，原来 Vue 底层是这样处理 props 选项的，下面我们再来看看第二个规范化函数：normalizeInject，源码如下：

```js
/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}
```

首先是这三句代码：

```js
const inject = options.inject
  if (!inject) return
  const normalized = options.inject = {}
```

+ 第一句代码使用 inject 变量缓存了 options.inject，通过这句代码和函数的名字我们能够知道，这个函数是用来规范化 inject 选项的。
+ 第二句代码判断是否传递了 inject 选项，如果没有则直接 return。
+ 然后在第三句代码中重写了 options.inject 的值为一个空的 JSON 对象，并定义了一个值同样为空 JSON 对象的变量 normalized。现在变量 normalized 和 options.inject 将拥有相同的引用，也就是说当修改 normalized 的时候，options.inject 也将受到影响。

在这两句代码之后，同样是判断分支语句，判断 inject 选项是否是数组和纯对象，类似于对 props 的判断一样。说到这里我们需要了解一下 inject 选项了，这个选项是 2.2.0 版本新增，它要配合 provide 选项一同使用，具体介绍可以查看官方文档，这里我们举一个简单的例子：

```js
// 子组件
const ChildComponent = {
  template: '<div>child component</div>',
  created: function () {
    // 这里的 data 是父组件注入进来的
    console.log(this.data)
  },
  inject: ['data']
}

// 父组件
var vm = new Vue({
  el: '#app',
  // 向子组件提供数据
  provide: {
    data: 'test provide'
  },
  components: {
    ChildComponent
  }
})
```

上面的代码中，在子组件的 created 钩子中我们访问了 this.data，但是在子组件中我们并没有定义这个数据，之所以在没有定义的情况下能够使用，是因为我们使用了 inject 选项注入了这个数据，这个数据的来源就是父组件通过 provide 提供的。父组件通过 provide 选项向子组件提供数据，然后子组件中可以使用 inject 选项注入数据。这里我们的 inject 选项使用一个字符串数组，其实我们也可以写成对象的形式，如下：

```js
// 子组件
const ChildComponent = {
  template: '<div>child component</div>',
  created: function () {
    console.log(this.d)
  },
  // 对象的语法类似于允许我们为注入的数据声明一个别名
  inject: {
    d: 'data'
  }
}
```

上面的代码中，我们使用对象语法代替了字符串数组的语法，对象语法实际上相当于允许我们为注入的数据声明一个别名。现在我们已经知道了 inject 选项的使用方法和写法，其写法与 props 一样拥有两种，一种是字符串数组，一种是对象语法。所以这个时候我们再回过头去看 normalizeInject 函数，其作用无非就是把两种写法规范化为一种写法罢了，由注释我们也能知道，最终规范化为对象语法。接下来我们就看看具体实现，首先是 inject 选项是数组的情况下，如下：

```js
if (Array.isArray(inject)) {
  for (let i = 0; i < inject.length; i++) {
    normalized[inject[i]] = { from: inject[i] }
  }
} else if (isPlainObject(inject)) {
  ...
} else if (process.env.NODE_ENV !== 'production') {
  ...
}
```

使用 for 循环遍历数组的每一个元素，将元素的值作为 key，然后将 { from: inject[i] } 作为值。大家不要忘了一件事，那就是 normalized 对象和 options.inject 拥有相同的引用，所以 normalized 的改变就意味着 options.inject 的改变。

也就是说如果你的 inject 选项是这样写的：

```js
['data1', 'data2']
```

那么将被规范化为：

```js
{
  'data1': { from: 'data1' },
  'data2': { from: 'data2' }
}
```

当 inject 选项不是数组的情况下，如果是一个纯对象，那么将走 else if 分支：

```js
if (Array.isArray(inject)) {
  ...
} else if (isPlainObject(inject)) {
  for (const key in inject) {
    const val = inject[key]
    normalized[key] = isPlainObject(val)
      ? extend({ from: key }, val)
      : { from: val }
  }
} else if (process.env.NODE_ENV !== 'production') {
  ...
}
```

有的同学可能会问：normalized 函数的目的不就是将 inject 选项规范化为对象结构吗？那既然已经是对象了还规范什么呢？那是因为我们期望得到的对象是这样的：

```js
inject: {
  'data1': { from: 'data1' },
  'data2': { from: 'data2' }
}
```
即带有 from 属性的对象，但是开发者所写的对象可能是这样的：

```JS
let data1 = 'data1'

// 这里为简写，这应该写在Vue的选项中
inject: {
  data1,
  d2: 'data2',
  data3: { someProperty: 'someValue' }
}
```

而实现方式，就是 else if 分支内的代码所实现的，即如下代码：

```JS
for (const key in inject) {
  const val = inject[key]
  normalized[key] = isPlainObject(val)  // 判断一下值(即 val)是否为纯对象
    ? extend({ from: key }, val)        // 使用 extend 进行混合
    : { from: val } // 使用 val 作为 from 字段的值，
}
```

最后一个判断分支同样是在当你传递的 inject 选项既不是数组又不是纯对象的时候，在非生产环境下给你一个警告：

```JS
if (Array.isArray(inject)) {
  ...
} else if (isPlainObject(inject)) {
  ...
} else if (process.env.NODE_ENV !== 'production') {
  warn(
    `Invalid value for option "inject": expected an Array or an Object, ` +
    `but got ${toRawType(inject)}.`,
    vm
  )
}
```

### 规范化 directives（normalizeDirectives）

最后一个规范化函数是 normalizeDirectives，源码如下：

```JS
/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}
```

看其代码内容，应该是规范化 directives 选项的。我们知道 directives 选项用来注册局部指令，比如下面的代码我们注册了两个局部指令分别是 v-test1 和 v-test2：

```JS
<div id="app" v-test1 v-test2>{{test}}</div>

var vm = new Vue({
  el: '#app',
  data: {
    test: 1
  },
  // 注册两个局部指令
  directives: {
    test1: {
      bind: function () {
        console.log('v-test1')
      }
    },
    test2: function () {
      console.log('v-test2')
    }
  }
})
```

上面的代码中我们注册了两个局部指令，但是注册的方法不同，其中 v-test1 指令我们使用对象语法，而 v-test2 指令我们使用的则是一个函数。所以既然出现了允许多种写法的情况，那么当然要进行规范化了，而规范化的手段就如同 normalizeDirectives 代码中写的那样：

```JS
for (const key in dirs) {
  const def = dirs[key]
  if (typeof def === 'function') {
    dirs[key] = { bind: def, update: def }
  }
}
```

注意 if 判断语句，当发现你注册的指令是一个函数的时候，则将该函数作为对象形式的 bind 属性和 update 属性的值。也就是说，可以把使用函数语法注册指令的方式理解为一种简写。

这样，我们就彻底了解了这三个用于规范化选项的函数的作用了，相信通过上面的介绍，大家对 props、inject 以及 directives 这三个选项会有一个新的认识。知道了 Vue 是如何做到允许我们采用多种写法，也知道了 Vue 是如何统一处理的，这也算是看源码的收获之一吧。

看完了 mergeOptions 函数里的三个规范化函数之后，我们继续看后面的代码，接下来是这样一段代码：

```JS
 // Apply extends and mixins on the child options,      应用扩展和混合子选项，
  // but only if it is a raw options object that isn't  但仅当它是一个原始选项对象，而不是
  // the result of another mergeOptions call.           另一个合并选项调用的结果。
  // Only merged options has the _base property.        只有合并后的选项具有_base属性。
  if (!child._base) {
    if (child.extends) {  
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }
```

很显然，这段代码是处理 extends 选项和 mixins 选项的。

到目前为止我们所看到的 mergeOptions 的代码，还都是对选项的规范化，或者说的明显一点：现在所做的事儿还都在对 parent 以及 child 进行预处理，而这是接下来合并选项的必要步骤。

## Vue 选项的合并

上一章节我们了解了 Vue 对选项的规范化，而接下来才是真正的合并阶段，我们继续看 mergeOptions 函数的代码，接下来的一段代码如下：

```JS
  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return  options
```

这段代码的第一句和最后一句说明了 mergeOptions 函数的的确确返回了一个新的对象，因为第一句代码定义了一个常量 options，而最后一句代码将其返回，所以我们自然可以预估到中间的代码是在充实 options 常量，而 options 常量就应该是最终合并之后的选项，我们看看它是怎么产生的。

首先我们明确一下代码结构，这里有两个 for in 循环以及一个名字叫 mergeField 的函数，而且我们可以发现这两个 for in 循环中都调用了 mergeField 函数。我们先看第一段 for in 代码：

```js
 for (key in parent) {
    mergeField(key)
  }
```
这段 for in 用来遍历 parent，并且将 parent 对象的键作为参数传递给 mergeField 函数，大家应该知道这里的 key 是什么，假如 parent 就是 Vue.options：

```js
Vue.options = {
  components: {
      KeepAlive,
      Transition,
      TransitionGroup
  },
  directives:{
      model,
      show
  },
  filters: Object.create(null),
  _base: Vue
}
```

那么 key 就应该分别是：components、directives、filters 以及 _base，除了 _base 其他的字段都可以理解为是 Vue 提供的选项的名字。

而第二段 for in 代码：

```js
for (key in child) {
  if (!hasOwn(parent, key)) {
    mergeField(key)
  }
}
```

其遍历的是 child 对象，并且多了一个判断：

```
if (!hasOwn(parent, key)
```

其中 hasOwn 函数来自于 shared/util.js 文件，其作用是用来判断一个属性是否是对象自身的属性(不包括原型上的)。所以这个判断语句的意思是，如果 child 对象的键也在 parent 上出现，那么就不要再调用 mergeField 了，因为在上一个 for in 循环中已经调用过了，这就避免了重复调用。

总之这两个 for in 循环的目的就是使用在 parent 或者 child 对象中出现的 key(即选项的名字) 作为参数调用 mergeField 函数，真正合并的操作实际在 mergeField 函数中。

mergeField 代码如下：

```js
 function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
```

mergeField 函数只有两句代码，第一句代码定义了一个常量 strat，它的值是通过指定的 key 访问 strats 对象得到的，而当访问的属性不存在时，则使用 defaultStrat 作为值。

这里我们就要明确了，strats 是什么？想弄明白这个问题，我们需要从整体角度去看一下 options.js 文件，首先看文件顶部的一堆 import 语句下的第一句代码：

```js
/**
 * Option overwriting strategies are functions that handle  选项覆盖策略是函数，处理
 * how to merge a parent option value and a child option    如何合并一个父选项值和一个子选项
 * value into the final value.                              值转换为最终值。
 */
const strats = config.optionMergeStrategies
```

这句代码就定义了 strats 变量，且它是一个常量，这个常量的值为 config.optionMergeStrategies，这个 config 对象是全局配置对象，来自于 core/config.js 文件，此时 config.optionMergeStrategies 还只是一个空的对象。注意一下这里的一段注释：选项覆盖策略是处理如何将父选项值和子选项值合并到最终值的函数。也就是说 config.optionMergeStrategies 是一个合并选项的策略对象，这个对象下包含很多函数，这些函数就可以认为是合并特定选项的策略。这样不同的选项使用不同的合并策略，如果你使用自定义选项，那么你也可以自定义该选项的合并策略，只需要在 Vue.config.optionMergeStrategies 对象上添加与自定义选项同名的函数就行。而这就是 Vue 文档中提过的全局配置：optionMergeStrategies。

### 选项 el、propsData 的合并策略

那么接下来我们就看看这个选项合并策略对象都有哪些策略，首先是下面这段代码：

```js
/**
 * Options with restrictions
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}
```

非生产环境下在 strats 策略对象上添加两个策略(两个属性)分别是 el 和 propsData，且这两个属性的值是一个函数。通过这两个属性的名字可知，这两个策略函数是用来合并 el 选项和 propsData 选项的。与其说“合并”不如说“处理”，因为其本质上并没有做什么合并工作。那么我们看看这个策略函数的具体内容，了解一下它是怎么处理 el 和 propsData 选项的。

首先是一段 if 判断分支，判断是否有传递 vm 参数：

```js
if (!vm) {
    warn(
    `option "${key}" can only be used during instance ` +
    'creation with the `new` keyword.'
    )
}
```

如果没有传递这个参数，那么便会给你一个警告，提示你 el 选项或者 propsData 选项只能在使用 new 操作符创建实例的时候可用。比如下面的代码：

```js
// 子组件
var ChildComponent = {
  el: '#app2',
  created: function () {
    console.log('child component created')
  }
}

// 父组件
new Vue({
  el: '#app',
  data: {
    test: 1
  },
  components: {
    ChildComponent
  }
})
```

上面的代码中我们在父组件中使用 el 选项，这并没有什么问题，但是在子组件中也使用了 el 选项，这就会得到如上警告。这说明了一个问题，即在策略函数中如果拿不到 vm 参数，那说明处理的是子组件选项。所以问题来了，为什么通过判断 vm 是否存在，就能判断出是否是子组件呢？那首先我们要搞清楚策略函数中的 vm 参数是哪里来的。首先我们还是看一下 mergeField 函数：

```js
function mergeField (key) {
  const strat = strats[key] || defaultStrat
  options[key] = strat(parent[key], child[key], vm, key)
}
```

函数体的第二句代码中在调用策略函数的时候，第三个参数 vm 就是我们在策略函数中使用的那个 vm，那么这里的 vm 是谁呢？它实际上是从 mergeOptions 函数透传过来的，因为 mergeOptions 函数的第三个参数就是 vm。我们知道在 _init 方法中调用 mergeOptions 函数时第三个参数就是当前 Vue 实例：



















