import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db.js';
import { isAdmin } from '../config.js';

// Проверяем, что авторизованный пользователь — администратор
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  const { userId, tgId } = req.user as { userId: number; tgId: string };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!isAdmin(tgId) && !user?.isAdmin) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /api/admin/stats ────────────────────────────────────────────────────
  app.get('/api/admin/stats', { onRequest: [requireAdmin] }, async (_req, reply) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const week = new Date(now.getTime() - 7 * 86400000);
    const month = new Date(now.getTime() - 30 * 86400000);

    const [
      totalUsers,
      newToday,
      activeWeek,
      totalRevenue,
      revenueToday,
      totalReadings,
      readingsToday,
      topupCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(today) } } }),
      prisma.user.count({ where: { updatedAt: { gte: week } } }),
      prisma.transaction.aggregate({ where: { type: 'topup' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({
        where: { type: 'topup', createdAt: { gte: new Date(today) } },
        _sum: { amount: true },
      }),
      prisma.reading.count(),
      prisma.reading.count({ where: { createdAt: { gte: new Date(today) } } }),
      prisma.transaction.count({ where: { type: 'topup', amount: { gt: 0 } } }),
    ]);

    return reply.send({
      users: { total: totalUsers, today: newToday, activeWeek },
      revenue: {
        total: totalRevenue._sum.amount ?? 0,
        today: revenueToday._sum.amount ?? 0,
        topups: topupCount,
      },
      readings: { total: totalReadings, today: readingsToday },
    });
  });

  // ── GET /api/admin/users ────────────────────────────────────────────────────
  app.get<{ Querystring: { page?: string; search?: string } }>(
    '/api/admin/users',
    { onRequest: [requireAdmin] },
    async (req, reply) => {
      const page = Math.max(0, parseInt(req.query.page ?? '0', 10));
      const search = req.query.search?.trim();
      const pageSize = 30;

      const where = search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { username: { contains: search, mode: 'insensitive' as const } },
          { tgId: { contains: search } },
        ],
      } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page * pageSize,
          take: pageSize,
          select: {
            id: true, tgId: true, firstName: true, username: true,
            balance: true, isAdmin: true, deck: true, funnelStep: true,
            createdAt: true, updatedAt: true,
            _count: { select: { readings: true, payments: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return reply.send({ users, total, page, pageSize });
    },
  );

  // ── POST /api/admin/admins ──────────────────────────────────────────────────
  app.post<{ Body: { tgId: string } }>(
    '/api/admin/admins',
    { onRequest: [requireAdmin] },
    async (req, reply) => {
      const tgId = String(req.body.tgId ?? '').trim();
      if (!/^\d+$/.test(tgId)) return reply.status(400).send({ error: 'Valid tgId required' });

      const user = await prisma.user.upsert({
        where: { tgId },
        create: {
          tgId,
          firstName: `Admin ${tgId}`,
          username: null,
          photoUrl: null,
          balance: 0,
          isAdmin: true,
        },
        update: { isAdmin: true },
        select: { id: true, tgId: true, firstName: true, username: true, balance: true, isAdmin: true },
      });

      return reply.send({ ok: true, user });
    },
  );

  // ── POST /api/admin/broadcast ───────────────────────────────────────────────
  app.post<{
    Body: { text: string; buttonLabel?: string; buttonUrl?: string };
  }>('/api/admin/broadcast', { onRequest: [requireAdmin] }, async (req, reply) => {
    const { text, buttonLabel, buttonUrl } = req.body;
    if (!text?.trim()) return reply.status(400).send({ error: 'text required' });

    const { tgId } = req.user as { tgId: string };

    // Запускаем рассылку асинхронно (не блокируем ответ)
    // Бот передаётся через глобальный синглтон
    const { getBotInstance } = await import('../bot.js');
    const bot = getBotInstance();
    if (!bot) return reply.status(503).send({ error: 'Bot not ready' });

    const { sendBroadcast } = await import('../push.js');
    // Запускаем в фоне
    sendBroadcast(bot, text.trim(), buttonLabel, buttonUrl, tgId)
      .then(r => console.log('[Admin] broadcast done:', r))
      .catch(e => console.error('[Admin] broadcast error:', e));

    return reply.send({ ok: true, message: 'Рассылка запущена в фоне' });
  });

  // ── GET /api/admin/broadcasts ───────────────────────────────────────────────
  app.get('/api/admin/broadcasts', { onRequest: [requireAdmin] }, async (_req, reply) => {
    const broadcasts = await prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return reply.send(broadcasts);
  });

  // ── GET /api/admin/check ────────────────────────────────────────────────────
  // Проверить, является ли текущий пользователь администратором
  app.get('/api/admin/check', { onRequest: [requireAdmin] }, async (req, reply) => {
    const { tgId } = req.user as { tgId: string };
    return reply.send({ isAdmin: true, tgId });
  });
};
