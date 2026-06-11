import 'dotenv/config';

function require_env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env variable: ${key}`);
  return v;
}

const DEFAULT_ADMIN_IDS = ['1113930428', '435149892'];

const envAdminIds = (process.env.ADMIN_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  botToken: require_env('BOT_TOKEN'),
  webappUrl: require_env('WEBAPP_URL'),
  jwtSecret: require_env('JWT_SECRET'),
  jwtTtl: parseInt(process.env.JWT_TTL ?? '86400', 10),
  llmProvider: (process.env.LLM_PROVIDER ?? 'openai') as 'openai' | 'anthropic',
  llmApiKey: require_env('LLM_API_KEY'),
  // НЕ використовуйте gpt-4o-mini для бойових розкладів — він дає банальні відповіді.
  llmModel: process.env.LLM_MODEL ?? 'gpt-4o',
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? 'telegram') as 'telegram' | 'yukassa',
  telegramPaymentToken: process.env.TELEGRAM_PAYMENT_TOKEN ?? '',
  yukassaShopId: process.env.YUKASSA_SHOP_ID ?? '',
  yukassaSecretKey: process.env.YUKASSA_SECRET_KEY ?? '',
  cdnBaseUrl: process.env.CDN_BASE_URL ?? '',
  databaseUrl: require_env('DATABASE_URL'),
  // Список Telegram userId администраторов через запятую
  // Пример в .env: ADMIN_IDS=123456789,987654321
  adminIds: Array.from(new Set([...DEFAULT_ADMIN_IDS, ...envAdminIds])),
};

export function isAdmin(tgId: string): boolean {
  return config.adminIds.includes(tgId);
}
