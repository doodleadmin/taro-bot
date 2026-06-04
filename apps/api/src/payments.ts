import { config } from './config.js';
import { TOPUP } from '@taro/shared';
import type { TopupPackage } from '@taro/shared';

export interface InvoiceResult {
  method: 'telegram_stars' | 'yukassa';
  // For Telegram Stars: pass to sendInvoice
  telegramInvoice?: {
    title: string;
    description: string;
    payload: string;
    providerToken: string;
    currency: string;
    prices: Array<{ label: string; amount: number }>;
  };
  // For YuKassa: redirect URL
  paymentUrl?: string;
  externalId?: string;
}

export function getPackageById(packageId: string): TopupPackage | undefined {
  return TOPUP.find(p => p.id === packageId);
}

export async function createInvoice(
  userId: number,
  pkg: TopupPackage,
): Promise<InvoiceResult> {
  if (config.paymentProvider === 'telegram') {
    return {
      method: 'telegram_stars',
      telegramInvoice: {
        title: `Пополнение баланса — ${pkg.label}`,
        description: `+${pkg.amount}${pkg.bonus ? ` + ${pkg.bonus} бонус` : ''} ₽ на счёт Таро Премиум`,
        payload: JSON.stringify({ userId, packageId: pkg.id }),
        providerToken: config.telegramPaymentToken,
        currency: 'RUB',
        prices: [{ label: pkg.label, amount: pkg.amount * 100 }], // kopecks
      },
    };
  }

  if (config.paymentProvider === 'yukassa') {
    const idempotenceKey = `taro-${userId}-${pkg.id}-${Date.now()}`;
    const body = {
      amount: { value: String(pkg.amount) + '.00', currency: 'RUB' },
      confirmation: { type: 'redirect', return_url: config.webappUrl },
      description: `Пополнение баланса ${pkg.amount} ₽ (${pkg.label})`,
      metadata: { userId: String(userId), packageId: pkg.id },
    };
    const creds = Buffer.from(`${config.yukassaShopId}:${config.yukassaSecretKey}`).toString('base64');
    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${creds}`,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`YuKassa error: ${resp.status}`);
    const data = (await resp.json()) as { id: string; confirmation: { confirmation_url: string } };
    return {
      method: 'yukassa',
      paymentUrl: data.confirmation.confirmation_url,
      externalId: data.id,
    };
  }

  throw new Error(`Unknown payment provider: ${config.paymentProvider}`);
}

export interface WebhookPayload {
  userId: number;
  packageId: string;
  providerPaymentId: string;
}

export function parseYukassaWebhook(body: Record<string, unknown>): WebhookPayload | null {
  try {
    const obj = body as {
      event?: string;
      object?: {
        id: string;
        status: string;
        metadata?: { userId?: string; packageId?: string };
      };
    };
    if (obj.event !== 'payment.succeeded') return null;
    const payment = obj.object!;
    if (payment.status !== 'succeeded') return null;
    const meta = payment.metadata ?? {};
    if (!meta.userId || !meta.packageId) return null;
    return {
      userId: parseInt(meta.userId, 10),
      packageId: meta.packageId,
      providerPaymentId: payment.id,
    };
  } catch {
    return null;
  }
}

export function parseTelegramStarsWebhook(body: Record<string, unknown>): WebhookPayload | null {
  try {
    const msg = body as {
      message?: { successful_payment?: { invoice_payload?: string; telegram_payment_charge_id?: string } };
    };
    const sp = msg.message?.successful_payment;
    if (!sp?.invoice_payload) return null;
    const payload = JSON.parse(sp.invoice_payload) as { userId: number; packageId: string };
    return {
      userId: payload.userId,
      packageId: payload.packageId,
      providerPaymentId: sp.telegram_payment_charge_id ?? String(Date.now()),
    };
  } catch {
    return null;
  }
}
