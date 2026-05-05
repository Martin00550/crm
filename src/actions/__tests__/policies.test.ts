import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPolicyLeakageRisk, getRetentionStrategy } from '../policies';
import { db } from '@/lib/db';

// Mock auth
vi.mock('@/lib/auth-wrapper', () => ({
  requireAgencyAuth: vi.fn().mockResolvedValue({ userId: 'user-1', agencyId: 'agency-1' }),
}));

// Mock db
vi.mock('@/lib/db', () => {
  const mock = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    then: vi.fn(),
  };
  mock.then.mockImplementation((fn) => mock.execute().then(fn));
  return { db: mock };
});

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatCurrency: vi.fn((v) => `$${v}`),
  formatDate: vi.fn((v) => v.toISOString()),
  calculateDaysUntil: vi.fn(() => 30),
}));

describe('Policy Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPolicyLeakageRisk', () => {
    it('should calculate risk correctly for high-increase policies', async () => {
      vi.mocked(db.execute).mockResolvedValueOnce([
        {
          id: 'p1',
          premium: '1000',
          currentTermPremium: '1300',
          previousTermPremium: '1000',
          expirationDate: new Date(),
          healthScore: 80,
          clientName: 'Test Client',
        }
      ]);

      const result = await getPolicyLeakageRisk('agency-1');
      expect(result.summary.criticalRisk).toBe(1);
      expect(result.policies[0].riskFactors).toContain('Premium increased 30.0%');
    });
  });

  describe('getRetentionStrategy', () => {
    it('should recommend remarketing if premium increase is high', async () => {
      const mockedDb = vi.mocked(db);
      mockedDb.where.mockReturnThis();
      mockedDb.limit.mockReturnThis();
      mockedDb.from.mockReturnThis();
      
      // First call (policy)
      mockedDb.execute.mockResolvedValueOnce([{ id: 'p1', agencyId: 'agency-1', currentTermPremium: '1200', previousTermPremium: '1000', expirationDate: new Date() }]);
      // Second call (client)
      mockedDb.execute.mockResolvedValueOnce([{ id: 'c1', name: 'Test Client' }]);

      const result = await getRetentionStrategy('p1');
      expect(result?.strategies[0].action).toBe('Remarket Coverage');
    });
  });
});
