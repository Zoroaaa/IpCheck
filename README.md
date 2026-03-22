# 🛡️ CF-Workers-CheckProxy

> **CF-Workers-CheckProxyIP** × **CF-Workers-CheckSocks5** 合并版  
> 基于 Cloudflare Workers 的高性能代理验证服务，不删减任何原有功能。

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🌐 ProxyIP 检测 | 检测能够反向代理 Cloudflare IP 段的服务器（支持 TLS 握手验证，最多重试 4 次） |
| 🔌 SOCKS5 检测 | 检测 SOCKS5 代理连通性，支持用户名/密码认证、Base64 编码凭证 |
| 🌍 HTTP 代理检测 | 检测 HTTP CONNECT 代理连通性，支持 Proxy-Authorization |
| 🔍 域名解析 | 自动解析域名 A/AAAA 记录，并发检测所有 IP |
| 📊 IP 信息查询 | 统一使用 [ipapi.is](https://ipapi.is)，返回 ASN、地理位置、风险评分等完整信息 |
| 🔒 TOKEN 鉴权 | 支持路径 TOKEN 和参数 TOKEN，设置后首页自动伪装为 nginx |
| 📱 响应式界面 | 两个独立工具页面 + 统一导航首页 |

---

## 🚀 部署方式

### Workers 部署
复制 `_worker.js` 及 `src/` 目录内所有文件到 Cloudflare Workers，或使用 Wrangler：

```bash
wrangler deploy
```

### Pages 部署
Fork 后连接 GitHub，一键部署即可（入口文件为 `_worker.js`）。

---

## 📝 页面路由

| 路径 | 说明 |
|------|------|
| `/` | 导航首页（两个工具入口 + API 文档） |
| `/proxyip` | ProxyIP 检测页面 |
| `/proxy` | SOCKS5/HTTP 代理检测页面 |

---

## 📡 API 接口

### 检测 ProxyIP
```bash
GET /check?proxyip=1.2.3.4:443
GET /check?proxyip=[2001:db8::1]:443
GET /check?proxyip=example.com:443
```

**响应示例：**
```json
{
  "success": true,
  "proxyIP": "1.2.3.4",
  "portRemote": 443,
  "colo": "HKG",
  "responseTime": 166,
  "message": "第1次验证有效ProxyIP",
  "timestamp": "2025-06-03T17:27:52.946Z"
}
```

---

### 检测 SOCKS5 / HTTP 代理
```bash
# 方式1：proxy 参数（带协议前缀）
GET /check?proxy=socks5://user:pass@host:1080
GET /check?proxy=http://user:pass@host:8080

# 方式2：简写参数（不带协议前缀）
GET /check?socks5=user:pass@host:1080
GET /check?http=user:pass@host:8080
```

**响应示例：**
```json
{
  "success": true,
  "proxy": "socks5://user:pass@host:1080",
  "ip": "8.8.8.8",
  "loc": "US",
  "responseTime": 1070,
  "is_vpn": true,
  "is_datacenter": true,
  "asn": { "asn": 15169, "org": "Google LLC" },
  "location": { "country_code": "US", "city": "Mountain View" },
  "timestamp": "2025-06-03T17:21:25.045Z"
}
```

---

### 解析域名
```bash
GET /resolve?domain=example.com
```

**响应：**
```json
{
  "success": true,
  "domain": "example.com",
  "ips": ["1.2.3.4", "[2001:db8::1]"]
}
```

---

### 查询 IP 信息
```bash
GET /ip-info?ip=1.2.3.4
```

数据来源：[ipapi.is](https://ipapi.is)，包含 ASN、地理位置、风险评分等完整信息。

---

## 🔧 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `TOKEN` | API 访问令牌。设置后首页变为 nginx 伪装，需通过 `/TOKEN/` 路径或 `?token=TOKEN` 访问 | 否 |
| `URL302` | 302 跳转伪装首页 | 否 |
| `URL` | 反向代理伪装首页 | 否 |
| `ICO` | 网站图标 URL | 否 |
| `IMG` | SOCKS5 页面背景图片 URL（逗号分隔，随机选取） | 否 |
| `BEIAN` | 页脚备案信息（仅 SOCKS5 页面显示） | 否 |

---

## 🔐 TOKEN 访问方式

```bash
# 路径 TOKEN（推荐）
https://your-worker.dev/YOUR_TOKEN/
https://your-worker.dev/YOUR_TOKEN/proxyip
https://your-worker.dev/YOUR_TOKEN/check?proxyip=1.2.3.4

# 参数 TOKEN
https://your-worker.dev/check?proxyip=1.2.3.4&token=YOUR_TOKEN
```

---

## 📁 文件结构

```
CheckProxy/
├── _worker.js          # 主入口 + 路由 + 导航首页
├── wrangler.toml       # Wrangler 配置
├── README.md
└── src/
    ├── auth.js         # TOKEN 验证与双重哈希（共用）
    ├── utils.js        # 公共工具函数（DNS、整理、nginx 等）
    ├── ipInfo.js       # IP 信息查询（统一 ipapi.is）
    ├── checkProxyIP.js # ProxyIP 检测逻辑
    ├── checkProxy.js   # SOCKS5/HTTP 检测逻辑
    ├── pageProxyIP.js  # ProxyIP 前端页面
    └── pageProxy.js    # SOCKS5/HTTP 前端页面
```

---

## ⚠️ 合并说明与优化项

1. **IP 信息 API 统一**：原 ProxyIP 项目使用 `ip-api.com`（HTTP，字段较少），原 Socks5 项目使用 `ipapi.is`（HTTPS，字段更丰富）。合并后统一使用 `ipapi.is`，ProxyIP 页面的 IP 信息展示已同步更新字段。

2. **TOKEN 时间窗口统一**：原 ProxyIP 项目为 31 分钟，原 Socks5 项目为 12 小时。合并后统一使用 31 分钟（更安全）。

3. **整理函数增强**：合并后的 `整理()` 同时支持竖线、换行、制表符、逗号分隔，并自动去重。

4. **SOCKS5 错误处理改善**：原代码在无 ipMatch 时会直接 `.match()[1]` 抛 TypeError，合并版增加了空值检查。

5. **导航首页新增**：原两项目均无统一入口，合并后新增根路径导航页，两个工具均可从首页直达。

---

## 🙏 致谢

- [CF-Workers-CheckProxyIP](https://github.com/cmliu/CF-Workers-CheckProxyIP) by cmliu
- [CF-Workers-CheckSocks5](https://github.com/cmliu/CF-Workers-CheckSocks5) by cmliu
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ipapi.is](https://ipapi.is)
# IpChenck
