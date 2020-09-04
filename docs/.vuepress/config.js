module.exports = {
    title: 'seven',
    description: '个人技术分享',
    base: '/',
    head: [
        ['link', { rel: 'icon', href: '/img/logo.png' }],
        ['meta', { 'name': 'viewport', content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0;" }]
    ],
    markdown: {
        lineNumbers: true,  // 代码显示行号
    },
    search: true,//搜索
    searchMaxSuggestions: 10,
    lastUpdated: true, // 最后更新时间
    dest: 'dist',
    themeConfig: {
        lastUpdated: "更新时间",    // 显示更新时间
        logo: "/img/logo.png",   // 导航栏左边logo,不写就不显示
        sidebarDepth: 2, // 侧边栏显示2级
        nav: [
            { text: "JavaScript", link: "/javascript/" },
            { text: "Vue", link: "/vue/" },
            { text: "Node", link: "/node/" },
            { text: "Http", link: "/http/" },
            { text: "WebPack", link: "/webpack/" },
            { text: "算法", link: "/algorithm/" },
            { text: "关于作者", link: "/about" },
            { text: "GitHub", link: "https://github.com/shuaiqi6666" }
        ],
    },
    plugins: [
        '@vuepress/active-header-links',
        '@vuepress/back-to-top'
    ]

}