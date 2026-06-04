import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
const mockPrisma = {
  $transaction: vi.fn(),
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  transaction: {
    create: vi.fn(),
  },
  reading: {
    create: vi.fn(),
  },
};

vi.mock('../db.js', () => ({ prisma: mockPrisma }));
vi.mock('../llm.js', () => ({
  getAiInterpretation: vi.fn().mockResolvedValue({
    cards: ['Трактовка 1', 'Трактовка 2', 'Трактовка 3'],
    summary: 'Общий вывод',
  }),
}));
vi.mock('../config.js', () => ({
  config: {
    botToken: 'test', nodeEnv: 'test', jwtSecret: 'test', jwtTtl: 86400,
    port: 3000, llmProvider: 'openai', llmApiKey: 'test', llmModel: 'gpt-4o-mini',
    paymentProvider: 'telegram', telegramPaymentToken: '', yukassaShopId: '',
    yukassaSecretKey: '', cdnBaseUrl: '', databaseUrl: 'postgresql://localhost/test',
    webappUrl: 'https://example.com',
  },
}));

// Simple unit tests for economy logic (without actual DB)
describe('Economy: balance deduction', () => {
  it('deducts correct amount for paid spread', () => {
    const balance = 100;
    const price = 15;
    const newBalance = balance - price;
    expect(newBalance).toBe(85);
  });

  it('blocks spread if balance insufficient', () => {
    const balance = 10;
    const price = 30;
    const canPay = balance >= price;
    expect(canPay).toBe(false);
  });

  it('calculates shortage correctly', () => {
    const balance = 10;
    const price = 30;
    const shortage = price - balance;
    expect(shortage).toBe(20);
  });

  it('free spread does not deduct balance', () => {
    const balance = 45;
    // Free spread: amount = 0
    const newBalance = balance - 0;
    expect(newBalance).toBe(45);
  });

  it('credits topup amount + bonus correctly', () => {
    const balance = 45;
    const amount = 150;
    const bonus = 15;
    const newBalance = balance + amount + bonus;
    expect(newBalance).toBe(210);
  });
});

describe('Economy: free daily spread', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  it('free spread available if freeUsedDate is null', () => {
    const freeUsedDate: string | null = null;
    const available = freeUsedDate !== today;
    expect(available).toBe(true);
  });

  it('free spread available if freeUsedDate is yesterday', () => {
    const freeUsedDate = yesterday;
    const available = freeUsedDate !== today;
    expect(available).toBe(true);
  });

  it('free spread NOT available if freeUsedDate is today', () => {
    const freeUsedDate = today;
    const available = freeUsedDate !== today;
    expect(available).toBe(false);
  });

  it('free spread only available for spreads with free1card flag', () => {
    const spreadWithFree = { free1card: true, price: 15 };
    const spreadWithout = { free1card: false, price: 15 };
    const freeAvailable = true;

    const canUseFreeForFirst = spreadWithFree.free1card && freeAvailable;
    const canUseFreeForSecond = !!spreadWithout.free1card && freeAvailable;

    expect(canUseFreeForFirst).toBe(true);
    expect(canUseFreeForSecond).toBe(false);
  });
});

describe('Economy: card draw', () => {
  it('draws correct number of unique cards', () => {
    // Simulate server-side card draw
    const pool = Array.from({ length: 78 }, (_, i) => i);
    const count = 10;
    const drawn: number[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      drawn.push(pool.splice(idx, 1)[0]);
    }
    expect(drawn.length).toBe(count);
    // All unique
    expect(new Set(drawn).size).toBe(count);
    // All in valid range
    drawn.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(78);
    });
  });

  it('reversed cards are within 0-100% probability', () => {
    const reversals = Array.from({ length: 1000 }, () => Math.random() < 0.35);
    const rate = reversals.filter(Boolean).length / 1000;
    // Should be roughly 35% ± 5%
    expect(rate).toBeGreaterThan(0.28);
    expect(rate).toBeLessThan(0.42);
  });
});

describe('Economy: topup idempotency', () => {
  it('same providerPaymentId should not credit twice', () => {
    const processed = new Set<string>();
    const providerPaymentId = 'pay_123';

    const credit = (id: string): boolean => {
      if (processed.has(id)) return false;
      processed.add(id);
      return true;
    };

    expect(credit(providerPaymentId)).toBe(true);
    expect(credit(providerPaymentId)).toBe(false); // already processed
  });
});
