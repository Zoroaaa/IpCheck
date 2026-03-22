// ============================================================
//  pageProxyIP.js — ProxyIP 检测前端页面（优化版）
//  注意：前端 ip-info 调用现在使用 ipapi.is 格式的响应字段
// ============================================================

export function renderProxyIPPage(hostname, ico, pathToken) {
  const base = pathToken ? `/${pathToken}` : '';
  const tokenBadge = pathToken ? `<div class="token-badge">🔑 TOKEN验证通过</div>` : '';
  const curlExample = `https://${hostname}${base}/check?proxyip=1.2.3.4:443`;
  const tokenSection = pathToken ? `
    <div class="doc-card">
      <div class="doc-card-header">
        <span class="doc-card-icon">🔐</span>
        <h3>TOKEN 访问方式</h3>
      </div>
      <div class="token-grid">
        <div class="token-item">
          <div class="token-label">路径 TOKEN（推荐）</div>
          <div class="code-inline">https://${hostname}/<span class="highlight">${pathToken}</span>/check?proxyip=...</div>
        </div>
        <div class="token-item">
          <div class="token-label">参数 TOKEN</div>
          <div class="code-inline">https://${hostname}/check?proxyip=...&token=<span class="highlight">${pathToken}</span></div>
        </div>
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Check ProxyIP - 代理IP检测服务</title>
  <link rel="icon" href="${ico}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{--primary:#6366f1;--primary-dark:#4f46e5;--primary-light:#818cf8;--secondary:#22c55e;--accent:#f59e0b;--success:#10b981;--warning:#f59e0b;--error:#ef4444;--bg-dark:#0f172a;--bg-card:rgba(30,41,59,.7);--bg-input:#1e293b;--text-primary:#f1f5f9;--text-secondary:#94a3b8;--text-muted:#64748b;--border-color:rgba(148,163,184,.15);--border-focus:rgba(99,102,241,.5);--glow-primary:rgba(99,102,241,.4)}
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg-dark);min-height:100vh;color:var(--text-primary);overflow-x:hidden}
    body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 30% 20%,rgba(99,102,241,.12) 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(34,197,94,.08) 0%,transparent 50%);pointer-events:none;z-index:0}
    .nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:16px 24px;background:rgba(15,23,42,.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border-color)}
    .nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
    .nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--text-primary)}
    .nav-logo-icon{width:40px;height:40px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem}
    .nav-logo-text{font-size:1.25rem;font-weight:700;letter-spacing:-.02em}
    .nav-links{display:flex;gap:8px}
    .nav-link{padding:10px 20px;border-radius:10px;text-decoration:none;font-weight:500;font-size:.9rem;transition:all .25s ease;color:var(--text-secondary);background:transparent;border:1px solid transparent}
    .nav-link:hover{color:var(--text-primary);background:rgba(255,255,255,.05);border-color:var(--border-color)}
    .nav-link.active{color:var(--primary);background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.3)}
    .main{position:relative;z-index:1;padding:120px 24px 60px;max-width:1000px;margin:0 auto}
    .hero{text-align:center;margin-bottom:48px}
    .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);border-radius:100px;font-size:.85rem;color:var(--primary-light);margin-bottom:20px}
    .hero h1{font-size:clamp(2rem,5vw,3rem);font-weight:800;letter-spacing:-.03em;line-height:1.2;margin-bottom:12px;background:linear-gradient(135deg,var(--text-primary) 0%,var(--primary-light) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .hero p{font-size:1.1rem;color:var(--text-secondary);max-width:500px;margin:0 auto}
    .card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-color);border-radius:20px;padding:32px;margin-bottom:24px;position:relative;overflow:hidden}
    .card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--primary),var(--secondary))}
    .form-section{margin-bottom:0}
    .form-label{display:block;font-weight:600;font-size:1rem;margin-bottom:12px;color:var(--text-primary)}
    .input-group{display:flex;gap:12px;align-items:stretch}
    .input-wrapper{flex:1}
    .form-input{width:100%;padding:16px 20px;border:2px solid var(--border-color);border-radius:12px;font-size:16px;font-family:inherit;transition:all .25s ease;background:var(--bg-input);color:var(--text-primary)}
    .form-input:focus{outline:none;border-color:var(--border-focus);box-shadow:0 0 0 4px rgba(99,102,241,.1)}
    .form-input::placeholder{color:var(--text-muted)}
    .btn{padding:16px 32px;border:none;border-radius:12px;font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .25s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:120px}
    .btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;box-shadow:0 4px 15px rgba(99,102,241,.3)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(99,102,241,.4)}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .loading-spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,.3);border-top:2px solid #fff;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
    .result-section{margin-top:24px;opacity:0;transform:translateY(20px);transition:all .4s ease}
    .result-section.show{opacity:1;transform:translateY(0)}
    .result-card{border-radius:16px;padding:24px;margin-bottom:16px;border-left:4px solid;position:relative}
    .result-success{background:rgba(16,185,129,.1);border-color:var(--success);color:#d1fae5}
    .result-error{background:rgba(239,68,68,.1);border-color:var(--error);color:#fecaca}
    .result-warning{background:rgba(245,158,11,.1);border-color:var(--warning);color:#fde68a}
    .result-card h3{font-size:1.2rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
    .result-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px;font-size:.95rem}
    .result-row strong{color:var(--text-secondary);font-weight:500}
    .copy-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);padding:6px 12px;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s;color:var(--text-primary);font-family:inherit}
    .copy-btn:hover{background:var(--primary);border-color:var(--primary)}
    .copy-btn.copied{background:var(--success);border-color:var(--success)}
    .tag{padding:4px 10px;border-radius:100px;font-size:12px;font-weight:500}
    .tag-country{background:rgba(99,102,241,.2);color:var(--primary-light)}
    .tag-as{background:rgba(34,197,94,.2);color:#4ade80}
    .ip-grid{display:grid;gap:12px;margin-top:16px}
    .ip-item{background:rgba(255,255,255,.05);border:1px solid var(--border-color);border-radius:12px;padding:16px;transition:all .2s}
    .ip-item:hover{background:rgba(255,255,255,.08)}
    .ip-item.valid{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.3)}
    .ip-item.invalid{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3)}
    .ip-status-line{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .status-badge{padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600}
    .status-badge.success{background:var(--success);color:#fff}
    .status-badge.error{background:var(--error);color:#fff}
    .doc-card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-color);border-radius:20px;padding:32px;margin-bottom:24px}
    .doc-card-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
    .doc-card-icon{width:40px;height:40px;background:linear-gradient(135deg,rgba(99,102,241,.2),rgba(99,102,241,.05));border:1px solid rgba(99,102,241,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem}
    .doc-card h2{font-size:1.5rem;font-weight:700;letter-spacing:-.02em}
    .doc-card h3{font-size:1.1rem;font-weight:600;color:var(--text-primary);margin:24px 0 12px}
    .doc-card p{color:var(--text-secondary);line-height:1.7;margin-bottom:16px}
    .code-block{background:var(--bg-input);color:var(--text-primary);padding:20px;border-radius:12px;font-family:'SF Mono',Monaco,monospace;font-size:14px;overflow-x:auto;margin:16px 0;border:1px solid var(--border-color)}
    .code-block .highlight{color:var(--primary-light);font-weight:600}
    .code-block .method{color:#4ade80;font-weight:600}
    .code-inline{background:var(--bg-input);padding:8px 12px;border-radius:8px;font-family:'SF Mono',Monaco,monospace;font-size:13px;display:block;margin-top:8px;border:1px solid var(--border-color)}
    .code-inline .highlight{color:var(--primary-light);font-weight:600}
    .token-grid{display:grid;gap:16px}
    .token-item{background:rgba(255,255,255,.03);padding:16px;border-radius:12px;border:1px solid var(--border-color)}
    .token-label{font-size:.85rem;color:var(--text-muted);margin-bottom:8px}
    .flow-diagram{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:20px;background:rgba(255,255,255,.03);border-radius:12px;margin:16px 0}
    .flow-item{background:rgba(99,102,241,.1);padding:12px 16px;border-radius:10px;text-align:center;border:1px solid rgba(99,102,241,.2)}
    .flow-item .title{font-weight:600;font-size:.9rem;color:var(--primary-light)}
    .flow-item .desc{font-size:.75rem;color:var(--text-muted);margin-top:4px}
    .flow-arrow{color:var(--text-muted);font-size:1.5rem}
    .feature-list{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:12px;padding:20px;margin:16px 0}
    .feature-list ul{margin:0;padding-left:20px;color:#a7f3d0;line-height:1.8}
    .footer{text-align:center;padding:40px 0;color:var(--text-muted);font-size:.9rem;border-top:1px solid var(--border-color);margin-top:40px}
    .token-badge{position:fixed;top:80px;left:24px;background:linear-gradient(135deg,var(--success),#059669);color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;z-index:999;box-shadow:0 4px 15px rgba(16,185,129,.3)}
    .toast{position:fixed;bottom:24px;right:24px;background:var(--bg-card);backdrop-filter:blur(20px);color:var(--text-primary);padding:14px 20px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.3);transform:translateY(100px);opacity:0;transition:all .3s ease;z-index:1001;border:1px solid var(--border-color)}
    .toast.show{transform:translateY(0);opacity:1}
    .tooltip{position:relative;display:inline-block;cursor:help}
    .tooltip .tooltiptext{visibility:hidden;width:320px;background:var(--bg-card);backdrop-filter:blur(20px);color:var(--text-primary);text-align:left;border-radius:12px;padding:14px 18px;position:fixed;z-index:9999;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity .3s;box-shadow:0 10px 40px rgba(0,0,0,.4);font-size:13px;border:1px solid var(--border-color)}
    .tooltip:hover .tooltiptext{visibility:visible;opacity:1}
    @media(max-width:768px){.nav{padding:12px 16px}.nav-links{display:none}.main{padding:100px 16px 40px}.card,.doc-card{padding:20px}.input-group{flex-direction:column}.btn{width:100%}.hero h1{font-size:1.75rem}.flow-diagram{flex-direction:column}.flow-arrow{transform:rotate(90deg)}}
  </style>
</head>
<body>
  ${tokenBadge}
  
  <nav class="nav">
    <div class="nav-inner">
      <a href="${base}/" class="nav-logo">
        <div class="nav-logo-icon">🛡️</div>
        <span class="nav-logo-text">Proxy Checker</span>
      </a>
      <div class="nav-links">
        <a href="${base}/" class="nav-link">首页</a>
        <a href="${base}/proxyip" class="nav-link active">ProxyIP</a>
        <a href="${base}/proxy" class="nav-link">SOCKS5/HTTP</a>
      </div>
    </div>
  </nav>

  <main class="main">
    <div class="hero">
      <div class="hero-badge">🌐 ProxyIP 检测</div>
      <h1>Check ProxyIP</h1>
      <p>检测能够反向代理 Cloudflare IP 段的第三方服务器</p>
    </div>

    <div class="card">
      <div class="form-section">
        <label for="proxyip" class="form-label">输入 ProxyIP 地址</label>
        <div class="input-group">
          <div class="input-wrapper">
            <input type="text" id="proxyip" class="form-input" placeholder="例如: 1.2.3.4:443 或 example.com" autocomplete="off">
          </div>
          <button id="checkBtn" class="btn btn-primary" onclick="checkProxyIP()">
            <span class="btn-text">开始检测</span>
            <div class="loading-spinner" style="display:none"></div>
          </button>
        </div>
      </div>
      <div id="result" class="result-section"></div>
    </div>

    <div class="doc-card">
      <div class="doc-card-header">
        <span class="doc-card-icon">🤔</span>
        <h2>什么是 ProxyIP？</h2>
      </div>
      <p>在 Cloudflare Workers 环境中，ProxyIP 特指那些能够成功代理连接到 Cloudflare 服务的第三方 IP 地址。根据 <a href="https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/" target="_blank" style="color:var(--primary-light)">TCP Sockets 官方文档</a> 说明，Workers 无法直接连接到 Cloudflare 自有 IP 段，需借助第三方服务器作为跳板。</p>
      
      <div class="flow-diagram">
        <div class="flow-item"><div class="title">Cloudflare Workers</div><div class="desc">发起请求</div></div>
        <span class="flow-arrow">→</span>
        <div class="flow-item"><div class="title">ProxyIP 服务器</div><div class="desc">第三方代理</div></div>
        <span class="flow-arrow">→</span>
        <div class="flow-item"><div class="title">Cloudflare 服务</div><div class="desc">目标服务</div></div>
      </div>

      <h3>有效 ProxyIP 特征</h3>
      <div class="feature-list">
        <ul>
          <li><strong>网络连通性：</strong>能够成功建立到指定端口（通常为 443）的 TCP 连接</li>
          <li><strong>代理功能：</strong>具备反向代理 Cloudflare IP 段的 HTTPS 服务能力</li>
        </ul>
      </div>

      <h3>支持的输入格式</h3>
      <div class="code-block">
# IPv4 地址<br>
1.2.3.4<br><br>
# IPv4 地址 + 端口<br>
1.2.3.4:443<br><br>
# IPv6 地址<br>
[2001:db8::1]<br><br>
# 域名（自动解析）<br>
example.com<br><br>
# 特殊格式（.tp端口号）<br>
example.com.tp443.com
      </div>
    </div>

    <div class="doc-card">
      <div class="doc-card-header">
        <span class="doc-card-icon">📚</span>
        <h2>API 文档</h2>
      </div>
      
      <h3>检查 ProxyIP</h3>
      <div class="code-block"><span class="method">GET</span> /check?proxyip=<span class="highlight">YOUR_PROXY_IP</span></div>
      
      <h3>使用示例</h3>
      <div class="code-block">curl "${curlExample}"</div>
      
      <h3>响应格式</h3>
      <div class="code-block">
{<br>
&nbsp;&nbsp;"success": true,<br>
&nbsp;&nbsp;"proxyIP": "1.2.3.4",<br>
&nbsp;&nbsp;"portRemote": 443,<br>
&nbsp;&nbsp;"colo": "HKG",<br>
&nbsp;&nbsp;"responseTime": 166,<br>
&nbsp;&nbsp;"message": "第1次验证有效ProxyIP",<br>
&nbsp;&nbsp;"timestamp": "2025-06-03T17:27:52.946Z"<br>
}
      </div>

      <h3>解析域名</h3>
      <div class="code-block"><span class="method">GET</span> /resolve?domain=<span class="highlight">example.com</span></div>

      <h3>查询 IP 信息</h3>
      <div class="code-block"><span class="method">GET</span> /ip-info?ip=<span class="highlight">1.2.3.4</span></div>
      <p style="margin-top:8px;font-size:.9rem">数据来源：<a href="https://ipapi.is" target="_blank" style="color:var(--primary-light)">ipapi.is</a></p>

      ${tokenSection}
    </div>

    <footer class="footer">
      © 2025 Proxy Checker · 基于 Cloudflare Workers 构建 · IP数据来源: ipapi.is
    </footer>
  </main>

  <div id="toast" class="toast"></div>

  <script>
    let isChecking = false;
    const ipCheckResults = new Map();
    let pageLoadTimestamp;
    const pathToken = ${JSON.stringify(pathToken || '')};

    function calculateTimestamp() {
      return Math.ceil(Date.now() / (1000 * 60 * 31));
    }

    function isValidProxyIPFormat(input) {
      const domainRe = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      const ipv4Re = /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/;
      const ipv6Re = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;
      return domainRe.test(input) || ipv4Re.test(input) || ipv6Re.test(input) ||
             /^.+:\\d+$/.test(input) || /^.+\\.tp\\d+\\./.test(input);
    }

    function isIPAddress(input) {
      return /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(input) ||
             /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/.test(input) ||
             /^\\[[0-9a-fA-F:]+\\]:\\d+$/.test(input) ||
             /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?):\\d+$/.test(input);
    }

    async function callAPI(endpoint, params = {}) {
      if (pathToken) params.token = pathToken;
      const qs = new URLSearchParams(params).toString();
      const url = qs ? endpoint + '?' + qs : endpoint;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('API请求失败: ' + resp.status);
      return resp.json();
    }

    document.addEventListener('DOMContentLoaded', function() {
      pageLoadTimestamp = calculateTimestamp();
      const input = document.getElementById('proxyip');
      input.focus();
      if (pathToken) showToast('✅ TOKEN验证通过，所有功能已启用', 5000);
      const reservedPaths = ['proxyip', 'proxy', 'check', 'resolve', 'ip-info', 'favicon.ico'];
      const urlParams = new URLSearchParams(window.location.search);
      let autoCheck = urlParams.get('autocheck');
      if (!autoCheck) {
        const segs = window.location.pathname.split('/').filter(Boolean);
        const checkSeg = (segs.length > 1 && segs[0] === pathToken) ? segs[1]
                       : (segs.length === 1 && segs[0] !== pathToken) ? segs[0] : null;
        if (checkSeg && isValidProxyIPFormat(checkSeg) && !reservedPaths.includes(checkSeg.toLowerCase())) autoCheck = checkSeg;
      }
      if (!autoCheck) {
        try { const s = localStorage.getItem('lastProxyIP'); if (s && isValidProxyIPFormat(s)) input.value = s; } catch(_) {}
      }
      if (autoCheck) {
        input.value = autoCheck;
        setTimeout(() => { if (!isChecking) checkProxyIP(); }, 500);
      }
      input.addEventListener('keypress', e => { if (e.key === 'Enter' && !isChecking) checkProxyIP(); });
      document.addEventListener('click', e => {
        if (e.target.classList.contains('copy-btn')) {
          const t = e.target.getAttribute('data-copy');
          if (t) copyToClipboard(t, e.target);
        }
      });
    });

    function showToast(msg, dur = 3000) {
      const t = document.getElementById('toast');
      t.textContent = msg; t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), dur);
    }

    function copyToClipboard(text, el) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = el.textContent;
        el.classList.add('copied'); el.textContent = '已复制 ✓';
        showToast('复制成功！');
        setTimeout(() => { el.classList.remove('copied'); el.textContent = orig; }, 2000);
      }).catch(() => showToast('复制失败，请手动复制'));
    }

    function createCopyButton(text) {
      return '<button class="copy-btn" data-copy="' + text + '">' + text + '</button>';
    }

    async function checkProxyIP() {
      if (isChecking) return;
      const input = document.getElementById('proxyip');
      const resultDiv = document.getElementById('result');
      const btn = document.getElementById('checkBtn');
      const btnText = btn.querySelector('.btn-text');
      const spinner = btn.querySelector('.loading-spinner');
      let proxyip = (input.value || '').trim().split(' ')[0];
      if (proxyip !== input.value) { input.value = proxyip; showToast('已自动清理输入内容'); }
      if (!proxyip) { showToast('请输入代理IP地址'); input.focus(); return; }
      if (!pathToken && calculateTimestamp() !== pageLoadTimestamp) {
        showToast('TOKEN已过期，正在刷新页面...');
        setTimeout(() => { window.location.href = window.location.protocol + '//' + window.location.host + '/' + encodeURIComponent(proxyip); }, 1000);
        return;
      }
      try { localStorage.setItem('lastProxyIP', proxyip); } catch(_) {}
      isChecking = true;
      btn.disabled = true;
      btnText.style.display = 'none'; spinner.style.display = 'block';
      resultDiv.classList.remove('show');
      try {
        if (isIPAddress(proxyip)) await checkSingleIP(proxyip, resultDiv);
        else await checkDomain(proxyip, resultDiv);
      } catch(err) {
        resultDiv.innerHTML = '<div class="result-card result-error"><h3>❌ 检测失败</h3><div class="result-row"><strong>错误信息:</strong> ' + err.message + '</div><div class="result-row"><strong>检测时间:</strong> ' + new Date().toLocaleString() + '</div></div>';
        resultDiv.classList.add('show');
      } finally {
        isChecking = false;
        btn.disabled = false;
        btnText.style.display = 'block'; spinner.style.display = 'none';
      }
    }

    async function checkSingleIP(proxyip, resultDiv) {
      const data = await callAPI('./check', { proxyip });
      const ipInfo = data.success ? await getIPInfo(data.proxyIP) : null;
      const ipInfoHTML = formatIPInfo(ipInfo);
      if (data.success) {
        const rtHTML = data.responseTime > 0
          ? '<div class="tooltip"><span class="status-badge success">' + data.responseTime + 'ms</span><span class="tooltiptext">该延迟是 Cloudflare.' + (data.colo||'CF') + ' 机房到 ProxyIP 的响应时间</span></div>'
          : '<span style="color:var(--text-muted)">延迟未知</span>';
        resultDiv.innerHTML = '<div class="result-card result-success"><h3>✅ ProxyIP 有效</h3><div class="result-row"><strong>ProxyIP:</strong>' + createCopyButton(data.proxyIP) + ipInfoHTML + rtHTML + '</div><div class="result-row"><strong>端口:</strong> ' + createCopyButton(String(data.portRemote)) + '</div><div class="result-row"><strong>机房:</strong> ' + (data.colo||'CF') + '</div><div class="result-row"><strong>时间:</strong> ' + new Date(data.timestamp).toLocaleString() + '</div></div>';
      } else {
        resultDiv.innerHTML = '<div class="result-card result-error"><h3>❌ ProxyIP 失效</h3><div class="result-row"><strong>IP地址:</strong>' + createCopyButton(proxyip) + ipInfoHTML + '</div><div class="result-row"><strong>端口:</strong> ' + (data.portRemote !== -1 ? createCopyButton(String(data.portRemote)) : '未知') + '</div><div class="result-row"><strong>机房:</strong> ' + (data.colo||'CF') + '</div>' + (data.message ? '<div class="result-row"><strong>错误:</strong> ' + data.message + '</div>' : '') + '<div class="result-row"><strong>时间:</strong> ' + new Date(data.timestamp).toLocaleString() + '</div></div>';
      }
      resultDiv.classList.add('show');
    }

    async function checkDomain(domain, resultDiv) {
      let port = 443, cleanDomain = domain;
      if (domain.includes('.tp')) { port = parseInt(domain.split('.tp')[1]) || 443; }
      else if (domain.includes('[') && domain.includes(']:')) { port = parseInt(domain.split(']:')[1]) || 443; cleanDomain = domain.split(']:')[0] + ']'; }
      else if (domain.includes(':')) { port = parseInt(domain.split(':')[1]) || 443; cleanDomain = domain.split(':')[0]; }
      const resolveData = await callAPI('./resolve', { domain: cleanDomain });
      if (!resolveData.success) throw new Error(resolveData.error || '域名解析失败');
      const ips = resolveData.ips;
      if (!ips || ips.length === 0) throw new Error('未找到域名对应的IP地址');
      ipCheckResults.clear();
      resultDiv.innerHTML = '<div class="result-card result-warning"><h3>🔍 域名解析结果</h3><div class="result-row"><strong>域名:</strong> ' + createCopyButton(cleanDomain) + '</div><div class="result-row"><strong>端口:</strong> ' + createCopyButton(String(port)) + '</div><div class="result-row"><strong>机房:</strong> <span id="domain-colo">检测中...</span></div><div class="result-row"><strong>IP数量:</strong> ' + ips.length + ' 个</div><div class="result-row"><strong>时间:</strong> ' + new Date().toLocaleString() + '</div><div class="ip-grid" id="ip-grid">' + ips.map((ip, i) => '<div class="ip-item" id="ip-item-' + i + '"><div class="ip-status-line"><strong>IP:</strong>' + createCopyButton(ip) + '<span id="ip-info-' + i + '" style="color:var(--text-muted)">获取中...</span><span id="status-icon-' + i + '"></span></div></div>').join('') + '</div></div>';
      resultDiv.classList.add('show');
      await Promise.all([
        ...ips.map((ip, i) => checkIPWithIndex(ip, port, i)),
        ...ips.map((ip, i) => getIPInfoWithIndex(ip, i))
      ]);
      const validCount = Array.from(ipCheckResults.values()).filter(r => r.success).length;
      const card = resultDiv.querySelector('.result-card');
      const firstValid = Array.from(ipCheckResults.values()).find(r => r.success && r.colo);
      const coloEl = document.getElementById('domain-colo');
      if (coloEl) coloEl.textContent = firstValid?.colo || 'CF';
      if (validCount === ips.length) { card.className = 'result-card result-success'; card.querySelector('h3').innerHTML = '✅ 所有IP均有效'; }
      else if (validCount === 0) { card.className = 'result-card result-error'; card.querySelector('h3').innerHTML = '❌ 所有IP均失效'; }
      else { card.className = 'result-card result-warning'; card.querySelector('h3').innerHTML = '⚠️ 部分IP有效 (' + validCount + '/' + ips.length + ')'; }
    }

    async function checkIPWithIndex(ip, port, i) {
      try {
        const key = ip + ':' + port;
        let result = ipCheckResults.get(key);
        if (!result) { result = await callAPI('./check', { proxyip: key }); ipCheckResults.set(key, result); }
        const item = document.getElementById('ip-item-' + i);
        const icon = document.getElementById('status-icon-' + i);
        if (result.success) {
          item.classList.add('valid');
          icon.innerHTML = result.responseTime > 0
            ? '<div class="tooltip"><span class="status-badge success">' + result.responseTime + 'ms</span><span class="tooltiptext">Cloudflare.' + (result.colo||'CF') + ' 机房响应时间</span></div>'
            : '<span class="status-badge success">有效</span>';
        } else {
          item.classList.add('invalid');
          icon.innerHTML = '<span class="status-badge error">失效</span>';
        }
      } catch(e) {
        const icon = document.getElementById('status-icon-' + i);
        if (icon) icon.innerHTML = '<span class="status-badge error">错误</span>';
        ipCheckResults.set(ip + ':' + port, { success: false, colo: 'CF' });
      }
    }

    async function getIPInfoWithIndex(ip, i) {
      try {
        const info = await getIPInfo(ip.replace(/^\\[|\\]$/g, ''));
        const el = document.getElementById('ip-info-' + i);
        if (el) el.innerHTML = formatIPInfo(info);
      } catch(_) {
        const el = document.getElementById('ip-info-' + i);
        if (el) el.innerHTML = '<span style="color:var(--text-muted)">获取失败</span>';
      }
    }

    async function getIPInfo(ip) {
      try { return await callAPI('./ip-info', { ip: ip.replace(/[\\[\\]]/g, '') }); } catch(_) { return null; }
    }

    function formatIPInfo(info) {
      if (!info || info.error) return '<span style="color:var(--text-muted)">获取失败</span>';
      const country = info.location?.country_code || info.country || '未知';
      const org = info.asn?.org || info.company?.name || (info.asn?.asn ? 'AS' + info.asn.asn : '') || '未知';
      return '<span class="tag tag-country">' + country + '</span><span class="tag tag-as">' + org + '</span>';
    }
  </script>
</body>
</html>`;
}
