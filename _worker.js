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
import { handleBatchCheck } from './src/batchCheck.js';
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

    // --- /batch-check ---
    if (实际路径 === '/batch-check') {
      const authErr = requireToken();
      if (authErr) return authErr;
      
      const rateErr = checkApiRateLimit();
      if (rateErr) return rateErr;
      
      return handleBatchCheck(request, url);
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
//  导航首页（浅色现代主题）
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--primary:#6366f1;--primary-dark:#4f46e5;--primary-light:#818cf8;--secondary:#10b981;--accent:#f59e0b;--bg-main:#f8fafc;--bg-card:#ffffff;--bg-hover:#f1f5f9;--text-dark:#1e293b;--text-body:#475569;--text-muted:#94a3b8;--border:#e2e8f0;--shadow:0 1px 3px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.04)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(180deg,#f1f5f9 0%,#f8fafc 100%);min-height:100vh;color:var(--text-dark)}
.nav{position:sticky;top:0;z-index:1000;padding:16px 24px;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--text-dark)}
.nav-logo-icon{width:42px;height:42px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;box-shadow:0 4px 12px rgba(99,102,241,.25)}
.nav-logo-text{font-size:1.2rem;font-weight:700;color:var(--text-dark)}
.nav-links{display:flex;gap:6px}
.nav-link{padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:500;font-size:.9rem;transition:all .2s;color:var(--text-body);background:transparent}
.nav-link:hover{background:var(--bg-hover);color:var(--text-dark)}
.nav-link.active{color:#fff;background:linear-gradient(135deg,var(--primary),var(--primary-dark));box-shadow:0 2px 8px rgba(99,102,241,.3)}
.main{padding:60px 24px 80px;max-width:1200px;margin:0 auto}
.hero{text-align:center;margin-bottom:60px;padding:40px 0}
.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(16,185,129,.1));border-radius:100px;font-size:.85rem;color:var(--primary);margin-bottom:20px;font-weight:500}
.hero h1{font-size:clamp(2.2rem,5vw,3.2rem);font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:16px;color:var(--text-dark)}
.hero h1 span{background:linear-gradient(135deg,var(--primary),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{font-size:1.15rem;color:var(--text-body);max-width:560px;margin:0 auto;line-height:1.7}
.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-bottom:60px}
.card{position:relative;background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:32px;text-decoration:none;color:var(--text-dark);transition:all .3s ease;box-shadow:var(--shadow);overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--primary),var(--secondary));opacity:0;transition:opacity .3s}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 30px rgba(0,0,0,.1),0 4px 12px rgba(0,0,0,.05);border-color:var(--primary-light)}
.card:hover::before{opacity:1}
.card-icon{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin-bottom:20px}
.card-icon-blue{background:linear-gradient(135deg,#eef2ff,#e0e7ff);border:1px solid #c7d2fe}
.card-icon-green{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0}
.card h2{font-size:1.35rem;font-weight:700;margin-bottom:10px;color:var(--text-dark)}
.card p{color:var(--text-body);line-height:1.65;font-size:.95rem;margin-bottom:20px}
.card-footer{display:flex;align-items:center;justify-content:space-between;padding-top:20px;border-top:1px solid var(--border)}
.card-link{display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-weight:600;font-size:.9rem}
.card-arrow{transition:transform .2s}
.card:hover .card-arrow{transform:translateX(4px)}
.card-features{display:flex;gap:6px;flex-wrap:wrap}
.card-feature{padding:4px 10px;background:var(--bg-hover);border-radius:100px;font-size:.75rem;color:var(--text-muted);font-weight:500}
.api-section{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:36px;margin-bottom:40px;box-shadow:var(--shadow)}
.api-header{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.api-header-icon{width:44px;height:44px;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid #fcd34d;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem}
.api-header h3{font-size:1.35rem;font-weight:700;color:var(--text-dark)}
.api-table{width:100%;border-collapse:collapse}
.api-table th{color:var(--text-muted);font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;padding:14px 16px;text-align:left;border-bottom:2px solid var(--border);background:var(--bg-hover)}
.api-table td{padding:14px 16px;border-bottom:1px solid var(--border);font-size:.9rem;color:var(--text-body)}
.api-table tr:last-child td{border-bottom:none}
.api-table tr:hover td{background:var(--bg-hover)}
.api-table code{background:linear-gradient(135deg,#eef2ff,#f1f5f9);padding:5px 10px;border-radius:6px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:.85rem;color:var(--primary-dark);border:1px solid #e2e8f0}
.badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:6px;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
.badge-get{background:linear-gradient(135deg,#dcfce7,#d1fae5);color:#16a34a;border:1px solid #a7f3d0}
.badge-post{background:linear-gradient(135deg,#dbeafe,#bfdbfe);color:#2563eb;border:1px solid #93c5fd}
.footer{text-align:center;padding:40px 0;color:var(--text-muted);font-size:.9rem;border-top:1px solid var(--border);margin-top:20px}
.footer a{color:var(--primary);text-decoration:none;font-weight:500}
.footer a:hover{text-decoration:underline}
@media(max-width:768px){.nav{padding:12px 16px}.nav-links{display:none}.main{padding:40px 16px 60px}.cards{grid-template-columns:1fr;gap:16px}.card{padding:24px}.hero{margin-bottom:40px;padding:20px 0}.hero h1{font-size:1.8rem}.hero p{font-size:1rem}.api-section{padding:24px}}
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
    <div class="hero-badge">✨ Cloudflare Workers 边缘计算</div>
    <h1>高性能<span>代理验证</span>服务</h1>
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
        <tr><td><span class="badge badge-post">POST</span></td><td><code>/batch-check</code></td><td>批量检测 ProxyIP 或代理（最多 50 个）</td></tr>
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
