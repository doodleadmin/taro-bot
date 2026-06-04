import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import 'dotenv/config';

import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { catalogRoutes } from './routes/catalog.js';
import { readingRoutes } from './routes/reading.js';
import { topupRoutes } from './routes/topup.js';
import { adminRoutes } from './routes/admin.js';
import { createBot } from './bot.js';
import { startCron } from './cron.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function start() {
  const app = Fastify({ logger: false });

  await app.register(fastifyCors, { origin: true, credentials: true });
  await app.register(fastifyJwt, { secret: config.jwtSecret });

  app.decorate('authenticate', async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.setErrorHandler((err: any, _req: FastifyRequest, reply: FastifyReply) => {
    if (err.code === 'INSUFFICIENT_BALANCE') {
      return reply.status(402).send({ error: 'Insufficient balance', shortage: err.shortage ?? 0 });
    }
    if (err.validation || err.statusCode === 400) {
      return reply.status(400).send({ error: err.message });
    }
    console.error('[API Error]', err.message);
    return reply.status(500).send({ error: 'Internal server error' });
  });

  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(catalogRoutes);
  await app.register(readingRoutes);
  await app.register(topupRoutes);
  await app.register(adminRoutes);

  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  // Telegram bot
  const bot = createBot();
  await bot.init();

  if (config.nodeEnv === 'production') {
    app.post('/api/bot-webhook', async (req: any, reply: any) => {
      reply.send({ ok: true });
      try {
        await bot.handleUpdate(req.body);
      } catch (err: any) {
        console.error('[Bot webhook]', err?.message ?? err);
      }
    });
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`[API] Listening on port ${config.port}`);

  if (config.nodeEnv === 'production') {
    try {
      await bot.api.setWebhook(`${config.webappUrl}/api/bot-webhook`, {
        allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
      });
      console.log('[Bot] Webhook set');
    } catch (err: any) {
      console.error('[Bot] Webhook failed:', err?.message);
    }

    // Устанавливаем команды бота (обновляем список)
    await bot.api.setMyCommands([
      { command: 'start', description: 'Открыть Таро Премиум' },
      { command: 'help',  description: 'Справка' },
    ]).catch(() => {});

    // Запускаем планировщик
    startCron(bot);
  } else {
    bot.start();
    console.log('[Bot] Polling started');
    startCron(bot);
  }
}

start().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
