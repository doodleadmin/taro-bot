import crypto from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';
import { isAdmin } from '../config.js';
import { SPREADS, ARCANA } from '@taro/shared';
import type { DrawnCard, SpreadId, PairExtra } from '@taro/shared';
import { getAiInterpretation, getDailyInterpretation, getNatalInterpretation } from '../llm.js';

const INTRO_FREE_READINGS = 3;

type FreeUserState = {
  freeReadingsUsed: number;
  freeUsedDate: string | null;
};

function isFreeEligibleSpread(spread: typeof SPREADS[keyof typeof SPREADS]): boolean {
  // Бесплатная квота действует на платные расклады. Карта дня бесплатна отдельно и квоту не расходует.
  return spread.price > 0;
}

function getFreeState(user: FreeUserState, today: string) {
  const introFreeRemaining = Math.max(0, INTRO_FREE_READINGS - user.freeReadingsUsed);
  const dailyFreeAvailableToday = introFreeRemaining === 0 && user.freeUsedDate !== today;
  return {
    introFreeRemaining,
    dailyFreeAvailableToday,
    freeAvailableToday: introFreeRemaining > 0 || dailyFreeAvailableToday,
  };
}

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
      const admin = isAdmin(user.tgId) || user.isAdmin;

      let paidWith: 'free' | 'paid';
      const freeState = getFreeState(user, today);
      const freeEligible = isFreeEligibleSpread(spread);

      if (spread.price === 0) {
        paidWith = 'paid';
      } else if (admin) {
        // Администраторы имеют бесконечный баланс: не списываем деньги и не блокируем расклады.
        paidWith = 'paid';
      } else if (freeEligible && freeState.introFreeRemaining > 0) {
        // Первые 3 любых платных расклада — бесплатно.
        await tx.user.update({ where: { id: userId }, data: { freeReadingsUsed: { increment: 1 } } });
        await tx.transaction.create({ data: {
          userId,
          type: 'free',
          title: `${spread.title} · подарок новичка`,
          amount: 0,
        }});
        paidWith = 'free';
      } else if (freeEligible && freeState.dailyFreeAvailableToday) {
        // После стартовых 3: один любой платный расклад бесплатно раз в день.
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
      paidWith: result.paidWith,
      ...getFreeState(updatedUser, today),
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
    // If already revealed today, return cached interpretation (may be fallback if LLM failed)
    const interpretation = user.dayRevealedDate === today
      ? await getDailyInterpretation(card.name, card.key, card.up)
      : undefined;
    return reply.send({
      card,
      revealed: user.dayRevealedDate === today,
      interpretation,
    });
  });

  // POST /api/daily/reveal — reveal today's card (free, no deduction)
  app.post('/api/daily/reveal', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const today = new Date().toISOString().slice(0, 10);
    await prisma.user.update({ where: { id: userId }, data: { dayRevealedDate: today } });
    const cardIndex = parseInt(today.replace(/-/g, ''), 10) % ARCANA.length;
    const card = ARCANA[cardIndex];
    // LLM interpretation with daily cache
    const interpretation = await getDailyInterpretation(card.name, card.key, card.up);
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
    Body: { name: string; date: string; time?: string; place?: string; question?: string };
  }>('/api/natal', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as { userId: number };
    const { name, date, time, place, question = '' } = req.body;

    const spread = SPREADS['natal'];
    const NATAL_PRICE = spread.price; // 100 ₽
    const today = new Date().toISOString().slice(0, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const admin = isAdmin(user.tgId) || user.isAdmin;
      const freeState = getFreeState(user, today);
      const useIntroFree = !admin && freeState.introFreeRemaining > 0;
      const useDailyFree = !admin && !useIntroFree && freeState.dailyFreeAvailableToday;

      if (!admin && !useIntroFree && !useDailyFree && user.balance < NATAL_PRICE) {
        throw Object.assign(new Error('Insufficient balance'), {
          code: 'INSUFFICIENT_BALANCE',
          shortage: NATAL_PRICE - user.balance,
        });
      }
      if (useIntroFree) {
        await tx.user.update({ where: { id: userId }, data: { freeReadingsUsed: { increment: 1 } } });
        await tx.transaction.create({ data: {
          userId,
          type: 'free',
          title: 'Натальная карта · подарок новичка',
          amount: 0,
        }});
      } else if (useDailyFree) {
        await tx.user.update({ where: { id: userId }, data: { freeUsedDate: today } });
        await tx.transaction.create({ data: {
          userId,
          type: 'free',
          title: 'Натальная карта · бесплатно',
          amount: 0,
        }});
      } else if (!admin) {
        await tx.user.update({ where: { id: userId }, data: { balance: { decrement: NATAL_PRICE } } });
        await tx.transaction.create({ data: {
          userId,
          type: 'spend',
          title: 'Натальная карта',
          amount: -NATAL_PRICE,
        }});
      }
      return user;
    });

    const { computeNatal } = await import('@taro/shared');
    const natalData = computeNatal({ name, date, time, place });

    // Get LLM natal interpretation
    const natalInterpretation = await getNatalInterpretation(natalData, name, question);

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const reading = await prisma.reading.create({
      data: {
        userId,
        spreadId: 'natal',
        question: question ? `Натальная карта: ${name}. Вопрос: ${question}` : `Натальная карта: ${name}`,
        cards: [] as object,
        interpretation: { cards: [natalInterpretation], summary: '' } as object,
        extra: { type: 'natal', name, date, time, place, question } as object,
      },
    });

    return reply.send({
      id: reading.id,
      natalData,
      natalInterpretation,
      balance: updatedUser.balance,
      ...getFreeState(updatedUser, today),
      createdAt: reading.createdAt.toISOString(),
    });
  });
};
