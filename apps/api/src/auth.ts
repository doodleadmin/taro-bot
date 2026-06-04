import crypto from 'node:crypto';
import { config } from './config.js';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface ParsedInitData {
  user: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
  chat_instance?: string;
  chat_type?: string;
}

/**
 * Validates Telegram WebApp initData HMAC-SHA256 signature.
 * See: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string): ParsedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing hash in initData');

  // Build data_check_string: sorted key=value pairs (without hash), joined by \n
  params.delete('hash');
  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  // Secret key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(config.botToken)
    .digest();

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) {
    throw new Error('Invalid initData signature');
  }

  // Check auth_date freshness (max 24 hours)
  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    throw new Error('initData expired');
  }

  const userJson = params.get('user');
  if (!userJson) throw new Error('No user in initData');
  const user: TelegramUser = JSON.parse(userJson);

  return {
    user,
    auth_date: authDate,
    hash,
    query_id: params.get('query_id') ?? undefined,
  };
}

/**
 * For local development: allows bypassing signature validation
 * when NODE_ENV !== 'production' and initData starts with 'dev:'.
 */
export function parseInitDataDev(initData: string): ParsedInitData {
  if (config.nodeEnv !== 'production' && initData.startsWith('dev:')) {
    const userId = initData.slice(4) || '000000001';
    return {
      user: { id: parseInt(userId, 10), first_name: 'Dev User', username: 'devuser' },
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'dev',
    };
  }
  return validateInitData(initData);
}
