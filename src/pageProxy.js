// ============================================================
//  pageProxy.js — SOCKS5 / HTTP 代理检测前端页面
// ============================================================

export function renderProxyPage(hostname, ico, bgStyle, pathToken) {
  const icoTag = ico ? `<link rel="icon" href="${ico}" type="image/x-icon">` : '';
  const tokenScript = pathToken ? `
<script>
  (function(){
    const orig = window.fetch;
    window.fetch = function(url, opts={}) {
      if (typeof url === 'string' && (url.includes('/check') || url.includes('/ip-info'))) {
        url += (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent('${pathToken}');
      }
      return orig.call(this, url, opts);
    };
    document.addEventListener('DOMContentLoaded', function() {
      const h1 = document.querySelector('h1');
      if (h1) h1.textContent = '代理检测工具 (授权访问)';
      const hc = document.querySelector('.header-content');
      if (hc) { const n = document.createElement('p'); n.style.cssText='font-size:.9em;opacity:.8;margin-top:5px'; n.textContent='✓ 已通过路径TOKEN授权访问'; hc.appendChild(n); }
    });
  })();
<\/script>` : '';
  const tokenSection = pathToken ? `
    <h3 style="color:#1b5e20;margin:24px 0 12px">🔐 TOKEN访问方式</h3>
    <div style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);padding:20px;border-radius:10px;border-left:4px solid #2e7d32">
      <p style="margin-bottom:12px;color:#1565c0;font-weight:600">路径TOKEN访问（推荐）:</p>
      <div class="code-block" style="background:#1e3a8a;color:#e0f2fe">
https://${hostname}/<span class="highlight">${pathToken}</span><br>
https://${hostname}/<span class="highlight">${pathToken}</span>/check?proxy=socks5://...
      </div>
      <p style="margin:16px 0 12px;color:#1565c0;font-weight:600">参数TOKEN访问:</p>
      <div class="code-block" style="background:#1e3a8a;color:#e0f2fe">
https://${hostname}/check?proxy=socks5://...&amp;token=<span class="highlight">${pathToken}</span>
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Check Socks5/HTTP - 代理检测服务</title>
${icoTag}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;${bgStyle}background-size:cover;background-position:center;background-attachment:fixed;background-repeat:no-repeat;min-height:100vh;padding:20px}
body::before{content:'';position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.1);backdrop-filter:blur(2px);z-index:0;pointer-events:none}
.container{max-width:1200px;margin:0 auto;background:rgba(255,255,255,.15);backdrop-filter:blur(25px) saturate(180%);border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.4);overflow:hidden;border:1px solid rgba(255,255,255,.3);position:relative;z-index:1}
.container>*{position:relative;z-index:2}
.header{background:linear-gradient(45deg,#2e7d32,#4caf50);color:#fff;padding:25px 35px;display:flex;align-items:center;justify-content:space-between;gap:30px;border-bottom:1px solid rgba(255,255,255,.2)}
.header-content{flex-shrink:0}
.header h1{font-size:1.8em;margin:0 0 8px;text-shadow:2px 2px 6px rgba(0,0,0,.3)}
.header p{font-size:.95em;opacity:.95;margin:0}
.header-input{flex:1;max-width:600px;display:flex;gap:15px;align-items:center}
.header-input input{flex:1;padding:14px 20px;border:2px solid rgba(255,255,255,.3);border-radius:12px;font-size:15px;background:rgba(255,255,255,.95);color:#333;box-shadow:0 2px 8px rgba(0,0,0,.1);transition:all .3s}
.header-input input:focus{outline:none;border-color:rgba(255,255,255,.8);box-shadow:0 0 0 3px rgba(255,255,255,.2);background:#fff}
.header-input input::placeholder{color:#888}
.header-input button{padding:14px 28px;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);color:#fff;border:2px solid rgba(255,255,255,.3);border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;white-space:nowrap}
.header-input button:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.2);background:rgba(255,255,255,.3)}
.header-input button:disabled{opacity:.6;cursor:not-allowed;transform:none}
.results-section{padding:35px;display:grid;grid-template-columns:1fr 1fr;gap:30px;background:rgba(255,255,255,.15);backdrop-filter:blur(15px)}
.info-card{background:rgba(255,255,255,.25);backdrop-filter:blur(20px);border:2px solid rgba(255,255,255,.3);border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.4);transition:all .3s}
.info-card:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,.15)}
.info-card h3{background:linear-gradient(45deg,#2e7d32,#4caf50);color:#fff;padding:22px;margin:0;font-size:1.3em;text-align:center;font-weight:600;border-bottom:1px solid rgba(255,255,255,.2)}
.info-content{padding:28px;background:#fff;border-top:1px solid rgba(200,200,200,.3)}
.info-item{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(200,200,200,.3)}
.info-item:last-child{border-bottom:none}
.info-label{font-weight:600;color:#333;min-width:120px}
.info-value{text-align:right;flex:1;color:#666}
.ip-selector{display:flex;align-items:center;justify-content:flex-end;gap:8px}
.more-ip-btn{background:rgba(76,175,80,.1);color:#2e7d32;border:1px solid rgba(76,175,80,.3);border-radius:4px;padding:2px 8px;font-size:.8em;cursor:pointer;transition:all .3s}
.more-ip-btn:hover{background:rgba(76,175,80,.2)}
.ip-dropdown{position:absolute;right:0;top:100%;background:#fff;border:1px solid rgba(200,200,200,.5);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:1000;min-width:200px;max-height:200px;overflow-y:auto;display:none}
.ip-dropdown.show{display:block}
.ip-option{padding:8px 12px;cursor:pointer;transition:background .2s;border-bottom:1px solid rgba(200,200,200,.3);font-size:.9em}
.ip-option:hover{background:rgba(76,175,80,.1)}
.ip-option.active{background:rgba(76,175,80,.2);color:#2e7d32;font-weight:600}
.ip-value-container{position:relative}
.status-yes{background:rgba(211,47,47,.8);color:#fff;padding:5px 10px;border-radius:8px;font-size:.9em;font-weight:500}
.status-no{background:rgba(54,137,61,.8);color:#fff;padding:5px 10px;border-radius:8px;font-size:.9em;font-weight:500}
.loading{text-align:center;padding:45px;color:#666;font-size:1.1em}
.error{text-align:center;padding:45px;color:rgba(211,47,47,.9);font-size:1.1em;background:rgba(244,67,54,.1);border-radius:8px;margin:10px;border:1px solid rgba(244,67,54,.2)}
.waiting{text-align:center;padding:45px;color:#666;font-size:1.1em}
.spinner{border:3px solid rgba(200,200,200,.4);border-top:3px solid rgba(100,100,100,.8);border-radius:50%;width:32px;height:32px;animation:spin 1s linear infinite;margin:0 auto 18px}

.footer{text-align:center;padding:25px;color:#666;font-size:14px;border-top:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.2);backdrop-filter:blur(10px)}

/* API文档区域 */
.api-section{padding:35px;background:rgba(255,255,255,.1);backdrop-filter:blur(15px);border-top:1px solid rgba(255,255,255,.3)}
.api-section h2{color:#1b5e20;font-size:1.5em;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid rgba(76,175,80,.4)}
.api-tabs{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}
.api-tab{padding:8px 18px;background:rgba(255,255,255,.3);border:1px solid rgba(255,255,255,.5);border-radius:8px;cursor:pointer;font-weight:600;color:#2e7d32;transition:all .3s}
.api-tab.active,.api-tab:hover{background:rgba(76,175,80,.3);border-color:rgba(76,175,80,.5)}
.api-tab-content{display:none}
.api-tab-content.active{display:block}
.code-block{background:rgba(0,0,0,.7);color:#e2e8f0;padding:18px;border-radius:10px;font-family:'Monaco','Menlo',monospace;font-size:13px;overflow-x:auto;margin:12px 0;border:1px solid rgba(255,255,255,.1)}
.highlight{color:#f56565;font-weight:600}
.field-table{width:100%;border-collapse:collapse;margin:12px 0;background:rgba(255,255,255,.8);border-radius:8px;overflow:hidden}
.field-table th{background:rgba(76,175,80,.3);color:#1b5e20;padding:10px 14px;text-align:left;font-weight:600}
.field-table td{padding:10px 14px;border-bottom:1px solid rgba(200,200,200,.3);color:#333;font-size:.9em}
.field-table tr:last-child td{border-bottom:none}
.field-table tr:hover td{background:rgba(76,175,80,.05)}

@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
@media(max-width:768px){
  .header{flex-direction:column;align-items:stretch;gap:20px;padding:25px}
  .header-input{max-width:none;flex-direction:column;gap:15px}
  .results-section{grid-template-columns:1fr;padding:20px}
  .container{margin:10px;border-radius:16px}
  .api-section{padding:20px}
}
</style>
${tokenScript}
</head>
<body>
<div class="container">
  <div class="header">
    <div class="header-content">
      <h1>代理检测工具</h1>
      <p>检测代理服务器的出入口信息，支持 SOCKS5 和 HTTP 代理</p>
    </div>
    <div class="header-input">
      <input type="text" id="proxyInput" placeholder="输入代理链接，例如：socks5://username:password@host:port" />
      <button id="checkBtn" onclick="checkProxy()">检查代理</button>
    </div>
  </div>

  <div class="results-section">
    <div class="info-card">
      <h3>入口信息</h3>
      <div class="info-content" id="entryInfo"><div class="waiting">请输入代理链接并点击检查</div></div>
    </div>
    <div class="info-card">
      <h3 id="exitInfoTitle">出口信息</h3>
      <div class="info-content" id="exitInfo"><div class="waiting">请输入代理链接并点击检查</div></div>
    </div>
  </div>

  <!-- API 文档与使用说明 -->
  <div class="api-section">
    <h2>📚 API 文档 &amp; 使用说明</h2>
    <div class="api-tabs">
      <div class="api-tab active" onclick="showTab('tab-usage')">使用说明</div>
      <div class="api-tab" onclick="showTab('tab-api')">API 接口</div>
      <div class="api-tab" onclick="showTab('tab-fields')">字段说明</div>
    </div>

    <div id="tab-usage" class="api-tab-content active">
      <h3 style="color:#1b5e20;margin-bottom:12px">支持的代理格式</h3>
      <div class="code-block">
# SOCKS5 代理（有认证）<br>
socks5://username:password@host:port<br><br>
# SOCKS5 代理（无认证）<br>
socks5://host:port<br><br>
# HTTP 代理（有认证）<br>
http://username:password@host:port<br><br>
# HTTP 代理（无认证）<br>
http://host:port<br><br>
# IPv6 地址需要用方括号括起来<br>
socks5://username:password@[2001:db8::1]:1080
      </div>
      <p style="color:#555;margin-top:12px;line-height:1.8">
        💡 <strong>入口信息</strong>：代理服务器本身的 IP 地址信息（地理位置、ASN、风险评分等）<br>
        💡 <strong>出口信息</strong>：通过代理后实际出口的 IP 地址信息
      </p>
    </div>

    <div id="tab-api" class="api-tab-content">
      <h3 style="color:#1b5e20;margin-bottom:12px">检测接口</h3>
      <div class="code-block">
<span style="color:#68d391">GET</span> /check?proxy=<span class="highlight">socks5://user:pass@host:port</span><br><br>
# 也支持以下参数格式：<br>
GET /check?socks5=<span class="highlight">user:pass@host:port</span><br>
GET /check?http=<span class="highlight">user:pass@host:port</span>
      </div>

      <h3 style="color:#1b5e20;margin:20px 0 12px">查询IP信息接口</h3>
      <div class="code-block">
<span style="color:#68d391">GET</span> /ip-info?ip=<span class="highlight">1.2.3.4</span>
      </div>

      <h3 style="color:#1b5e20;margin:20px 0 12px">响应示例</h3>
      <div class="code-block">
{<br>
&nbsp;&nbsp;"success": true,<br>
&nbsp;&nbsp;"proxy": "socks5://user:pass@host:port",<br>
&nbsp;&nbsp;"ip": "8.8.8.8",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 出口 IP<br>
&nbsp;&nbsp;"loc": "US",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 位置代码<br>
&nbsp;&nbsp;"responseTime": 1070,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 毫秒<br>
&nbsp;&nbsp;"is_datacenter": true,<br>
&nbsp;&nbsp;"is_vpn": true,<br>
&nbsp;&nbsp;"asn": { "asn": 15169, "org": "Google LLC" },<br>
&nbsp;&nbsp;"location": { "country": "United States", "city": "Mountain View" },<br>
&nbsp;&nbsp;"timestamp": "2025-06-03T17:21:25.045Z"<br>
}
      </div>

      <h3 style="color:#1b5e20;margin:20px 0 12px">TOKEN 访问方式</h3>
      <div class="code-block">
# 路径TOKEN（推荐）<br>
GET /YOUR_TOKEN/check?proxy=socks5://...<br><br>
# 参数TOKEN<br>
GET /check?proxy=socks5://...&amp;token=YOUR_TOKEN
      </div>
      ${tokenSection}
    </div>

    <div id="tab-fields" class="api-tab-content">
      <h3 style="color:#1b5e20;margin-bottom:12px">风险评估字段</h3>
      <table class="field-table">
        <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>is_datacenter</td><td>boolean</td><td>是否为数据中心 IP</td></tr>
          <tr><td>is_proxy</td><td>boolean</td><td>是否为代理服务器</td></tr>
          <tr><td>is_vpn</td><td>boolean</td><td>是否为 VPN 服务器</td></tr>
          <tr><td>is_tor</td><td>boolean</td><td>是否为 Tor 出口节点</td></tr>
          <tr><td>is_crawler</td><td>boolean</td><td>是否为网络爬虫</td></tr>
          <tr><td>is_abuser</td><td>boolean</td><td>是否有滥用行为记录</td></tr>
          <tr><td>is_bogon</td><td>boolean</td><td>是否为虚假/保留 IP</td></tr>
        </tbody>
      </table>
      <h3 style="color:#1b5e20;margin:20px 0 12px">地理位置与 ASN 字段</h3>
      <table class="field-table">
        <thead><tr><th>字段路径</th><th>说明</th></tr></thead>
        <tbody>
          <tr><td>location.country_code</td><td>国家代码（ISO 3166-1）</td></tr>
          <tr><td>location.city</td><td>城市名称</td></tr>
          <tr><td>asn.asn</td><td>自治系统编号</td></tr>
          <tr><td>asn.org</td><td>所属组织/ISP</td></tr>
          <tr><td>company.type</td><td>IP 类型（isp/hosting/business）</td></tr>
          <tr><td>company.abuser_score</td><td>滥用风险评分</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">© 2025 代理检测服务 - 基于 Cloudflare Workers 构建 | IP数据来源: ipapi.is</div>
</div>

<script>
  let currentDomainInfo = null;
  let currentProxyTemplate = null;
  const pathToken = ${JSON.stringify(pathToken || '')};

  function showTab(id) {
    document.querySelectorAll('.api-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.api-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.target.classList.add('active');
  }

  function preprocessProxyUrl(input) {
    let p = input.trim();
    if (p.includes('#')) p = p.split('#')[0].trim();
    while (p.startsWith('/')) p = p.substring(1);
    if (!p.includes('://')) p = 'socks5://' + p;
    const [scheme, rest] = p.split('://');
    let auth = '', host = rest;
    if (host.includes('@')) { const i = host.lastIndexOf('@'); auth = host.substring(0, i + 1); host = host.substring(i + 1); }
    const parts = host.split(':');
    if (parts.length > 2) {
      const port = parts[parts.length - 1], h = parts.slice(0, -1).join(':');
      if (isIPv6Address(h) && !h.startsWith('[')) p = scheme + '://' + auth + '[' + h + ']:' + port;
    }
    return p;
  }

  function extractHostFromProxy(proxyUrl) {
    let u = proxyUrl.includes('://') ? proxyUrl.split('://')[1] : proxyUrl;
    if (u.includes('@')) u = u.substring(u.lastIndexOf('@') + 1);
    if (u.startsWith('[') && u.includes(']:')) return u.substring(1, u.indexOf(']:'));
    let h = u.split(':')[0];
    if (h.startsWith('[') && h.includes(']')) h = h.substring(1, h.indexOf(']'));
    return h;
  }

  function isIPAddress(h) {
    return /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(h) ||
           isIPv6Address(h);
  }

  function isIPv6Address(h) {
    return /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$/.test(h);
  }

  function replaceHostInProxy(proxyUrl, newHost) {
    const [proto, rest] = proxyUrl.split('://');
    let auth = '', h = rest;
    if (h.includes('@')) { const i = h.lastIndexOf('@'); auth = h.substring(0, i + 1); h = h.substring(i + 1); }
    const port = h.split(':')[h.split(':').length - 1];
    const nh = (isIPv6Address(newHost) && !newHost.startsWith('[')) ? '[' + newHost + ']' : newHost;
    return proto + '://' + auth + nh + ':' + port;
  }

  async function fetchDNSRecords(domain, type) {
    const r = await fetch('https://cloudflare-dns.com/dns-query?' + new URLSearchParams({ name: domain, type }), { headers: { Accept: 'application/dns-json' } });
    const d = await r.json(); return d.Answer || [];
  }

  async function resolveDomainIPs(domain) {
    const [v4, v6] = await Promise.all([fetchDNSRecords(domain, 'A').catch(() => []), fetchDNSRecords(domain, 'AAAA').catch(() => [])]);
    const all = [...v4.map(r => r.data), ...v6.map(r => r.data)].filter(Boolean);
    if (!all.length) throw new Error('无法解析域名 ' + domain + ' 的 IP');
    return { domain, all_ips: all, ipv4_addresses: v4.map(r=>r.data), ipv6_addresses: v6.map(r=>r.data), default_ip: all[0] };
  }

  function formatIpType(type) {
    if (!type) return '<span>未知</span>';
    const m = { isp: { t:'住宅', s:'color:#36893dcc;font-weight:bold' }, hosting: { t:'机房', s:'font-weight:bold' }, business: { t:'商用', s:'color:#eab308;font-weight:bold' } };
    const x = m[type.toLowerCase()]; return x ? '<span style="' + x.s + '">' + x.t + '</span>' : '<span style="font-weight:bold">' + type + '</span>';
  }

  function calculateAbuseScore(cScore, aScore, flags={}) {
    const c = parseFloat(cScore)||0, a = parseFloat(aScore)||0;
    let base = ((c+a)/2)*5;
    let risk = flags.is_bogon ? 1.0 : 0;
    risk += [flags.is_crawler, flags.is_proxy, flags.is_vpn, flags.is_tor, flags.is_abuser].filter(Boolean).length * 0.15;
    return (base===0 && risk===0) ? null : base + risk;
  }

  function getRiskLevelColor(lv) {
    return {'极度危险':'rgb(220,38,38)','高风险':'rgb(239,68,68)','轻微风险':'rgb(249,115,22)','纯净':'rgb(22,163,74)','极度纯净':'rgb(34,197,94)'}[lv]||'rgb(100,100,100)';
  }

  function formatAbuseScorePercentage(s) { return s===null?'未知':(s*100).toFixed(2)+'%'; }

  function formatInfoDisplay(data, containerId, showIPSelector=false, responseTime=null) {
    const container = document.getElementById(containerId);
    if (containerId === 'exitInfo') {
      const title = document.getElementById('exitInfoTitle');
      if (title) {
        if (responseTime!==null && data?.success) title.textContent = '出口信息(响应时间: '+(responseTime/1000).toFixed(2)+'秒)';
        else if (data && (!data.success || data.error)) title.textContent = '出口信息(代理不可用)';
        else title.textContent = '出口信息';
      }
    }
    if (!data || data.error) { container.innerHTML = '<div class="error">数据获取失败，请稍后重试</div>'; return; }

    const cScore = data.company?.abuser_score, aScore = data.asn?.abuser_score;
    const flags = { is_crawler:data.is_crawler, is_proxy:data.is_proxy, is_vpn:data.is_vpn, is_tor:data.is_tor, is_abuser:data.is_abuser, is_bogon:data.is_bogon };
    const combined = calculateAbuseScore(cScore, aScore, flags);
    let abuseHTML = '未知';
    if (combined !== null) {
      const pct = combined * 100;
      let lv = pct>=100?'极度危险':pct>=20?'高风险':pct>=5?'轻微风险':pct>=0.25?'纯净':'极度纯净';
      abuseHTML = '<span style="background:' + getRiskLevelColor(lv) + ';color:#fff;padding:4px 8px;border-radius:5px;font-size:.9em;font-weight:bold">' + formatAbuseScorePercentage(combined) + ' ' + lv + '</span>';
    }

    const ipVal = data.ip || 'N/A';
    const ipDisplay = showIPSelector && currentDomainInfo?.all_ips?.length > 1
      ? '<div class="ip-selector"><button class="more-ip-btn" onclick="toggleIPDropdown()">更多IP</button><span class="ip-text">' + ipVal + '</span><div class="ip-dropdown" id="ipDropdown">' + currentDomainInfo.all_ips.map(ip => '<div class="ip-option' + (ip===ipVal?' active':'') + '" onclick="selectIP(\'' + ip + '\')">' + ip + '</div>').join('') + '</div></div>'
      : ipVal;

    const bool = (v) => '<span class="' + (v?'status-yes':'status-no') + '">' + (v?'是':'否') + '</span>';
    const row = (label, val) => '<div class="info-item"><span class="info-label">' + label + ':</span><span class="info-value">' + val + '</span></div>';
    container.innerHTML =
      row('IP地址', '<div class="ip-value-container">' + ipDisplay + '</div>') +
      row('运营商/ASN类型', formatIpType(data.company && data.company.type) + ' / ' + formatIpType(data.asn && data.asn.type)) +
      row('综合滥用评分', abuseHTML) +
      row('网络爬虫', bool(data.is_crawler)) +
      row('Tor网络', bool(data.is_tor)) +
      row('代理', bool(data.is_proxy)) +
      row('VPN', bool(data.is_vpn)) +
      row('滥用IP', bool(data.is_abuser)) +
      row('虚假IP', bool(data.is_bogon)) +
      row('自治系统编号', data.asn && data.asn.asn ? 'AS' + data.asn.asn : 'N/A') +
      row('所属组织', (data.asn && data.asn.org) || 'N/A') +
      row('国家', (data.location && data.location.country_code) || 'N/A') +
      row('城市', (data.location && data.location.city) || 'N/A');
  }

  function toggleIPDropdown() {
    const dd = document.getElementById('ipDropdown'); dd.classList.toggle('show');
    document.addEventListener('click', function close(e) { if (!e.target.closest('.ip-value-container')) { dd.classList.remove('show'); document.removeEventListener('click', close); } });
  }

  async function fetchEntryInfo(host, retry=0) {
    try {
      const tq = pathToken ? '&token='+encodeURIComponent(pathToken) : '';
      const r = await fetch('/ip-info?ip='+encodeURIComponent(host)+tq);
      const d = await r.json();
      if (d.error && retry < 3) { await new Promise(res=>setTimeout(res,1000)); return fetchEntryInfo(host, retry+1); }
      return d;
    } catch(e) {
      if (retry < 3) { await new Promise(res=>setTimeout(res,1000)); return fetchEntryInfo(host, retry+1); }
      throw e;
    }
  }

  async function selectIP(selectedIP) {
    const dd = document.getElementById('ipDropdown'); dd.classList.remove('show');
    const btn = document.getElementById('checkBtn'), entry = document.getElementById('entryInfo'), exit = document.getElementById('exitInfo');
    btn.disabled = true;
    entry.innerHTML = '<div class="loading"><div class="spinner"></div>正在获取入口信息...</div>';
    exit.innerHTML = '<div class="loading"><div class="spinner"></div>正在获取出口信息...</div>';
    try {
      const entryIP = selectedIP.startsWith('[')&&selectedIP.endsWith(']') ? selectedIP.slice(1,-1) : selectedIP;
      const entryData = await fetchEntryInfo(entryIP);
      if (entryData.error) entry.innerHTML = '<div class="error">入口信息获取失败</div>';
      else formatInfoDisplay(entryData, 'entryInfo', true);
      const newProxy = replaceHostInProxy(currentProxyTemplate, selectedIP);
      const pr = await fetch('/check?proxy='+encodeURIComponent(newProxy));
      const pd = await pr.json();
      if (!pd.success) { document.getElementById('exitInfoTitle').textContent='出口信息(代理不可用)'; exit.innerHTML='<div class="error">代理检测失败</div>'; }
      else formatInfoDisplay(pd, 'exitInfo', false, pd.responseTime);
    } catch(e) { entry.innerHTML='<div class="error">切换失败</div>'; exit.innerHTML='<div class="error">切换失败</div>'; }
    finally { btn.disabled=false; }
  }

  async function checkProxy() {
    const input = document.getElementById('proxyInput');
    const btn = document.getElementById('checkBtn');
    const entry = document.getElementById('entryInfo'), exit = document.getElementById('exitInfo');
    const rawProxy = input.value.trim();
    if (!rawProxy) { alert('请输入代理链接'); return; }
    const proxyUrl = preprocessProxyUrl(rawProxy);
    input.value = proxyUrl; currentProxyTemplate = proxyUrl;
    btn.disabled = true;
    document.getElementById('exitInfoTitle').textContent = '出口信息';
    entry.innerHTML = '<div class="loading"><div class="spinner"></div>正在解析代理信息...</div>';
    exit.innerHTML = '<div class="loading"><div class="spinner"></div>正在解析代理信息...</div>';
    try {
      const host = extractHostFromProxy(proxyUrl);
      let targetIP = host, targetProxy = proxyUrl;
      currentDomainInfo = null;
      if (!isIPAddress(host)) {
        entry.innerHTML = '<div class="loading"><div class="spinner"></div>Resolving domain...</div>';
        try {
          currentDomainInfo = await resolveDomainIPs(host);
          targetIP = currentDomainInfo.default_ip;
          targetProxy = replaceHostInProxy(proxyUrl, targetIP);
          currentProxyTemplate = proxyUrl;
        } catch(e) {
          entry.innerHTML = '<div class="error">Domain resolution failed: ' + e.message + '</div>';
          exit.innerHTML = '<div class="error">Domain resolution failed: ' + e.message + '</div>';
          return;
        }
      }
      entry.innerHTML = '<div class="loading"><div class="spinner"></div>Getting entry info...</div>';
      exit.innerHTML = '<div class="loading"><div class="spinner"></div>Checking proxy...</div>';
      const entryIP = (targetIP.startsWith('[')&&targetIP.endsWith(']')) ? targetIP.slice(1,-1) : targetIP;
      const [ep, xp] = await Promise.allSettled([
        fetchEntryInfo(entryIP),
        fetch('/check?proxy='+encodeURIComponent(targetProxy)).then(r=>r.json())
      ]);
      if (ep.status==='fulfilled') { if(ep.value.error) entry.innerHTML='<div class="error">入口信息获取失败</div>'; else formatInfoDisplay(ep.value,'entryInfo',currentDomainInfo&&currentDomainInfo.all_ips.length>1); }
      else entry.innerHTML='<div class="error">入口信息获取失败</div>';
      if (xp.status==='fulfilled') { if(!xp.value.success) { document.getElementById('exitInfoTitle').textContent='Exit Info(Proxy Unavailable)'; exit.innerHTML='<div class="error">Proxy check failed: '+(xp.value.error||'Please check proxy link')+'</div>'; } else formatInfoDisplay(xp.value,'exitInfo',false,xp.value.responseTime); }
      else { document.getElementById('exitInfoTitle').textContent='Exit Info(Proxy Unavailable)'; exit.innerHTML='<div class="error">Proxy check failed</div>'; }
    } catch(e) {
      entry.innerHTML='<div class="error">Check failed</div>';
      document.getElementById('exitInfoTitle').textContent='Exit Info(Proxy Unavailable)';
      exit.innerHTML='<div class="error">Check failed</div>';
    } finally { btn.disabled=false; }
  }

  document.getElementById('proxyInput').addEventListener('keypress', e => { if(e.key==='Enter') checkProxy(); });
</script>
</body>
</html>`;
}
