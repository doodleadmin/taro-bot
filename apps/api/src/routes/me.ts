import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = new Date().toISOString().slice(0, 10);
    return reply.send({
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
    });
  });

  app.get('/api/me/transactions', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const txns = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reply.send(txns.map(t => ({
      id: t.id,
      type: t.type,
      title: t.title,
      amount: t.amount,
      createdAt: t.createdAt.toISOString(),
    })));
  });
};
