'use strict';

const { buildInvoicePayload, findOrderForInvoice } = require('./order-invoice-data.js');
const { generateInvoicePdf } = require('./invoice-pdf.js');

const DELIVERED_STATUSES = new Set([
  'S-11 Entregue',
  'S-15 Concluído e Avaliado',
  'S-16 Concluído Sem Avaliação',
]);

const sendingLocks = new Set();

function isDeliveredOrder(order) {
  return DELIVERED_STATUSES.has(String(order?.order_status || ''));
}

function invoiceFilename(publicId) {
  const safe = String(publicId || 'pedido').replace(/[^a-zA-Z0-9-_]/g, '_');
  return `fatura-${safe}.pdf`;
}

async function resolveOrderDocumentId(strapi, token) {
  const raw = String(token || '').trim();
  if (!raw) return null;
  if (raw.startsWith('GE-')) {
    return raw.slice(3);
  }
  if (raw.startsWith('#GG-')) {
    const rows = await strapi.db.query('api::order.order').findMany({
      where: { orderId: raw },
      select: ['documentId'],
      limit: 1,
    });
    return rows[0]?.documentId || null;
  }
  return raw;
}

async function loadOrderForInvoice(strapi, token) {
  const documentId = await resolveOrderDocumentId(strapi, token);
  if (!documentId) return null;
  const order = await findOrderForInvoice(strapi, { documentId });
  if (!order || !isDeliveredOrder(order)) return null;
  return order;
}

async function buildInvoicePdfBuffer(order) {
  const data = buildInvoicePayload(order);
  const buffer = await generateInvoicePdf(data);
  return { buffer, data, filename: invoiceFilename(data.publicId) };
}

async function invoiceAlreadySent(strapi, documentId) {
  const rows = await strapi.db.query('api::order.order').findMany({
    where: { documentId },
    select: ['invoiceEmailSent'],
  });
  return rows.some((r) => r.invoiceEmailSent === true);
}

async function markInvoiceSent(strapi, documentId) {
  const rows = await strapi.db.query('api::order.order').findMany({
    where: { documentId },
    select: ['id'],
  });
  for (const row of rows) {
    await strapi.db.query('api::order.order').update({
      where: { id: row.id },
      data: { invoiceEmailSent: true },
    });
  }
}

async function tryAcquireSendLock(documentId) {
  if (sendingLocks.has(documentId)) return false;
  sendingLocks.add(documentId);
  return true;
}

function releaseSendLock(documentId) {
  sendingLocks.delete(documentId);
}

module.exports = {
  DELIVERED_STATUSES,
  isDeliveredOrder,
  invoiceFilename,
  resolveOrderDocumentId,
  loadOrderForInvoice,
  buildInvoicePdfBuffer,
  invoiceAlreadySent,
  markInvoiceSent,
  tryAcquireSendLock,
  releaseSendLock,
};
