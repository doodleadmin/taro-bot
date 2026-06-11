import type { FastifyPluginAsync } from 'fastify';
import { parseInitDataDev } from '../auth.js';
import { prisma } from '../db.js';
import { isAdmin } from '../config.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { initData: string } }>('/api/auth', {
    schema: {
      body: {
        type: 'object',
        required: ['initData'],
        properties: { initData: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    const { initData } = req.body;
    const parsed = parseInitDataDev(initData);
    const tg = parsed.user;

    const user = await prisma.user.upsert({
      where: { tgId: String(tg.id) },
      create: {
        tgId: String(tg.id),
        firstName: tg.first_name,
        username: tg.username ?? null,
        photoUrl: tg.photo_url ?? null,
        balance: 0,
        isAdmin: isAdmin(String(tg.id)),
      },
      update: {
        firstName: tg.first_name,
        username: tg.username ?? null,
        photoUrl: tg.photo_url ?? null,
      },
    });

    const token = app.jwt.sign(
      { userId: user.id, tgId: user.tgId },
      { expiresIn: '24h' },
    );

    const today = new Date().toISOString().slice(0, 10);
    const admin = isAdmin(user.tgId) || user.isAdmin;
    const introFreeRemaining = Math.max(0, 3 - user.freeReadingsUsed);
    const dailyFreeAvailableToday = introFreeRemaining === 0 && user.freeUsedDate !== today;
    return reply.send({
      token,
      user: {
        id: user.id,
        tgId: user.tgId,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl,
        balance: user.balance,
        isAdmin: admin,
        deck: user.deck,
        freeAvailableToday: introFreeRemaining > 0 || dailyFreeAvailableToday,
        introFreeRemaining,
        dailyFreeAvailableToday,
        dayRevealedToday: user.dayRevealedDate === today,
        createdAt: user.createdAt.toISOString(),
      },
    });
  });
};
