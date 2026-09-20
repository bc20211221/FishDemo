# 农场钓鱼限时活动 · 原型 Demo

王者荣耀农场钓鱼玩法原型（纯静态页面：HTML + JS + CSS）。

## 在线访问

- 线上地址：

> 如遇 CDN 缓存未刷新，可在链接后加随机参数访问，例如 `?v=20260611`。

## 本地运行

```bash
node server.js   # 本地起静态服务（仅开发用，无需上线）
```

或直接用浏览器打开 `index.html`。

## 文件说明

| 文件 | 说明 |
|---|---|
| `index.html` | 入口页 |
| `app.js`     | 玩法主逻辑（QTE：抛竿/缩圈/滑条等方案） |
| `data.js`    | 鱼类/配置数据 |
| `style.css`  | 样式 |
| `server.js`  | 本地静态服务（**不参与线上部署**） |

## 部署信息（腾讯云 CloudBase）

- 部署方式：CloudBase **静态网站托管**
- 环境 ID：`codebuddy-d2g5hlh0n3c05d405`
- 区域：`ap-shanghai`
- 已上传文件：`index.html`、`app.js`、`data.js`、`style.css`
- 控制台（静态托管）：

### 更新部署

修改文件后，重新上传以上 4 个静态文件到静态托管根目录即可（无需后端 / 云函数）。
