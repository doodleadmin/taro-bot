import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';
import { SPREADS, ARCANA } from '@taro/shared';
import type { DrawnCard, SpreadId, PairExtra } from '@taro/shared';
import { getAiInterpretation } from '../llm.js';

function drawCards(count: number, reversible = true): DrawnCard[] {
  // Cryptographically random draw
  const pool = Array.from({ length: 78 }, (_, i) => i);
  const out: DrawnCard[] = [];
  for (let i = 0; i < count; i++) {
    const buf = crypto.randomBytes(4);
    const idx = buf.readUInt32BE(0) % pool.length;
    const n = pool.splice(idx, 1)[0];
    const revBuf = crypto.randomBytes(4);
    const reversed = reversible && (revBuf.readUInt32BE(0) / 0xffffffff) < 0.35;
    out.push({ n, reversed });
  }
  return out;
}

export const readingRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/reading — do a spread
  app.post<{
    Body: {
      spreadId: SpreadId;
      question?: string;
      extra?: PairExtra;
    };
  }>('/api/reading', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const { spreadId, question = '', extra } = req.body;

    const spread = SPREADS[spreadId];
    if (!spread) return reply.status(400).send({ error: 'Unknown spreadId' });

    const today = new Date().toISOString().slice(0, 10);

    // Atomic charge + draw in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      let paidWith: 'free' | 'paid';

      if (spread.price === 0) {
        paidWith = 'paid';
      } else if (spread.free1card && user.freeUsedDate !== today) {
        // Use free daily slot
        await tx.user.update({ where: { id: userId }, data: { freeUsedDate: today } });
        await tx.transaction.create({ data: {
          userId,
          type: 'free',
          title: `${spread.title} · бесплатно`,
          amount: 0,
        }});
        paidWith = 'free';
      } else if (user.balance >= spread.price) {
        // Deduct balance
        await tx.user.update({ where: { id: userId }, data: { balance: { decrement: spread.price } } });
        await tx.transaction.create({ data: {
          userId,
          type: 'spend',
          title: spread.title,
          amount: -spread.price,
        }});
        paidWith = 'paid';
      } else {
        const shortage = spread.price - user.balance;
        throw Object.assign(new Error('Insufficient balance'), { code: 'INSUFFICIENT_BALANCE', shortage });
      }

      // Draw cards server-side
      const cards = drawCards(spread.count);

      return { user, cards, paidWith };
    });

    // Fetch updated balance
    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // Get AI interpretation
    const interpretation = await getAiInterpretation(
      spread,
      result.cards,
      question,
      updatedUser.deck,
      extra,
    );

    // Save reading
    const reading = await prisma.reading.create({
      data: {
        userId,
        spreadId,
        question,
        cards: result.cards as object,
        interpretation: interpretation as object,
        extra: extra ? (extra as object) : undefined,
      },
    });

    return reply.send({
      id: reading.id,
      spreadId,
      question,
      cards: result.cards,
      interpretation,
      balance: updatedUser.balance,
      createdAt: reading.createdAt.toISOString(),
    });
  });

  // GET /api/history
  app.get('/api/history', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return reply.send(readings.map(r => ({
      id: r.id,
      spreadId: r.spreadId,
      question: r.question,
      cards: r.cards,
      interpretation: r.interpretation,
      extra: r.extra ?? null,
      createdAt: r.createdAt.toISOString(),
    })));
  });

  // GET /api/daily — get today's card (deterministic)
  app.get('/api/daily', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = new Date().toISOString().slice(0, 10);
    const cardIndex = parseInt(today.replace(/-/g, ''), 10) % ARCANA.length;
    const card = ARCANA[cardIndex];
    return reply.send({
      card,
      revealed: user.dayRevealedDate === today,
    });
  });

  // POST /api/daily/reveal — reveal today's card (free, no deduction)
  app.post('/api/daily/reveal', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const today = new Date().toISOString().slice(0, 10);
    await prisma.user.update({ where: { id: userId }, data: { dayRevealedDate: today } });
    const cardIndex = parseInt(today.replace(/-/g, ''), 10) % ARCANA.length;
    const card = ARCANA[cardIndex];
    // Return card with a simple interpretation
    const interpretation = card.up;
    return reply.send({ card, revealed: true, interpretation });
  });

  // POST /api/deck — change deck
  app.post<{ Body: { deck: string } }>('/api/deck', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const { deck } = req.body;
    if (!['mansion', 'wood', 'classic'].includes(deck)) {
      return reply.status(400).send({ error: 'Invalid deck' });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { deck: deck as 'mansion' | 'wood' | 'classic' },
    });
    return reply.send({ deck });
  });

  // POST /api/natal — natal chart reading
  app.post<{
    Body: { name: string; date: string; time?: string; place?: string };
  }>('/api/natal', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const { name, date, time, place } = req.body;

    const spread = SPREADS['natal'];
    const NATAL_PRICE = spread.price; // 100 ₽

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (user.balance < NATAL_PRICE) {
        throw Object.assign(new Error('Insufficient balance'), {
          code: 'INSUFFICIENT_BALANCE',
          shortage: NATAL_PRICE - user.balance,
        });
      }
      await tx.user.update({ where: { id: userId }, data: { balance: { decrement: NATAL_PRICE } } });
      await tx.transaction.create({ data: {
        userId,
        type: 'spend',
        title: 'Натальная карта',
        amount: -NATAL_PRICE,
      }});
      return user;
    });

    const { computeNatal } = await import('@taro/shared');
    const natalData = computeNatal({ name, date, time, place });

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const reading = await prisma.reading.create({
      data: {
        userId,
        spreadId: 'natal',
        question: `Натальная карта: ${name}`,
        cards: [] as object,
        interpretation: { cards: [], summary: '' } as object,
        extra: { type: 'natal', name, date, time, place } as object,
      },
    });

    return reply.send({
      id: reading.id,
      natalData,
      balance: updatedUser.balance,
      createdAt: reading.createdAt.toISOString(),
    });
  });
};
