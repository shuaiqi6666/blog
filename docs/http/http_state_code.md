# HTTP 状态码

HTTP状态码负责表示客户端HTTP请求的返回结果。标记服务器端的处理是否正常、通知出现错误等工作。

## 状态码的类别

| 状态码     |类别                           | 原因短语   |
| ---------------------------- |:-------------:| -----:|
| 1xx       | Informational（信息性状态码）   | 接收的请求正在处理       |
| 2xx       | Success（成功状态码）           | 请求正常处理完毕         |
| 3xx       | Redirection（重定向状态码）     | 需要进行附加操作以完成请求 |
| 4xx       | Client Error（客户端错误状态码） | 服务器无法处理请求       |
| 5xx       |  Server Error（服务端错误状态码）| 服务器处理请求出错       |


## 所有状态码

仅记录在REF2616上的HTTP状态码就达40种，若再加上WebDAV和附加HTTP状态码等扩展，数量就达到60多种。别看种类繁多，实际上经常使用的大概只有14种。

|状态码          |    官方含义        | 个人解释               |  是否常用   |
| ----------------------------  |:-------------:|:-------------:| -----:|
| 200           | ok            | 表示客户端发送的请求被正常处理并完成了。    |  :white_check_mark: |
| 201           | created       | 成功请求并创建了新的资源                 ||
| 202           | accepted      | 已经接受请求，但是未处理完成   ||
| 203           | Non-Authoritative Information |||
| 204           | no centent | 请求已成功处理，但是没有内容返回| :white_check_mark: |
| 205           | Reset Content | 服务器成功处理请求，但没有内容返回。与204不同的是：205会要求请求者重置文档视图。该相应主要是用于接受用户输入后，立即重置表单，以便用户能够轻松的开始另一次输入 ||
| 206           | partial centent | 服务器成功处理了部分请求| :white_check_mark: |
| 301           | Moved Permanently | 永久重定向。请求的资源被永久的移动到新的URL。 | :white_check_mark: |
| 302           | found | 临时重定向，访问资源的URL不变，但资源被临时移动 | :white_check_mark: |
| 303           | |||
| 304           | not modified | 未修改文件。用于服务协商缓存验证，资源未修改则返回304，已修改则返回200并携带最新的资源文件 | :white_check_mark: |
| 305           | Use Proxy | 被请求的资源只能通过制定的代理才能访问 ||
| 306           | Switch Proxy | 已被停用 :x: | :x: |
| 307           | Temporary Redirect | 请求的资源临时从不同的URL进行相应。新的临时性URL会在相应的Location中返回。||
| 400           | bad request | 客户端请求报文中存在语法错误 ||
| 401           | Unauthorized | 身份认证失败（比如：提交代码时需要输入账号和密码，输入错误返回401）| :white_check_mark: |
| 402           ||||
| 403           | Forbidden | 请求的资源被服务端拒绝了，没有权限访问 | |
| 404           | Not Found	| 服务端找不到客户端请求的资源 | :white_check_mark: |
| 405           | Method Not Allowed | 客户端请求中的方法被禁止 ||
| 406           ||||
| 407           ||||
| 408           | request timeout | 服务器等待客户端发送的请求时间过长，超时 ||
| 409           ||||
| 410           ||||
| 411           ||||
| 412           ||||
| 413           ||||
| 414           ||||
| 415           ||||
| 416           ||||
| 417           ||||
| 500           | internal server error | 服务器在执行请求时发生了错误。也可以是web存在的bug或某些临时的故障| :white_check_mark: |
| 501           | Not Implemented |服务器不支持请求的功能，无法完成请求 ||
| 502           | Bad Gateway | 错误的网关：作为网关或者代理工作的服务器尝试执行请求时，从上游服务区接受到无效的响应||
| 503           | server unavailable | 服务在处于超负荷或者停机维护，暂时无法处理客户端请求 ||
| 504           | Gateway Timeout | 网关超时 ||
| 505           | HTTP version not  supproted | 服务器不支持请求的http版本，无法处理请求 ||