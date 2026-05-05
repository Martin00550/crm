/**
 * Redis Caching Layer
 * Provides high-performance caching for frequently accessed data
 */

import Redis from 'ioredis';
import { logger } from '@/lib/logger';

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    logger.warn('Redis URL not configured, caching disabled');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', error);
    return null;
  }
}

/**
 * Cache configuration
 */
export const CacheConfig = {
  // Dashboard stats - cache for 5 minutes
  DASHBOARD_STATS: 300,
  
  // User preferences - cache for 1 hour
  USER_PREFERENCES: 3600,
  
  // API responses - cache for 2 minutes
  API_RESPONSE: 120,
  
  // User data - cache for 10 minutes
  USER_DATA: 600,
  
  // Agency data - cache for 5 minutes
  AGENCY_DATA: 300,
  
  // Policy lists - cache for 1 minute
  POLICY_LIST: 60,
  
  // Client lists - cache for 1 minute
  CLIENT_LIST: 60,
};

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get(key);
    if (!value) return null;
    
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Redis get error', error);
    return null;
  }
}

/**
 * Set cached value with TTL
 */
export async function setCached<T>(key: string, value: T, ttl: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    logger.error('Redis set error', error);
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Redis delete error', error);
    return false;
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis delete pattern error', error);
    return false;
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 */
export async function getOrSetCached<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  await setCached(key, data, ttl);
  
  return data;
}

/**
 * Invalidate cache for a specific resource
 */
export async function invalidateResourceCache(resourceType: string, resourceId: string): Promise<void> {
  const patterns = [
    `${resourceType}:${resourceId}`,
    `${resourceType}:${resourceId}:*`,
    `${resourceType}:list:*`,
  ];

  for (const pattern of patterns) {
    await deleteCachedPattern(pattern);
  }
}

/**
 * Generate cache key
 */
export function generateCacheKey(parts: string[]): string {
  return parts.join(':');
}

/**
 * Cache keys
 */
export const CacheKeys = {
  // Dashboard stats
  dashboardStats: (agencyId: string) => generateCacheKey(['dashboard', 'stats', agencyId]),
  
  // User preferences
  userPreferences: (userId: string) => generateCacheKey(['user', 'preferences', userId]),
  
  // User data
  userData: (userId: string) => generateCacheKey(['user', 'data', userId]),
  
  // Agency data
  agencyData: (agencyId: string) => generateCacheKey(['agency', 'data', agencyId]),
  
  // Policy list
  policyList: (agencyId: string, page: number = 1, limit: number = 50) => 
    generateCacheKey(['policy', 'list', agencyId, String(page), String(limit)]),
  
  // Client list
  clientList: (agencyId: string, page: number = 1, limit: number = 50) => 
    generateCacheKey(['client', 'list', agencyId, String(page), String(limit)]),
  
  // Policy details
  policyDetails: (policyId: string) => generateCacheKey(['policy', 'details', policyId]),
  
  // Client details
  clientDetails: (clientId: string) => generateCacheKey(['client', 'details', clientId]),
};

/**
 * Health check for Redis
 */
export async function redisHealthCheck(): Promise<{ healthy: boolean; message: string }> {
  const client = getRedisClient();
  if (!client) {
    return { healthy: false, message: 'Redis not configured' };
  }

  try {
    await client.ping();
    return { healthy: true, message: 'Redis connection healthy' };
  } catch (error) {
    return { healthy: false, message: 'Redis connection failed' };
  }
}
