// ============================================================
//  pageProxy.js — SOCKS5 / HTTP 代理检测前端页面（浅色现代主题）
// ============================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJs(str) {
  if (!str) return '""';
  return JSON.stringify(String(str));
}

export function renderProxyPage(hostname, ico, bgStyle, pathToken) {
  const safeToken = escapeJs(pathToken || '');
  const base = pathToken ? `/${pathToken}` : '';
  const tokenBadge = pathToken ? '<div class="token-badge">🔑 TOKEN验证通过</div>' : '';
  const curlExample = 'https://' + hostname + base + '/check?proxy=socks5://user:pass@1.2.3.4:1080';

  let tokenScript = '';
  if (pathToken) {
    tokenScript = '<script>\n' +
      '(function(){\n' +
      '  var orig = window.fetch;\n' +
      '  var tk = ' + safeToken + ';\n' +
      '  window.fetch = function(url, opts){\n' +
      '    if(typeof url === "string" && (url.indexOf("/check")!==-1 || url.indexOf("/ip-info")!==-1)){\n' +
      '      url += (url.indexOf("?")!==-1 ? "&" : "?") + "token=" + encodeURIComponent(tk);\n' +
      '    }\n' +
      '    return orig.call(this, url, opts);\n' +
      '  };\n' +
      '})();\n' +
      '<\/script>';
  }

  let tokenSection = '';
  if (pathToken) {
    tokenSection = `
    <div class="doc-card">
      <div class="doc-card-header">
        <span class="doc-card-icon">🔐</span>
        <h3>TOKEN 访问方式</h3>
      </div>
      <div class="token-grid">
        <div class="token-item">
          <div class="token-label">路径 TOKEN（推荐）</div>
          <div class="code-inline">https://${hostname}/<span class="highlight">${escapeHtml(pathToken)}</span>/check?proxy=...</div>
        </div>
        <div class="token-item">
          <div class="token-label">参数 TOKEN</div>
          <div class="code-inline">https://${hostname}/check?proxy=...&token=<span class="highlight">${escapeHtml(pathToken)}</span></div>
        </div>
      </div>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Check SOCKS5/HTTP - 代理检测服务</title>
${ico ? '<link rel="icon" href="' + ico + '" type="image/x-icon">\n' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--primary:#10b981;--primary-dark:#059669;--primary-light:#34d399;--secondary:#6366f1;--accent:#f59e0b;--success:#10b981;--warning:#f59e0b;--error:#ef4444;--bg-main:#f8fafc;--bg-card:#ffffff;--bg-input:#f1f5f9;--bg-hover:#f1f5f9;--text-dark:#1e293b;--text-body:#475569;--text-muted:#94a3b8;--border:#e2e8f0;--shadow:0 1px 3px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.04)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(180deg,#f1f5f9 0%,#f8fafc 100%);min-height:100vh;color:var(--text-dark)}
.nav{position:sticky;top:0;z-index:1000;padding:16px 24px;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border)}
.nav-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--text-dark)}
.nav-logo-icon{width:42px;height:42px;background:linear-gradient(135deg,var(--primary),var(--secondary));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;box-shadow:0 4px 12px rgba(16,185,129,.25)}
.nav-logo-text{font-size:1.2rem;font-weight:700;color:var(--text-dark)}
.nav-links{display:flex;gap:6px}
.nav-link{padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:500;font-size:.9rem;transition:all .2s;color:var(--text-body);background:transparent}
.nav-link:hover{background:var(--bg-hover);color:var(--text-dark)}
.nav-link.active{color:#fff;background:linear-gradient(135deg,var(--primary),var(--primary-dark));box-shadow:0 2px 8px rgba(16,185,129,.3)}
.main{padding:60px 24px 80px;max-width:1200px;margin:0 auto}
.hero{text-align:center;margin-bottom:40px}
.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.05));border-radius:100px;font-size:.85rem;color:var(--primary-dark);margin-bottom:16px;font-weight:500}
.hero h1{font-size:clamp(1.8rem,4vw,2.5rem);font-weight:800;letter-spacing:-.02em;line-height:1.2;margin-bottom:10px;color:var(--text-dark)}
.hero p{font-size:1rem;color:var(--text-body);max-width:500px;margin:0 auto}
.input-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:var(--shadow)}
.input-group{display:flex;gap:12px;align-items:stretch}
.input-wrapper{flex:1}
.form-input{width:100%;padding:14px 18px;border:2px solid var(--border);border-radius:12px;font-size:15px;font-family:inherit;transition:all .2s ease;background:var(--bg-input);color:var(--text-dark)}
.form-input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 4px rgba(16,185,129,.1);background:#fff}
.form-input::placeholder{color:var(--text-muted)}
.btn{padding:14px 28px;border:none;border-radius:12px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s ease;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:140px}
.btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;box-shadow:0 4px 12px rgba(16,185,129,.25)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(16,185,129,.35)}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
.loading-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top:2px solid #fff;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.results-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
.info-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow)}
.info-card-header{background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.03));padding:18px 22px;border-bottom:1px solid var(--border)}
.info-card-header h3{font-size:1rem;font-weight:700;display:flex;align-items:center;gap:10px;color:var(--text-dark)}
.info-card-header .response-time{margin-left:auto;font-size:.8rem;color:var(--text-muted)}
.info-card-content{padding:20px 22px}
.info-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)}
.info-item:last-child{border-bottom:none}
.info-label{font-weight:500;color:var(--text-muted);font-size:.85rem}
.info-value{text-align:right;color:var(--text-dark);font-size:.85rem}
.status-yes{background:linear-gradient(135deg,#fef2f2,#fee2e2);color:#dc2626;padding:3px 8px;border-radius:6px;font-size:.75rem;font-weight:600;border:1px solid #fecaca}
.status-no{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#059669;padding:3px 8px;border-radius:6px;font-size:.75rem;font-weight:600;border:1px solid #a7f3d0}
.ip-selector{display:flex;align-items:center;justify-content:flex-end;gap:8px}
.more-ip-btn{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:var(--primary-dark);border:1px solid #a7f3d0;border-radius:6px;padding:3px 8px;font-size:.75rem;cursor:pointer;transition:all .2s;font-weight:500}
.more-ip-btn:hover{background:linear-gradient(135deg,#d1fae5,#a7f3d0)}
.ip-dropdown{position:absolute;right:0;top:100%;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.12);z-index:100;min-width:180px;max-height:180px;overflow-y:auto;display:none;margin-top:4px}
.ip-dropdown.show{display:block}
.ip-option{padding:8px 12px;cursor:pointer;transition:background .2s;font-size:.85rem}
.ip-option:hover{background:var(--bg-hover)}
.ip-option.active{background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:var(--primary-dark)}
.ip-value-container{position:relative}
.loading{text-align:center;padding:30px;color:var(--text-muted)}
.error{text-align:center;padding:20px;color:var(--error);background:linear-gradient(135deg,#fef2f2,#fee2e2);border-radius:10px;margin:10px;border:1px solid #fecaca;font-size:.9rem}
.waiting{text-align:center;padding:30px;color:var(--text-muted);font-size:.9rem}
.doc-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:28px;margin-bottom:24px;box-shadow:var(--shadow)}
.doc-card-header{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.doc-card-icon{width:40px;height:40px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem}
.doc-card h2{font-size:1.3rem;font-weight:700;color:var(--text-dark)}
.doc-card h3{font-size:1rem;font-weight:600;color:var(--text-dark);margin:20px 0 10px}
.doc-card p{color:var(--text-body);line-height:1.7;margin-bottom:14px;font-size:.95rem}
.code-block{background:var(--bg-input);color:var(--text-dark);padding:18px;border-radius:10px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;overflow-x:auto;margin:14px 0;border:1px solid var(--border)}
.code-block .highlight{color:var(--primary-dark);font-weight:600}
.code-block .method{color:#059669;font-weight:600}
.code-inline{background:var(--bg-input);padding:8px 12px;border-radius:8px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;display:block;margin-top:8px;border:1px solid var(--border)}
.code-inline .highlight{color:var(--primary-dark);font-weight:600}
.token-grid{display:grid;gap:14px}
.token-item{background:var(--bg-hover);padding:14px;border-radius:10px;border:1px solid var(--border)}
.token-label{font-size:.8rem;color:var(--text-muted);margin-bottom:6px}
.field-table{width:100%;border-collapse:collapse;margin:14px 0;background:var(--bg-card);border-radius:10px;overflow:hidden;border:1px solid var(--border)}
.field-table th{background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.03));color:var(--primary-dark);padding:12px 14px;text-align:left;font-weight:600;font-size:.8rem;border-bottom:1px solid var(--border)}
.field-table td{padding:12px 14px;border-bottom:1px solid var(--border);font-size:.85rem;color:var(--text-body)}
.field-table tr:last-child td{border-bottom:none}
.field-table tr:hover td{background:var(--bg-hover)}
.footer{text-align:center;padding:30px 0;color:var(--text-muted);font-size:.85rem;border-top:1px solid var(--border);margin-top:30px}
.token-badge{position:fixed;top:70px;left:20px;background:linear-gradient(135deg,var(--success),#059669);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;z-index:999;box-shadow:0 4px 12px rgba(16,185,129,.25)}
.toast{position:fixed;bottom:20px;right:20px;background:var(--bg-card);color:var(--text-dark);padding:12px 18px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.12);transform:translateY(80px);opacity:0;transition:all .3s ease;z-index:1001;border:1px solid var(--border)}
.toast.show{transform:translateY(0);opacity:1}
@media(max-width:900px){.results-grid{grid-template-columns:1fr}}
@media(max-width:768px){.nav{padding:12px 16px}.nav-links{display:none}.main{padding:40px 16px 60px}.input-card,.doc-card{padding:20px}.input-group{flex-direction:column}.btn{width:100%}.hero h1{font-size:1.5rem}}
</style>
${tokenScript}
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
      <a href="${base}/proxyip" class="nav-link">ProxyIP</a>
      <a href="${base}/proxy" class="nav-link active">SOCKS5/HTTP</a>
    </div>
  </div>
</nav>

<main class="main">
  <div class="hero">
    <div class="hero-badge">🔌 SOCKS5 / HTTP 代理检测</div>
    <h1>Check Proxy</h1>
    <p>检测代理服务器的连通性，获取出入口 IP 信息与风险评估</p>
  </div>

  <div class="input-card">
    <div class="input-group">
      <div class="input-wrapper">
        <input type="text" id="proxyInput" class="form-input" placeholder="输入代理链接，例如：socks5://username:password@host:port">
      </div>
      <button id="checkBtn" class="btn btn-primary">
        <span class="btn-text">开始检测</span>
        <div class="loading-spinner" style="display:none"></div>
      </button>
    </div>
  </div>

  <div class="results-grid">
    <div class="info-card">
      <div class="info-card-header">
        <h3>📥 入口信息</h3>
      </div>
      <div class="info-card-content" id="entryInfo">
        <div class="waiting">请输入代理链接并点击检测</div>
      </div>
    </div>
    <div class="info-card">
      <div class="info-card-header">
        <h3 id="exitInfoTitle">📤 出口信息</h3>
      </div>
      <div class="info-card-content" id="exitInfo">
        <div class="waiting">请输入代理链接并点击检测</div>
      </div>
    </div>
  </div>

  <div class="doc-card">
    <div class="doc-card-header">
      <span class="doc-card-icon">📖</span>
      <h2>使用说明</h2>
    </div>
    <h3>支持的代理格式</h3>
    <div class="code-block">
# SOCKS5 代理（有认证）<br>
socks5://username:password@host:1080<br><br>
# SOCKS5 代理（无认证）<br>
socks5://host:1080<br><br>
# HTTP 代理（有认证）<br>
http://username:password@host:8080<br><br>
# IPv6 地址需要用方括号<br>
socks5://username:password@[2001:db8::1]:1080
    </div>
    <h3>入口信息 vs 出口信息</h3>
    <p><strong>入口信息：</strong>代理服务器本身的 IP 地址信息（地理位置、ASN、风险评分等）</p>
    <p><strong>出口信息：</strong>通过代理后实际出口的 IP 地址信息，代表你的真实网络身份</p>
  </div>

  <div class="doc-card">
    <div class="doc-card-header">
      <span class="doc-card-icon">📚</span>
      <h2>API 文档</h2>
    </div>
    <h3>检测代理</h3>
    <div class="code-block"><span class="method">GET</span> /check?proxy=<span class="highlight">socks5://user:pass@host:port</span></div>
    <p style="font-size:.85rem">也支持简写格式：<code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;border:1px solid var(--border)">/check?socks5=user:pass@host:port</code></p>
    <h3>使用示例</h3>
    <div class="code-block">curl "${curlExample}"</div>
    <h3>响应字段</h3>
    <table class="field-table">
      <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>
      <tbody>
        <tr><td>is_datacenter</td><td>boolean</td><td>是否为数据中心 IP</td></tr>
        <tr><td>is_proxy</td><td>boolean</td><td>是否为代理服务器</td></tr>
        <tr><td>is_vpn</td><td>boolean</td><td>是否为 VPN 服务器</td></tr>
        <tr><td>is_tor</td><td>boolean</td><td>是否为 Tor 出口节点</td></tr>
        <tr><td>is_crawler</td><td>boolean</td><td>是否为网络爬虫</td></tr>
        <tr><td>is_abuser</td><td>boolean</td><td>是否有滥用行为记录</td></tr>
        <tr><td>asn.org</td><td>string</td><td>所属组织/ISP</td></tr>
        <tr><td>location.country_code</td><td>string</td><td>国家代码</td></tr>
      </tbody>
    </table>
    ${tokenSection}
  </div>

  <footer class="footer">
    © 2025 Proxy Checker · 基于 Cloudflare Workers 构建 · IP数据来源: ipapi.is
  </footer>
</main>

<div id="toast" class="toast"></div>

<script>
(function() {
  var currentDomainInfo = null;
  var currentProxyTemplate = null;
  var pathToken = ${safeToken};

  function showToast(msg, dur) {
    dur = dur || 3000;
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function() { t.classList.remove("show"); }, dur);
  }

  if (pathToken) {
    document.addEventListener("DOMContentLoaded", function() {
      showToast("✅ TOKEN验证通过，所有功能已启用", 4000);
    });
  }

  function preprocessProxyUrl(input) {
    var p = input.trim();
    if (p.indexOf("#") !== -1) p = p.split("#")[0].trim();
    while (p.charAt(0) === "/") p = p.substring(1);
    if (p.indexOf("://") === -1) p = "socks5://" + p;
    var parts = p.split("://");
    var scheme = parts[0];
    var rest = parts[1];
    var auth = "";
    var host = rest;
    if (host.indexOf("@") !== -1) {
      var i = host.lastIndexOf("@");
      auth = host.substring(0, i + 1);
      host = host.substring(i + 1);
    }
    var hostParts = host.split(":");
    if (hostParts.length > 2) {
      var port = hostParts[hostParts.length - 1];
      var h = hostParts.slice(0, -1).join(":");
      if (isIPv6Address(h) && h.charAt(0) !== "[") p = scheme + "://" + auth + "[" + h + "]:" + port;
    }
    return p;
  }

  function extractHostFromProxy(proxyUrl) {
    var u = proxyUrl.indexOf("://") !== -1 ? proxyUrl.split("://")[1] : proxyUrl;
    if (u.indexOf("@") !== -1) u = u.substring(u.lastIndexOf("@") + 1);
    if (u.charAt(0) === "[" && u.indexOf("]:") !== -1) return u.substring(1, u.indexOf("]:"));
    var h = u.split(":")[0];
    if (h.charAt(0) === "[" && h.indexOf("]") !== -1) h = h.substring(1, h.indexOf("]"));
    return h;
  }

  function isIPAddress(h) {
    return /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(h) || isIPv6Address(h);
  }

  function isIPv6Address(h) {
    return /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$/.test(h);
  }

  function replaceHostInProxy(proxyUrl, newHost) {
    var parts = proxyUrl.split("://");
    var proto = parts[0];
    var rest = parts[1];
    var auth = "";
    var h = rest;
    if (h.indexOf("@") !== -1) {
      var i = h.lastIndexOf("@");
      auth = h.substring(0, i + 1);
      h = h.substring(i + 1);
    }
    var port = h.split(":")[h.split(":").length - 1];
    var nh = (isIPv6Address(newHost) && newHost.charAt(0) !== "[") ? "[" + newHost + "]" : newHost;
    return proto + "://" + auth + nh + ":" + port;
  }

  async function fetchDNSRecords(domain, type) {
    var url = "https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(domain) + "&type=" + encodeURIComponent(type);
    var r = await fetch(url, { headers: { Accept: "application/dns-json" } });
    var d = await r.json();
    return d.Answer || [];
  }

  async function resolveDomainIPs(domain) {
    var v4 = await fetchDNSRecords(domain, "A").catch(function() { return []; });
    var v6 = await fetchDNSRecords(domain, "AAAA").catch(function() { return []; });
    var all = v4.map(function(r) { return r.data; }).concat(v6.map(function(r) { return r.data; })).filter(Boolean);
    if (!all.length) throw new Error("无法解析域名 " + domain + " 的 IP");
    return { domain: domain, all_ips: all, ipv4_addresses: v4.map(function(r) { return r.data; }), ipv6_addresses: v6.map(function(r) { return r.data; }), default_ip: all[0] };
  }

  function formatIpType(type) {
    if (!type) return "<span>未知</span>";
    var m = { isp: { t: "住宅", s: "color:#059669;font-weight:600" }, hosting: { t: "机房", s: "color:#d97706;font-weight:600" }, business: { t: "商用", s: "color:#2563eb;font-weight:600" } };
    var x = m[type.toLowerCase()];
    return x ? "<span style=\\"" + x.s + "\\">" + x.t + "</span>" : "<span style=\\"font-weight:600\\">" + type + "</span>";
  }

  function calculateAbuseScore(cScore, aScore, flags) {
    var c = parseFloat(cScore) || 0;
    var a = parseFloat(aScore) || 0;
    var base = ((c + a) / 2) * 5;
    var risk = flags.is_bogon ? 1.0 : 0;
    risk += [flags.is_crawler, flags.is_proxy, flags.is_vpn, flags.is_tor, flags.is_abuser].filter(Boolean).length * 0.15;
    return (base === 0 && risk === 0) ? null : base + risk;
  }

  function getRiskLevelColor(lv) {
    var colors = { "极度危险": "#dc2626", "高风险": "#ef4444", "轻微风险": "#f97316", "纯净": "#10b981", "极度纯净": "#059669" };
    return colors[lv] || "#64748b";
  }

  function formatAbuseScorePercentage(s) {
    return s === null ? "未知" : (s * 100).toFixed(2) + "%";
  }

  function formatInfoDisplay(data, containerId, showIPSelector, responseTime) {
    var container = document.getElementById(containerId);
    if (containerId === "exitInfo") {
      var title = document.getElementById("exitInfoTitle");
      if (title) {
        if (responseTime !== null && data && data.success) title.innerHTML = "📤 出口信息 <span class='response-time'>(" + (responseTime / 1000).toFixed(2) + "s)</span>";
        else if (data && (!data.success || data.error)) title.innerHTML = "📤 出口信息 <span class='response-time'>(代理不可用)</span>";
        else title.innerHTML = "📤 出口信息";
      }
    }
    if (!data || data.error) { container.innerHTML = "<div class='error'>数据获取失败，请稍后重试</div>"; return; }

    var cScore = data.company ? data.company.abuser_score : null;
    var aScore = data.asn ? data.asn.abuser_score : null;
    var flags = { is_crawler: data.is_crawler, is_proxy: data.is_proxy, is_vpn: data.is_vpn, is_tor: data.is_tor, is_abuser: data.is_abuser, is_bogon: data.is_bogon };
    var combined = calculateAbuseScore(cScore, aScore, flags);
    var abuseHTML = "未知";
    if (combined !== null) {
      var pct = combined * 100;
      var lv = pct >= 100 ? "极度危险" : pct >= 20 ? "高风险" : pct >= 5 ? "轻微风险" : pct >= 0.25 ? "纯净" : "极度纯净";
      abuseHTML = "<span style=\\"background:" + getRiskLevelColor(lv) + ";color:#fff;padding:3px 8px;border-radius:6px;font-size:.75rem;font-weight:600\\">" + formatAbuseScorePercentage(combined) + " " + lv + "</span>";
    }

    var ipVal = data.ip || "N/A";
    var ipDisplay = ipVal;
    if (showIPSelector && currentDomainInfo && currentDomainInfo.all_ips && currentDomainInfo.all_ips.length > 1) {
      var ipOptions = currentDomainInfo.all_ips.map(function(ip) {
        return "<div class=\\"ip-option" + (ip === ipVal ? " active" : "") + "\\" data-ip=\\"" + ip + "\\">" + ip + "</div>";
      }).join("");
      ipDisplay = "<div class=\\"ip-selector\\"><button class=\\"more-ip-btn\\" id=\\"moreIpBtn\\">更多IP</button><span class=\\"ip-text\\">" + ipVal + "</span><div class=\\"ip-dropdown\\" id=\\"ipDropdown\\">" + ipOptions + "</div></div>";
    }

    function bool(v) {
      return "<span class=\\"" + (v ? "status-yes" : "status-no") + "\\">" + (v ? "是" : "否") + "</span>";
    }
    function row(label, val) {
      return "<div class=\\"info-item\\"><span class=\\"info-label\\">" + label + "</span><span class=\\"info-value\\">" + val + "</span></div>";
    }
    container.innerHTML =
      row("IP地址", "<div class=\\"ip-value-container\\">" + ipDisplay + "</div>") +
      row("运营商/ASN类型", formatIpType(data.company ? data.company.type : null) + " / " + formatIpType(data.asn ? data.asn.type : null)) +
      row("综合滥用评分", abuseHTML) +
      row("网络爬虫", bool(data.is_crawler)) +
      row("Tor网络", bool(data.is_tor)) +
      row("代理", bool(data.is_proxy)) +
      row("VPN", bool(data.is_vpn)) +
      row("滥用IP", bool(data.is_abuser)) +
      row("虚假IP", bool(data.is_bogon)) +
      row("自治系统编号", data.asn && data.asn.asn ? "AS" + data.asn.asn : "N/A") +
      row("所属组织", (data.asn && data.asn.org) || (data.company && data.company.name) || (data.asn && data.asn.asn ? "AS" + data.asn.asn : "") || "N/A") +
      row("国家", (data.location && data.location.country_code) || "N/A") +
      row("城市", (data.location && data.location.city) || "N/A");

    var moreIpBtn = document.getElementById("moreIpBtn");
    if (moreIpBtn) {
      moreIpBtn.onclick = function(e) {
        e.stopPropagation();
        var dd = document.getElementById("ipDropdown");
        dd.classList.toggle("show");
      };
    }
    var ipOptionsEls = document.querySelectorAll(".ip-option");
    for (var i = 0; i < ipOptionsEls.length; i++) {
      ipOptionsEls[i].onclick = function(e) {
        e.stopPropagation();
        var selectedIP = this.getAttribute("data-ip");
        selectIP(selectedIP);
      };
    }
    document.addEventListener("click", function closeDropdown(e) {
      var dd = document.getElementById("ipDropdown");
      if (dd && !e.target.closest(".ip-value-container")) {
        dd.classList.remove("show");
      }
    });
  }

  async function fetchEntryInfo(host, retry) {
    retry = retry || 0;
    try {
      var tq = pathToken ? "&token=" + encodeURIComponent(pathToken) : "";
      var r = await fetch("/ip-info?ip=" + encodeURIComponent(host) + tq);
      var d = await r.json();
      if (d.error && retry < 3) {
        await new Promise(function(res) { setTimeout(res, 1000); });
        return fetchEntryInfo(host, retry + 1);
      }
      return d;
    } catch(e) {
      if (retry < 3) {
        await new Promise(function(res) { setTimeout(res, 1000); });
        return fetchEntryInfo(host, retry + 1);
      }
      throw e;
    }
  }

  async function selectIP(selectedIP) {
    var dd = document.getElementById("ipDropdown");
    if (dd) dd.classList.remove("show");
    var btn = document.getElementById("checkBtn");
    var entry = document.getElementById("entryInfo");
    var exit = document.getElementById("exitInfo");
    btn.disabled = true;
    entry.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在获取入口信息...</div>";
    exit.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在获取出口信息...</div>";
    try {
      var entryIP = selectedIP.charAt(0) === "[" && selectedIP.charAt(selectedIP.length - 1) === "]" ? selectedIP.slice(1, -1) : selectedIP;
      var entryData = await fetchEntryInfo(entryIP);
      if (entryData.error) entry.innerHTML = "<div class='error'>入口信息获取失败</div>";
      else formatInfoDisplay(entryData, "entryInfo", true);
      var newProxy = replaceHostInProxy(currentProxyTemplate, selectedIP);
      var pr = await fetch("/check?proxy=" + encodeURIComponent(newProxy));
      var pd = await pr.json();
      if (!pd.success) {
        document.getElementById("exitInfoTitle").innerHTML = "📤 出口信息 <span class='response-time'>(代理不可用)</span>";
        exit.innerHTML = "<div class='error'>代理检测失败</div>";
      } else formatInfoDisplay(pd, "exitInfo", false, pd.responseTime);
    } catch(e) {
      entry.innerHTML = "<div class='error'>切换失败</div>";
      exit.innerHTML = "<div class='error'>切换失败</div>";
    } finally {
      btn.disabled = false;
    }
  }

  async function checkProxy() {
    var input = document.getElementById("proxyInput");
    var btn = document.getElementById("checkBtn");
    var entry = document.getElementById("entryInfo");
    var exit = document.getElementById("exitInfo");
    var btnText = btn.querySelector('.btn-text');
    var spinner = btn.querySelector('.loading-spinner');
    var rawProxy = input.value.trim();
    if (!rawProxy) { showToast("请输入代理链接"); return; }
    var proxyUrl = preprocessProxyUrl(rawProxy);
    input.value = proxyUrl;
    currentProxyTemplate = proxyUrl;
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    document.getElementById("exitInfoTitle").innerHTML = "📤 出口信息";
    entry.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在解析代理信息...</div>";
    exit.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在解析代理信息...</div>";
    try {
      var host = extractHostFromProxy(proxyUrl);
      var targetIP = host;
      var targetProxy = proxyUrl;
      currentDomainInfo = null;
      if (!isIPAddress(host)) {
        entry.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在解析域名...</div>";
        try {
          currentDomainInfo = await resolveDomainIPs(host);
          targetIP = currentDomainInfo.default_ip;
          targetProxy = replaceHostInProxy(proxyUrl, targetIP);
          currentProxyTemplate = proxyUrl;
        } catch(e) {
          entry.innerHTML = "<div class='error'>域名解析失败: " + e.message + "</div>";
          exit.innerHTML = "<div class='error'>域名解析失败: " + e.message + "</div>";
          return;
        }
      }
      entry.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在获取入口信息...</div>";
      exit.innerHTML = "<div class='loading'><div class='loading-spinner'></div>正在检测代理...</div>";
      var entryIP = (targetIP.charAt(0) === "[" && targetIP.charAt(targetIP.length - 1) === "]") ? targetIP.slice(1, -1) : targetIP;
      var results = await Promise.allSettled([
        fetchEntryInfo(entryIP),
        fetch("/check?proxy=" + encodeURIComponent(targetProxy)).then(function(r) { return r.json(); })
      ]);
      var ep = results[0];
      var xp = results[1];
      if (ep.status === "fulfilled") {
        if (ep.value.error) entry.innerHTML = "<div class='error'>入口信息获取失败</div>";
        else formatInfoDisplay(ep.value, "entryInfo", currentDomainInfo && currentDomainInfo.all_ips.length > 1);
      } else entry.innerHTML = "<div class='error'>入口信息获取失败</div>";
      if (xp.status === "fulfilled") {
        if (!xp.value.success) {
          document.getElementById("exitInfoTitle").innerHTML = "📤 出口信息 <span class='response-time'>(代理不可用)</span>";
          exit.innerHTML = "<div class='error'>代理检测失败: " + (xp.value.error || "请检查代理链接") + "</div>";
        } else formatInfoDisplay(xp.value, "exitInfo", false, xp.value.responseTime);
      } else {
        document.getElementById("exitInfoTitle").innerHTML = "📤 出口信息 <span class='response-time'>(代理不可用)</span>";
        exit.innerHTML = "<div class='error'>代理检测失败</div>";
      }
    } catch(e) {
      entry.innerHTML = "<div class='error'>检测失败</div>";
      document.getElementById("exitInfoTitle").innerHTML = "📤 出口信息 <span class='response-time'>(代理不可用)</span>";
      exit.innerHTML = "<div class='error'>检测失败</div>";
    } finally {
      btn.disabled = false;
      btnText.style.display = 'block';
      spinner.style.display = 'none';
    }
  }

  document.getElementById("proxyInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") checkProxy();
  });
  document.getElementById("checkBtn").addEventListener("click", checkProxy);
})();
<\/script>
</body>
</html>`;
}
