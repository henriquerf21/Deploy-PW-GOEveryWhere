'use strict';

const { buildInvoicePdfBuffer } = require('./order-invoice-service.js');

async function serveInvoicePdf(ctx, order) {
  const { buffer, filename } = await buildInvoicePdfBuffer(order);
  ctx.set('Content-Type', 'application/pdf');
  ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
  ctx.body = buffer;
}

module.exports = { serveInvoicePdf };
