// ============================================================
//  _worker.js — 合并入口
//
//  整合了两个项目：
//    - CF-Workers-CheckProxyIP  （检测 CF 反代 ProxyIP）
//    - CF-Workers-CheckSocks5   （检测 SOCKS5 / HTTP 代理）
//
//  路由规则：
//    GET /                    → 显示两个工具的导航主页
//    GET /proxyip             → ProxyIP 检测页面
//    GET /proxy               → SOCKS5/HTTP 检测页面
//    GET /check?proxyip=...   → ProxyIP 检测 API
//    GET /check?proxy=...     → SOCKS5/HTTP 检测 API
//    GET /check?socks5=...    → SOCKS5 检测 API
//    GET /check?http=...      → HTTP 检测 API
//    GET /resolve?domain=...  → 域名解析 API
//    GET /ip-info?ip=...      → IP 信息查询 API（统一使用 ipapi.is）
//
//  环境变量（全部可选）：
//    TOKEN   — API 访问令牌（设置后首页变 nginx 伪装）
//    URL302  — 302 跳转伪装首页
//    URL     — 反向代理伪装首页
//    ICO     — 网站图标 URL
//    IMG     — 背景图片 URL（逗号分隔，仅 Socks5 页面生效）
//    BEIAN   — 页脚备案信息
//    RATE_LIMIT — 请求频率限制（每分钟最大请求数，默认 60）
//
//  修复：添加请求频率限制机制
// ============================================================

import { initTokens, parsePathToken, validateQueryToken, forbidden } from './src/auth.js';
import { 整理, 随机取, nginx, 代理URL, resolveDomain, jsonResp } from './src/utils.js';
import { handleIpInfo } from './src/ipInfo.js';
import { handleCheckProxyIP } from './src/checkProxyIP.js';
import { handleCheckProxy } from './src/checkProxy.js';
import { renderProxyIPPage } from './src/pageProxyIP.js';
import { renderProxyPage } from './src/pageProxy.js';

// ---------- 请求频率限制配置 ----------
const RATE_LIMIT_DEFAULT = 60;           // 默认每分钟最大请求数
const RATE_LIMIT_WINDOW = 60000;         // 时间窗口：60秒（毫秒）
const rateLimitStore = new Map();        // 频率限制存储（内存缓存）

/**
 * 检查请求频率限制
 * @param {string} clientIP - 客户端 IP
 * @param {number} limit - 每分钟最大请求数
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
function checkRateLimit(clientIP, limit) {
  const now = Date.now();
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW;
  const key = `${clientIP}:${windowStart}`;
  
  const current = rateLimitStore.get(key) || 0;
  const remaining = Math.max(0, limit - current);
  const resetTime = windowStart + RATE_LIMIT_WINDOW;
  
  if (current >= limit) {
    return { allowed: false, remaining: 0, resetTime };
  }
  
  rateLimitStore.set(key, current + 1);
  
  // 清理过期的记录（每 100 次请求清理一次）
  if (rateLimitStore.size > 1000) {
    for (const [k] of rateLimitStore) {
      const keyTime = parseInt(k.split(':')[1]);
      if (keyTime < windowStart - RATE_LIMIT_WINDOW) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return { allowed: true, remaining: remaining - 1, resetTime };
}

/**
 * 生成频率限制超时响应
 */
function rateLimitResponse(resetTime) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return new Response(JSON.stringify({
    status: 'error',
    message: `请求频率超限，请在 ${retryAfter} 秒后重试`,
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 429,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
      'Retry-After': String(retryAfter),
      'X-RateLimit-Reset': String(resetTime),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const UA = request.headers.get('User-Agent') || 'null';
    const hostname = url.hostname;
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // ---------- TOKEN 初始化 ----------
    const { 临时TOKEN, 永久TOKEN } = await initTokens(hostname, UA, env);
    const { 已验证, 路径TOKEN, 实际路径 } = parsePathToken(url.pathname, 临时TOKEN, 永久TOKEN);

    // ---------- 公共 TOKEN 鉴权 ----------
    function requireToken() {
      if (!env.TOKEN) return null; // 未设置TOKEN则无需验证
      if (已验证) return null;     // 路径TOKEN已验证
      if (validateQueryToken(url.searchParams, 临时TOKEN, 永久TOKEN)) return null;
      return forbidden();
    }

    // ---------- 请求频率限制（仅对 API 接口生效）----------
    function checkApiRateLimit() {
      if (已验证) return null;  // 已验证 TOKEN 的用户不受限制
      const limit = parseInt(env.RATE_LIMIT) || RATE_LIMIT_DEFAULT;
      const result = checkRateLimit(clientIP, limit);
      if (!result.allowed) {
        return rateLimitResponse(result.resetTime);
      }
      return null;
    }

    // ---------- favicon ----------
    if (实际路径 === '/favicon.ico') {
      const ico = env.ICO || 'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/19kSkLSfWtDcspvQI5pit4/c5630cf25d589a0de91978ca29486259/performance-acceleration-bolt.svg';
      return Response.redirect(ico, 302);
    }

    // =====================================================
    //  API 路由
    // =====================================================

    // --- /check ---
    if (实际路径 === '/check') {
      const authErr = requireToken();
      if (authErr) return authErr;
      
      const rateErr = checkApiRateLimit();
      if (rateErr) return rateErr;

      // 判断是 ProxyIP 检测还是 Socks5/HTTP 检测
      if (url.searchParams.has('proxyip')) {
        return handleCheckProxyIP(request, url);
      } else if (url.searchParams.has('proxy') || url.searchParams.has('socks5') || url.searchParams.has('http')) {
        return handleCheckProxy(url);
      }
      return jsonResp({ success: false, error: '请提供 proxyip、proxy、socks5 或 http 参数' }, 400);
    }

    // --- /resolve ---
    if (实际路径 === '/resolve') {
      const authErr = requireToken();
      if (authErr) return authErr;
      
      const rateErr = checkApiRateLimit();
      if (rateErr) return rateErr;
      
      const domain = url.searchParams.get('domain');
      if (!domain) return new Response('Missing domain parameter', { status: 400 });
      try {
        const ips = await resolveDomain(domain);
        return jsonResp({ success: true, domain, ips });
      } catch (e) {
        return jsonResp({ success: false, error: e.message }, 500);
      }
    }

    // --- /ip-info ---
    if (实际路径 === '/ip-info') {
      // /ip-info 需要任意有效 TOKEN（路径或参数），未设置TOKEN时始终放行
      if (env.TOKEN && !已验证 && !validateQueryToken(url.searchParams, 临时TOKEN, 永久TOKEN)) {
        return forbidden('IP查询失败: 无效的TOKEN');
      }
      
      const rateErr = checkApiRateLimit();
      if (rateErr) return rateErr;
      
      return handleIpInfo(request, url);
    }

    // =====================================================
    //  页面路由
    // =====================================================

    // 设置了TOKEN但未验证 → 伪装页或自定义跳转
    if (env.TOKEN && !已验证) {
      if (env.URL302) {
        const urls = await 整理(env.URL302);
        return Response.redirect(随机取(urls), 302);
      }
      if (env.URL) {
        return 代理URL(env.URL, url, 整理);
      }
      return new Response(nginx(), { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
    }

    // 自定义跳转（未设置TOKEN时也支持）
    if (!env.TOKEN) {
      if (env.URL302) {
        const urls = await 整理(env.URL302);
        return Response.redirect(随机取(urls), 302);
      }
      if (env.URL) {
        return 代理URL(env.URL, url, 整理);
      }
    }

    // ProxyIP 专属页
    if (实际路径 === '/proxyip') {
      const ico = env.ICO || 'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/19kSkLSfWtDcspvQI5pit4/c5630cf25d589a0de91978ca29486259/performance-acceleration-bolt.svg';
      return new Response(renderProxyIPPage(hostname, ico, 路径TOKEN), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }

    // Socks5/HTTP 专属页
    if (实际路径 === '/proxy') {
      const ico = env.ICO || '';
      let bgStyle = 'background: #f5f5f5;';
      if (env.IMG) {
        const imgs = await 整理(env.IMG);
        bgStyle = `background-image: url('${随机取(imgs)}');`;
      }
      return new Response(renderProxyPage(hostname, ico, bgStyle, 路径TOKEN), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }

    // 根路径 → 导航首页（两个工具入口 + API 文档）
    if (实际路径 === '/' || 实际路径 === '') {
      const ico = env.ICO || 'https://cf-assets.www.cloudflare.com/dzlvafdwdttg/19kSkLSfWtDcspvQI5pit4/c5630cf25d589a0de91978ca29486259/performance-acceleration-bolt.svg';
      return new Response(renderHomePage(hostname, ico, 路径TOKEN), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

// =====================================================
//  导航首页（新增，两个工具统一入口）
// =====================================================
function renderHomePage(hostname, ico, pathToken) {
  const base = pathToken ? `/${pathToken}` : '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Proxy Checker - 代理检测服务</title>
<link rel="icon" href="${ico}" type="image/x-icon">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.wrap{max-width:900px;width:100%}
.hero{text-align:center;margin-bottom:60px;color:#fff}
.hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;background:linear-gradient(135deg,#e0f2fe,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px}
.hero p{font-size:1.1rem;color:rgba(255,255,255,.7);max-width:600px;margin:0 auto}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:50px}
.card{background:rgba(255,255,255,.07);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:40px 32px;text-decoration:none;color:#fff;transition:all .3s;display:flex;flex-direction:column;gap:20px}
.card:hover{transform:translateY(-8px);background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.3);box-shadow:0 20px 40px rgba(0,0,0,.3)}
.card-icon{font-size:3rem}
.card h2{font-size:1.5rem;font-weight:700}
.card p{color:rgba(255,255,255,.7);line-height:1.7;font-size:.95rem}
.card-link{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);padding:10px 20px;border-radius:10px;font-size:.9rem;font-weight:600;transition:all .3s;margin-top:auto;width:fit-content}
.card:hover .card-link{background:rgba(255,255,255,.25);border-color:rgba(255,255,255,.4)}
.card-blue{border-top:3px solid #3b82f6}
.card-green{border-top:3px solid #22c55e}
.api-box{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:32px}
.api-box h3{color:#e0f2fe;font-size:1.2rem;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.1)}
.api-table{width:100%;border-collapse:collapse}
.api-table th{color:rgba(255,255,255,.5);font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.1)}
.api-table td{padding:10px 12px;color:rgba(255,255,255,.8);font-size:.9rem;border-bottom:1px solid rgba(255,255,255,.05)}
.api-table tr:last-child td{border-bottom:none}
.api-table code{background:rgba(255,255,255,.1);padding:2px 8px;border-radius:4px;font-family:monospace;font-size:.85rem;color:#a5f3fc}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;font-weight:600}
.badge-get{background:rgba(34,197,94,.2);color:#4ade80;border:1px solid rgba(34,197,94,.3)}
.footer{text-align:center;color:rgba(255,255,255,.4);font-size:.85rem;margin-top:40px}
@media(max-width:640px){.cards{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <h1>🛡️ Proxy Checker</h1>
    <p>高性能代理验证服务，基于 Cloudflare Workers 边缘计算平台，支持 ProxyIP、SOCKS5、HTTP 代理检测</p>
  </div>

  <div class="cards">
    <a href="${base}/proxyip" class="card card-blue">
      <div class="card-icon">🌐</div>
      <h2>Check ProxyIP</h2>
      <p>检测能够反向代理 Cloudflare IP 段的第三方服务器，专为 edgetunnel / epeius 等项目提供 ProxyIP 可用性验证。</p>
      <div class="card-link">进入检测 →</div>
    </a>
    <a href="${base}/proxy" class="card card-green">
      <div class="card-icon">🔌</div>
      <h2>Check SOCKS5/HTTP</h2>
      <p>检测 SOCKS5 和 HTTP 代理的连通性，获取代理入口/出口的 IP 信息、地理位置、ASN 和风险评分。</p>
      <div class="card-link">进入检测 →</div>
    </a>
  </div>

  <div class="api-box">
    <h3>📡 API 接口一览</h3>
    <table class="api-table">
      <thead>
        <tr><th>方法</th><th>路径</th><th>说明</th></tr>
      </thead>
      <tbody>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/check?proxyip=1.2.3.4:443</code></td><td>检测 ProxyIP 可用性</td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/check?proxy=socks5://user:pass@host:port</code></td><td>检测 SOCKS5/HTTP 代理</td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/check?socks5=user:pass@host:port</code></td><td>检测 SOCKS5（简写）</td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/check?http=user:pass@host:port</code></td><td>检测 HTTP（简写）</td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/resolve?domain=example.com</code></td><td>解析域名返回所有 IP</td></tr>
        <tr><td><span class="badge badge-get">GET</span></td><td><code>/ip-info?ip=1.2.3.4</code></td><td>查询 IP 详情（ipapi.is）</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    © 2025 Proxy Checker · 基于 Cloudflare Workers 构建
  </div>
</div>
</body>
</html>`;
}
