/**
 * IP Whitelisting for Admin Operations
 * Restricts sensitive operations to trusted IP addresses
 */

interface IPWhitelistConfig {
  enabled: boolean;
  allowedIPs: string[];
  allowedCIDRs: string[];
}

/**
 * Parse environment variable for IP whitelist
 * Format: comma-separated IPs and CIDR ranges
 * Example: "192.168.1.1,10.0.0.0/8,1.2.3.4"
 */
function parseIPWhitelist(): IPWhitelistConfig {
  const envWhitelist = process.env.ADMIN_IP_WHITELIST || '';
  
  if (!envWhitelist || envWhitelist === '') {
    return {
      enabled: false,
      allowedIPs: [],
      allowedCIDRs: [],
    };
  }

  const entries = envWhitelist.split(',').map(entry => entry.trim()).filter(Boolean);
  const ips: string[] = [];
  const cidrs: string[] = [];

  for (const entry of entries) {
    if (entry.includes('/')) {
      cidrs.push(entry);
    } else {
      ips.push(entry);
    }
  }

  return {
    enabled: true,
    allowedIPs: ips,
    allowedCIDRs: cidrs,
  };
}

const whitelistConfig = parseIPWhitelist();

/**
 * Check if an IP address is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [network, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength, 10);

  const ipParts = ip.split('.').map(Number);
  const networkParts = network.split('.').map(Number);

  // Convert to 32-bit integers
  const ipNum = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
  const networkNum = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];

  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  
  return (ipNum & mask) === (networkNum & mask);
}

/**
 * Check if an IP address is whitelisted
 */
export function isIPWhitelisted(ip: string): boolean {
  // If whitelist is disabled, allow all IPs
  if (!whitelistConfig.enabled) {
    return true;
  }

  // Check exact IP match
  if (whitelistConfig.allowedIPs.includes(ip)) {
    return true;
  }

  // Check CIDR ranges
  for (const cidr of whitelistConfig.allowedCIDRs) {
    if (isIPInCIDR(ip, cidr)) {
      return true;
    }
  }

  return false;
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback - this won't work in serverless but is a safe default
  return '0.0.0.0';
}

/**
 * Middleware to check IP whitelist for admin operations
 * Returns error response if IP is not whitelisted
 */
export function checkIPWhitelist(ip: string): { allowed: boolean; error?: string } {
  if (!whitelistConfig.enabled) {
    return { allowed: true };
  }

  if (isIPWhitelisted(ip)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: 'Access denied: Your IP address is not authorized for this operation',
  };
}

/**
 * Get whitelist configuration (for debugging/admin UI)
 */
export function getWhitelistConfig(): IPWhitelistConfig {
  return { ...whitelistConfig };
}
