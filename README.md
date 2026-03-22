<div align="center">

# 🛡️ CF-Workers-CheckProxy

**高性能代理验证服务** | 基于 Cloudflare Workers 边缘计算平台

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![IP API](https://img.shields.io/badge/IP%20API-ipapi.is-green?style=for-the-badge)](https://ipapi.is)

**CF-Workers-CheckProxyIP** × **CF-Workers-CheckSocks5** 合并版  
不删减任何原有功能，统一入口，双重能力

[🚀 快速部署](#-快速部署) · [📖 API 文档](#-api-文档) · [🔧 环境变量](#-环境变量) · [❓ 常见问题](#-常见问题)

</div>

---

## ✨ 功能特性

| 功能 | 说明 |
|:-----|:-----|
| 🌐 **ProxyIP 检测** | 检测能够反向代理 Cloudflare IP 段的服务器，支持 TLS 握手验证，最多重试 4 次 |
| 🔌 **SOCKS5 检测** | 检测 SOCKS5 代理连通性，支持用户名/密码认证、Base64 编码凭证 |
| 🌍 **HTTP 代理检测** | 检测 HTTP CONNECT 代理连通性，支持 Proxy-Authorization 认证 |
| 🔍 **域名解析** | 自动解析域名 A/AAAA 记录，并发检测所有 IP，支持一键切换 |
| 📊 **IP 信息查询** | 统一使用 [ipapi.is](https://ipapi.is)，返回 ASN、地理位置、风险评分等完整信息 |
| 🔒 **TOKEN 鉴权** | 支持路径 TOKEN 和参数 TOKEN，设置后首页自动伪装为 nginx |
| 🛡️ **频率限制** | 内置请求频率限制机制，防止滥用（已验证 TOKEN 用户不受限制） |
| 📱 **响应式界面** | 两个独立工具页面 + 统一导航首页，完美适配移动端 |

---

## 🎯 在线演示

| 页面 | 说明 |
|:-----|:-----|
| `/` | 导航首页（两个工具入口 + API 文档） |
| `/proxyip` | ProxyIP 检测页面 |
| `/proxy` | SOCKS5/HTTP 代理检测页面 |

---

## 🚀 快速部署

### 方式一：Workers 部署

1. 复制 `_worker.js` 及 `src/` 目录内所有文件到 Cloudflare Workers
2. 或使用 Wrangler CLI：

```bash
# 克隆仓库
git clone https://github.com/your-repo/CF-Workers-CheckProxy.git
cd CF-Workers-CheckProxy

# 安装依赖（可选）
npm install -g wrangler

# 登录并部署
wrangler login
wrangler deploy
```

### 方式二：Pages 部署

1. Fork 本仓库
2. 在 Cloudflare Dashboard 中连接 GitHub
3. 选择仓库并部署（入口文件自动识别为 `_worker.js`）

---

## 📖 API 文档

### 1️⃣ 检测 ProxyIP

检测能够反向代理 Cloudflare IP 段的第三方服务器。

**请求**

```http
GET /check?proxyip={IP_OR_DOMAIN}[:PORT]
```

**参数说明**

| 参数 | 类型 | 必填 | 说明 |
|:-----|:-----|:-----|:-----|
| `proxyip` | string | 是 | ProxyIP 地址，支持多种格式 |

**支持的输入格式**

```
# IPv4 地址
1.2.3.4

# IPv4 地址 + 端口
1.2.3.4:443

# IPv6 地址
[2001:db8::1]

# IPv6 地址 + 端口
[2001:db8::1]:443

# 域名（自动解析）
example.com

# 域名 + 端口
example.com:443

# 特殊格式（.tp端口号）
example.com.tp443.com
```

**响应示例（成功）**

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

**响应示例（失败）**

```json
{
  "success": false,
  "proxyIP": -1,
  "portRemote": -1,
  "colo": "CF",
  "responseTime": -1,
  "message": "无法通过ProxyIP访问Cloudflare",
  "timestamp": "2025-06-03T17:27:52.946Z"
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `success` | boolean | ProxyIP 是否有效 |
| `proxyIP` | string | 检测的 IP 地址 |
| `portRemote` | number | 端口号 |
| `colo` | string | Cloudflare 机房代码 |
| `responseTime` | number | 响应时间（毫秒），失败时为 -1 |
| `message` | string | 检测结果描述 |
| `timestamp` | string | 检测时间（ISO 8601） |

---

### 2️⃣ 检测 SOCKS5 / HTTP 代理

检测 SOCKS5 或 HTTP 代理的连通性，获取出入口 IP 信息。

**请求**

```http
# 方式1：proxy 参数（带协议前缀）
GET /check?proxy=socks5://[username:password@]host:port
GET /check?proxy=http://[username:password@]host:port

# 方式2：简写参数（不带协议前缀）
GET /check?socks5=[username:password@]host:port
GET /check?http=[username:password@]host:port
```

**支持的代理格式**

```
# SOCKS5 代理（有认证）
socks5://username:password@host:1080

# SOCKS5 代理（无认证）
socks5://host:1080

# HTTP 代理（有认证）
http://username:password@host:8080

# HTTP 代理（无认证）
http://host:8080

# IPv6 地址需要用方括号括起来
socks5://username:password@[2001:db8::1]:1080
```

**响应示例**

```json
{
  "success": true,
  "proxy": "socks5://user:pass@1.2.3.4:1080",
  "ip": "8.8.8.8",
  "loc": "US",
  "responseTime": 1070,
  "is_datacenter": true,
  "is_vpn": true,
  "is_proxy": false,
  "is_tor": false,
  "is_crawler": false,
  "is_abuser": false,
  "is_bogon": false,
  "asn": {
    "asn": 15169,
    "org": "Google LLC",
    "type": "hosting"
  },
  "company": {
    "type": "hosting",
    "abuser_score": 0.01
  },
  "location": {
    "country_code": "US",
    "city": "Mountain View"
  },
  "timestamp": "2025-06-03T17:21:25.045Z"
}
```

**响应字段说明**

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `success` | boolean | 代理是否可用 |
| `proxy` | string | 检测的代理地址 |
| `ip` | string | 出口 IP 地址 |
| `loc` | string | 位置代码 |
| `responseTime` | number | 响应时间（毫秒） |
| `is_datacenter` | boolean | 是否为数据中心 IP |
| `is_vpn` | boolean | 是否为 VPN 服务器 |
| `is_proxy` | boolean | 是否为代理服务器 |
| `is_tor` | boolean | 是否为 Tor 出口节点 |
| `is_crawler` | boolean | 是否为网络爬虫 |
| `is_abuser` | boolean | 是否有滥用行为记录 |
| `is_bogon` | boolean | 是否为虚假/保留 IP |
| `asn` | object | ASN 信息 |
| `company` | object | 公司信息 |
| `location` | object | 地理位置信息 |

---

### 3️⃣ 解析域名

解析域名返回所有 A 记录和 AAAA 记录。

**请求**

```http
GET /resolve?domain=example.com
```

**响应示例**

```json
{
  "success": true,
  "domain": "example.com",
  "ips": ["1.2.3.4", "[2001:db8::1]"]
}
```

---

### 4️⃣ 查询 IP 信息

查询 IP 地址的详细信息，数据来源 [ipapi.is](https://ipapi.is)。

**请求**

```http
GET /ip-info?ip=1.2.3.4
```

**响应示例**

```json
{
  "ip": "8.8.8.8",
  "location": {
    "country_code": "US",
    "city": "Mountain View"
  },
  "asn": {
    "asn": 15169,
    "org": "Google LLC",
    "type": "hosting"
  },
  "company": {
    "type": "hosting",
    "abuser_score": 0.01
  },
  "is_datacenter": true,
  "is_vpn": false,
  "is_proxy": false,
  "is_tor": false,
  "is_crawler": false,
  "is_abuser": false,
  "is_bogon": false,
  "timestamp": "2025-06-03T17:21:25.045Z"
}
```

**字段说明**

| 字段路径 | 说明 |
|:---------|:-----|
| `location.country_code` | 国家代码（ISO 3166-1） |
| `location.city` | 城市名称 |
| `asn.asn` | 自治系统编号 |
| `asn.org` | 所属组织/ISP |
| `asn.type` | ASN 类型（isp/hosting/business） |
| `company.type` | IP 类型（isp/hosting/business） |
| `company.abuser_score` | 滥用风险评分（0-1） |

---

## 🔧 环境变量

| 变量名 | 说明 | 必需 | 默认值 |
|:-------|:-----|:-----|:-------|
| `TOKEN` | API 访问令牌。设置后首页变为 nginx 伪装，需通过 `/TOKEN/` 路径或 `?token=TOKEN` 访问 | 否 | - |
| `URL302` | 302 跳转伪装首页（支持多个 URL，逗号/换行/竖线分隔，随机选取） | 否 | - |
| `URL` | 反向代理伪装首页 | 否 | - |
| `ICO` | 网站图标 URL | 否 | Cloudflare 默认图标 |
| `IMG` | SOCKS5 页面背景图片 URL（逗号分隔，随机选取） | 否 | - |
| `BEIAN` | 页脚备案信息（仅 SOCKS5 页面显示） | 否 | - |
| `RATE_LIMIT` | 请求频率限制（每分钟最大请求数） | 否 | 60 |

---

## 🔐 TOKEN 访问方式

设置 `TOKEN` 环境变量后，需要通过以下方式访问：

### 路径 TOKEN（推荐）

```
https://your-worker.dev/YOUR_TOKEN/
https://your-worker.dev/YOUR_TOKEN/proxyip
https://your-worker.dev/YOUR_TOKEN/check?proxyip=1.2.3.4
```

### 参数 TOKEN

```
https://your-worker.dev/check?proxyip=1.2.3.4&token=YOUR_TOKEN
https://your-worker.dev/check?proxy=socks5://...&token=YOUR_TOKEN
```

### TOKEN 特性

- **临时 TOKEN**：基于 SHA-256 双重哈希生成，31 分钟有效期
- **永久 TOKEN**：通过环境变量 `TOKEN` 设置，永不过期
- **频率限制豁免**：已验证 TOKEN 的用户不受请求频率限制

---

## 🏗️ 技术架构

### 请求流程

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│   Client    │────>│           Cloudflare Workers             │
└─────────────┘     │                                          │
                    │  ┌─────────────┐    ┌─────────────────┐  │
                    │  │   auth.js   │───>│  TOKEN 验证     │  │
                    │  └─────────────┘    └─────────────────┘  │
                    │                                          │
                    │  ┌─────────────┐    ┌─────────────────┐  │
                    │  │ _worker.js  │───>│   路由分发      │  │
                    │  └─────────────┘    └─────────────────┘  │
                    │         │                               │
                    │         v                               │
                    │  ┌─────────────────────────────────────┐│
                    │  │  checkProxyIP.js  │  checkProxy.js  ││
                    │  │   (ProxyIP检测)   │  (代理检测)     ││
                    │  └─────────────────────────────────────┘│
                    │         │                               │
                    │         v                               │
                    │  ┌─────────────────────────────────────┐│
                    │  │  ipInfo.js  │  utils.js (DNS解析)   ││
                    │  │  (IP信息)   │  (公共工具)           ││
                    │  └─────────────────────────────────────┘│
                    └──────────────────────────────────────────┘
                              │
                              v
                    ┌──────────────────────────────────────────┐
                    │              外部服务                     │
                    │  • ipapi.is (IP 信息查询)                │
                    │  • cloudflare-dns.com (DNS 解析)         │
                    │  • speed.cloudflare.com (HTTP Trace)     │
                    └──────────────────────────────────────────┘
```

### ProxyIP 检测原理

```
┌──────────┐    Step 1: HTTP Trace     ┌──────────────┐
│  Worker  │ ────────────────────────> │   ProxyIP    │
│          │   GET /cdn-cgi/trace       │  (待测IP)    │
│          │   Host: speed.cloudflare   │              │
│          │ <────────────────────────  │              │
│          │   CF 400 Bad Request       └──────────────┘
└──────────┘
     │
     │ 验证通过：ProxyIP 能代理到 Cloudflare
     v
┌──────────┐    Step 2: TLS 握手       ┌──────────────┐
│  Worker  │ ────────────────────────> │   ProxyIP    │
│          │   TLS Client Hello        │              │
│          │   SNI: chatgpt.com        │              │
│          │ <────────────────────────  │              │
│          │   TLS Server Hello        └──────────────┘
└──────────┘
     │
     v
验证通过：ProxyIP 的 443 端口支持 TLS 代理
```

---

## 📁 文件结构

```
CF-Workers-CheckProxy/
├── _worker.js              # 主入口 + 路由 + 导航首页
├── wrangler.toml           # Wrangler 配置
├── README.md
└── src/
    ├── auth.js             # TOKEN 验证与双重 SHA-256 哈希
    ├── utils.js            # 公共工具（DNS 解析、nginx 伪装等）
    ├── ipInfo.js           # IP 信息查询（统一 ipapi.is）
    ├── checkProxyIP.js     # ProxyIP 检测逻辑
    ├── checkProxy.js       # SOCKS5/HTTP 检测逻辑
    ├── pageProxyIP.js      # ProxyIP 前端页面
    └── pageProxy.js        # SOCKS5/HTTP 前端页面
```

---

## ❓ 常见问题

### Q: ProxyIP 是什么？

**ProxyIP** 特指那些能够成功代理连接到 Cloudflare 服务的第三方 IP 地址。根据 [Cloudflare Workers TCP Sockets 官方文档](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)，Cloudflare Workers 无法直接连接到 Cloudflare 自有 IP 段，需借助第三方服务器作为跳板。

### Q: 入口信息 vs 出口信息？

- **入口信息**：代理服务器本身的 IP 地址信息（地理位置、ASN、风险评分等）
- **出口信息**：通过代理后实际出口的 IP 地址信息，代表你的真实网络身份

### Q: 为什么有些 IP 显示"未知"？

`ipapi.is` 可能没有某些 IP 的完整 ASN 组织信息，此时系统会尝试从 `company.name` 或 ASN 编号获取信息。

### Q: 响应时间代表什么？

响应时间并非您当前网络到 ProxyIP 的实际延迟，而是 **Cloudflare 机房** 到 ProxyIP 的响应时间。

### Q: 如何自定义 TLS SNI 目标？

当前 TLS 握手使用硬编码报文（SNI: `chatgpt.com`）。如需更换目标域名，需重新生成 TLS Client Hello 报文。

---

## 📊 第三方服务

| 服务 | 用途 | 说明 |
|:-----|:-----|:-----|
| [ipapi.is](https://ipapi.is) | IP 信息查询 | 免费额度 1000次/月，数据质量高 |
| [Cloudflare DNS](https://cloudflare-dns.com) | DNS over HTTPS | 全球最快，隐私保护好 |
| [speed.cloudflare.com](https://speed.cloudflare.com) | HTTP Trace 目标 | Cloudflare 官方测速端点 |

---

## 🔄 合并说明与优化项

1. **IP 信息 API 统一**：原 ProxyIP 项目使用 `ip-api.com`（HTTP，字段较少），原 Socks5 项目使用 `ipapi.is`（HTTPS，字段更丰富）。合并后统一使用 `ipapi.is`。

2. **TOKEN 时间窗口统一**：原 ProxyIP 项目为 31 分钟，原 Socks5 项目为 12 小时。合并后统一使用 31 分钟（更安全）。

3. **整理函数增强**：合并后的 `整理()` 同时支持竖线、换行、制表符、逗号分隔，并自动去重。

4. **SOCKS5 错误处理改善**：原代码在无 ipMatch 时会直接抛 TypeError，合并版增加了空值检查。

5. **导航首页新增**：原两项目均无统一入口，合并后新增根路径导航页。

6. **请求频率限制**：新增频率限制机制，防止 API 滥用。

---

## 🙏 致谢

- [CF-Workers-CheckProxyIP](https://github.com/cmliu/CF-Workers-CheckProxyIP) by [@cmliu](https://github.com/cmliu)
- [CF-Workers-CheckSocks5](https://github.com/cmliu/CF-Workers-CheckSocks5) by [@cmliu](https://github.com/cmliu)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ipapi.is](https://ipapi.is)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star ⭐**

[![Star History Chart](https://api.star-history.com/svg?repos=your-repo/CF-Workers-CheckProxy&type=Date)](https://star-history.com/#your-repo/CF-Workers-CheckProxy&Date)

**Made with ❤️ by Community**

</div>
