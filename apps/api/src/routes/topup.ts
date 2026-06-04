import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db.js';
import { createInvoice, getPackageById, parseYukassaWebhook, parseTelegramStarsWebhook } from '../payments.js';
import { config } from '../config.js';

export const topupRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/topup/create — start payment
  app.post<{ Body: { packageId: string } }>(
    '/api/topup/create',
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const { userId } = req.user as { userId: number };
      const { packageId } = req.body;

      const pkg = getPackageById(packageId);
      if (!pkg) return reply.status(400).send({ error: 'Unknown packageId' });

      // Create pending payment record
      const pendingId = `pending-${userId}-${Date.now()}`;
      await prisma.payment.create({
        data: {
          userId,
          provider: config.paymentProvider,
          providerPaymentId: pendingId,
          packageId,
          amount: pkg.amount,
          bonus: pkg.bonus,
          status: 'pending',
        },
      });

      const invoice = await createInvoice(userId, pkg);
      return reply.send(invoice);
    },
  );

  // POST /api/payments/webhook — handle payment provider callback
  app.post<{ Body: Record<string, unknown> }>(
    '/api/payments/webhook',
    async (req, reply) => {
      const body = req.body;

      let parsed = config.paymentProvider === 'yukassa'
        ? parseYukassaWebhook(body)
        : parseTelegramStarsWebhook(body);

      if (!parsed) return reply.send({ ok: true }); // not a relevant event

      const { userId, packageId, providerPaymentId } = parsed;
      const pkg = getPackageById(packageId);
      if (!pkg) return reply.send({ ok: true });

      // Idempotent: check if already processed
      const existing = await prisma.payment.findUnique({
        where: { providerPaymentId },
      });
      if (existing?.status === 'completed') return reply.send({ ok: true });

      // Credit balance atomically
      await prisma.$transaction(async (tx) => {
        const add = pkg.amount + pkg.bonus;

        // Upsert payment record
        await tx.payment.upsert({
          where: { providerPaymentId },
          create: {
            userId,
            provider: config.paymentProvider,
            providerPaymentId,
            packageId,
            amount: pkg.amount,
            bonus: pkg.bonus,
            status: 'completed',
          },
          update: { status: 'completed' },
        });

        // Credit balance
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: add } },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            userId,
            type: 'topup',
            title: 'Пополнение баланса',
            amount: add,
          },
        });
      });

      return reply.send({ ok: true });
    },
  );
};
