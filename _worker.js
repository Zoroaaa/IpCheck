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
//  导航首页（优化版，统一入口）
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--primary:#6366f1;--primary-dark:#4f46e5;--secondary:#22c55e;--accent:#f59e0b;--bg-dark:#0f172a;--bg-card:rgba(30,41,59,.7);--text-primary:#f1f5f9;--text-secondary:#94a3b8;--border-color:rgba(148,163,184,.15);--glow-primary:rgba(99,102,241,.4);--glow-secondary:rgba(34,197,94,.4)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg-dark);min-height:100vh;color:var(--text-primary);overflow-x:hidden}
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 20% 20%,rgba(99,102,241,.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(34,197,94,.1) 0%,transparent 50%),radial-gradient(ellipse at 50% 50%,rgba(245,158,11,.05) 0%,transparent 70%);pointer-events:none;z-index:0}
.nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:16px 24px;background:rgba(15,23,42,.8);backdrop-filter:blur(20px);border-bottom:1px solid var(--border-color)}
.nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--text-primary)}
.nav-logo-icon{width:40px;height:40px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem}
.nav-logo-text{font-size:1.25rem;font-weight:700;letter-spacing:-.02em}
.nav-links{display:flex;gap:8px}
.nav-link{padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:500;font-size:.9rem;transition:all .25s ease;color:var(--text-secondary);background:transparent;border:1px solid transparent}
.nav-link:hover{color:var(--text-primary);background:rgba(255,255,255,.05);border-color:var(--border-color)}
.nav-link.active{color:var(--primary);background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.3)}
.nav-link.active-green{color:var(--secondary);background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3)}
.main{position:relative;z-index:1;padding:120px 24px 60px;max-width:1200px;margin:0 auto}
.hero{text-align:center;margin-bottom:80px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:100px;font-size:.85rem;color:var(--primary);margin-bottom:24px}
.hero-badge-dot{width:8px;height:8px;background:var(--primary);border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
.hero h1{font-size:clamp(2.5rem,6vw,4rem);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:24px;background:linear-gradient(135deg,var(--text-primary) 0%,var(--primary) 50%,var(--secondary) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{font-size:1.2rem;color:var(--text-secondary);max-width:600px;margin:0 auto;line-height:1.7}
.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:80px}
.card{position:relative;background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-color);border-radius:24px;padding:40px;text-decoration:none;color:var(--text-primary);transition:all .4s cubic-bezier(.4,0,.2,1);overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--primary),var(--secondary));opacity:0;transition:opacity .3s}
.card:hover{transform:translateY(-8px);border-color:rgba(99,102,241,.3);box-shadow:0 25px 50px -12px rgba(0,0,0,.5),0 0 0 1px rgba(99,102,241,.1)}
.card:hover::before{opacity:1}
.card-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:24px}
.card-icon-blue{background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(99,102,241,.05));border:1px solid rgba(99,102,241,.2)}
.card-icon-green{background:linear-gradient(135deg,rgba(34,197,94,.2),rgba(34,197,94,.05));border:1px solid rgba(34,197,94,.2)}
.card h2{font-size:1.5rem;font-weight:700;margin-bottom:12px;letter-spacing:-.02em}
.card p{color:var(--text-secondary);line-height:1.7;font-size:.95rem;margin-bottom:24px}
.card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:24px;border-top:1px solid var(--border-color)}
.card-link{display:inline-flex;align-items:center;gap:8px;color:var(--primary);font-weight:600;font-size:.9rem;transition:gap .25s}
.card:hover .card-link{gap:12px}
.card-arrow{font-size:1.2rem;transition:transform .25s}
.card:hover .card-arrow{transform:translateX(4px)}
.card-features{display:flex;gap:8px;flex-wrap:wrap}
.card-feature{padding:4px 12px;background:rgba(255,255,255,.05);border-radius:100px;font-size:.75rem;color:var(--text-secondary)}
.api-section{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-color);border-radius:24px;padding:40px;margin-bottom:40px}
.api-header{display:flex;align-items:center;gap:16px;margin-bottom:32px}
.api-header-icon{width:48px;height:48px;background:linear-gradient(135deg,rgba(245,158,11,.2),rgba(245,158,11,.05));border:1px solid rgba(245,158,11,.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.5rem}
.api-header h3{font-size:1.5rem;font-weight:700;letter-spacing:-.02em}
.api-table{width:100%;border-collapse:collapse}
.api-table th{color:var(--text-secondary);font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;padding:16px;text-align:left;border-bottom:1px solid var(--border-color)}
.api-table td{padding:16px;border-bottom:1px solid var(--border-color);font-size:.9rem}
.api-table tr:last-child td{border-bottom:none}
.api-table tr:hover td{background:rgba(255,255,255,.02)}
.api-table code{background:rgba(99,102,241,.1);padding:4px 10px;border-radius:6px;font-family:'SF Mono',Monaco,monospace;font-size:.85rem;color:#a5b4fc}
.badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:6px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.badge-get{background:rgba(34,197,94,.15);color:#4ade80}
.footer{text-align:center;padding:40px 0;color:var(--text-secondary);font-size:.9rem;border-top:1px solid var(--border-color)}
.footer a{color:var(--primary);text-decoration:none}
.footer a:hover{text-decoration:underline}
@media(max-width:768px){.nav{padding:12px 16px}.nav-links{display:none}.main{padding:100px 16px 40px}.cards{grid-template-columns:1fr;gap:16px}.card{padding:24px}.hero{margin-bottom:48px}.hero h1{font-size:2rem}.hero p{font-size:1rem}.api-section{padding:24px}}
</style>
</head>
<body>
<nav class="nav">
  <div class="nav-inner">
    <a href="${base}/" class="nav-logo">
      <div class="nav-logo-icon">🛡️</div>
      <span class="nav-logo-text">Proxy Checker</span>
    </a>
    <div class="nav-links">
      <a href="${base}/" class="nav-link active">首页</a>
      <a href="${base}/proxyip" class="nav-link">ProxyIP</a>
      <a href="${base}/proxy" class="nav-link">SOCKS5/HTTP</a>
    </div>
  </div>
</nav>

<main class="main">
  <div class="hero">
    <div class="hero-badge">
      <span class="hero-badge-dot"></span>
      Cloudflare Workers 边缘计算
    </div>
    <h1>高性能代理验证服务</h1>
    <p>支持 ProxyIP、SOCKS5、HTTP 代理检测，提供完整的 IP 信息查询与风险评估</p>
  </div>

  <div class="cards">
    <a href="${base}/proxyip" class="card">
      <div class="card-icon card-icon-blue">🌐</div>
      <h2>Check ProxyIP</h2>
      <p>检测能够反向代理 Cloudflare IP 段的第三方服务器，专为 edgetunnel / epeius 等项目提供 ProxyIP 可用性验证。</p>
      <div class="card-footer">
        <span class="card-link">进入检测 <span class="card-arrow">→</span></span>
        <div class="card-features">
          <span class="card-feature">TLS 验证</span>
          <span class="card-feature">自动重试</span>
        </div>
      </div>
    </a>
    <a href="${base}/proxy" class="card">
      <div class="card-icon card-icon-green">🔌</div>
      <h2>Check SOCKS5/HTTP</h2>
      <p>检测 SOCKS5 和 HTTP 代理的连通性，获取代理入口/出口的 IP 信息、地理位置、ASN 和风险评分。</p>
      <div class="card-footer">
        <span class="card-link">进入检测 <span class="card-arrow">→</span></span>
        <div class="card-features">
          <span class="card-feature">风险评估</span>
          <span class="card-feature">ASN 信息</span>
        </div>
      </div>
    </a>
  </div>

  <div class="api-section">
    <div class="api-header">
      <div class="api-header-icon">📡</div>
      <h3>API 接口一览</h3>
    </div>
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

  <footer class="footer">
    © 2025 Proxy Checker · 基于 <a href="https://workers.cloudflare.com/" target="_blank">Cloudflare Workers</a> 构建
  </footer>
</main>
</body>
</html>`;
}
