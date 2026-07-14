# hexo-bb-channel

[English](./README.md) | 简体中文

> 将公开 Telegram Channel 渲染成 Hexo 博客里的动态碎片流页面。

[![Hexo](https://img.shields.io/badge/Hexo-%3E%3D6-0e83cd?style=flat-square&logo=hexo)](https://hexo.io/)
[![Telegram](https://img.shields.io/badge/Telegram-channel-26a5e4?style=flat-square&logo=telegram)](https://telegram.org/)
[![在线示例](https://img.shields.io/badge/demo-kaaaaai.cn%2Fbb-ff7900?style=flat-square)](https://www.kaaaaai.cn/bb/)
[![License](https://img.shields.io/badge/license-MIT-black?style=flat-square)](./LICENSE)

`hexo-bb-channel` 是一个轻量 Hexo 插件：它只生成 `/bb/` 页面壳，内容在浏览器端从独立 API 拉取。这样博客仍然是静态站，但 Telegram Channel 更新后不需要重新 `hexo generate`。

在线示例：[https://www.kaaaaai.cn/bb/](https://www.kaaaaai.cn/bb/)

## 为什么这样设计

- **主题无关**：通过 Hexo generator 输出页面，NexT、Wizarding 以及大部分主题都可以接入。
- **静态博客里的动态内容**：页面访问时从 API 拉取 Telegram 内容。
- **博客侧不放 Telegram 凭证**：Hexo 只需要配置一个 API 地址。
- **适合碎片流展示**：支持正文、Telegram 原生 hashtag entity、图片、文件、分页、图片预览交互。
- **保留评论能力**：生成的是标准 Hexo page，默认开启 `comments: true`。

## 快速开始

### 1. 先部署 API

先创建一个公开 Telegram Channel。公开链接应该类似 `https://t.me/my_notes`，API 里的 `TG_CHANNEL` 只填写 `my_notes`，不要带 `@`。

先部署配套 API：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKaaaaai%2Fkaaaaai.tools.channel-api&project-name=kaaaaai-tools-channel-api&repository-name=kaaaaai.tools.channel-api&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Atrue%7D%5D&env=TG_CHANNEL,ALLOWED_ORIGINS,REFRESH_SECRET&CACHE_TTL=300&PAGE_SIZE=20&MAX_FETCH_PAGES=2&POST_LIMIT=500)

后端仓库：[Kaaaaai/kaaaaai.tools.channel-api](https://github.com/Kaaaaai/kaaaaai.tools.channel-api)
详细的 Telegram 频道创建步骤见 API 仓库 README。

### 2. 安装 Hexo 插件

```bash
npm install hexo-bb-channel
```

如果 npm 包暂未发布，可以直接从 GitHub 安装：

```bash
npm install github:Kaaaaai/kaaaaai.tools.hexo-bb-channel
```

### 3. 配置 Hexo

在 Hexo 主目录的 `_config.yml` 增加：

```yml
bb_channel:
  enable: true
  mode: client
  route: bb/
  title: 闲言碎语
  description: 这些片段可能来自于大脑皮层短暂兴奋后的捕捉 🤏
  api_base: https://your-channel-api.vercel.app
  page_size: 20
```

然后重新生成：

```bash
hexo clean
hexo generate
hexo server
```

打开：

```text
http://localhost:4000/bb/
```

## 配置项

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `enable` | `true` | 是否启用页面。 |
| `mode` | `client` | 当前支持客户端动态渲染。 |
| `route` | `bb/` | 页面路由，例如 `moments/`。 |
| `title` | `moments` | 页面内容区标题。 |
| `description` | 空 | 页面描述。 |
| `api_base` | 空 | `kaaaaai.tools.channel-api` 的 API 根地址。 |
| `page_size` | `20` | 每页拉取数量。 |

## 工作原理

```text
Hexo build
  └─ hexo-bb-channel 生成 /bb/index.html

Browser
  └─ 请求 api_base/api/posts?page=1&page_size=20

kaaaaai.tools.channel-api
  ├─ 抓取公开 Telegram Channel 页面
  ├─ 解析消息、标签、图片、文件
  └─ 将标准化数据缓存到 Upstash Redis
```

Hexo 构建阶段**不会**抓取 Telegram，只生成页面壳。实际内容在访问页面时由 API 返回。

## 主题接入说明

插件通过 Hexo generator 输出页面，理论上不需要修改主题模板。已在以下场景使用：

- NexT theme
- Wizarding theme
- 任何能渲染标准 Hexo `page` layout 的主题

如果你的 `source/` 或主题里已经存在 `/bb/` 页面，请删除旧页面，或修改 `bb_channel.route` 避免重复输出。

## 页面能力

- 客户端分页
- 每条消息保留 Telegram 原文链接
- 基于 Telegram 原生 entity 提取 hashtag，而不是宽松正则匹配
- 图片缩略图和点击展开预览
- 多图横向轮播
- 文件附件卡片
- 兼容 Hexo 图片懒加载插件的图片延迟注入

## API 返回结构

插件期望 API 返回：

```http
GET /api/posts?page=1&page_size=20
```

```json
{
  "channel": {
    "title": "Channel title",
    "description": "Channel description"
  },
  "posts": [
    {
      "id": "101",
      "datetime": "2026-01-01T12:00:00.000Z",
      "html": "<p>Hello</p>",
      "tags": ["Tools"],
      "media": [{ "type": "image", "src": "https://..." }],
      "attachments": [{ "title": "file.dmg", "meta": "351.5 MB", "url": "https://..." }],
      "source": { "telegramUrl": "https://t.me/channel/101" }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 3,
    "totalItems": 60,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## FAQ

### Telegram 更新后需要重新构建博客吗？

不需要。页面壳是静态的，但内容由 API 动态返回。

### 支持私有 Telegram Channel 吗？

不支持。当前方案面向 `t.me/s/<channel>` 可访问的公开频道。

### 为什么需要独立 API？

静态站不适合保存刷新密钥或 Redis 凭证。独立 API 可以把抓取、缓存、CORS、刷新逻辑从博客里隔离出来。

### 可以用于非 Hexo 博客吗？

当前前端封装为 Hexo 插件；后端 API 是通用 JSON 服务，其他静态站也可以消费同一份数据。

## 开发

```bash
npm install
npm test
```

## 相关项目

- API 后端：[Kaaaaai/kaaaaai.tools.channel-api](https://github.com/Kaaaaai/kaaaaai.tools.channel-api)
- 在线示例：[https://www.kaaaaai.cn/bb/](https://www.kaaaaai.cn/bb/)

## License

MIT
