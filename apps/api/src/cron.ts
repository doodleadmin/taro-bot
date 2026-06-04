/**
 * cron.ts — Планировщик задач.
 * Использует нативный setInterval для избежания зависимостей.
 * Более точный вариант — подключить node-cron, но это работает из коробки.
 */
import type { Bot } from 'grammy';
import { runFunnelStep, sendDailyCardPush } from './push.js';

// Текущее время в МСК (UTC+3)
function nowMsk(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
}

let _bot: Bot;

export function startCron(bot: Bot) {
  _bot = bot;

  // ── Воронка: проверяем каждые 5 минут ──────────────────────────────────────
  setInterval(async () => {
    try { await runFunnelStep(_bot); }
    catch (e) { console.error('[Cron] funnel error:', e); }
  }, 5 * 60 * 1000); // 5 мин

  // ── Карта дня: проверяем каждый час, шлём ровно в 09:00 МСК ───────────────
  setInterval(async () => {
    try {
      const msk = nowMsk();
      const h = msk.getHours(), m = msk.getMinutes();
      // Запускаем в 09:00–09:05 МСК
      if (h === 9 && m < 5) {
        await sendDailyCardPush(_bot);
      }
    } catch (e) { console.error('[Cron] daily push error:', e); }
  }, 60 * 1000); // каждую минуту

  console.log('[Cron] Started: funnel every 5 min, daily push at 09:00 MSK');
}
