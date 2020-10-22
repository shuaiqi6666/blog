# JavaScript 数据类型

## 1. 数据类型分类

在js中数据类型分为基础数据类型和引用数据类型。

基础数据类型存储在栈内存中，而引用数据类型是存储在堆内存中。

基本数据类型：
    
    String 字符串
    Number 数字
    Boolean 布尔值
    Undefined   未定义
    Null 空
    Bigint 大整数 (ES10新增)
    Symbol 唯一值

引用数据类型：

    Object
        Object 普通对象
        Array 数组
        Math 数字函数
        Function 函数
        Date 日期对象
        RegExp 正则对象



## 2. 数据类型检测

### 1. typeof

```js
typeof '123';       // string
typeof 213;         // number
typeof true,        // boolean
typeof undefined;   // undefined
typeof null;        // object
typeof Symbol(123); // symbol

typeof {};          // object
typeof [];          // object
typeof () => {};    // function
typeof Math;        // object
typeof new Date();  // object
typeof new RegExp();// object
```

由上可见： 

  1. 在检测`null`时，并未检查出正确的数据类型。
  2. 检测对象数据类型时，除了`Function`其他的都是`Object`类型。

其实问题不止这两点，如果我们采用 `new Number(123)`创建数子类型，使用`typeof`也会变成对象数据类型。

```js
typeof new String('123');  // object
typeof new Number(213);    // object
typeof new Boolean(true);  // object
```

::: danger 
其他基本数据类型不能被`new`
:::

### 2. instanceof

`instanceof`是基于原型链查找，只要处在原型链中就判断为`true`。

```js
111 instanceof Number;              // false
'aaa' instanceof String;            // false
true instanceof Boolean;            // false
undefined instanceof Undifined;     // error
null instanceof Null;               // error
Symbol(123) instanceof Symbol;      // false

new String('123') instanceof String;// true
new Number(213) instanceof Number;  // true
new Boolean(true) instanceof Boolean// true

{} instanceof Object;              // true
[] instanceof Array;               // true
() => {} instanceof Function;      // true
new Date() instanceof Data;        // true
new RegExp() instanceof RegExp;    // true
```

由上可知：
 
  · 通过基础数据类型通过字面量的方式无法正确判断，因为字面量的方式没有原型。
  · null、undefined 无法进行判断，会保存。
  · Symbol 类型无法正确判断

#### 手动实现 instanceof

```js
function isObject(val) {
  return typeof val === 'object' ||
         typeof val === 'function' &&
         Object.prototype.toString.call(val) !== '[object Null]'
}
function myInstanceof(value, target) {
  if (!isObject(value)) {
    return false
  }
  while (value) {
    value = Object.getPrototypeOf(value);
    if (target.prototype == value) {
      return true
    }
  }
  return false
}
```

### 3. constructor

```js
console.log(true.constructor === Boolean);         // true
console.log((123).constructor === Number);         // true
console.log('123'.constructor === String);         // true
console.log([].constructor === Array);             // true
console.log({}.constructor === Object);            // true
console.log(function(){}.constructor === Function);// true
console.log(Symbol(324).constructor === Symbol);   // true
console.log((new Date()).constructor === Date);    // true
console.log((new RegExp()).constructor === RegExp);// true
```

`null`、`undefined`没有`constructor`属性，所以无法进行判断，并且他是不安全的，因为`constuctor`是可以被改变的。

### 4.Object.prototype.toString.call

这个是目前判断类型最精确的方法。任何数据类型都可以正确的辨识。

```js
console.log(Object.prototype.toString.call(123))         // [object Number]
console.log(Object.prototype.toString.call('aaa'))       // [object String]
console.log(Object.prototype.toString.call(null))        // [object Null]
console.log(Object.prototype.toString.call(undefined))   // [object Undefined]
console.log(Object.prototype.toString.call(true))        // [object Boolean]
console.log(Object.prototype.toString.call(Symbol(123))) // [object Symbol]
console.log(Object.prototype.toString.call({}))          // [object Object]
console.log(Object.prototype.toString.call([]))          // [object Array]
console.log(Object.prototype.toString.call(new Date()))  // [object Date]
console.log(Object.prototype.toString.call(new RegExp()))// [object RegExp]
console.log(Object.prototype.toString.call(function(){}))// [object Function]
```

### 5. Array.isArray

Array.isArray()：用于确定传递的值是否是一个Array，返回值是Boolean；

### 6. isNaN 和 Number.isNaN

isNaN()：用来确定以一个值是否为NaN。（会经过隐式类型转换，无法转换为Number的会返回true）；

Number.isNaN()：用来确定一个值是否为NaN。（只有当值为NaN时，才会返回true。不会进行类型转换）；

### 7. 总结

`typeof`： 可以以测试出`number`、`string`、`boolean`、`Symbol`、`undefined`及`function`，而对于`null`及数组、对象，`typeof`均检测出为`object`，不能进一步判断它们的类型。

`instanceof`： 适合于判断自定义的类实例对象，而不是用来判断原生的数据类型，仅能判断引用数据类型和某些能用`new`生成的基础数据数据类型的实例。

`Object.prototype.toString.call`： 不能检测非原生构造函数的构造函数。

`constructor`：`null`、`undefined`没有`constructor`属性，所以无法进行判断，并且他是不安全的，因为`constuctor`是可以被改变的。

## 3. 数据类型转换

在js中数据类型转换是一件非常头疼的事，一旦有误就会影响整段代码的执行。

| 原始值        | 转换目标           | 结果  |
| ------------- |:-------------:| -----:|
| Number      | Boolean      | 除了0、-0、NaN都为true |
| String      | Boolean      | 除了空字符串都为true  |
| Undefined | Boolean    |    false |
| Null | Boolean    |    false |
| 引用数据类型 | Boolean    |    true |
| Boolean | String    |    'true'/'false' |
| Array | String    |  [1,2,3] => '1,2,3'   |
| Object | String    |    '[object Object]' |
| String | Number    |    '1' => 1 / 'a' => NaN |
| Array | Number    |    [] => 0 / [1] => 1 / ['a'] => NaN |
| null | Number    |    0 |
|除了数组其他的引用数据类型 | Number    |  NaN   |

类型转换规则：

    · 除0、-0、NaN、’‘、null、undefined的其他值都为true。
    · 判断的类型是否包含String和Number，是的话就要把String转为Number在进行比较。
    · 如果其中一方是否是Boolean，是的话就需要把Boolean转换成Number在进行比较。
    · 如果一方是Object，另一方是基本数据，需要把Object转换成字符串（优先调用Symbol.toPrimitive,其次valueOf，最后调用toString方法返回结果），在进行比较

```js
var obj = {
  value: 3,
  valueOf() {
    return 4;
  },
  toString() {
    return '5'
  },
  [Symbol.toPrimitive]() {
    return 6
  }
}
console.log(obj + 1); // 输出7

```