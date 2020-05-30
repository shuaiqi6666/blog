// dcos/.vuepress/config.js
module.exports = {
    title: "熊猫大大",   // HTML的title
    description: "熊猫大大的前端博客",   // 描述
    keywords: "",  // 关键字
    head: [   // 配置头部
        [
            ['link', { rel: 'icon', href: "/logo.png" }],
            ['meta', { 'name': 'viewport', content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;" }]
        ]
    ],
    markdown: {
        lineNumbers: true,  // 代码显示行号
    },
    search: true,//搜索
    searchMaxSuggestions: 10,
    dest: "dist",    // 设置打包路径 
    lastUpdated: true, // 最后更新时间
    themeConfig: {
        lastUpdated: "更新时间",    // 显示更新时间
        logo: "/logo.png",   // 导航栏左边logo,不写就不显示
        sidebarDepth: 2, // 侧边栏显示2级
        nav: require('./nav'),   // 引入导航栏
        sidebar: require('./sidebar'),  // 引入侧边栏

    }, 
    plugins: [
        '@vuepress/active-header-links', 
        '@vuepress/back-to-top',
        '@vuepress/nprogress'
    ]
} 
