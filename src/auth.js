// ============================================================
//  auth.js — TOKEN 验证与双重哈希（两项目共用）
// ============================================================

/**
 * 双重 SHA-256 哈希，用于生成临时 TOKEN
 * ProxyIP 项目时间窗口 31 分钟，Socks5 项目 12 小时。
 * 合并后统一用 31 分钟（更安全），若需宽松可改为 720）。
 * 
 * 安全升级：从 MD5 升级为 SHA-256（MD5 已被破解，不适用于安全场景）
 */
export async function 双重哈希(文本) {
  const enc = new TextEncoder();
  const h1 = await crypto.subtle.digest('SHA-256', enc.encode(文本));
  const hex1 = Array.from(new Uint8Array(h1)).map(b => b.toString(16).padStart(2, '0')).join('');
  const h2 = await crypto.subtle.digest('SHA-256', enc.encode(hex1.slice(7, 27)));
  return Array.from(new Uint8Array(h2)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

/**
 * 初始化 TOKEN，返回 { 临时TOKEN, 永久TOKEN }
 */
export async function initTokens(hostname, ua, env) {
  const ts = Math.ceil(Date.now() / (1000 * 60 * 31));
  const 临时TOKEN = await 双重哈希(hostname + ts + ua);
  const 永久TOKEN = env.TOKEN || 临时TOKEN;
  return { 临时TOKEN, 永久TOKEN };
}

/**
 * 解析路径中的 TOKEN，返回 { 已验证, 路径TOKEN, 实际路径 }
 */
export function parsePathToken(pathname, 临时TOKEN, 永久TOKEN) {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length > 0 && (segs[0] === 临时TOKEN || segs[0] === 永久TOKEN)) {
    return {
      已验证: true,
      路径TOKEN: segs[0],
      实际路径: ('/' + segs.slice(1).join('/')).toLowerCase() || '/',
    };
  }
  return { 已验证: false, 路径TOKEN: null, 实际路径: pathname.toLowerCase() };
}

/**
 * 验证查询参数中的 TOKEN
 */
export function validateQueryToken(searchParams, 临时TOKEN, 永久TOKEN) {
  const t = searchParams.get('token');
  return t === 临时TOKEN || t === 永久TOKEN;
}

/**
 * 统一的 403 JSON 响应
 */
export function forbidden(message = '无效的TOKEN') {
  return new Response(JSON.stringify({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  }, null, 2), {
    status: 403,
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' },
  });
}
