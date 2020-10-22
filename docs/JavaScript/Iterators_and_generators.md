# 迭代器与生成器

生成器函数不遵守`运行到完成`模型，这是否意味着我们可以在某个生成器函数时将其暂停呢？ 嗯， 差不多吧！

调用生成器函数会返回一个生成器对象，这个对象是一个迭代器。
我们可以在生成器函数中使用yield关键词来暂停执行。

Iterator（遍历器）  主要时 数组 Array， 对象 Object ， Map Set 四种数据集合。

Iteerator接口的目的，就是为所有的数据结构，提供一种统一的访问机制，即 for-of。当使用for-of循环遍历某种数据结构时，该循环会自动去寻找Iterator接口。

一旦数据结构只要部署了 Iterator 接口， 我们就称这种数据结构是 可遍历的（iterable）；

默认的 Iterator 接口部署在数据结构的Symbol.

Symbol.iterator属性本身是一个函数，就是当前数据结构默认的遍历器生成函数。执行这个函数，就会返回一个遍历器

原生具备 Iterator 接口的数据结构如下。
    Array
    Map
    Set
    String
    TypedArray
    函数的 arguments 对象
    NodeList 对象