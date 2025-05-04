# 2.0.7
* 优化订阅数据展示
* 修复同一up订阅多个群聊订阅，推送类型合并的问题
* 添加白名单关键词过滤功能
* 新增B站视频解析

# 2.0.6
* 优化屏蔽关键词功能
* 新增 weibo User-Agent 配置项
* 优化api请求
* 优化消息发送
* 优化文字动态图片资源的发送
* 依赖升级
* 新增哔哩直播动态@全体成员功能，开启前请检查机器人管理员权限和所在聊天类型是否支持

# 2.0.5
* 优化ck
* 新增 bili User-Agent 配置项
* 优化获取动态数据
* 新增获取B站up数据的随机延迟配置项
* 新增puppeteer渲染图片测试脚本

# 2.0.4
* 增加splitHeight配置项，其他优化
* 优化B站风控相关，新增bili_tiket参数
* fix Repeated Instantiation puppeteer
* 优化获取B站登录ck
* 添加截图列队，优化配置文件注释

# 2.0.3
* 优化截图、静态资源引入方式
* 优化获取完整文章动态
* fix addBiliSub
* 优化提示信息

# 2.0.2
* fix DYNAMIC_TYPE_ARTICLE
* 优化Next npm包插件 Task加载

# 2.0.1
* 规范版本号
* 调整渲染出图类型为webp格式，减小发送图片消息带宽压力

# 2.0.0
* 优化代码，npm 包增加 typescript 类型定义文件
* 统一配置文件目录：yunzai/data/yuki-plugin/config/，更新后如需使用旧配置文件，请自行移动旧配置文件到新目录

# 1.4.0
* 优化哔哩登录日志
* 优化渲染
* 增加哔哩 MAJOR_TYPE_DRAW MAJOR_TYPE_ARTICLE 动态子类型

# 1.3.0
* 修复群组与好友动态推送混淆问题
* 更新获取B站up信息api
* 优化动态字体样式
* 优化文字动态内容排版
* 修复转发动态内容缺失

# 1.2.0
* 新增支持获取完整文章动态内容
* 修复宫格样式

# 1.1.0
* 修复了一些bug
* 优化了一些功能
* 新增 Yunzai-v4.1 npm包方式安装支持，yarn add yz-yuki-plugin -W

# 1.0.0
* 支持Yunzai-V4.1.1 初版
