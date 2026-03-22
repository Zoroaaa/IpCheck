// ============================================================
//  pageProxy.js — SOCKS5 / HTTP 代理检测前端页面
// ============================================================

export function renderProxyPage(hostname, ico, bgStyle, pathToken) {
  const icoTag = ico ? '<link rel="icon" href="' + ico + '" type="image/x-icon">' : '';
  const safeToken = JSON.stringify(pathToken || '');
  const tokenBadge = pathToken ? '<div class="token-badge">🔑 TOKEN验证通过</div>' : '';
  const secureSubtitle = pathToken ? '<p style="font-size:.9em;opacity:.8;margin-top:5px">🔒 安全模式 - 路径TOKEN验证已启用</p>' : '';
  const footerToken = pathToken ? '<p style="margin-top:4px;opacity:.6">🔒 当前会话已通过TOKEN验证</p>' : '';
  const tokenScript = pathToken ? '<script>\n' +
    '(function(){\n' +
    '  var orig = window.fetch;\n' +
    '  var tk = ' + safeToken + ';\n' +
    '  window.fetch = function(url, opts){\n' +
    '    if(typeof url === "string" && (url.indexOf("/check")!==-1 || url.indexOf("/ip-info")!==-1)){\n' +
    '      url += (url.indexOf("?")!==-1 ? "&" : "?") + "token=" + encodeURIComponent(tk);\n' +
    '    }\n' +
    '    return orig.call(this, url, opts);\n' +
    '  };\n' +
    '  document.addEventListener("DOMContentLoaded", function(){\n' +
    '    var h1 = document.querySelector("h1");\n' +
    '    if(h1) h1.textContent = "代理检测工具 (授权访问)";\n' +
    '  });\n' +
    '})();\n' +
    '<\/script>' : '';
  const tokenSection = pathToken ? '\n' +
    '    <h3 style="color:#1b5e20;margin:24px 0 12px">🔐 TOKEN访问方式</h3>\n' +
    '    <div style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);padding:20px;border-radius:10px;border-left:4px solid #2e7d32">\n' +
    '      <p style="margin-bottom:12px;color:#1565c0;font-weight:600">路径TOKEN访问（推荐）:</p>\n' +
    '      <div class="code-block" style="background:#1e3a8a;color:#e0f2fe">\n' +
    'https://' + hostname + '/<span class="highlight">' + escapeHtml(pathToken) + '</span><br>\n' +
    'https://' + hostname + '/<span class="highlight">' + escapeHtml(pathToken) + '</span>/check?proxy=socks5://...\n' +
    '      </div>\n' +
    '      <p style="margin:16px 0 12px;color:#1565c0;font-weight:600">参数TOKEN访问:</p>\n' +
    '      <div class="code-block" style="background:#1e3a8a;color:#e0f2fe">\n' +
    'https://' + hostname + '/check?proxy=socks5://...&amp;token=<span class="highlight">' + escapeHtml(pathToken) + '</span>\n' +
    '      </div>\n' +
    '    </div>' : '';

  return '<!DOCTYPE html>\n' +
'<html lang="zh-CN">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
'<title>Check Socks5/HTTP - 代理检测服务</title>\n' +
icoTag + '\n' +
'<style>\n' +
':root{--primary-color:#4caf50;--primary-dark:#2e7d32;--secondary-color:#81c784;--success-color:#2e7d32;--warning-color:#f39c12;--error-color:#e74c3c;--bg-primary:#ffffff;--bg-secondary:#f8f9fa;--bg-tertiary:#e9ecef;--text-primary:#2c3e50;--text-secondary:#6c757d;--text-light:#adb5bd;--border-color:#dee2e6;--shadow-sm:0 2px 4px rgba(0,0,0,.1);--shadow-md:0 4px 6px rgba(0,0,0,.1);--shadow-lg:0 10px 25px rgba(0,0,0,.15);--border-radius:12px;--border-radius-sm:8px;--transition:all .3s cubic-bezier(.4,0,.2,1)}\n' +
'*{margin:0;padding:0;box-sizing:border-box}\n' +
'body{font-family:\'Segoe UI\',system-ui,sans-serif;' + bgStyle + 'background-size:cover;background-position:center;background-attachment:fixed;background-repeat:no-repeat;min-height:100vh;padding:20px}\n' +
'body::before{content:\'\';position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.1);backdrop-filter:blur(2px);z-index:0;pointer-events:none}\n' +
'.container{max-width:1200px;margin:0 auto;background:rgba(255,255,255,.15);backdrop-filter:blur(25px) saturate(180%);border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.4);overflow:hidden;border:1px solid rgba(255,255,255,.3);position:relative;z-index:1}\n' +
'.container>*{position:relative;z-index:2}\n' +
'.header{background:linear-gradient(45deg,#2e7d32,#4caf50);color:#fff;padding:25px 35px;display:flex;align-items:center;justify-content:space-between;gap:30px;border-bottom:1px solid rgba(255,255,255,.2)}\n' +
'.header-content{flex-shrink:0}\n' +
'.header h1{font-size:1.8em;margin:0 0 8px;text-shadow:2px 2px 6px rgba(0,0,0,.3)}\n' +
'.header p{font-size:.95em;opacity:.95;margin:0}\n' +
'.header-input{flex:1;max-width:600px;display:flex;gap:15px;align-items:center}\n' +
'.header-input input{flex:1;padding:14px 20px;border:2px solid rgba(255,255,255,.3);border-radius:12px;font-size:15px;background:rgba(255,255,255,.95);color:#333;box-shadow:0 2px 8px rgba(0,0,0,.1);transition:all .3s}\n' +
'.header-input input:focus{outline:none;border-color:rgba(255,255,255,.8);box-shadow:0 0 0 3px rgba(255,255,255,.2);background:#fff}\n' +
'.header-input input::placeholder{color:#888}\n' +
'.header-input button{padding:14px 28px;background:rgba(255,255,255,.2);backdrop-filter:blur(10px);color:#fff;border:2px solid rgba(255,255,255,.3);border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all .3s;white-space:nowrap}\n' +
'.header-input button:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.2);background:rgba(255,255,255,.3)}\n' +
'.header-input button:disabled{opacity:.6;cursor:not-allowed;transform:none}\n' +
'.results-section{padding:35px;display:grid;grid-template-columns:1fr 1fr;gap:30px;background:rgba(255,255,255,.15);backdrop-filter:blur(15px)}\n' +
'.info-card{background:rgba(255,255,255,.25);backdrop-filter:blur(20px);border:2px solid rgba(255,255,255,.3);border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.4);transition:all .3s}\n' +
'.info-card:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,.15)}\n' +
'.info-card h3{background:linear-gradient(45deg,#2e7d32,#4caf50);color:#fff;padding:22px;margin:0;font-size:1.3em;text-align:center;font-weight:600;border-bottom:1px solid rgba(255,255,255,.2)}\n' +
'.info-content{padding:28px;background:#fff;border-top:1px solid rgba(200,200,200,.3)}\n' +
'.info-item{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(200,200,200,.3)}\n' +
'.info-item:last-child{border-bottom:none}\n' +
'.info-label{font-weight:600;color:#333;min-width:120px}\n' +
'.info-value{text-align:right;flex:1;color:#666}\n' +
'.ip-selector{display:flex;align-items:center;justify-content:flex-end;gap:8px}\n' +
'.more-ip-btn{background:rgba(76,175,80,.1);color:#2e7d32;border:1px solid rgba(76,175,80,.3);border-radius:4px;padding:2px 8px;font-size:.8em;cursor:pointer;transition:all .3s}\n' +
'.more-ip-btn:hover{background:rgba(76,175,80,.2)}\n' +
'.ip-dropdown{position:absolute;right:0;top:100%;background:#fff;border:1px solid rgba(200,200,200,.5);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:1000;min-width:200px;max-height:200px;overflow-y:auto;display:none}\n' +
'.ip-dropdown.show{display:block}\n' +
'.ip-option{padding:8px 12px;cursor:pointer;transition:background .2s;border-bottom:1px solid rgba(200,200,200,.3);font-size:.9em}\n' +
'.ip-option:hover{background:rgba(76,175,80,.1)}\n' +
'.ip-option.active{background:rgba(76,175,80,.2);color:#2e7d32;font-weight:600}\n' +
'.ip-value-container{position:relative}\n' +
'.status-yes{background:rgba(211,47,47,.8);color:#fff;padding:5px 10px;border-radius:8px;font-size:.9em;font-weight:500}\n' +
'.status-no{background:rgba(54,137,61,.8);color:#fff;padding:5px 10px;border-radius:8px;font-size:.9em;font-weight:500}\n' +
'.loading{text-align:center;padding:45px;color:#666;font-size:1.1em}\n' +
'.error{text-align:center;padding:45px;color:rgba(211,47,47,.9);font-size:1.1em;background:rgba(244,67,54,.1);border-radius:8px;margin:10px;border:1px solid rgba(244,67,54,.2)}\n' +
'.waiting{text-align:center;padding:45px;color:#666;font-size:1.1em}\n' +
'.spinner{border:3px solid rgba(200,200,200,.4);border-top:3px solid rgba(100,100,100,.8);border-radius:50%;width:32px;height:32px;animation:spin 1s linear infinite;margin:0 auto 18px}\n' +
'.footer{text-align:center;padding:25px;color:#666;font-size:14px;border-top:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.2);backdrop-filter:blur(10px)}\n' +
'.token-badge{position:fixed;top:20px;left:20px;background:linear-gradient(135deg,var(--success-color),var(--secondary-color));color:#fff;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;z-index:1000;box-shadow:var(--shadow-md)}\n' +
'.toast{position:fixed;bottom:20px;right:20px;background:var(--text-primary);color:#fff;padding:12px 20px;border-radius:var(--border-radius-sm);box-shadow:var(--shadow-lg);transform:translateY(100px);opacity:0;transition:var(--transition);z-index:1000}\n' +
'.toast.show{transform:translateY(0);opacity:1}\n' +
'.api-docs{background:var(--bg-primary);border-radius:var(--border-radius);padding:32px;box-shadow:var(--shadow-lg);margin:20px;position:relative;overflow:hidden}\n' +
'.api-docs::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--primary-color),var(--secondary-color))}\n' +
'.api-docs:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.12)}\n' +
'.section-title{font-size:1.8rem;font-weight:700;color:var(--text-primary);margin-bottom:24px;position:relative;padding-bottom:12px}\n' +
'.section-title::after{content:"";position:absolute;bottom:0;left:0;width:60px;height:3px;background:linear-gradient(90deg,var(--primary-color),var(--secondary-color));border-radius:2px}\n' +
'.code-block{background:#2d3748;color:#e2e8f0;padding:20px;border-radius:var(--border-radius-sm);font-family:\'Monaco\',\'Menlo\',\'Ubuntu Mono\',monospace;font-size:14px;overflow-x:auto;margin:16px 0;border:1px solid #4a5568;position:relative}\n' +
'.code-block::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#4caf50,#81c784)}\n' +
'.highlight{color:#f56565;font-weight:600}\n' +
'.field-table{width:100%;border-collapse:collapse;margin:16px 0;background:var(--bg-primary);border-radius:var(--border-radius-sm);overflow:hidden;border:1px solid var(--border-color)}\n' +
'.field-table th{background:linear-gradient(135deg,rgba(76,175,80,.2),rgba(129,199,132,.2));color:#2e7d32;padding:12px 16px;text-align:left;font-weight:600}\n' +
'.field-table td{padding:12px 16px;border-bottom:1px solid var(--border-color);color:var(--text-primary);font-size:.95em}\n' +
'.field-table tr:last-child td{border-bottom:none}\n' +
'.field-table tr:hover td{background:rgba(76,175,80,.05)}\n' +
'@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}\n' +
'@media(max-width:768px){\n' +
'  .header{flex-direction:column;align-items:stretch;gap:20px;padding:25px}\n' +
'  .header-input{max-width:none;flex-direction:column;gap:15px}\n' +
'  .results-section{grid-template-columns:1fr;padding:20px}\n' +
'  .container{margin:10px;border-radius:16px}\n' +
'  .api-docs{margin:10px;padding:20px}\n' +
'}\n' +
'</style>\n' +
tokenScript + '\n' +
'</head>\n' +
'<body>\n' +
tokenBadge + '\n' +
'<div class="container">\n' +
'  <div class="header">\n' +
'    <div class="header-content">\n' +
'      <h1>代理检测工具</h1>\n' +
'      <p>检测代理服务器的出入口信息，支持 SOCKS5 和 HTTP 代理</p>\n' +
'      ' + secureSubtitle + '\n' +
'    </div>\n' +
'    <div class="header-input">\n' +
'      <input type="text" id="proxyInput" placeholder="输入代理链接，例如：socks5://username:password@host:port" />\n' +
'      <button id="checkBtn">检查代理</button>\n' +
'    </div>\n' +
'  </div>\n' +
'\n' +
'  <div class="results-section">\n' +
'    <div class="info-card">\n' +
'      <h3>入口信息</h3>\n' +
'      <div class="info-content" id="entryInfo"><div class="waiting">请输入代理链接并点击检查</div></div>\n' +
'    </div>\n' +
'    <div class="info-card">\n' +
'      <h3 id="exitInfoTitle">出口信息</h3>\n' +
'      <div class="info-content" id="exitInfo"><div class="waiting">请输入代理链接并点击检查</div></div>\n' +
'    </div>\n' +
'  </div>\n' +
'\n' +
'  <div class="api-docs">\n' +
'    <h2 class="section-title">📖 使用说明</h2>\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">支持的代理格式</h3>\n' +
'    <div class="code-block">\n' +
'# SOCKS5 代理（有认证）<br>\n' +
'socks5://username:password@host:port<br><br>\n' +
'# SOCKS5 代理（无认证）<br>\n' +
'socks5://host:port<br><br>\n' +
'# HTTP 代理（有认证）<br>\n' +
'http://username:password@host:port<br><br>\n' +
'# HTTP 代理（无认证）<br>\n' +
'http://host:port<br><br>\n' +
'# IPv6 地址需要用方括号括起来<br>\n' +
'socks5://username:password@[2001:db8::1]:1080\n' +
'    </div>\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">💡 入口信息 vs 出口信息</h3>\n' +
'    <div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);padding:20px;border-radius:var(--border-radius-sm);border-left:4px solid #2e7d32">\n' +
'      <ul style="margin:0;color:#1b5e20;line-height:1.8;padding-left:20px">\n' +
'        <li><strong>入口信息：</strong>代理服务器本身的 IP 地址信息（地理位置、ASN、风险评分等）</li>\n' +
'        <li><strong>出口信息：</strong>通过代理后实际出口的 IP 地址信息，代表你的真实网络身份</li>\n' +
'      </ul>\n' +
'    </div>\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">🔍 域名解析支持</h3>\n' +
'    <p style="margin-bottom:16px;line-height:1.8;color:var(--text-secondary)">\n' +
'      当代理地址使用域名时，系统会自动解析域名获取所有 IP 地址。如果解析出多个 IP，可以通过"更多IP"按钮切换检测不同的 IP 地址。\n' +
'    </p>\n' +
'  </div>\n' +
'\n' +
'  <div class="api-docs" style="margin-top:50px">\n' +
'    <h2 class="section-title">📚 API 文档</h2>\n' +
'    <p style="margin-bottom:24px;color:var(--text-secondary);font-size:1.1rem">提供简单易用的 RESTful API 接口，支持 SOCKS5 和 HTTP 代理检测</p>\n' +
'\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">📍 检测代理</h3>\n' +
'    <div class="code-block"><strong style="color:#68d391">GET</strong> /check?proxy=<span class="highlight">socks5://user:pass@host:port</span></div>\n' +
'    <p style="color:var(--text-secondary);margin-top:8px;font-size:.95rem">也支持简写格式：<code style="background:rgba(46,125,50,.1);padding:2px 6px;border-radius:4px">/check?socks5=user:pass@host:port</code> 或 <code style="background:rgba(46,125,50,.1);padding:2px 6px;border-radius:4px">/check?http=user:pass@host:port</code></p>\n' +
'\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">💡 使用示例</h3>\n' +
'    <div class="code-block">curl "https://' + hostname + (pathToken ? '/' + escapeHtml(pathToken) : '') + '/check?proxy=socks5://user:pass@1.2.3.4:1080"</div>\n' +
'\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">🔗 响应 JSON 格式</h3>\n' +
'    <div class="code-block">\n' +
'{<br>\n' +
'&nbsp;&nbsp;"success": true,<br>\n' +
'&nbsp;&nbsp;"proxy": "socks5://user:pass@1.2.3.4:1080",<br>\n' +
'&nbsp;&nbsp;"ip": "8.8.8.8",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 出口 IP<br>\n' +
'&nbsp;&nbsp;"loc": "US",&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 位置代码<br>\n' +
'&nbsp;&nbsp;"responseTime": 1070,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 响应时间(ms)<br>\n' +
'&nbsp;&nbsp;"is_datacenter": true,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否为数据中心<br>\n' +
'&nbsp;&nbsp;"is_vpn": true,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否为 VPN<br>\n' +
'&nbsp;&nbsp;"is_proxy": false,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否为代理<br>\n' +
'&nbsp;&nbsp;"is_tor": false,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否为 Tor<br>\n' +
'&nbsp;&nbsp;"is_crawler": false,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否为爬虫<br>\n' +
'&nbsp;&nbsp;"is_abuser": false,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否有滥用记录<br>\n' +
'&nbsp;&nbsp;"is_bogon": false,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// 是否为虚假IP<br>\n' +
'&nbsp;&nbsp;"asn": { "asn": 15169, "org": "Google LLC", "type": "hosting" },<br>\n' +
'&nbsp;&nbsp;"company": { "type": "hosting", "abuser_score": 0.01 },<br>\n' +
'&nbsp;&nbsp;"location": { "country_code": "US", "city": "Mountain View" },<br>\n' +
'&nbsp;&nbsp;"timestamp": "2025-06-03T17:21:25.045Z"<br>\n' +
'}\n' +
'    </div>\n' +
'\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">📍 查询 IP 信息</h3>\n' +
'    <div class="code-block"><strong style="color:#68d391">GET</strong> /ip-info?ip=<span class="highlight">1.2.3.4</span></div>\n' +
'    <p style="color:var(--text-secondary);margin-top:8px;font-size:.95rem">数据来源：<a href="https://ipapi.is" target="_blank" style="color:#2e7d32">ipapi.is</a>，包含 ASN、地理位置、风险评分等详细信息</p>\n' +
'\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">📍 解析域名</h3>\n' +
'    <div class="code-block"><strong style="color:#68d391">GET</strong> /resolve?domain=<span class="highlight">example.com</span></div>\n' +
'\n' +
'    ' + tokenSection + '\n' +
'  </div>\n' +
'\n' +
'  <div class="api-docs" style="margin-top:50px">\n' +
'    <h2 class="section-title">📋 字段说明</h2>\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">风险评估字段</h3>\n' +
'    <table class="field-table">\n' +
'      <thead><tr><th>字段</th><th>类型</th><th>说明</th></tr></thead>\n' +
'      <tbody>\n' +
'        <tr><td>is_datacenter</td><td>boolean</td><td>是否为数据中心 IP</td></tr>\n' +
'        <tr><td>is_proxy</td><td>boolean</td><td>是否为代理服务器</td></tr>\n' +
'        <tr><td>is_vpn</td><td>boolean</td><td>是否为 VPN 服务器</td></tr>\n' +
'        <tr><td>is_tor</td><td>boolean</td><td>是否为 Tor 出口节点</td></tr>\n' +
'        <tr><td>is_crawler</td><td>boolean</td><td>是否为网络爬虫</td></tr>\n' +
'        <tr><td>is_abuser</td><td>boolean</td><td>是否有滥用行为记录</td></tr>\n' +
'        <tr><td>is_bogon</td><td>boolean</td><td>是否为虚假/保留 IP</td></tr>\n' +
'      </tbody>\n' +
'    </table>\n' +
'    <h3 style="color:#2e7d32;margin:24px 0 16px">地理位置与 ASN 字段</h3>\n' +
'    <table class="field-table">\n' +
'      <thead><tr><th>字段路径</th><th>说明</th></tr></thead>\n' +
'      <tbody>\n' +
'        <tr><td>location.country_code</td><td>国家代码（ISO 3166-1）</td></tr>\n' +
'        <tr><td>location.city</td><td>城市名称</td></tr>\n' +
'        <tr><td>asn.asn</td><td>自治系统编号</td></tr>\n' +
'        <tr><td>asn.org</td><td>所属组织/ISP</td></tr>\n' +
'        <tr><td>asn.type</td><td>ASN 类型（isp/hosting/business）</td></tr>\n' +
'        <tr><td>company.type</td><td>IP 类型（isp/hosting/business）</td></tr>\n' +
'        <tr><td>company.abuser_score</td><td>滥用风险评分（0-1）</td></tr>\n' +
'      </tbody>\n' +
'    </table>\n' +
'  </div>\n' +
'\n' +
'  <div class="footer">© 2025 代理检测服务 - 基于 Cloudflare Workers 构建 | IP数据来源: ipapi.is\n' +
'    ' + footerToken + '\n' +
'  </div>\n' +
'</div>\n' +
'\n' +
'  <div id="toast" class="toast"></div>\n' +
'\n' +
'<script>\n' +
'  var currentDomainInfo = null;\n' +
'  var currentProxyTemplate = null;\n' +
'  var pathToken = ' + safeToken + ';\n' +
'\n' +
'  function showToast(msg, dur) {\n' +
'    dur = dur || 3000;\n' +
'    var t = document.getElementById("toast");\n' +
'    t.textContent = msg;\n' +
'    t.classList.add("show");\n' +
'    setTimeout(function() { t.classList.remove("show"); }, dur);\n' +
'  }\n' +
'\n' +
'  if (pathToken) {\n' +
'    document.addEventListener("DOMContentLoaded", function() {\n' +
'      showToast("✅ TOKEN验证通过，所有功能已启用", 5000);\n' +
'    });\n' +
'  }\n' +
'\n' +
'  function preprocessProxyUrl(input) {\n' +
'    var p = input.trim();\n' +
'    if (p.indexOf("#") !== -1) p = p.split("#")[0].trim();\n' +
'    while (p.charAt(0) === "/") p = p.substring(1);\n' +
'    if (p.indexOf("://") === -1) p = "socks5://" + p;\n' +
'    var parts = p.split("://");\n' +
'    var scheme = parts[0];\n' +
'    var rest = parts[1];\n' +
'    var auth = "";\n' +
'    var host = rest;\n' +
'    if (host.indexOf("@") !== -1) {\n' +
'      var i = host.lastIndexOf("@");\n' +
'      auth = host.substring(0, i + 1);\n' +
'      host = host.substring(i + 1);\n' +
'    }\n' +
'    var hostParts = host.split(":");\n' +
'    if (hostParts.length > 2) {\n' +
'      var port = hostParts[hostParts.length - 1];\n' +
'      var h = hostParts.slice(0, -1).join(":");\n' +
'      if (isIPv6Address(h) && h.charAt(0) !== "[") p = scheme + "://" + auth + "[" + h + "]:" + port;\n' +
'    }\n' +
'    return p;\n' +
'  }\n' +
'\n' +
'  function extractHostFromProxy(proxyUrl) {\n' +
'    var u = proxyUrl.indexOf("://") !== -1 ? proxyUrl.split("://")[1] : proxyUrl;\n' +
'    if (u.indexOf("@") !== -1) u = u.substring(u.lastIndexOf("@") + 1);\n' +
'    if (u.charAt(0) === "[" && u.indexOf("]:") !== -1) return u.substring(1, u.indexOf("]:"));\n' +
'    var h = u.split(":")[0];\n' +
'    if (h.charAt(0) === "[" && h.indexOf("]") !== -1) h = h.substring(1, h.indexOf("]"));\n' +
'    return h;\n' +
'  }\n' +
'\n' +
'  function isIPAddress(h) {\n' +
'    return /^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(h) || isIPv6Address(h);\n' +
'  }\n' +
'\n' +
'  function isIPv6Address(h) {\n' +
'    return /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$/.test(h);\n' +
'  }\n' +
'\n' +
'  function replaceHostInProxy(proxyUrl, newHost) {\n' +
'    var parts = proxyUrl.split("://");\n' +
'    var proto = parts[0];\n' +
'    var rest = parts[1];\n' +
'    var auth = "";\n' +
'    var h = rest;\n' +
'    if (h.indexOf("@") !== -1) {\n' +
'      var i = h.lastIndexOf("@");\n' +
'      auth = h.substring(0, i + 1);\n' +
'      h = h.substring(i + 1);\n' +
'    }\n' +
'    var port = h.split(":")[h.split(":").length - 1];\n' +
'    var nh = (isIPv6Address(newHost) && newHost.charAt(0) !== "[") ? "[" + newHost + "]" : newHost;\n' +
'    return proto + "://" + auth + nh + ":" + port;\n' +
'  }\n' +
'\n' +
'  async function fetchDNSRecords(domain, type) {\n' +
'    var r = await fetch("https://cloudflare-dns.com/dns-query?" + new URLSearchParams({ name: domain, type: type }), { headers: { Accept: "application/dns-json" } });\n' +
'    var d = await r.json();\n' +
'    return d.Answer || [];\n' +
'  }\n' +
'\n' +
'  async function resolveDomainIPs(domain) {\n' +
'    var v4 = await fetchDNSRecords(domain, "A").catch(function() { return []; });\n' +
'    var v6 = await fetchDNSRecords(domain, "AAAA").catch(function() { return []; });\n' +
'    var all = v4.map(function(r) { return r.data; }).concat(v6.map(function(r) { return r.data; })).filter(Boolean);\n' +
'    if (!all.length) throw new Error("无法解析域名 " + domain + " 的 IP");\n' +
'    return { domain: domain, all_ips: all, ipv4_addresses: v4.map(function(r) { return r.data; }), ipv6_addresses: v6.map(function(r) { return r.data; }), default_ip: all[0] };\n' +
'  }\n' +
'\n' +
'  function formatIpType(type) {\n' +
'    if (!type) return "<span>未知</span>";\n' +
'    var m = { isp: { t: "住宅", s: "color:#36893dcc;font-weight:bold" }, hosting: { t: "机房", s: "font-weight:bold" }, business: { t: "商用", s: "color:#eab308;font-weight:bold" } };\n' +
'    var x = m[type.toLowerCase()];\n' +
'    return x ? "<span style=\"" + x.s + "\">" + x.t + "</span>" : "<span style=\"font-weight:bold\">" + type + "</span>";\n' +
'  }\n' +
'\n' +
'  function calculateAbuseScore(cScore, aScore, flags) {\n' +
'    var c = parseFloat(cScore) || 0;\n' +
'    var a = parseFloat(aScore) || 0;\n' +
'    var base = ((c + a) / 2) * 5;\n' +
'    var risk = flags.is_bogon ? 1.0 : 0;\n' +
'    risk += [flags.is_crawler, flags.is_proxy, flags.is_vpn, flags.is_tor, flags.is_abuser].filter(Boolean).length * 0.15;\n' +
'    return (base === 0 && risk === 0) ? null : base + risk;\n' +
'  }\n' +
'\n' +
'  function getRiskLevelColor(lv) {\n' +
'    var colors = { "极度危险": "rgb(220,38,38)", "高风险": "rgb(239,68,68)", "轻微风险": "rgb(249,115,22)", "纯净": "rgb(22,163,74)", "极度纯净": "rgb(34,197,94)" };\n' +
'    return colors[lv] || "rgb(100,100,100)";\n' +
'  }\n' +
'\n' +
'  function formatAbuseScorePercentage(s) {\n' +
'    return s === null ? "未知" : (s * 100).toFixed(2) + "%";\n' +
'  }\n' +
'\n' +
'  function formatInfoDisplay(data, containerId, showIPSelector, responseTime) {\n' +
'    var container = document.getElementById(containerId);\n' +
'    if (containerId === "exitInfo") {\n' +
'      var title = document.getElementById("exitInfoTitle");\n' +
'      if (title) {\n' +
'        if (responseTime !== null && data && data.success) title.textContent = "出口信息(响应时间: " + (responseTime / 1000).toFixed(2) + "秒)";\n' +
'        else if (data && (!data.success || data.error)) title.textContent = "出口信息(代理不可用)";\n' +
'        else title.textContent = "出口信息";\n' +
'      }\n' +
'    }\n' +
'    if (!data || data.error) { container.innerHTML = "<div class=\"error\">数据获取失败，请稍后重试</div>"; return; }\n' +
'\n' +
'    var cScore = data.company ? data.company.abuser_score : null;\n' +
'    var aScore = data.asn ? data.asn.abuser_score : null;\n' +
'    var flags = { is_crawler: data.is_crawler, is_proxy: data.is_proxy, is_vpn: data.is_vpn, is_tor: data.is_tor, is_abuser: data.is_abuser, is_bogon: data.is_bogon };\n' +
'    var combined = calculateAbuseScore(cScore, aScore, flags);\n' +
'    var abuseHTML = "未知";\n' +
'    if (combined !== null) {\n' +
'      var pct = combined * 100;\n' +
'      var lv = pct >= 100 ? "极度危险" : pct >= 20 ? "高风险" : pct >= 5 ? "轻微风险" : pct >= 0.25 ? "纯净" : "极度纯净";\n' +
'      abuseHTML = "<span style=\"background:" + getRiskLevelColor(lv) + ";color:#fff;padding:4px 8px;border-radius:5px;font-size:.9em;font-weight:bold\">" + formatAbuseScorePercentage(combined) + " " + lv + "</span>";\n' +
'    }\n' +
'\n' +
'    var ipVal = data.ip || "N/A";\n' +
'    var ipDisplay = ipVal;\n' +
'    if (showIPSelector && currentDomainInfo && currentDomainInfo.all_ips && currentDomainInfo.all_ips.length > 1) {\n' +
'      var ipOptions = currentDomainInfo.all_ips.map(function(ip) {\n' +
'        return "<div class=\"ip-option" + (ip === ipVal ? " active" : "") + "\" data-ip=\"" + ip + "\">" + ip + "</div>";\n' +
'      }).join("");\n' +
'      ipDisplay = "<div class=\"ip-selector\"><button class=\"more-ip-btn\" id=\"moreIpBtn\">更多IP</button><span class=\"ip-text\">" + ipVal + "</span><div class=\"ip-dropdown\" id=\"ipDropdown\">" + ipOptions + "</div></div>";\n' +
'    }\n' +
'\n' +
'    function bool(v) {\n' +
'      return "<span class=\"" + (v ? "status-yes" : "status-no") + "\">" + (v ? "是" : "否") + "</span>";\n' +
'    }\n' +
'    function row(label, val) {\n' +
'      return "<div class=\"info-item\"><span class=\"info-label\">" + label + ":</span><span class=\"info-value\">" + val + "</span></div>";\n' +
'    }\n' +
'    container.innerHTML =\n' +
'      row("IP地址", "<div class=\"ip-value-container\">" + ipDisplay + "</div>") +\n' +
'      row("运营商/ASN类型", formatIpType(data.company ? data.company.type : null) + " / " + formatIpType(data.asn ? data.asn.type : null)) +\n' +
'      row("综合滥用评分", abuseHTML) +\n' +
'      row("网络爬虫", bool(data.is_crawler)) +\n' +
'      row("Tor网络", bool(data.is_tor)) +\n' +
'      row("代理", bool(data.is_proxy)) +\n' +
'      row("VPN", bool(data.is_vpn)) +\n' +
'      row("滥用IP", bool(data.is_abuser)) +\n' +
'      row("虚假IP", bool(data.is_bogon)) +\n' +
'      row("自治系统编号", data.asn && data.asn.asn ? "AS" + data.asn.asn : "N/A") +\n' +
'      row("所属组织", (data.asn && data.asn.org) || "N/A") +\n' +
'      row("国家", (data.location && data.location.country_code) || "N/A") +\n' +
'      row("城市", (data.location && data.location.city) || "N/A");\n' +
'\n' +
'    var moreIpBtn = document.getElementById("moreIpBtn");\n' +
'    if (moreIpBtn) {\n' +
'      moreIpBtn.addEventListener("click", function(e) {\n' +
'        e.stopPropagation();\n' +
'        var dd = document.getElementById("ipDropdown");\n' +
'        dd.classList.toggle("show");\n' +
'      });\n' +
'    }\n' +
'    var ipOptionsEls = document.querySelectorAll(".ip-option");\n' +
'    ipOptionsEls.forEach(function(el) {\n' +
'      el.addEventListener("click", function(e) {\n' +
'        e.stopPropagation();\n' +
'        var selectedIP = el.getAttribute("data-ip");\n' +
'        selectIP(selectedIP);\n' +
'      });\n' +
'    });\n' +
'    document.addEventListener("click", function closeDropdown(e) {\n' +
'      var dd = document.getElementById("ipDropdown");\n' +
'      if (dd && !e.target.closest(".ip-value-container")) {\n' +
'        dd.classList.remove("show");\n' +
'      }\n' +
'    });\n' +
'  }\n' +
'\n' +
'  async function fetchEntryInfo(host, retry) {\n' +
'    retry = retry || 0;\n' +
'    try {\n' +
'      var tq = pathToken ? "&token=" + encodeURIComponent(pathToken) : "";\n' +
'      var r = await fetch("/ip-info?ip=" + encodeURIComponent(host) + tq);\n' +
'      var d = await r.json();\n' +
'      if (d.error && retry < 3) {\n' +
'        await new Promise(function(res) { setTimeout(res, 1000); });\n' +
'        return fetchEntryInfo(host, retry + 1);\n' +
'      }\n' +
'      return d;\n' +
'    } catch(e) {\n' +
'      if (retry < 3) {\n' +
'        await new Promise(function(res) { setTimeout(res, 1000); });\n' +
'        return fetchEntryInfo(host, retry + 1);\n' +
'      }\n' +
'      throw e;\n' +
'    }\n' +
'  }\n' +
'\n' +
'  async function selectIP(selectedIP) {\n' +
'    var dd = document.getElementById("ipDropdown");\n' +
'    if (dd) dd.classList.remove("show");\n' +
'    var btn = document.getElementById("checkBtn");\n' +
'    var entry = document.getElementById("entryInfo");\n' +
'    var exit = document.getElementById("exitInfo");\n' +
'    btn.disabled = true;\n' +
'    entry.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在获取入口信息...</div>";\n' +
'    exit.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在获取出口信息...</div>";\n' +
'    try {\n' +
'      var entryIP = selectedIP.charAt(0) === "[" && selectedIP.charAt(selectedIP.length - 1) === "]" ? selectedIP.slice(1, -1) : selectedIP;\n' +
'      var entryData = await fetchEntryInfo(entryIP);\n' +
'      if (entryData.error) entry.innerHTML = "<div class=\"error\">入口信息获取失败</div>";\n' +
'      else formatInfoDisplay(entryData, "entryInfo", true);\n' +
'      var newProxy = replaceHostInProxy(currentProxyTemplate, selectedIP);\n' +
'      var pr = await fetch("/check?proxy=" + encodeURIComponent(newProxy));\n' +
'      var pd = await pr.json();\n' +
'      if (!pd.success) {\n' +
'        document.getElementById("exitInfoTitle").textContent = "出口信息(代理不可用)";\n' +
'        exit.innerHTML = "<div class=\"error\">代理检测失败</div>";\n' +
'      } else formatInfoDisplay(pd, "exitInfo", false, pd.responseTime);\n' +
'    } catch(e) {\n' +
'      entry.innerHTML = "<div class=\"error\">切换失败</div>";\n' +
'      exit.innerHTML = "<div class=\"error\">切换失败</div>";\n' +
'    } finally {\n' +
'      btn.disabled = false;\n' +
'    }\n' +
'  }\n' +
'\n' +
'  async function checkProxy() {\n' +
'    var input = document.getElementById("proxyInput");\n' +
'    var btn = document.getElementById("checkBtn");\n' +
'    var entry = document.getElementById("entryInfo");\n' +
'    var exit = document.getElementById("exitInfo");\n' +
'    var rawProxy = input.value.trim();\n' +
'    if (!rawProxy) { alert("请输入代理链接"); return; }\n' +
'    var proxyUrl = preprocessProxyUrl(rawProxy);\n' +
'    input.value = proxyUrl;\n' +
'    currentProxyTemplate = proxyUrl;\n' +
'    btn.disabled = true;\n' +
'    document.getElementById("exitInfoTitle").textContent = "出口信息";\n' +
'    entry.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在解析代理信息...</div>";\n' +
'    exit.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在解析代理信息...</div>";\n' +
'    try {\n' +
'      var host = extractHostFromProxy(proxyUrl);\n' +
'      var targetIP = host;\n' +
'      var targetProxy = proxyUrl;\n' +
'      currentDomainInfo = null;\n' +
'      if (!isIPAddress(host)) {\n' +
'        entry.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在解析域名...</div>";\n' +
'        try {\n' +
'          currentDomainInfo = await resolveDomainIPs(host);\n' +
'          targetIP = currentDomainInfo.default_ip;\n' +
'          targetProxy = replaceHostInProxy(proxyUrl, targetIP);\n' +
'          currentProxyTemplate = proxyUrl;\n' +
'        } catch(e) {\n' +
'          entry.innerHTML = "<div class=\"error\">域名解析失败: " + e.message + "</div>";\n' +
'          exit.innerHTML = "<div class=\"error\">域名解析失败: " + e.message + "</div>";\n' +
'          return;\n' +
'        }\n' +
'      }\n' +
'      entry.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在获取入口信息...</div>";\n' +
'      exit.innerHTML = "<div class=\"loading\"><div class=\"spinner\"></div>正在检测代理...</div>";\n' +
'      var entryIP = (targetIP.charAt(0) === "[" && targetIP.charAt(targetIP.length - 1) === "]") ? targetIP.slice(1, -1) : targetIP;\n' +
'      var results = await Promise.allSettled([\n' +
'        fetchEntryInfo(entryIP),\n' +
'        fetch("/check?proxy=" + encodeURIComponent(targetProxy)).then(function(r) { return r.json(); })\n' +
'      ]);\n' +
'      var ep = results[0];\n' +
'      var xp = results[1];\n' +
'      if (ep.status === "fulfilled") {\n' +
'        if (ep.value.error) entry.innerHTML = "<div class=\"error\">入口信息获取失败</div>";\n' +
'        else formatInfoDisplay(ep.value, "entryInfo", currentDomainInfo && currentDomainInfo.all_ips.length > 1);\n' +
'      } else entry.innerHTML = "<div class=\"error\">入口信息获取失败</div>";\n' +
'      if (xp.status === "fulfilled") {\n' +
'        if (!xp.value.success) {\n' +
'          document.getElementById("exitInfoTitle").textContent = "出口信息(代理不可用)";\n' +
'          exit.innerHTML = "<div class=\"error\">代理检测失败: " + (xp.value.error || "请检查代理链接") + "</div>";\n' +
'        } else formatInfoDisplay(xp.value, "exitInfo", false, xp.value.responseTime);\n' +
'      } else {\n' +
'        document.getElementById("exitInfoTitle").textContent = "出口信息(代理不可用)";\n' +
'        exit.innerHTML = "<div class=\"error\">代理检测失败</div>";\n' +
'      }\n' +
'    } catch(e) {\n' +
'      entry.innerHTML = "<div class=\"error\">检测失败</div>";\n' +
'      document.getElementById("exitInfoTitle").textContent = "出口信息(代理不可用)";\n' +
'      exit.innerHTML = "<div class=\"error\">检测失败</div>";\n' +
'    } finally {\n' +
'      btn.disabled = false;\n' +
'    }\n' +
'  }\n' +
'\n' +
'  document.getElementById("proxyInput").addEventListener("keypress", function(e) {\n' +
'    if (e.key === "Enter") checkProxy();\n' +
'  });\n' +
'  document.getElementById("checkBtn").addEventListener("click", checkProxy);\n' +
'<\/script>\n' +
'</body>\n' +
'</html>';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
