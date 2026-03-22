// ============================================================
//  utils.js — 公共工具函数
// ============================================================

/**
 * 整理多值字符串（换行/逗号/竖线分隔），去重去空
 */
export async function 整理(内容) {
  const cleaned = 内容.replace(/[\t|"'\r\n]+/g, ',').replace(/,+/g, ',').replace(/^,|,$/g, '');
  return [...new Set(cleaned.split(',').filter(Boolean))];
}

/**
 * 随机选取数组元素
 */
export function 随机取(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * nginx 伪装页面
 */
export function nginx() {
  return `<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>body{width:35em;margin:0 auto;font-family:Tahoma,Verdana,Arial,sans-serif}</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and working. Further configuration is required.</p>
<p>For online documentation and support please refer to <a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at <a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>`;
}

/**
 * 反向代理 URL
 */
export async function 代理URL(代理网址, 目标url, 整理fn) {
  const list = await 整理fn(代理网址);
  const base = 随机取(list);
  const parsed = new URL(base);
  let pathname = parsed.pathname.replace(/\/$/, '') + 目标url.pathname;
  const newUrl = `${parsed.protocol}//${parsed.hostname}${pathname}${parsed.search}`;
  const resp = await fetch(newUrl);
  const newResp = new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: resp.headers });
  newResp.headers.set('X-New-URL', newUrl);
  return newResp;
}

/**
 * DNS 查询（使用 Cloudflare DoH）
 * 统一用 cloudflare-dns.com，两个项目均有此实现。
 */
export async function fetchDNSRecords(domain, type) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
  const resp = await fetch(url, { headers: { Accept: 'application/dns-json' } });
  if (!resp.ok) throw new Error(`DNS query failed: ${resp.statusText}`);
  const data = await resp.json();
  return data.Answer || [];
}

/**
 * 解析域名返回所有 IP（IPv4 在前，IPv6 用方括号包围）
 * ProxyIP 项目格式：IPv6 用 [addr] 包围；Socks5 项目 getIpInfo 内部直接用裸地址。
 * 此处返回两种形式供调用方选择。
 */
export async function resolveDomain(domain) {
  domain = domain.split(':')[0]; // 去掉端口
  const [v4recs, v6recs] = await Promise.all([
    fetchDNSRecords(domain, 'A').catch(() => []),
    fetchDNSRecords(domain, 'AAAA').catch(() => []),
  ]);
  const v4 = v4recs.filter(r => r.type === 1).map(r => r.data);
  const v6 = v6recs.filter(r => r.type === 28).map(r => `[${r.data}]`);
  const ips = [...v4, ...v6];
  if (ips.length === 0) throw new Error('No A or AAAA records found');
  return ips;
}

/**
 * JSON 响应快捷函数
 */
export function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
