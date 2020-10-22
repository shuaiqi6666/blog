# TS

## 基础类型

```ts
let isDone: boolean = false;

// 可以是二、八、十、十六进制
let decLiteral: number = 6;

// 单引号、双引号、模版字符串都可以
let name: string = "bob";

// 数组
let list: number[] = [1, 2, 3];
let list: Array<number> = [1, 2, 3];

// 元组
let x: [string, number];
x = ['hello', 10]; // OK
x = [10, 'hello']; // Error
x[3] = 'world'; // OK, 字符串可以赋值给(string | number)类型

// 枚举
// 默认情况下，从0开始为元素编号。 你也可以手动的指定成员的数值
enum Color {Red, Green, Blue}
let c: Color = Color.Green;  

// any 
// 可以是任何数据类型
let notSure: any = 4;
notSure = "maybe a string instead";
notSure = false;

// viod
// 没有数据类型，当一个函数没有返回值时，会见到返回类型时void

// undefined \ null

// never
// 代表那些永远不存在的值的类型

// object

// 类型断言
// 有时候你会比ts更了解某个值的详细信息
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;
// 等价
let someValue: any = "this is a string";
let strLength: number = (someValue as string).length;
```

## 接口

核心之一： 对值所具有的结构进行类型检查。就是为这些类型命名和为你的代码或第三方代码定义契约

```ts
interface Label {
    label: string;
    color?: string; // 可选属性
    readonly x: number; // 只读属性
}
// Label就好比一个名字，用于描述上面例子里的要求

//TypeScript具有ReadonlyArray<T>类型，它与Array<T>相似，只是把所有可变方法去掉了
let ro: ReadonlyArray<number> = a;
// 可以使用类型断言进行重写
a = ro as number[];

// 额外的属性检查
// 1. 类型断言 2. 接口中定义[propName: string]: any; 3. 将对象赋值给另一个变量（因为不会经过额外属性检查）

// 函数类型

interface SearchFunc {
  (source: string, subString: string): boolean;  // 括号中是参数， 后面的是返回值类型
}
```

## 类

```ts

```

## 函数

```ts

``` 