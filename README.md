<img decoding="async" align=right src="./resources/img/readme/min-Girl.png" width="35%">

# YUKI-PLUGIN

- 一个适用于 `Yunzai 系列机器人框架` 的B站动态和微博动态订阅推送的插件

- 支持 群聊/私聊 订阅B站动态和微博动态，支持定时推送，支持手动触发推送，支持简单查询B站/微博用户信息。

[![访问量](https://profile-counter.glitch.me/yuki-plugin/count.svg)](https://github.com/snowtafir/yuki-plugin)

# 🌰一、安装插件

## 选择安装方式
按照网络情况以及使用的bot框架是`Yunzai-Next`还是`Yunzai-V3`，选择对应的安装方式。

### ***（一）Yunzai-Next***
> 选择其中一种方式安装插件：

1. npm包安装到`yunzai-next/node_modules`的方式，仅Yunzai-Next支持：
```
 yarn add yz-yuki-plugin -W
```

选择启用插件方式：

* 方式1（推荐）：

手动新建 `yunzai-next/yunzai.config.json` 文件，输入如下内容，`applications`字段添加的 `"yz-yuki-plugin"`即为启用本插件：

```json
{
  "applications": ["yz-system", "yz-yuki-plugin"],
  "middlewares": ["yunzai-mys/runtime", "yunzai-mys/mw"]
}
```
* 方式2：

修改 `yunzai-next/yunzai.config.js`：
```js
import { defineConfig } from 'yunzai'
export default defineConfig({
  applications: ['yz-system', 'yz-yuki-plugin'], //该行添加 'yz-yuki-plugin'
  middlewares: ['yunzai-mys/runtime', 'yunzai-mys/message']
})
```

2. 安装到 `yunzai-next/plugins` 的方式：

> 仅支持Yunzai-Next的分支，选择仓库：

gitee仓库：
```shell
git clone --branch main https://gitee.com/snowtafir/yuki-plugin.git ./plugins/yuki-plugin
```

github仓库：
```shell
git clone --branch main https://github.com/snowtafir/yuki-plugin.git ./plugins/yuki-plugin
```

* 依赖安装：
```shell
yarn install
```

### ***（二）Yunzai-V3***

> 仅支持Yunzai-V3（TRSS/Miao）的分支，选择仓库，安装到 `yunzai/plugins`：

gitee仓库：
```
git clone --branch main3 https://gitee.com/snowtafir/yuki-plugin.git ./plugins/yuki-plugin
```

github仓库：
```
git clone --branch main3 https://github.com/snowtafir/yuki-plugin.git ./plugins/yuki-plugin
```

* 安装依赖

```shell
pnpm install --filter=yuki-plugin
```

# 📦二、插件配置

> [!IMPORTANT] 
> 统一的配置文件路径：

`Yunzai/data/yuki-plugin/config/`，启动一次后，即可查看配置文件。

### （一）B站动态功能：
 使用前建议先绑定B站账号或配置cookie，绑定后即可使用相关功能。

> **CK优先级：** **#添加B站CK** ＞ ***#扫码B站登录*** ＞ 自动ck。`只有删除前一个，后一个才生效，删除方法见功能指令。`

#### 1）绑定账号（推荐）：
`#扫码B站登录`，获取B站登录CK。取消使用登录则发送：`#删除B站登录`

#### 2）手动配置本地Cookie（可选）：
 私聊/私信 Bot下发送`#添加B站CK: xxx` 添加本地浏览器 无痕模式下 登录b站 获取的B站cookie。

<details> <summary>本地CK获取方法：</summary>

***注意事项：***
> 你平常使用浏览器访问 b 站为普通模式，cookie会定期自动刷新而导致复制的旧ck一段时间就失效，你应该使用`隐私窗口/无痕式窗口`重新登录b站，并获取新的 cookie。

> 成功复制cookie文本后应该直接点击`X`关闭 **浏览器窗口**，而`不是账号的 退出登录`，否则 cookie 会立马失效。

**步骤：**
* ①在浏览器打开的`无痕/隐私窗口`中登录自己的b站账号
* ②如示例图操作：处于bilibili首页 -> 按 F12 （或者右键 --> 检查）打开开发者工具，切换到网络 ( network )点击 重新载入（或者按 F5，Ctrl + R 等）刷新页面，接着点击某一个请求（通常为 nav ），选中Cookie项的文本并 Ctrl + C 复制（不是 `复制值`）（包含SESSDATA）得到cookie。

![](https://github.com/snowtafir/xianxin-plugin/raw/main/resources/img/REDME/redme00.png)
![](https://github.com/snowtafir/xianxin-plugin/raw/main/resources/img/REDME/redme01.png)

</details>

> [!TIP]
> 保存目录：`Yunzai/data/yuki-plugin/biliCookie.yaml`，如需更换/更新cookie 使用新的cookie发送`#添加B站CK: xxx`覆盖绑定即可。停用手动本地ck则发送命令：`#删除B站ck`

### （二）微博动态功能：
* 获取微博博主uid：

博主主页如：
```
https://m.weibo.cn/u/6593199887 # 6593199887 为原神博主uid
https://m.weibo.cn/u/7643376782 # 7643376782 为崩坏星穹铁道博主uid
```
或打开微博app，进入博主主页，右上角点击分享，复制分享链接，在链接里找到相应uid。

微博限制，可能连续获取动态会出现获取连接中断报错，待定时任务自动重试即可。

# 🌈 三、功能列表

请使用 `#优纪帮助`或 `/yuki帮助` 获取完整帮助

- [x] B站动态
- [x] 微博动态


# 🚀 四、指令列表

<details><summary>指令列表，点击展开</summary>

> [!TIP]
> 指令前缀：`#优纪`、`#yuki`、`/优纪`、`/yuki`，

示例：`#优纪订阅B站推送uid`、`#yuki订阅B站推送uid`、`/优纪订阅B站推送uid`、`/yuki订阅B站推送uid`。

| 用途 | 描述 | 指令 |
| --------- | ----------- | ------------ |
||||
| **B站功能** | ------------------------- | ---------- |
| 添加B站推送 | 检测up的B站动态进行推送，权限：Master。可选分类：直播、视频、图文、文章，不加分类则默认全部 | `#订阅B站推送uid` `#订阅B站推送 图文 uid` |
| 取消B站推送 | 删除对应up的B站对应类型的动态推送，权限：Master，可选分类：直播、视频、图文、文章，不加分类则默认全部 | `#取消B站推送uid` `#取消B站推送 图文 uid` |
| 查看B站订阅列表 | 查看本Bot所有的B站订阅列表，权限：Bot的Master | `#B站全部订阅列表` |
| 查看本群/私聊B站订阅列表 | 查看 本群/私聊 添加的B站订阅列表 | `#B站订阅列表` |
| 手动推送B站订阅 | 手动触发定时推送任务，权限：Bot的Master | `#执行B站任务` |
| 查看up信息 | 通过uid查看up信息 | `#B站up主 uid` |
| 搜索B站up主 | 根据昵称在b站搜索up信息 | `#搜索B站up主 xxx` |
| 扫码B站登录 | app扫码获取登录ck | `#扫码B站登录` |
| 取消B站登录 | 删除扫码获取的B站CK | `#取消B站登陆` |
| 查看B站登录信息 | 查看app扫码登录的信息和状态 | `#我的B站登录` |
| 绑定B站ck | 配置手动本地获取的B站CK，仅限私聊/私信，权限：Master | `#绑定B本地站ck: xxx` |
| 删除B站ck | 删除手动获取的B站cookie，权限：Master | `#删除B站本地ck` |
| 查看B站ck | 查看当前启用的B站ck,仅限私聊 | `#我的B站ck` |
| 刷新B站临时ck | 重新获取并刷新redis缓存的未绑定自己的B站ck而自动获取的 临时B站cookie | `#刷新B站临时ck` |
||||
| **微博功能** | ------------------------- | ---------- |
| 添加微博推送 | 检测博主的微博动态进行推送，权限：Master，可选分类：视频、图文、文章，不加分类则默认全部 | `#订阅微博推送uid` `#订阅微博推送 图文 uid` |
| 取消微博推送 | 删除对应博主的微博对应类型的动态推送，权限：Master，可选分类：视频、图文、文章，不加分类则默认全部 | `#取消微博推送uid` `#取消微博推送 图文 uid` |
| 查看微博订阅列表 | 查看本Bot所有的微博订阅列表，权限：Bot的Master | `#微博全部订阅列表` |
| 查看本群/私聊微博订阅列表 | 查看 本群/私聊 添加的微博订阅列表 | `#微博订阅列表` |
| 手动推送微博订阅 | 手动触发定时推送任务，权限：Bot的Master | `#执行微博任务` |
| 查看博主信息 | 通过uid查看博主信息 | `#微博博主 uid` |
| 搜索微博博主 | 根据关键词在微博搜索大V博主的信息 | `#搜索微博博主 xxx` |
||||
| **其他指令** |  |  |
| 查看版本信息 | 查看版本信息 | `#优纪版本` |
| 更新yuki插件 | 系统指令更新yuki插件，yunzai-next需安装yz-system | `#更新yuki-plugin` |
| 强制更新yuki插件 | 强制更新yuki插件，yunzai-next需安装yz-system| `#强制更新yuki-plugin` |

</details>

<details><summary>样式预览，点击展开</summary>

![](/resources/img/readme/mini-help.jpg)

</details>

# 🧩 五、支持与贡献

如果你喜欢这个项目，请不妨点个 Star🌟，这是对开发者最大的动力，呜咪~❤️

有意见或者建议也欢迎提交 [Issues](https://github.com/snowtafir/yuki-plugin/issues) 和 [Pull requests](https://github.com/snowtafir/yuki-plugin/pulls)。

# 🌟 六、license/声明
- this project is inspired by [trss-xianxin-plugin](https://github.com/snowtafir/xianxin-plugin)
- 基于  `MIT` 协议开源，但有如下额外限制：
1. 其中`resources/img/icon/`目录下的素材来源于网络，不保证商业使用，请遵守相关版权法律，如有侵权请联系本人删除。
2. 其中`resources/img/background/` 以及 `resources/img/readme/`的图片素材仅供学习交流使用，禁止用于任何商业用途。
3. ```严禁用于非法行为```


# 🔗 七、链接/致谢

|                              Nickname                               | Contribution            |
| :-----------------------------------------------------------------: | ----------------------- |
|Yunzai-Next||
| [Yunzai-org文档](https://yunzai-org.github.io/docs/)               | Yunzai Next 文档      |
| [Yunzai-Next 仓库](https://github.com/yunzai-org/yunzaijs/)           |  Yunzai Next       |
|Yunzai-V3||
| [功能/插件库](https://gitee.com/yhArcadia/Yunzai-Bot-plugins-index) | Yunzai-Bot 相关内容索引 |
|       [TRSS-Yunzai](https://gitee.com/TimeRainStarSky/Yunzai)       | 时雨🌌星空的 TRSS-Yunzai |
|     [Miao-Yunzai](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)     | 喵喵的 Miao-Yunzai      |
|         [Yunzai-Bot](https://gitee.com/Le-niao/Yunzai-Bot)          | 乐神的 Yunzai-Bot       |
