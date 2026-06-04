import { Bot, InlineKeyboard } from 'grammy';
import { config, isAdmin } from './config.js';
import { prisma } from './db.js';

let _bot: Bot | null = null;

export function getBotInstance(): Bot | null {
  return _bot;
}

export function createBot() {
  const bot = new Bot(config.botToken);
  _bot = bot;

  // ── /start ──────────────────────────────────────────────────────────────────
  bot.command('start', async (ctx) => {
    const name = ctx.from?.first_name ?? 'друг';
    const tgId = String(ctx.from?.id);

    // Получаем или создаём пользователя (регистрация)
    let user;
    try {
      user = await prisma.user.upsert({
        where: { tgId },
        create: {
          tgId,
          firstName: ctx.from?.first_name ?? '',
          username: ctx.from?.username ?? null,
          photoUrl: null,
          balance: 0,
          funnelStep: 0,
        },
        update: {},
      });
    } catch { /* уже зарегистрирован */ }

    const keyboard = new InlineKeyboard().webApp('🔮 Открыть Таро Премиум', config.webappUrl);
    const bannerUrl = `${config.cdnBaseUrl || config.webappUrl}/banners/start.png`;

    await ctx.replyWithPhoto(bannerUrl, {
      caption:
        `🌙 Привет, *${name}*!\n\n` +
        `Добро пожаловать в *Таро Премиум* — ваш личный оракул судьбы.\n\n` +
        `🃏 Расклады на любой вопрос\n` +
        `🌟 Карта дня — бесплатно каждый день\n` +
        `🌙 Натальная карта личности\n` +
        `✨ Глубокая ИИ-трактовка от мудрого таролога\n\n` +
        `_Первый расклад «Да или Нет» — бесплатно_ 🎁`,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  });

  // ── /help ───────────────────────────────────────────────────────────────────
  bot.command('help', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp('🔮 Открыть приложение', config.webappUrl);
    await ctx.reply(
      `*Таро Премиум* — справка\n\n` +
      `💰 *Баланс* — пополняется внутри приложения\n` +
      `🆓 *Бесплатно* — один расклад «Да или Нет» в день\n` +
      `🌅 *Карта дня* — всегда бесплатна\n` +
      `🔮 *Расклады* — от 15 ₽\n` +
      `🌙 *Натальная карта* — 100 ₽`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ── /admin ──────────────────────────────────────────────────────────────────
  bot.command('admin', async (ctx) => {
    const tgId = String(ctx.from?.id);
    if (!isAdmin(tgId)) {
      await ctx.reply('⛔ У вас нет доступа к этой команде.');
      return;
    }

    const adminUrl = `${config.webappUrl}?tg_admin=1`;
    const keyboard = new InlineKeyboard().webApp('📊 Открыть панель управления', adminUrl);

    await ctx.reply(
      `🛠 *Панель администратора*\n\n` +
      `Нажмите кнопку ниже, чтобы открыть дашборд:`,
      { parse_mode: 'Markdown', reply_markup: keyboard },
    );
  });

  // ── /stats — быстрая статистика прямо в чат ─────────────────────────────────
  bot.command('stats', async (ctx) => {
    const tgId = String(ctx.from?.id);
    if (!isAdmin(tgId)) return;

    const today = new Date().toISOString().slice(0, 10);
    const [users, newToday, revenue, readings] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(today) } } }),
      prisma.transaction.aggregate({ where: { type: 'topup' }, _sum: { amount: true } }),
      prisma.reading.count({ where: { createdAt: { gte: new Date(today) } } }),
    ]);

    await ctx.reply(
      `📊 *Статистика*\n\n` +
      `👤 Пользователей: *${users}* (+${newToday} сегодня)\n` +
      `💰 Оборот всего: *${revenue._sum.amount ?? 0} ₽*\n` +
      `🃏 Раскладов сегодня: *${readings}*`,
      { parse_mode: 'Markdown' },
    );
  });

  // ── Successful payment (Telegram Stars) ─────────────────────────────────────
  bot.on('message:successful_payment', async (ctx) => {
    await ctx.reply('✅ Оплата прошла успешно! Баланс пополнен.');
  });

  bot.catch((err) => {
    console.error('[Bot] Error:', err.message);
  });

  return bot;
}
