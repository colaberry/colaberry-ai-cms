import path from 'node:path';
import dns from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Blocks SSRF by rejecting private/internal IPs and non-HTTPS URLs.
 * Only allows http/https schemes to external hosts.
 * Resolves DNS to prevent rebinding attacks (e.g., nip.io, xip.io).
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
]);

function isPrivateIp(ip: string): boolean {
  // IPv4 private ranges
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^127\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true; // link-local / cloud metadata
  if (/^0\./.test(ip)) return true;
  // IPv6 loopback and link-local
  if (ip === '::1' || ip === '::' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  // IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1)
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped && isPrivateIp(v4Mapped[1])) return true;
  return false;
}

export function isUrlAllowed(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) return false;
    if (isIP(hostname) && isPrivateIp(hostname)) return false;
    // Block hostnames that resolve to common metadata endpoints
    if (hostname.endsWith('.internal')) return false;
    // Block URLs with embedded credentials (http://user:pass@host)
    if (url.username || url.password) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve DNS and verify all resolved IPs are public.
 * Prevents DNS rebinding attacks where a hostname resolves to a private IP.
 */
async function resolveAndCheckIps(hostname: string): Promise<boolean> {
  // If it's already an IP literal, skip DNS resolution
  if (isIP(hostname)) return !isPrivateIp(hostname);

  try {
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
    const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);
    const all = [...addresses, ...addresses6];

    // No DNS records = suspicious, block it
    if (all.length === 0) return false;

    // Every resolved IP must be public
    return all.every((ip) => !isPrivateIp(ip));
  } catch {
    return false;
  }
}

/**
 * Full SSRF-safe URL validation: URL parse check + DNS resolution check.
 * Use this instead of isUrlAllowed() when fetching external URLs.
 */
export async function isUrlSafe(rawUrl: string): Promise<boolean> {
  if (!isUrlAllowed(rawUrl)) return false;

  const url = new URL(rawUrl);
  return resolveAndCheckIps(url.hostname);
}

/**
 * Validates that a resolved file path stays within the allowed base directory.
 * Prevents path traversal attacks (e.g., ../../etc/passwd).
 */
export function isSafeLocalPath(basePath: string, filePath: string): boolean {
  const resolved = path.resolve(basePath, filePath);
  const normalizedBase = path.resolve(basePath) + path.sep;
  return resolved.startsWith(normalizedBase) || resolved === path.resolve(basePath);
}
