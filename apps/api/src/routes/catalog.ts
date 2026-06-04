import type { FastifyPluginAsync } from 'fastify';
import { SPREADS, TOPUP, DECKS } from '@taro/shared';

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/catalog', async (_req, reply) => {
    return reply.send({
      spreads: Object.values(SPREADS),
      topup: TOPUP,
      decks: DECKS,
    });
  });
};
