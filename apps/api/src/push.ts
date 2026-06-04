/**
 * push.ts — Отправка уведомлений пользователям через Telegram Bot API.
 * Воронка онбординга + ежедневная карта дня.
 */
import { Bot, InlineKeyboard } from 'grammy';
import { prisma } from './db.js';
import { config } from './config.js';

// ── Тексты сообщений воронки ────────────────────────────────────────────────

const FUNNEL: Array<{
  step: number;
  delayMs: number;  // задержка от предыдущего шага
  type: string;
  build: (webappUrl: string) => { text: string; keyboard: InlineKeyboard; banner?: string };
}> = [
  {
    step: 1,
    delayMs: 5 * 60 * 1000, // 5 мин — не открыл приложение
    type: 'funnel_1',
    build: (url) => ({
      text:
        `🌙 *Ваша карта дня ещё не открыта*\n\n` +
        `Каждый день звёзды приготовили для вас особое послание.\n` +
        `Узнайте, какая карта ведёт вас сегодня — это бесплатно ✨`,
      keyboard: new InlineKeyboard().webApp('Открыть карту дня →', url),
      banner: 'card_days.png',
    }),
  },
  {
    step: 2,
    delayMs: 24 * 60 * 60 * 1000, // 24 ч
    type: 'funnel_2',
    build: (url) => ({
      text:
        `✨ *Бесплатный расклад ждёт вас*\n\n` +
        `Один расклад «Да или Нет» каждый день — без оплаты.\n` +
        `Задайте любой вопрос — карты ответят честно и прямо.`,
      keyboard: new InlineKeyboard().webApp('Получить ответ бесплатно →', url),
      banner: 'yes_and_no.png',
    }),
  },
  {
    step: 3,
    delayMs: 3 * 24 * 60 * 60 * 1000, // 3 дня
    type: 'funnel_3',
    build: (url) => ({
      text:
        `🔮 *Как развивается ваша ситуация?*\n\n` +
        `Прошло несколько дней. Карты готовы дать глубокую трактовку — ` +
        `раскладов «Отношения», «Ситуация» или «Кельтский крест».\n\n` +
        `Узнайте, что ждёт впереди.`,
      keyboard: new InlineKeyboard().webApp('Сделать расклад →', url),
    }),
  },
  {
    step: 4,
    delayMs: 7 * 24 * 60 * 60 * 1000, // 7 дней
    type: 'funnel_4',
    build: (url) => ({
      text:
        `🎁 *Подарок для вас*\n\n` +
        `Пополните баланс сегодня и получите *+50 ₽ бонус* — ` +
        `этого хватит на 3 расклада.\n\n` +
        `Предложение действует 48 часов.`,
      keyboard: new InlineKeyboard().webApp('Пополнить со скидкой →', url),
    }),
  },
];

// ── Отправка воронки ─────────────────────────────────────────────────────────

export async function runFunnelStep(bot: Bot): Promise<void> {
  const now = new Date();

  for (const step of FUNNEL) {
    // Пользователи, чей шаг воронки = step.step - 1 (предыдущий шаг пройден)
    // И достаточно времени прошло с предыдущего действия
    const targetStep = step.step - 1; // 0, 1, 2, 3
    const cutoff = new Date(now.getTime() - step.delayMs);

    const users = await prisma.user.findMany({
      where: {
        funnelStep: targetStep,
        funnelDoneAt: null,
        createdAt: { lte: cutoff },
      },
      take: 100, // батч до 100 за раз
    });

    for (const user of users) {
      // Проверяем идемпотентность (уже отправляли?)
      const alreadySent = await prisma.pushLog.findFirst({
        where: { userId: user.id, type: step.type },
      });
      if (alreadySent) continue;

      try {
        const { text, keyboard, banner } = step.build(config.webappUrl);
        const cdnBase = config.cdnBaseUrl || config.webappUrl;
        
        if (banner) {
          const bannerUrl = `${cdnBase}/banners/${banner}`;
          await bot.api.sendPhoto(user.tgId, bannerUrl, {
            caption: text,
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        } else {
          await bot.api.sendMessage(user.tgId, text, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        }
        // Логируем успех
        await prisma.$transaction([
          prisma.pushLog.create({ data: { userId: user.id, type: step.type, ok: true } }),
          prisma.user.update({ where: { id: user.id }, data: { funnelStep: step.step } }),
        ]);
      } catch (err: any) {
        // Пользователь заблокировал бота — ставим воронку завершённой
        const blocked = err?.error_code === 403;
        await prisma.pushLog.create({
          data: { userId: user.id, type: step.type, ok: false },
        });
        if (blocked) {
          await prisma.user.update({
            where: { id: user.id },
            data: { funnelDoneAt: now },
          });
        }
        console.warn(`[Push] funnel_${step.step} failed for user ${user.tgId}:`, err?.description ?? err?.message);
      }
    }
  }
}

// ── Ежедневная карта дня (09:00 МСК) ────────────────────────────────────────

export async function sendDailyCardPush(bot: Bot): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const pushType = `daily_${today}`;

  // Пользователи, которые сегодня ещё не открыли карту и которым ещё не отправляли
  const users = await prisma.user.findMany({
    where: {
      funnelDoneAt: null,
      OR: [
        { dayRevealedDate: null },
        { dayRevealedDate: { not: today } },
      ],
      pushLogs: { none: { type: pushType } },
    },
    take: 200,
  });

  const keyboard = new InlineKeyboard().webApp('☀️ Открыть карту дня', config.webappUrl);
  const text =
    `☀️ *Карта дня готова*\n\n` +
    `Ваша карта на сегодня уже ждёт. Откройте её первой — ` +
    `она задаст тон всему дню.`;

  const cdnBase = config.cdnBaseUrl || config.webappUrl;
  const bannerUrl = `${cdnBase}/banners/card_days.png`;

  let sent = 0, failed = 0;
  for (const user of users) {
    try {
      await bot.api.sendPhoto(user.tgId, bannerUrl, {
        caption: text,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      await prisma.pushLog.create({ data: { userId: user.id, type: pushType, ok: true } });
      sent++;
    } catch (err: any) {
      await prisma.pushLog.create({ data: { userId: user.id, type: pushType, ok: false } });
      failed++;
      if (err?.error_code === 403) {
        await prisma.user.update({ where: { id: user.id }, data: { funnelDoneAt: new Date() } });
      }
    }
    // Небольшая задержка чтобы не попасть под rate limit Telegram (30 msg/sec)
    await sleep(50);
  }
  console.log(`[Push] Daily card: sent ${sent}, failed ${failed}`);
}

// ── Массовая рассылка (из админки) ──────────────────────────────────────────

export async function sendBroadcast(
  bot: Bot,
  text: string,
  buttonLabel?: string,
  buttonUrl?: string,
  adminTgId?: string,
): Promise<{ sent: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: { funnelDoneAt: null },
    select: { id: true, tgId: true },
  });

  const keyboard = buttonLabel && buttonUrl
    ? new InlineKeyboard().webApp(buttonLabel, buttonUrl)
    : undefined;

  let sent = 0, failed = 0;
  for (const user of users) {
    try {
      await bot.api.sendMessage(user.tgId, text, {
        parse_mode: 'Markdown',
        ...(keyboard ? { reply_markup: keyboard } : {}),
      });
      sent++;
    } catch {
      failed++;
    }
    await sleep(50);
  }

  // Логируем рассылку
  await prisma.broadcast.create({
    data: { text, buttonLabel: buttonLabel ?? null, buttonUrl: buttonUrl ?? null, sentCount: sent, failCount: failed, adminId: adminTgId ?? 'api' },
  });

  console.log(`[Push] Broadcast: sent ${sent}, failed ${failed}`);
  return { sent, failed };
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
