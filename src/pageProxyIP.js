// ============================================================
//  pageProxyIP.js — ProxyIP 检测前端页面
//  注意：前端 ip-info 调用现在使用 ipapi.is 格式的响应字段
// ============================================================

export function renderProxyIPPage(hostname, ico, pathToken) {
  const tokenBadge = pathToken ? `<div class="token-badge">🔑 TOKEN验证通过</div>` : '';
  const secureSubtitle = pathToken ? `<div class="subtitle">🔒 安全模式 - 路径TOKEN验证已启用</div>` : '';
  const footerToken = pathToken ? `<p style="margin-top:4px;opacity:.6">🔒 当前会话已通过TOKEN验证</p>` : '';
  const curlExample = `https://${hostname}${pathToken ? '/' + pathToken : ''}/check?proxyip=1.2.3.4:443`;
  const tokenSection = `
    <h3 style="color:var(--text-primary);margin:24px 0 16px">🔐 TOKEN访问方式</h3>
    <div style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);padding:20px;border-radius:var(--border-radius-sm);border-left:4px solid var(--primary-color)">
      <p style="margin-bottom:12px;color:#1565c0;font-weight:600">路径TOKEN访问（推荐）:</p>
      <div class="code-block" style="background:#1e3a8a;color:#e0f2fe">
https://${hostname}/<span class="highlight">${pathToken || '你的TOKEN'}</span><br>
https://${hostname}/<span class="highlight">${pathToken || '你的TOKEN'}</span>/check?proxyip=1.2.3.4
      </div>
      <p style="margin:16px 0 12px;color:#1565c0;font-weight:600">参数TOKEN访问:</p>
      <div class="code-block" style="background:#1e3a8a;color:#e0f2fe">
https://${hostname}/check?proxyip=1.2.3.4&amp;token=<span class="highlight">${pathToken || '你的TOKEN'}</span>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Check ProxyIP - 代理IP检测服务</title>
  <link rel="icon" href="${ico}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{--primary-color:#3498db;--primary-dark:#2980b9;--secondary-color:#1abc9c;--success-color:#2ecc71;--warning-color:#f39c12;--error-color:#e74c3c;--bg-primary:#ffffff;--bg-secondary:#f8f9fa;--bg-tertiary:#e9ecef;--text-primary:#2c3e50;--text-secondary:#6c757d;--text-light:#adb5bd;--border-color:#dee2e6;--shadow-sm:0 2px 4px rgba(0,0,0,.1);--shadow-md:0 4px 6px rgba(0,0,0,.1);--shadow-lg:0 10px 25px rgba(0,0,0,.15);--border-radius:12px;--border-radius-sm:8px;--transition:all .3s cubic-bezier(.4,0,.2,1)}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:var(--text-primary);background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;overflow-x:hidden}
    .container{max-width:1000px;margin:0 auto;padding:20px}
    .header{text-align:center;margin-bottom:50px;animation:fadeInDown .8s ease-out}
    .main-title{font-size:clamp(2.5rem,5vw,4rem);font-weight:700;background:linear-gradient(135deg,#fff 0%,#f0f0f0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px}
    .subtitle{font-size:1.2rem;color:rgba(255,255,255,.9);font-weight:400;margin-bottom:8px}
    .badge{display:inline-block;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:8px 16px;border-radius:50px;color:#fff;font-size:.9rem;font-weight:500;border:1px solid rgba(255,255,255,.3)}
    .card{background:var(--bg-primary);border-radius:var(--border-radius);padding:32px;box-shadow:var(--shadow-lg);margin-bottom:32px;border:1px solid var(--border-color);animation:fadeInUp .8s ease-out;position:relative;overflow:hidden}
    .card::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--primary-color),var(--secondary-color))}
    .card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,.15)}
    .form-label{display:block;font-weight:600;font-size:1.1rem;margin-bottom:12px;color:var(--text-primary)}
    .input-group{display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap}
    .input-wrapper{flex:1;min-width:300px}
    .form-input{width:100%;padding:16px 20px;border:2px solid var(--border-color);border-radius:var(--border-radius-sm);font-size:16px;font-family:inherit;transition:var(--transition);background:var(--bg-primary);color:var(--text-primary)}
    .form-input:focus{outline:none;border-color:var(--primary-color);box-shadow:0 0 0 4px rgba(52,152,219,.1);transform:translateY(-1px)}
    .form-input::placeholder{color:var(--text-light)}
    .btn{padding:16px 32px;border:none;border-radius:var(--border-radius-sm);font-size:16px;font-weight:600;font-family:inherit;cursor:pointer;transition:var(--transition);display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:120px;position:relative;overflow:hidden}
    .btn::before{content:"";position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transition:left .6s}
    .btn:hover::before{left:100%}
    .btn-primary{background:linear-gradient(135deg,var(--primary-color),var(--primary-dark));color:#fff;box-shadow:var(--shadow-md)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(52,152,219,.3)}
    .btn-primary:disabled{background:var(--text-light);cursor:not-allowed;transform:none}
    .loading-spinner{width:20px;height:20px;border:2px solid rgba(255,255,255,.3);border-top:2px solid #fff;border-radius:50%;animation:spin 1s linear infinite}
    .result-section{margin-top:32px;opacity:0;transform:translateY(20px);transition:var(--transition)}
    .result-section.show{opacity:1;transform:translateY(0)}
    .result-card{border-radius:var(--border-radius-sm);padding:24px;margin-bottom:16px;border-left:4px solid;position:relative;overflow:hidden}
    .result-success{background:linear-gradient(135deg,#d4edda,#c3e6cb);border-color:var(--success-color);color:#155724}
    .result-error{background:linear-gradient(135deg,#f8d7da,#f5c6cb);border-color:var(--error-color);color:#721c24}
    .result-warning{background:linear-gradient(135deg,#fff3cd,#ffeaa7);border-color:var(--warning-color);color:#856404}
    .ip-grid{display:grid;gap:16px;margin-top:20px}
    .ip-item{background:rgba(255,255,255,.9);border:1px solid var(--border-color);border-radius:var(--border-radius-sm);padding:20px;transition:var(--transition)}
    .ip-item:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}
    .ip-status-line{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .status-icon{font-size:18px;margin-left:auto}
    .copy-btn{background:var(--bg-secondary);border:1px solid var(--border-color);padding:6px 12px;border-radius:6px;font-size:14px;cursor:pointer;transition:var(--transition);display:inline-flex;align-items:center;gap:4px;margin:4px 0}
    .copy-btn:hover{background:var(--primary-color);color:#fff;border-color:var(--primary-color)}
    .copy-btn.copied{background:var(--success-color);color:#fff;border-color:var(--success-color)}
    .tag{padding:4px 8px;border-radius:16px;font-size:12px;font-weight:500}
    .tag-country{background:#e3f2fd;color:#1976d2}
    .tag-as{background:#f3e5f5;color:#7b1fa2}
    .api-docs{background:var(--bg-primary);border-radius:var(--border-radius);padding:32px;box-shadow:var(--shadow-lg);animation:fadeInUp .8s ease-out .2s both}
    .section-title{font-size:1.8rem;font-weight:700;color:var(--text-primary);margin-bottom:24px;position:relative;padding-bottom:12px}
    .section-title::after{content:"";position:absolute;bottom:0;left:0;width:60px;height:3px;background:linear-gradient(90deg,var(--primary-color),var(--secondary-color));border-radius:2px}
    .code-block{background:#2d3748;color:#e2e8f0;padding:20px;border-radius:var(--border-radius-sm);font-family:'Monaco','Menlo','Ubuntu Mono',monospace;font-size:14px;overflow-x:auto;margin:16px 0;border:1px solid #4a5568;position:relative}
    .code-block::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#48bb78,#38b2ac)}
    .highlight{color:#f56565;font-weight:600}
    .footer{text-align:center;padding:20px;color:rgba(255,255,255,.8);font-size:14px;margin-top:40px;border-top:1px solid rgba(255,255,255,.1)}
    .token-badge{position:fixed;top:20px;left:20px;background:linear-gradient(135deg,var(--success-color),var(--secondary-color));color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;z-index:1000;box-shadow:var(--shadow-md)}
    .toast{position:fixed;bottom:20px;right:20px;background:var(--text-primary);color:#fff;padding:12px 20px;border-radius:var(--border-radius-sm);box-shadow:var(--shadow-lg);transform:translateY(100px);opacity:0;transition:var(--transition);z-index:1000}
    .toast.show{transform:translateY(0);opacity:1}
    .tooltip{position:relative;display:inline-block;cursor:help}
    .tooltip .tooltiptext{visibility:hidden;width:420px;background:#2c3e50;color:#fff;text-align:left;border-radius:8px;padding:12px 16px;position:fixed;z-index:9999;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0;transition:opacity .3s;box-shadow:0 4px 20px rgba(0,0,0,.3);font-size:14px;max-width:90vw}
    .tooltip:hover .tooltiptext{visibility:visible;opacity:1}
    @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
    @keyframes fadeInDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:768px){.container{padding:16px}.card{padding:24px}.input-group{flex-direction:column}.input-wrapper{min-width:auto}.btn{width:100%}}
  </style>
</head>
<body>
  ${tokenBadge}

  <div class="container">
    <header class="header">
      <h1 class="main-title">Check ProxyIP</h1>
      ${secureSubtitle}
      <div class="badge">🌍 基于 Cloudflare Workers 边缘计算</div>
    </header>

    <div class="card">
      <div class="form-section" style="margin-bottom:32px">
        <label for="proxyip" class="form-label">🔍 输入 ProxyIP 地址</label>
        <div class="input-group">
          <div class="input-wrapper">
            <input type="text" id="proxyip" class="form-input" placeholder="例如: 1.2.3.4:443 或 example.com" autocomplete="off">
          </div>
          <button id="checkBtn" class="btn btn-primary" onclick="checkProxyIP()">
            <span class="btn-text">检测</span>
            <div class="loading-spinner" style="display:none"></div>
          </button>
        </div>
      </div>
      <div id="result" class="result-section"></div>
    </div>

    <!-- ProxyIP 概念说明 -->
    <div class="api-docs">
      <h2 class="section-title">🤔 什么是 ProxyIP ？</h2>
      <h3 style="color:var(--text-primary);margin:24px 0 16px">📖 ProxyIP 概念</h3>
      <p style="margin-bottom:16px;line-height:1.8;color:var(--text-secondary)">
        在 Cloudflare Workers 环境中，ProxyIP 特指那些能够成功代理连接到 Cloudflare 服务的第三方 IP 地址。
      </p>
      <h3 style="color:var(--text-primary);margin:24px 0 16px">🔧 技术原理</h3>
      <p style="margin-bottom:16px;line-height:1.8;color:var(--text-secondary)">
        根据 Cloudflare Workers 的 <a href="https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/" target="_blank" style="color:var(--primary-color);text-decoration:none">TCP Sockets 官方文档</a> 说明，Cloudflare Workers 无法直接连接到 Cloudflare 自有 IP 段，需借助第三方服务器作为跳板：
      </p>
      <div style="background:var(--bg-secondary);padding:20px;border-radius:var(--border-radius-sm);margin:20px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
        <div style="background:#e3f2fd;padding:12px;border-radius:8px;text-align:center;flex:1;min-width:120px"><div style="font-weight:600;color:#1976d2">Cloudflare Workers</div><div style="font-size:.9rem;color:var(--text-secondary)">发起请求</div></div>
        <div style="color:var(--primary-color);font-size:1.5rem">→</div>
        <div style="background:#f3e5f5;padding:12px;border-radius:8px;text-align:center;flex:1;min-width:120px"><div style="font-weight:600;color:#7b1fa2">ProxyIP 服务器</div><div style="font-size:.9rem;color:var(--text-secondary)">第三方代理</div></div>
        <div style="color:var(--primary-color);font-size:1.5rem">→</div>
        <div style="background:#e8f5e8;padding:12px;border-radius:8px;text-align:center;flex:1;min-width:120px"><div style="font-weight:600;color:#388e3c">Cloudflare 服务</div><div style="font-size:.9rem;color:var(--text-secondary)">目标服务</div></div>
      </div>
      <h3 style="color:var(--text-primary);margin:24px 0 16px">✅ 有效 ProxyIP 特征</h3>
      <div style="background:linear-gradient(135deg,#d4edda,#c3e6cb);padding:20px;border-radius:var(--border-radius-sm);border-left:4px solid var(--success-color)">
        <ul style="margin:0;color:#155724;line-height:1.8;padding-left:20px">
          <li><strong>网络连通性：</strong>能够成功建立到指定端口（通常为 443）的 TCP 连接</li>
          <li><strong>代理功能：</strong>具备反向代理 Cloudflare IP 段的 HTTPS 服务能力</li>
        </ul>
      </div>
      <h3 style="color:var(--text-primary);margin:24px 0 16px">📝 支持的输入格式</h3>
      <div class="code-block">
# IPv4 地址<br>
1.2.3.4<br><br>
# IPv4 地址 + 端口<br>
1.2.3.4:443<br><br>
# IPv6 地址<br>
[2001:db8::1]<br><br>
# IPv6 地址 + 端口<br>
[2001:db8::1]:443<br><br>
# 域名（自动解析）<br>
example.com<br><br>
# 域名 + 端口<br>
example.com:443<br><br>
# 特殊格式（.tp端口号）<br>
example.com.tp443.com
      </div>
    </div>

    <!-- API 文档 -->
    <div class="api-docs" style="margin-top:50px">
      <h2 class="section-title">📚 API 文档</h2>
      <p style="margin-bottom:24px;color:var(--text-secondary);font-size:1.1rem">提供简单易用的 RESTful API 接口，支持 ProxyIP 检测、域名解析和 IP 信息查询</p>

      <h3 style="color:var(--text-primary);margin:24px 0 16px">📍 检查 ProxyIP</h3>
      <div class="code-block"><strong style="color:#68d391">GET</strong> /check?proxyip=<span class="highlight">YOUR_PROXY_IP</span></div>
      <p style="color:var(--text-secondary);margin-top:8px;font-size:.95rem">支持格式：IPv4、IPv6、域名，可带端口号（默认 443）</p>

      <h3 style="color:var(--text-primary);margin:24px 0 16px">💡 使用示例</h3>
      <div class="code-block">curl "${curlExample}"</div>

      <h3 style="color:var(--text-primary);margin:24px 0 16px">🔗 响应 JSON 格式</h3>
      <div class="code-block">
{<br>
&nbsp;&nbsp;"success": true,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// ProxyIP 是否有效<br>
&nbsp;&nbsp;"proxyIP": "1.2.3.4",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 检测的 IP<br>
&nbsp;&nbsp;"portRemote": 443,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 端口<br>
&nbsp;&nbsp;"colo": "HKG",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// Cloudflare 机房代码<br>
&nbsp;&nbsp;"responseTime": 166,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 响应时间(ms)<br>
&nbsp;&nbsp;"message": "第1次验证有效ProxyIP",<br>
&nbsp;&nbsp;"timestamp": "2025-06-03T17:27:52.946Z"<br>
}
      </div>
      <p style="color:var(--text-secondary);margin-top:8px;font-size:.95rem">失败时：<code style="background:rgba(231,76,60,.1);padding:2px 6px;border-radius:4px">success: false</code>，<code style="background:rgba(231,76,60,.1);padding:2px 6px;border-radius:4px">proxyIP: -1</code>，<code style="background:rgba(231,76,60,.1);padding:2px 6px;border-radius:4px">responseTime: -1</code></p>

      <h3 style="color:var(--text-primary);margin:24px 0 16px">📍 解析域名</h3>
      <div class="code-block"><strong style="color:#68d391">GET</strong> /resolve?domain=<span class="highlight">example.com</span></div>
      <p style="color:var(--text-secondary);margin-top:8px;font-size:.95rem">返回域名对应的所有 A 记录和 AAAA 记录</p>

      <h3 style="color:var(--text-primary);margin:24px 0 16px">📍 查询 IP 信息</h3>
      <div class="code-block"><strong style="color:#68d391">GET</strong> /ip-info?ip=<span class="highlight">1.2.3.4</span></div>
      <p style="color:var(--text-secondary);margin-top:8px;font-size:.95rem">数据来源：<a href="https://ipapi.is" target="_blank" style="color:var(--primary-color)">ipapi.is</a>，包含 ASN、地理位置、风险评分等详细信息</p>

      ${tokenSection}
    </div>

    <div class="footer">
      <p style="margin-top:8px;opacity:.8">© 2025 代理检测服务 - 基于 Cloudflare Workers 构建 | IP数据来源: ipapi.is</p>
      ${footerToken}
    </div>
  </div>

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

      // 保留路径，不应作为自动检测的 ProxyIP
      const reservedPaths = ['proxyip', 'proxy', 'check', 'resolve', 'ip-info', 'favicon.ico'];

      // 自动检测：路径参数或 localStorage
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
      return '<span class="copy-btn" data-copy="' + text + '">' + text + '</span>';
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

      // TOKEN 过期检测（仅无路径TOKEN时）
      if (!pathToken && calculateTimestamp() !== pageLoadTimestamp) {
        showToast('TOKEN已过期，正在刷新页面...');
        setTimeout(() => { window.location.href = window.location.protocol + '//' + window.location.host + '/' + encodeURIComponent(proxyip); }, 1000);
        return;
      }

      try { localStorage.setItem('lastProxyIP', proxyip); } catch(_) {}

      isChecking = true;
      btn.disabled = true; btn.classList.add('btn-loading');
      btnText.style.display = 'none'; spinner.style.display = 'block';
      resultDiv.classList.remove('show');

      try {
        if (isIPAddress(proxyip)) await checkSingleIP(proxyip, resultDiv);
        else await checkDomain(proxyip, resultDiv);
      } catch(err) {
        resultDiv.innerHTML = '<div class="result-card result-error"><h3>❌ 检测失败</h3><p><strong>错误信息:</strong> ' + err.message + '</p><p><strong>检测时间:</strong> ' + new Date().toLocaleString() + '</p></div>';
        resultDiv.classList.add('show');
      } finally {
        isChecking = false;
        btn.disabled = false; btn.classList.remove('btn-loading');
        btnText.style.display = 'block'; spinner.style.display = 'none';
      }
    }

    async function checkSingleIP(proxyip, resultDiv) {
      const data = await callAPI('./check', { proxyip });
      const ipInfo = data.success ? await getIPInfo(data.proxyIP) : null;
      const ipInfoHTML = formatIPInfo(ipInfo);
      if (data.success) {
        const rtHTML = data.responseTime > 0
          ? '<div class="tooltip"><span style="background:var(--success-color);color:#fff;padding:4px 8px;border-radius:6px;font-weight:600;font-size:14px">' + data.responseTime + 'ms</span><span class="tooltiptext">该延迟并非 <strong>您当前网络</strong> 到 ProxyIP 的实际延迟，<br>而是 <strong>Cloudflare.' + (data.colo||'CF') + ' 机房</strong> 到 ProxyIP 的响应时间。</span></div>'
          : '<span style="color:var(--text-light)">延迟未知</span>';
        resultDiv.innerHTML = '<div class="result-card result-success"><h3>✅ ProxyIP 有效</h3><div style="margin-top:20px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap"><strong>🌐 ProxyIP 地址:</strong>' + createCopyButton(data.proxyIP) + ipInfoHTML + rtHTML + '</div><p><strong>🔌 端口:</strong> ' + createCopyButton(String(data.portRemote)) + '</p><p><strong>🏢 机房信息:</strong> ' + (data.colo||'CF') + '</p><p><strong>🕒 检测时间:</strong> ' + new Date(data.timestamp).toLocaleString() + '</p></div></div>';
      } else {
        resultDiv.innerHTML = '<div class="result-card result-error"><h3>❌ ProxyIP 失效</h3><div style="margin-top:20px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap"><strong>🌐 IP地址:</strong>' + createCopyButton(proxyip) + ipInfoHTML + '<span style="color:var(--error-color);font-weight:600;font-size:18px">❌</span></div><p><strong>🔌 端口:</strong> ' + (data.portRemote !== -1 ? createCopyButton(String(data.portRemote)) : '未知') + '</p><p><strong>🏢 机房信息:</strong> ' + (data.colo||'CF') + '</p>' + (data.message ? '<p><strong>错误信息:</strong> ' + data.message + '</p>' : '') + '<p><strong>🕒 检测时间:</strong> ' + new Date(data.timestamp).toLocaleString() + '</p></div></div>';
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
      resultDiv.innerHTML = '<div class="result-card result-warning"><h3>🔍 域名解析结果</h3><div style="margin-top:20px"><p><strong>🌐 ProxyIP 域名:</strong> ' + createCopyButton(cleanDomain) + '</p><p><strong>🔌 端口:</strong> ' + createCopyButton(String(port)) + '</p><p><strong>🏢 机房信息:</strong> <span id="domain-colo">检测中...</span></p><p><strong>📋 发现IP:</strong> ' + ips.length + ' 个</p><p><strong>🕒 解析时间:</strong> ' + new Date().toLocaleString() + '</p></div><div class="ip-grid" id="ip-grid">' + ips.map((ip, i) => '<div class="ip-item" id="ip-item-' + i + '"><div class="ip-status-line" id="ip-status-line-' + i + '"><strong>IP:</strong>' + createCopyButton(ip) + '<span id="ip-info-' + i + '" style="color:var(--text-secondary)">获取信息中...</span><span class="status-icon" id="status-icon-' + i + '">🔄</span></div></div>').join('') + '</div></div>';
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
          item.style.background = 'linear-gradient(135deg,#d4edda,#c3e6cb)';
          item.style.borderColor = 'var(--success-color)';
          icon.innerHTML = result.responseTime > 0
            ? '<div class="tooltip"><span style="background:var(--success-color);color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;font-weight:600">' + result.responseTime + 'ms</span><span class="tooltiptext">Cloudflare.' + (result.colo||'CF') + ' 机房到 ProxyIP 的响应时间</span></div>'
            : '<span style="color:var(--text-light);font-size:12px">延迟未知</span>';
          icon.className = 'status-icon status-success';
        } else {
          item.style.background = 'linear-gradient(135deg,#f8d7da,#f5c6cb)';
          item.style.borderColor = 'var(--error-color)';
          icon.textContent = '❌'; icon.className = 'status-icon status-error'; icon.style.color = 'var(--error-color)';
        }
      } catch(e) {
        const icon = document.getElementById('status-icon-' + i);
        if (icon) { icon.textContent = '❌'; icon.style.color = 'var(--error-color)'; }
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
        if (el) el.innerHTML = '<span style="color:var(--text-light)">信息获取失败</span>';
      }
    }

    async function getIPInfo(ip) {
      try { return await callAPI('./ip-info', { ip: ip.replace(/[\\[\\]]/g, '') }); } catch(_) { return null; }
    }

    // 格式化 IP 信息（适配 ipapi.is 响应字段）
    function formatIPInfo(info) {
      if (!info || info.error) return '<span style="color:var(--text-light)">信息获取失败</span>';
      const country = info.location?.country_code || info.country || '未知';
      const org = info.asn?.org || info.company?.name || (info.asn?.asn ? 'AS' + info.asn.asn : '') || '未知';
      return '<span class="tag tag-country">' + country + '</span><span class="tag tag-as">' + org + '</span>';
    }
  </script>
</body>
</html>`;
}
