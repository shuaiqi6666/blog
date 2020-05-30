#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
yarn build


# 进入生成的文件夹
cd dist

# 如果是发布到自定义域名
echo 'www.shangbancw.com' > CNAME

# 初始化仓库
git init
# 添加
git add -A
# 提交
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io
# git push -f git@github.com:shuaiqi6666/shuaiqi6666.github.io.git master

# 如果发布到 https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:shuaiqi6666/blog.git master:gh-pages

cd -