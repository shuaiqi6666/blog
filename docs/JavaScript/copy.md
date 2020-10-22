# JavaScript深克隆与浅克隆

## 前言

实现一个深克隆是面试中常见的问题的,可是绝大多数面试者的答案都是不完整的,甚至是错误的,这个时候面试官会不断追问,看看你到底理解不理解深克隆的原理,很多情况下一些一知半解的面试者就原形毕漏了。


## 浅克隆

浅克隆之所以被称为浅克隆，是因为对象只会被克隆最外部的一层,至于更深层的对象,则依然是通过引用指向同一块堆内存。

### for-in 循环

当然，最简单的浅拷贝还是for-in循环最实用。这个不多讲，大家都知道，直接上代码。

```js
function clone(obj) {
    let target = {};
    for (let key in obj) {
        target[key] = obj[key];
    }
    return target;
}
```

### Object.assign

Object.assign()方法用于对象的合并，将源对象（source）的所有可枚举属性，复制到目标对象（target）。

```js
const target = {};

const source1 = { b: 2 };
const source2 = { c: 3 };

Object.assign(target, source1, source2);
target // {b:2, c:3}
```

### 扩展运算符

```js
let obj = {a:1, b:2};
let target = {...obj} // target = {a:1, b:2}
```

## 深克隆

深克隆之所以称之为深克隆，是因为克隆后的对象与之前的对象毫无关联了，互不影响。

所以为什么要深拷贝呢？ 因为`不希望原有数据被修改`。


### JSON 反序列化

首先我们先定义要克隆的数据。 然后采用JSON方法去克隆尝试下。

```js
let  a = {
    "symbol": Symbol(213123),
    "num": 1234,
    "str": "string",
    "boo": false,
    "null": null,
    "re": new RegExp('ab+c', 'i'),
    "undefined": undefined,
    "obj": {},
    "fn": function aaa() {
        console.log(1)
    },
    "math": Math.floor(3.2334),
    "date": new Date(),
    "arr": [122,23,1212,32,3,12,2121],
}
a.b = a;
console.log(JSON.parse(JSON.stringify(a)))
```

然而结果确是：

![An image](/img/js/21313223112.png)

报错的原因在于： 在请求中传递的对象有一个循环引用。

这是因为 JSON方法不支持循环引用对象。

当我们将循环引用删除后再次运行，代码如下：

```js
let  a = {
    "symbol": Symbol(213123),
    "num": 1234,
    "str": "string",
    "boo": false,
    "null": null,
    "undefined": undefined,
    "obj": {},
    "re": new RegExp('ab+c', 'i'),
    "fn": function aaa() {
        console.log(1)
    },
    "math": Math.floor(3.2334),
    "date": new Date(),
    "arr": [122,23,1212,32,3,12,2121],
}
console.log(JSON.parse(JSON.stringify(a)))
```
结果如下：

![An image](/img/js/3132871327.png) 

但是我们仍然发先一些问题：

    1. Symbol 类型无法复制。
    2. Date 类型在克隆是被转换成字符串了。
    3. Function 无法复制。
    4. Undefined 类型无法复制。
    5. RegExp 转换成空对象了。

然后我们再来测试下克隆时间。 代码如下：

```js
let  a = {
    "symbol": Symbol(213123),
    "num": 1234,
    "str": "string",
    "boo": false,
    "null": null,
    "undefined": undefined,
    "obj": {},
    "re": new RegExp('ab+c', 'i'),
    "fn": function aaa() {
        console.log(1)
    },
    "math": Math.floor(3.2334),
    "date": new Date(),
    "arr": [122,23,1212,32,3,12,2121],
}
console.time();
JSON.parse(JSON.stringify(a));
console.timeEnd();

```

测试数据 ：

    1. default: 0.02685546875 ms
    2. default: 0.0263671875 ms
    3. default: 0.02587890625 ms
    4. default: 0.0263671875 ms
    5. default: 0.026123046875 ms

经过以上数据测试：我们取平均值：0.0263ms

#### JSON 总结

    1.  Function Symbol Undefined  类型无法拷贝。
    2.  Date 类型会自动转译成 String 类型。
    3. RegExp 类型会转译成 Object 类型。
    4.  循环引用无法会导致报错。
    5.  耗时大概在 0.0263ms。

### 构造深克隆函数

我们知道要想实现一个靠谱的深克隆方法， 上一节提到的`序列/反序列 `是不可能了。

其实深拷贝可以拆分成 2 步，浅拷贝 + 递归，浅拷贝时判断属性值是否是对象，如果是对象就进行递归操作，两个一结合就实现了深拷贝。

1. 如果是原始数据类型，无需继续拷贝，直接返回。

2. 如果是引用数据类型，创建一个新对象，遍历需要克隆的对象，将需要克隆对象的属性执行深拷贝后依次添加到新对象上。

3. 如果是循环引用，我们可以额外开辟一个内存空间，来存储当前对象和拷贝对象的对应关系，当需要拷贝对象时，先去存储空间中查找，有的话直接返回，如果没有则继续拷贝，可以采用WeakMap。

::: tip 为什么要使用WeakMap
WeakMap 对象是一组键/值对的集合，其中的键是弱引用的（弱引用不影响垃圾回收）。其键必须是对象，而值是可以任意的。
:::

### 基础版

```js
function isObject(obj) {
  return Object.prototype.toString.call(obj) !== '[object Null]' &&
      (typeof obj === 'object' || typeof obj === 'function');
}
function clone() {
  let map = new WeakMap();
  function deepClone(obj) {
    if (!isObject(obj)) return obj;
    if (map.has(obj)) {
      return obj
    } else {
      map.set(obj, obj)
    }
    let target = null;
    switch (Object.prototype.toString.call(obj)) {
      case '[object Array]':
        target = [];
        obj.forEach((item, index) => {
          target[index] = deepClone(item);
        })
        break;
      case '[object Object]':
        target = {};
        for (let key in obj) {
          target[key] = deepClone(obj[key]);
        }
        break;
      case '[object RegExp]':
        target = new RegExp(obj.source, obj.flags);
        break;
      case '[object Date]':
        target = new Date(obj.getTime())
        break
      default:
        return obj
      }
      return target
  }
  return deepClone;
}
const deepClone = clone();
```

测试克隆时间：

    1. default: 0.17919921875 ms
    2. default: 0.18603515625 ms
    3. default: 0.179931640625 ms
    4. default: 0.1728515625 ms
    5. default: 0.171142578125 ms

  经过以上数据测试：我们取平均值：0.0179ms。

  当然,我们这个深克隆还不算完美,例如Buffer对象、Promise、Set、Map可能都需要我们做特殊处理。

  ### 进阶完整版

  ```js
// 可继续遍历的数据类型
    const mapTag = '[object Map]';
    const setTag = '[object Set]';
    const arrayTag = '[object Array]';
    const objectTag = '[object Object]';
    const argsTag = '[object Arguments]';
    // 不可继续遍历的数据类型
    const boolTag = '[object Boolean]';
    const dateTag = '[object Date]';
    const numberTag = '[object Number]';
    const stringTag = '[object String]';
    const symbolTag = '[object Symbol]';
    const errorTag = '[object Error]';
    const regexpTag = '[object RegExp]';
    const funcTag = '[object Function]';

    const deepTag = [mapTag, setTag, arrayTag, objectTag, argsTag];
    // 工具函数 - 通用while循环
    function forEach(array, iteratee) {
      let index = -1;
      const length = array.length;
      while (++index < length) {
        iteratee(array[index], index);
      }
      return array;
    }
    // 工具函数 - 判断是否为引用数据类型
    function isObject(target) {
      const type = typeof target;
      return target !== null && (type === 'object' || type === 'function');
    }
    // 工具函数 - 获取实际类型
    function getType(target) {
      return Object.prototype.toString.call(target);
    }
    // 工具函数 - 初始化被克隆的对象
    function getInit(target) {
      const Ctor = target.constructor;
      return new Ctor;
    }
    // 工具函数 - 克隆Symbol
    function symbolClone(target) {
      return Object(Symbol.prototype.valueOf.call(target));
    }
    // 工具函数 - 克隆正则
    function cloneReg(target) {
      const reFlags = /\w*$/;
      const result = new target.constructor(target.source, reFlags.exec(target));
      reslut.lastIndex = target.lastIndex;
      return result;
    }
    // 工具函数 - 克隆函数
    function cloneFunction(func) {
      const bodyReg = /(?<={)(.|\n)+(?=})/m;
      const paramReg = /(?<=\().+(?=\s+{)/;
      const funcString = func.toSting();
      if (func.prototype) { // 普通函数
        const param = paramReg.exec(funcString);
        const body = bodyReg.exec(funcString);
        if (body) {
          if (param) {
            const paramArr = param[0].split(",");
            return new Function(...paramArr, body[0]);
          } else {
            return new Function(body[0])
          }
        } else {
          return null;
        }
      } else {  // 箭头函数
        return eval(funcString);
      }
    }
    // 工具函数 克隆不可遍历对象
    function cloneOuterType(target, type) {
      const Ctor = target.constructor;
      switch (type) {
        case boolTag:
        case numberTag:
        case stringTag:
        case errorTag:
        case dateTag:
          return new Ctor(target);
        case regexpTag:
          return cloneReg(target);
        case symbolTag:
          return symbolClone(target);
        case funcTag:
          return cloneFunction(target);
        default:
          return null;
      }
    }

    function clone(target, map = new WeakMap()) {
      // 原始数据类型直接返回
      if (!isObject(target)) {
        return target
      }
      // 根据不同的数据类型进行操作
      const type = getType(target);
      let cloneTarget;
      if (deepTag.includes(type)) {   // 是否是可继续遍历的数据类型
        cloneTarget = getInit(target, type);  // 保留对象原型上的数据
      } else {
        return cloneOuterType(target, type);
      }
      // 处理循环引用
      if (map.get(target)) {
        return target;
      }
      // 处理map和set
      if (type === setTag) {
        target.forEach( value => {
          cloneTarget.add(clone(value));
        });
        return cloneTarget;
      } 
      if (type === mapTag) {
        target.forEach((value, key) => {
          cloneTarget.set(key, value);
        })
        return cloneTarget;
      }
      // 处理对象和数组
      const keys = type === arrayTag ? undefined : Object.keys(target);
      forEach(keys || target, (value, key) => {
        if (keys) {
          key = value;
        }
        cloneTarget[key] = clone(target[key], map);
      })

      return cloneTarget;
    }
  ```

  ## 总结

  实现一个完整的深克隆是由许多坑要踩的,npm上一些库的实现也不够完整,在生产环境中最好用lodash的深克隆实现。

  在面试过程中,我们上面提到的众多坑是面试官很可能追问你的,要知道坑在哪里,能答出来才是你的加分项,在面试过程中必须要有一两个闪光点,如果只知道序列/反序列这种投机取巧的方法,在追问下不仅拿不到分,很可能造成只懂个皮毛的印象,毕竟,面试面得就是你知识的深度.
