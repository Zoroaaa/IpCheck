// ============================================================
//  ipInfo.js — IP 信息查询（统一使用 ipapi.is）
//
//  原 ProxyIP 项目用 ip-api.com（HTTP，字段不同），
//  原 Socks5  项目用 ipapi.is（HTTPS，字段更丰富）。
//  合并后统一用 ipapi.is，前端 ProxyIP 页面的 formatIPInfo
//  对应字段已同步调整。
//
//  修复：添加超时控制和降级策略
// ============================================================

import { fetchDNSRecords } from './utils.js';

// -------- 超时配置常量 --------
const API_TIMEOUT = 5000;           // API 请求超时：5秒
const DNS_TIMEOUT = 3000;           // DNS 解析超时：3秒

// -------- 超时辅助函数 --------
function createTimeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`请求超时（${ms / 1000}秒）`)), ms);
  });
}

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return resp;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      throw new Error(`请求超时（${ms / 1000}秒）`);
    }
    throw e;
  }
}

// -------- 降级数据模板 --------
function getFallbackIpInfo(ip) {
  return {
    ip,
    timestamp: new Date().toISOString(),
    fallback: true,
    message: 'IP 信息查询服务暂时不可用，显示基础信息',
    location: { country_code: 'N/A', city: 'N/A' },
    asn: { asn: null, org: 'N/A' },
    company: { type: 'unknown', abuser_score: null },
    is_datacenter: null,
    is_vpn: null,
    is_proxy: null,
    is_tor: null,
    is_crawler: null,
    is_abuser: null,
    is_bogon: null,
  };
}

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const IPV6_RE = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4})*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$/;

function isIP(s) { return IPV4_RE.test(s) || IPV6_RE.test(s); }

/**
 * 查询 IP 信息。若传入的是域名，先解析到 IP 再查询。
 * 返回 ipapi.is 的原始数据 + timestamp + (域名时附加 domain/resolved_ip/dns_info)。
 * 
 * 增加超时控制和降级策略：当 API 不可用时返回基础信息
 */
export async function getIpInfo(ip) {
  let finalIp = ip;
  let allIps = null;
  let v4addr = [];
  let v6addr = [];

  if (!isIP(ip)) {
    try {
      const dnsResults = await Promise.race([
        Promise.all([
          fetchDNSRecords(ip, 'A').catch(() => []),
          fetchDNSRecords(ip, 'AAAA').catch(() => []),
        ]),
        createTimeoutPromise(DNS_TIMEOUT),
      ]);
      v4addr = dnsResults[0].map(r => r.data).filter(Boolean);
      v6addr = dnsResults[1].map(r => r.data).filter(Boolean);
      allIps = [...v4addr, ...v6addr];
      if (allIps.length === 0) throw new Error(`无法解析域名 ${ip} 的 IP 地址`);
      finalIp = allIps[Math.floor(Math.random() * allIps.length)];
    } catch (e) {
      return {
        ...getFallbackIpInfo(ip),
        error: e.message,
        domain: ip,
      };
    }
  }

  try {
    const resp = await fetchWithTimeout(`https://api.ipapi.is/?q=${finalIp}`, API_TIMEOUT);
    if (!resp.ok) {
      if (resp.status >= 500) {
        return getFallbackIpInfo(finalIp);
      }
      throw new Error(`HTTP error: ${resp.status}`);
    }
    const data = await resp.json();
    data.timestamp = new Date().toISOString();

    if (allIps && finalIp !== ip) {
      data.domain = ip;
      data.resolved_ip = finalIp;
      data.ips = allIps;
      data.dns_info = {
        total_ips: allIps.length,
        ipv4_count: v4addr.length,
        ipv6_count: allIps.length - v4addr.length,
        selected_ip: finalIp,
        all_ips: allIps,
      };
    }

    return data;
  } catch (e) {
    console.error(`IP info API failed for ${finalIp}:`, e.message);
    return {
      ...getFallbackIpInfo(finalIp),
      error: e.message,
    };
  }
}

/**
 * /ip-info 路由处理器
 */
export async function handleIpInfo(request, url) {
  let ip = url.searchParams.get('ip') || request.headers.get('CF-Connecting-IP');
  if (!ip) {
    return new Response(JSON.stringify({ status: 'error', message: 'IP参数未提供', timestamp: new Date().toISOString() }, null, 2), {
      status: 400, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' },
    });
  }
  // 去掉 IPv6 方括号
  ip = ip.replace(/^\[|\]$/g, '');
  try {
    const data = await getIpInfo(ip);
    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error', message: `IP查询失败: ${err.message}`,
      code: 'API_REQUEST_FAILED', query: ip, timestamp: new Date().toISOString(),
    }, null, 2), {
      status: 500, headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
