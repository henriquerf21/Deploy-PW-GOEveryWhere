'use strict';

const { sendOrderInvoiceEmail } = require('../../../utils/invoice-email.js');
const { findOrderForInvoice } = require('../../../utils/order-invoice-data.js');
const {
  tryAcquireSendLock,
  releaseSendLock,
  invoiceAlreadySent,
  markInvoiceSent,
} = require('../../../utils/order-invoice-service.js');

const DELIVERED_STATUS = 'S-11 Entregue';
const HANDLED_EVENTS = new Set(['entry.update', 'entry.publish']);

function verifyWebhookAuth(ctx) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return false;
  const auth = String(ctx.request.header.authorization || '');
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 && token === secret;
}

module.exports = {
  async handleOrderInvoice(ctx) {
    if (!verifyWebhookAuth(ctx)) {
      return ctx.unauthorized('Webhook não autorizado');
    }

    const body = ctx.request.body || {};
    const event = body.event || ctx.request.header['x-strapi-event'];
    const model = body.model;
    const entry = body.entry;

    if (!HANDLED_EVENTS.has(event)) {
      ctx.body = { ok: true, skipped: 'event' };
      return;
    }
    if (model !== 'order' || !entry) {
      ctx.body = { ok: true, skipped: 'model' };
      return;
    }
    if (entry.order_status !== DELIVERED_STATUS) {
      ctx.body = { ok: true, skipped: 'status' };
      return;
    }

    const documentId = entry.documentId || null;
    if (!documentId) {
      ctx.body = { ok: true, skipped: 'no_document_id' };
      return;
    }

    if (!(await tryAcquireSendLock(documentId))) {
      ctx.body = { ok: true, skipped: 'in_progress' };
      return;
    }

    try {
      if (await invoiceAlreadySent(strapi, documentId)) {
        ctx.body = { ok: true, skipped: 'already_sent' };
        return;
      }

      const order = await findOrderForInvoice(strapi, { documentId });
      if (!order) {
        ctx.body = { ok: true, skipped: 'order_not_found' };
        return;
      }

      const userEmail = order.user?.email;
      if (!userEmail) {
        ctx.body = { ok: true, skipped: 'no_email' };
        return;
      }

      const publicId = order.orderId || `#${order.id}`;
      await sendOrderInvoiceEmail({ to: userEmail, order });
      await markInvoiceSent(strapi, documentId);

      strapi.log.info(`[Webhook] Email fatura (PDF) enviado para ${userEmail} (${publicId})`);
      ctx.body = { ok: true, sent: true, orderId: publicId };
    } catch (err) {
      strapi.log.error('[Webhook] Falha ao enviar fatura:', err?.message || err);
      ctx.status = 500;
      ctx.body = { ok: false, error: err?.message || 'send_failed' };
    } finally {
      releaseSendLock(documentId);
    }
  },
};
