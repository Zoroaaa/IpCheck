// ============================================================
//  checkProxy.js — SOCKS5 / HTTP 代理可用性检测
// ============================================================
import { connect } from 'cloudflare:sockets';
import { getIpInfo } from './ipInfo.js';

// -------- 超时配置常量 --------
const CONNECT_TIMEOUT = 8000;      // 连接超时：8秒
const READ_TIMEOUT = 10000;        // 读取超时：10秒
const HANDSHAKE_TIMEOUT = 5000;    // 握手超时：5秒

// -------- 超时辅助函数 --------
function createTimeoutPromise(ms, message) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function withTimeout(promise, ms, message) {
  return Promise.race([promise, createTimeoutPromise(ms, message)]);
}

// -------- 解析代理地址 --------
export async function 获取SOCKS5账号(address) {
  if (address.includes('@')) {
    const idx = address.lastIndexOf('@');
    let up = address.substring(0, idx).replaceAll('%3D', '=');
    const b64 = /^(?:[A-Z0-9+/]{4})*(?:[A-Z0-9+/]{2}==|[A-Z0-9+/]{3}=)?$/i;
    if (b64.test(up) && !up.includes(':')) up = atob(up);
    address = `${up}@${address.substring(idx + 1)}`;
  }
  const at = address.lastIndexOf('@');
  const [hostPart, authPart] = at === -1 ? [address, undefined] : [address.substring(at + 1), address.substring(0, at)];

  let username, password;
  if (authPart) {
    [username, password] = authPart.split(':');
    if (!password) throw new Error('无效的 SOCKS 地址格式：认证部分必须是 "username:password"');
  }

  let hostname, port;
  if (hostPart.includes(']:')) {
    [hostname, port] = [hostPart.split(']:')[0] + ']', Number(hostPart.split(']:')[1].replace(/\D/g, ''))];
  } else if (hostPart.startsWith('[')) {
    [hostname, port] = [hostPart, 80];
  } else {
    const parts = hostPart.split(':');
    [hostname, port] = parts.length === 2 ? [parts[0], Number(parts[1].replace(/\D/g, ''))] : [hostPart, 80];
  }

  if (isNaN(port)) throw new Error('无效的 SOCKS 地址格式：端口号必须是数字');
  if (hostname.includes(':') && !/^\[.*\]$/.test(hostname))
    throw new Error('无效的 SOCKS 地址格式：IPv6 地址必须用方括号括起来');
  return { username, password, hostname, port };
}

// -------- HTTP CONNECT 代理 --------
async function httpConnect(target, targetPort, proxyInfo) {
  const { username, password, hostname, port } = proxyInfo;
  let sock, w, r;
  try {
    sock = await withTimeout(
      connect({ hostname, port }).then(s => { sock = s; return s.opened; }).then(() => sock),
      CONNECT_TIMEOUT,
      `连接代理服务器超时（${CONNECT_TIMEOUT / 1000}秒）`
    );
    w = sock.writable.getWriter();
    r = sock.readable.getReader();
    
    let req = `CONNECT ${target}:${targetPort} HTTP/1.1\r\nHost: ${target}:${targetPort}\r\n`;
    if (username && password) req += `Proxy-Authorization: Basic ${btoa(`${username}:${password}`)}\r\n`;
    req += `User-Agent: Mozilla/5.0\r\nProxy-Connection: Keep-Alive\r\nConnection: Keep-Alive\r\n\r\n`;
    await w.write(new TextEncoder().encode(req));

    let buf = new Uint8Array(0);
    let hdrEnd = -1;
    const readStartTime = Date.now();
    while (hdrEnd === -1 && buf.length < 8192) {
      if (Date.now() - readStartTime > HANDSHAKE_TIMEOUT) {
        throw new Error(`HTTP代理响应超时（${HANDSHAKE_TIMEOUT / 1000}秒）`);
      }
      const { done, value } = await withTimeout(r.read(), READ_TIMEOUT, '读取代理响应超时');
      if (done) throw new Error('HTTP代理连接中断');
      const nb = new Uint8Array(buf.length + value.length);
      nb.set(buf); nb.set(value, buf.length); buf = nb;
      for (let i = 0; i < buf.length - 3; i++) {
        if (buf[i] === 0x0d && buf[i+1] === 0x0a && buf[i+2] === 0x0d && buf[i+3] === 0x0a) { hdrEnd = i + 4; break; }
      }
    }
    if (hdrEnd === -1) throw new Error('HTTP代理响应格式无效');
    const hdr = new TextDecoder().decode(buf.slice(0, hdrEnd));
    const m = hdr.split('\r\n')[0].match(/HTTP\/\d\.\d\s+(\d+)/);
    if (!m) throw new Error(`HTTP代理响应格式无效: ${hdr.split('\r\n')[0]}`);
    if (parseInt(m[1]) < 200 || parseInt(m[1]) >= 300) throw new Error(`HTTP代理连接失败 [${m[1]}]`);

    if (hdrEnd < buf.length) {
      const remaining = buf.slice(hdrEnd);
      const { readable, writable } = new TransformStream();
      new ReadableStream({ start(c) { c.enqueue(remaining); } }).pipeTo(writable).catch(() => {});
      sock.readable = readable;
    }
    w.releaseLock(); r.releaseLock();
    return sock;
  } catch (e) {
    try { if (w) w.releaseLock(); } catch (_) {}
    try { if (r) r.releaseLock(); } catch (_) {}
    try { if (sock) sock.close(); } catch (_) {}
    throw new Error(`HTTP代理连接失败: ${e.message}`);
  }
}

// -------- SOCKS5 握手 --------
async function socks5Connect(target, targetPort, proxyInfo, addrType = 3) {
  const { username, password, hostname, port } = proxyInfo;
  const enc = new TextEncoder();
  let socket, w, r;
  try {
    socket = connect({ hostname, port });
    await withTimeout(socket.opened, CONNECT_TIMEOUT, `连接代理服务器超时（${CONNECT_TIMEOUT / 1000}秒）`);
    w = socket.writable.getWriter();
    r = socket.readable.getReader();

    await w.write(new Uint8Array([5, 2, 0, 2]));
    let res = (await withTimeout(r.read(), HANDSHAKE_TIMEOUT, 'SOCKS5握手响应超时')).value;
    if (!res || res[0] !== 0x05 || res[1] === 0xff) throw new Error('SOCKS5握手失败：服务器拒绝认证方式');

    if (res[1] === 0x02) {
      if (!username || !password) throw new Error('SOCKS5需要认证但未提供用户名/密码');
      await w.write(new Uint8Array([1, username.length, ...enc.encode(username), password.length, ...enc.encode(password)]));
      res = (await withTimeout(r.read(), HANDSHAKE_TIMEOUT, 'SOCKS5认证响应超时')).value;
      if (!res || res[0] !== 0x01 || res[1] !== 0x00) throw new Error('SOCKS5认证失败');
    }

    const DSTADDR = addrType === 1
      ? new Uint8Array([1, ...target.split('.').map(Number)])
      : addrType === 3
        ? new Uint8Array([3, target.length, ...enc.encode(target)])
        : new Uint8Array([4, ...target.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]);

    await w.write(new Uint8Array([5, 1, 0, ...DSTADDR, targetPort >> 8, targetPort & 0xff]));
    res = (await withTimeout(r.read(), HANDSHAKE_TIMEOUT, 'SOCKS5连接响应超时')).value;
    if (!res || res[1] !== 0x00) throw new Error(`SOCKS5连接失败: 错误码 0x${res[1]?.toString(16) || 'unknown'}`);

    w.releaseLock(); r.releaseLock();
    return socket;
  } catch (e) {
    try { if (w) w.releaseLock(); } catch (_) {}
    try { if (r) r.releaseLock(); } catch (_) {}
    try { if (socket) socket.close(); } catch (_) {}
    throw new Error(`SOCKS5连接失败: ${e.message}`);
  }
}

// -------- 检测目标地址（固定用 check.socks5.090227.xyz:80） --------
const CHECK_HOST = 'check.socks5.090227.xyz';
const CHECK_PORT = 80;

/**
 * 主检测函数
 * @param {'socks5'|'http'|'https'} protocol
 * @param {string} rawParam  协议之后的原始参数（不含协议前缀）
 */
export async function SOCKS5可用性验证(protocol, rawParam) {
  const t0 = Date.now();
  let proxyInfo;
  try {
    proxyInfo = await 获取SOCKS5账号(rawParam);
  } catch (e) {
    return { success: false, error: e.message, proxy: `${protocol}://${rawParam}`, responseTime: Date.now() - t0 };
  }

  const { username, password, hostname, port } = proxyInfo;
  const proxyStr = username && password
    ? `${username}:${password}@${hostname}:${port}`
    : `${hostname}:${port}`;

  try {
    const sock = protocol === 'socks5'
      ? await socks5Connect(CHECK_HOST, CHECK_PORT, proxyInfo)
      : await httpConnect(CHECK_HOST, CHECK_PORT, proxyInfo);

    if (!sock) return { success: false, error: '无法连接到代理服务器', proxy: `${protocol}://${proxyStr}`, responseTime: Date.now() - t0 };

    try {
      const w = sock.writable.getWriter();
      await w.write(new TextEncoder().encode(`GET /cdn-cgi/trace HTTP/1.1\r\nHost: ${CHECK_HOST}\r\nConnection: close\r\n\r\n`));
      w.releaseLock();

      const rdr = sock.readable.getReader();
      const dec = new TextDecoder();
      let resp = '';
      const readStartTime = Date.now();
      try {
        while (true) {
          if (Date.now() - readStartTime > READ_TIMEOUT) {
            throw new Error(`读取代理响应超时（${READ_TIMEOUT / 1000}秒）`);
          }
          const { done, value } = await withTimeout(rdr.read(), READ_TIMEOUT, '读取代理响应超时');
          if (done) break;
          resp += dec.decode(value, { stream: true });
        }
      } finally { rdr.releaseLock(); }
      await sock.close();

      const ipMatch = resp.match(/ip=(.*)/);
      const locMatch = resp.match(/loc=(.*)/);
      if (!ipMatch) throw new Error('代理响应中未找到 IP 信息');

      const exitIP = ipMatch[1].trim();
      const ipInfo = await getIpInfo(exitIP);
      return {
        success: true,
        proxy: `${protocol}://${proxyStr}`,
        ip: exitIP,
        loc: locMatch ? locMatch[1].trim() : 'N/A',
        responseTime: Date.now() - t0,
        ...ipInfo,
      };
    } catch (e) {
      try { await sock.close(); } catch (_) {}
      return { success: false, error: e.message, proxy: `${protocol}://${proxyStr}`, responseTime: Date.now() - t0 };
    }
  } catch (e) {
    return { success: false, error: e.message, proxy: `${protocol}://${rawParam}`, responseTime: Date.now() - t0 };
  }
}

/**
 * 根据端口号自动识别代理协议
 * @param {string} rawParam - 原始参数（不含协议前缀）
 * @returns {{ protocol: string, rawParam: string }}
 */
function autoDetectProtocol(rawParam) {
  let port = 1080;
  const atIdx = rawParam.lastIndexOf('@');
  const hostPart = atIdx === -1 ? rawParam : rawParam.substring(atIdx + 1);
  
  if (hostPart.includes(']:')) {
    port = parseInt(hostPart.split(']:')[1].replace(/\D/g, '')) || 443;
  } else if (hostPart.startsWith('[')) {
    port = 443;
  } else {
    const parts = hostPart.split(':');
    if (parts.length >= 2) {
      port = parseInt(parts[parts.length - 1].replace(/\D/g, '')) || 1080;
    }
  }

  const httpPorts = [80, 8080, 3128, 8888, 8000, 9000];
  const httpsPorts = [443, 8443];
  const socks5Ports = [1080, 10808, 10809, 9050, 7890];
  const socks4Ports = [1081];

  if (httpsPorts.includes(port)) return { protocol: 'https', rawParam };
  if (httpPorts.includes(port)) return { protocol: 'http', rawParam };
  if (socks4Ports.includes(port)) return { protocol: 'socks4', rawParam };
  if (socks5Ports.includes(port)) return { protocol: 'socks5', rawParam };
  
  return { protocol: 'socks5', rawParam };
}

/**
 * /check?proxy=... / ?socks5=... / ?http=... 路由处理器（SOCKS5/HTTP 模式）
 */
export async function handleCheckProxy(url) {
  let protocol, rawParam;

  if (url.searchParams.has('socks5')) {
    protocol = 'socks5'; rawParam = url.searchParams.get('socks5');
  } else if (url.searchParams.has('http')) {
    protocol = 'http'; rawParam = url.searchParams.get('http');
  } else if (url.searchParams.has('proxy')) {
    const p = url.searchParams.get('proxy');
    const lower = p.toLowerCase();
    if (lower.startsWith('socks5://')) { protocol = 'socks5'; rawParam = p.slice(9); }
    else if (lower.startsWith('socks4://')) { protocol = 'socks4'; rawParam = p.slice(9); }
    else if (lower.startsWith('socks://')) { protocol = 'socks5'; rawParam = p.slice(8); }
    else if (lower.startsWith('https://')) { protocol = 'https'; rawParam = p.slice(8); }
    else if (lower.startsWith('http://')) { protocol = 'http'; rawParam = p.slice(7); }
    else {
      const detected = autoDetectProtocol(p);
      protocol = detected.protocol;
      rawParam = detected.rawParam;
    }
  } else {
    return new Response(JSON.stringify({ success: false, error: '请提供有效的代理参数：socks5、http 或 proxy' }, null, 2), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  const result = await SOCKS5可用性验证(protocol, rawParam);
  return new Response(JSON.stringify(result, null, 2), {
    status: result.success ? 200 : 502,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
