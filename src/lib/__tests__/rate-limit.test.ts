import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests within limit', async () => {
    const result = await checkRateLimit('test-user', 'api');
    expect(result.success).toBe(true);
  });

  it('should block requests exceeding limit', async () => {
    // Mock database to return count exceeding limit
    const { db } = await import('@/lib/db');
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ count: 101 }]),
    });

    const result = await checkRateLimit('test-user', 'api');
    expect(result.success).toBe(false);
  });

  it('should return retry after time when rate limited', async () => {
    const { db } = await import('@/lib/db');
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ count: 101, resetAt: new Date(Date.now() + 60000) }]),
    });

    const result = await checkRateLimit('test-user', 'api');
    expect(result.retryAfter).toBeDefined();
  });
});
