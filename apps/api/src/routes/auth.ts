import type { FastifyPluginAsync } from 'fastify';
import { parseInitDataDev } from '../auth.js';
import { prisma } from '../db.js';

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
    return reply.send({
      token,
      user: {
        id: user.id,
        tgId: user.tgId,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl,
        balance: user.balance,
        deck: user.deck,
        freeAvailableToday: user.freeUsedDate !== today,
        dayRevealedToday: user.dayRevealedDate === today,
        createdAt: user.createdAt.toISOString(),
      },
    });
  });
};
