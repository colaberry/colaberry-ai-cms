import path from 'node:path';
import { isIP } from 'node:net';

/**
 * Blocks SSRF by rejecting private/internal IPs and non-HTTPS URLs.
 * Only allows http/https schemes to external hosts.
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
    return true;
  } catch {
    return false;
  }
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
