import { creditService } from '@/lib/credits/credit-service';
import { db } from '@/server/db';
import { creditTransactions, userCredits } from '@/server/db/schema';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { eq } from 'drizzle-orm';

// Mock the database
jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  desc: jest.fn(),
  and: jest.fn(),
}));

describe('CreditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('earnCredits', () => {
    it('should earn credits and update balance', async () => {
      const userId = 'test-user-1';
      const amount = 100;
      const existingBalance = 50;

      // Mock existing credit account
      const mockAccount = {
        id: 'account-1',
        userId,
        balance: existingBalance,
        totalEarned: 100,
        totalSpent: 0,
        frozenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'tx-1',
              userId,
              type: 'earn',
              amount,
              balanceAfter: existingBalance + amount,
              source: 'subscription',
              createdAt: new Date(),
            },
          ]),
        }),
      });

      const result = await creditService.earnCredits({
        userId,
        amount,
        source: 'subscription',
        description: 'Test credit grant',
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(amount);
      expect(result.type).toBe('earn');
    });

    it('should throw error for negative amount', async () => {
      await expect(
        creditService.earnCredits({
          userId: 'test-user-1',
          amount: -10,
          source: 'subscription',
        })
      ).rejects.toThrow('Amount must be positive');
    });
  });

  describe('spendCredits', () => {
    it('should spend credits and update balance', async () => {
      const userId = 'test-user-1';
      const amount = 20;
      const existingBalance = 100;

      const mockAccount = {
        id: 'account-1',
        userId,
        balance: existingBalance,
        totalEarned: 200,
        totalSpent: 100,
        frozenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'tx-1',
              userId,
              type: 'spend',
              amount,
              balanceAfter: existingBalance - amount,
              source: 'api_call',
              createdAt: new Date(),
            },
          ]),
        }),
      });

      const result = await creditService.spendCredits({
        userId,
        amount,
        source: 'api_call',
        description: 'Test credit spend',
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(amount);
      expect(result.type).toBe('spend');
    });

    it('should throw error for insufficient credits', async () => {
      const userId = 'test-user-1';
      const amount = 100;
      const existingBalance = 50;

      const mockAccount = {
        id: 'account-1',
        userId,
        balance: existingBalance,
        totalEarned: 100,
        totalSpent: 50,
        frozenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      await expect(
        creditService.spendCredits({
          userId,
          amount,
          source: 'api_call',
        })
      ).rejects.toThrow('Insufficient credits');
    });
  });

  describe('hasEnoughCredits', () => {
    it('should return true when user has enough credits', async () => {
      const userId = 'test-user-1';
      const amount = 50;

      const mockAccount = {
        id: 'account-1',
        userId,
        balance: 100,
        totalEarned: 200,
        totalSpent: 100,
        frozenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      const result = await creditService.hasEnoughCredits(userId, amount);
      expect(result).toBe(true);
    });

    it('should return false when user has insufficient credits', async () => {
      const userId = 'test-user-1';
      const amount = 100;

      const mockAccount = {
        id: 'account-1',
        userId,
        balance: 50,
        totalEarned: 100,
        totalSpent: 50,
        frozenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAccount]),
          }),
        }),
      });

      const result = await creditService.hasEnoughCredits(userId, amount);
      expect(result).toBe(false);
    });
  });
});
