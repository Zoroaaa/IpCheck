// ============================================================
//  batchCheck.js — 批量检测 API
//  
//  支持批量检测 ProxyIP 和 SOCKS5/HTTP 代理
//  POST /batch-check
//  请求体: { type: "proxyip" | "proxy", items: [...] }
// ============================================================

import { CheckProxyIP } from './checkProxyIP.js';
import { SOCKS5可用性验证 } from './checkProxy.js';

const BATCH_MAX_ITEMS = 50;
const BATCH_CONCURRENCY = 5;

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

export async function handleBatchCheck(request, url) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: '仅支持 POST 请求',
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: '请求体必须是有效的 JSON 格式',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { type, items } = body;

  if (!type || !['proxyip', 'proxy'].includes(type)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'type 参数必须是 "proxyip" 或 "proxy"',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (!items || !Array.isArray(items)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'items 参数必须是数组',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (items.length === 0) {
    return new Response(JSON.stringify({
      success: false,
      error: 'items 数组不能为空',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (items.length > BATCH_MAX_ITEMS) {
    return new Response(JSON.stringify({
      success: false,
      error: `最多支持 ${BATCH_MAX_ITEMS} 个项目同时检测`,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const startTime = Date.now();
  const results = [];

  if (type === 'proxyip') {
    await batchProcess(items, async (item) => {
      const colo = request.cf?.colo || 'CF';
      const result = await CheckProxyIP(item.trim(), colo);
      return { input: item, ...result };
    }, results);
  } else if (type === 'proxy') {
    await batchProcess(items, async (item) => {
      let protocol, rawParam;
      const p = item.trim();
      const lower = p.toLowerCase();

      if (lower.startsWith('socks5://')) {
        protocol = 'socks5';
        rawParam = p.slice(9);
      } else if (lower.startsWith('socks4://')) {
        protocol = 'socks4';
        rawParam = p.slice(9);
      } else if (lower.startsWith('socks://')) {
        protocol = 'socks5';
        rawParam = p.slice(8);
      } else if (lower.startsWith('https://')) {
        protocol = 'https';
        rawParam = p.slice(8);
      } else if (lower.startsWith('http://')) {
        protocol = 'http';
        rawParam = p.slice(7);
      } else {
        const detected = autoDetectProtocol(p);
        protocol = detected.protocol;
        rawParam = detected.rawParam;
      }

      const result = await SOCKS5可用性验证(protocol, rawParam);
      return { input: item, ...result };
    }, results);
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;

  return new Response(JSON.stringify({
    success: true,
    type,
    total: results.length,
    successCount,
    failCount,
    responseTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    results,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function batchProcess(items, processor, results) {
  const chunks = [];
  for (let i = 0; i < items.length; i += BATCH_CONCURRENCY) {
    chunks.push(items.slice(i, i + BATCH_CONCURRENCY));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (item) => {
        try {
          return await processor(item);
        } catch (e) {
          return { input: item, success: false, error: e.message };
        }
      })
    );
    results.push(...chunkResults);
  }
}
