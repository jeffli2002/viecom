import { handleCreditPackPurchase } from '@/app/api/webhooks/creem/route';
import { sendCreditPackPurchaseEmail } from '@/lib/email';
import { getUserInfo } from '@/lib/email/user-helper';
import { db } from '@/server/db';
import { creditPackPurchase, creditTransactions, userCredits } from '@/server/db/schema';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

jest.mock('@/config/payment.config', () => ({
  paymentConfig: {
    creditPacks: [
      {
        id: 'pack-1000',
        name: '1,000 Credits',
        credits: 1000,
        price: 30,
        creemProductKey: 'prod_1000',
      },
    ],
    plans: [],
  },
}));

jest.mock('@/lib/creem/creem-service', () => ({
  creemService: {},
}));

jest.mock('@/lib/creem/enforce-single-subscription', () => ({
  enforceSingleCreemSubscription: jest.fn(),
}));

jest.mock('@/lib/creem/plan-utils', () => ({
  formatPlanName: jest.fn(),
  getCreditsForPlan: jest.fn(),
  resolvePlanByIdentifier: jest.fn(),
  resolvePlanByProductId: jest.fn(),
}));

jest.mock('@/lib/creem/status-utils', () => ({
  normalizeCreemStatus: jest.fn(),
}));

jest.mock('@/lib/creem/subscription-credits', () => ({
  grantSubscriptionCredits: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendCreditPackPurchaseEmail: jest.fn(),
  sendSubscriptionCancelledEmail: jest.fn(),
  sendSubscriptionCreatedEmail: jest.fn(),
  sendSubscriptionDowngradedEmail: jest.fn(),
  sendSubscriptionUpgradedEmail: jest.fn(),
}));

jest.mock('@/lib/email/user-helper', () => ({
  getUserInfo: jest.fn(),
}));

jest.mock('@/server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((...args) => ({ type: 'eq', args })),
  and: jest.fn((...args) => ({ type: 'and', args })),
  or: jest.fn((...args) => ({ type: 'or', args })),
  sql: jest.fn((strings, ...values) => ({
    text: Array.isArray(strings) ? strings.join('?') : String(strings),
    values,
  })),
  desc: jest.fn(),
}));

type InsertCall = {
  table: unknown;
  values: Record<string, unknown>;
};

type UpdateCall = {
  table: unknown;
  values: Record<string, unknown>;
};

describe('handleCreditPackPurchase', () => {
  const baseEvent = {
    type: 'credit_pack_purchase',
    userId: 'user_123',
    productId: 'prod_1000',
    productName: '1,000 Credits',
    credits: 1000,
    orderId: 'ord_123',
    checkoutId: 'chk_123',
    amount: 3000,
    currency: 'USD',
    eventId: 'evt_123',
  };

  const mockSelect = db.select as jest.Mock;
  const mockInsert = db.insert as jest.Mock;
  const mockUpdate = db.update as jest.Mock;
  const mockGetUserInfo = getUserInfo as jest.MockedFunction<typeof getUserInfo>;
  const mockSendEmail = sendCreditPackPurchaseEmail as jest.MockedFunction<
    typeof sendCreditPackPurchaseEmail
  >;

  let insertCalls: InsertCall[];
  let updateCalls: UpdateCall[];

  const createSelectChain = (rows: unknown[]) => {
    const limit = jest.fn().mockResolvedValue(rows);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    return { from };
  };

  const setSelectResults = (...results: unknown[][]) => {
    mockSelect.mockReset();
    results.forEach((rows) => {
      mockSelect.mockReturnValueOnce(createSelectChain(rows));
    });
  };

  const setupMutationMocks = () => {
    insertCalls = [];
    updateCalls = [];

    mockInsert.mockImplementation((table) => {
      if (table === creditTransactions) {
        return {
          values: jest.fn((values) => {
            insertCalls.push({ table, values });
            return {
              returning: jest.fn().mockResolvedValue([{ id: 'credit_tx_1' }]),
            };
          }),
        };
      }

      return {
        values: jest.fn((values) => {
          insertCalls.push({ table, values });
          return Promise.resolve([]);
        }),
      };
    });

    mockUpdate.mockImplementation((table) => ({
      set: jest.fn((values) => {
        updateCalls.push({ table, values });
        return {
          where: jest.fn().mockResolvedValue(undefined),
        };
      }),
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMutationMocks();
    mockGetUserInfo.mockResolvedValue({
      email: 'user@example.com',
      name: 'Credit Tester',
    });
    mockSendEmail.mockResolvedValue(undefined);
  });

  it('grants credits and records transactions for an existing account', async () => {
    setSelectResults(
      [],
      [],
      [
        {
          userId: baseEvent.userId,
          balance: 200,
          totalEarned: 400,
        },
      ]
    );

    await handleCreditPackPurchase(baseEvent);

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]?.table).toBe(userCredits);
    expect(updateCalls[0]?.values.balance).toBe(1200);
    expect(updateCalls[0]?.values.totalEarned).toBe(1400);

    const creditTxCall = insertCalls.find((call) => call.table === creditTransactions);
    expect(creditTxCall).toBeDefined();
    expect(creditTxCall?.values.amount).toBe(1000);
    expect(creditTxCall?.values.balanceAfter).toBe(1200);
    expect(creditTxCall?.values.referenceId).toBe('creem_credit_pack_ord_123');
    const metadata = JSON.parse(String(creditTxCall?.values.metadata));
    expect(metadata.checkoutId).toBe(baseEvent.checkoutId);
    expect(metadata.orderId).toBe(baseEvent.orderId);
    expect(metadata.creemEventId).toBe(baseEvent.eventId);

    const creditPackCall = insertCalls.find((call) => call.table === creditPackPurchase);
    expect(creditPackCall).toBeDefined();
    expect(creditPackCall?.values.credits).toBe(1000);
    expect(creditPackCall?.values.amountCents).toBe(3000);
    expect(creditPackCall?.values.creditTransactionId).toBe('credit_tx_1');

    expect(mockSendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Credit Tester',
      '1,000 Credits',
      1000,
      30
    );
  });

  it('creates a credit account when user has no balance record', async () => {
    setSelectResults([], [], []);

    await handleCreditPackPurchase(baseEvent);

    const accountInsert = insertCalls.find((call) => call.table === userCredits);
    expect(accountInsert).toBeDefined();
    expect(accountInsert?.values.balance).toBe(1000);
    expect(accountInsert?.values.totalEarned).toBe(1000);

    const creditTxCall = insertCalls.find((call) => call.table === creditTransactions);
    expect(creditTxCall?.values.balanceAfter).toBe(1000);
    expect(updateCalls).toHaveLength(0);
  });

  it('skips processing when the reference transaction already exists', async () => {
    setSelectResults([
      {
        id: 'tx_existing',
      },
    ]);

    await handleCreditPackPurchase(baseEvent);

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockGetUserInfo).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
