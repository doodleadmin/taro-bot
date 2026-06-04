import { describe, it, expect, vi, beforeAll } from 'vitest';
import crypto from 'node:crypto';

// Mock config before importing auth
vi.mock('../config.js', () => ({
  config: {
    botToken: 'test_bot_token_123',
    nodeEnv: 'test',
    jwtSecret: 'test_secret',
    jwtTtl: 86400,
    port: 3000,
    llmProvider: 'openai',
    llmApiKey: 'test',
    llmModel: 'gpt-4o-mini',
    paymentProvider: 'telegram',
    telegramPaymentToken: '',
    yukassaShopId: '',
    yukassaSecretKey: '',
    cdnBaseUrl: '',
    databaseUrl: 'postgresql://localhost/test',
    webappUrl: 'https://example.com',
  },
}));

import { validateInitData, parseInitDataDev } from '../auth.js';

function makeValidInitData(botToken: string, userId: number = 12345): string {
  const user = JSON.stringify({
    id: userId,
    first_name: 'Test',
    username: 'testuser',
  });
  const authDate = Math.floor(Date.now() / 1000);

  const params = new URLSearchParams({
    user,
    auth_date: String(authDate),
    query_id: 'test_query',
  });
  // Sort params for data_check_string
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.set('hash', hash);
  return params.toString();
}

describe('validateInitData', () => {
  it('validates correct initData signature', () => {
    const initData = makeValidInitData('test_bot_token_123');
    const result = validateInitData(initData);
    expect(result.user.id).toBe(12345);
    expect(result.user.first_name).toBe('Test');
    expect(result.user.username).toBe('testuser');
  });

  it('rejects tampered initData', () => {
    const initData = makeValidInitData('test_bot_token_123');
    const tampered = initData.replace('testuser', 'hacker');
    expect(() => validateInitData(tampered)).toThrow('Invalid initData signature');
  });

  it('rejects wrong bot token', () => {
    const initData = makeValidInitData('wrong_token');
    expect(() => validateInitData(initData)).toThrow('Invalid initData signature');
  });

  it('rejects missing hash', () => {
    const params = new URLSearchParams({ user: '{"id":1,"first_name":"Test"}', auth_date: '1700000000' });
    expect(() => validateInitData(params.toString())).toThrow('Missing hash');
  });
});

describe('parseInitDataDev', () => {
  it('allows dev: prefix in non-production', () => {
    vi.mock('../config.js', () => ({
      config: { botToken: 'test', nodeEnv: 'development' },
    }));
    const result = parseInitDataDev('dev:42');
    expect(result.user.id).toBe(42);
    expect(result.user.first_name).toBe('Dev User');
  });
});
