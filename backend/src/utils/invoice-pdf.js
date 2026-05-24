'use strict';

const PDFDocument = require('pdfkit');

const BRAND = '#16a34a';
const MUTED = '#6b7280';
const LABEL_W = 130;
const VALUE_X = 190;
const PAGE_W = 595;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * @param {ReturnType<import('./order-invoice-data.js')['buildInvoicePayload']>} data
 * @returns {Promise<Buffer>}
 */
function generateInvoicePdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    doc.fillColor(BRAND).fontSize(22).font('Helvetica-Bold')
      .text('GoEverywhere', MARGIN, y);
    y += 30;
    doc.fillColor('#111').fontSize(16).font('Helvetica-Bold')
      .text('Fatura / Recibo de entrega', MARGIN, y);
    y += 24;
    doc.fontSize(10).fillColor(MUTED).font('Helvetica')
      .text(`Documento emitido em ${formatLineDate(data.issuedAt)}`, MARGIN, y);
    y += 28;

    y = sectionTitle(doc, y, 'Dados do pedido');
    y = field(doc, y, 'N.º pedido', data.publicId);
    y = field(doc, y, 'Estado', data.orderStatus);
    y = field(doc, y, 'Data de entrega', formatLineDate(data.deliveredAt));
    y = field(doc, y, 'Loja', data.storeName);
    if (data.isUrgent) y = field(doc, y, 'Prioridade', `Urgente (P${data.priority})`);
    if (data.etaMinutes) y = field(doc, y, 'ETA estimado', `${data.etaMinutes} min`);
    y += 10;

    y = sectionTitle(doc, y, 'Cliente');
    y = field(doc, y, 'Nome', data.clientName);
    y = field(doc, y, 'Email', data.clientEmail);
    if (data.clientPhone) y = field(doc, y, 'Telefone', data.clientPhone);
    if (data.clientNif) y = field(doc, y, 'NIF', data.clientNif);
    if (data.clientAddress) y = field(doc, y, 'Morada faturação', data.clientAddress);
    y += 10;

    y = sectionTitle(doc, y, 'Entrega');
    const dest = [data.deliveryAddress, data.deliveryCity].filter(Boolean).join(', ') || '—';
    y = field(doc, y, 'Destino', dest);
    if (data.deliveryNotes) y = field(doc, y, 'Instruções', data.deliveryNotes);
    y += 10;

    if (data.courierName) {
      y = sectionTitle(doc, y, 'Estafeta');
      y = field(doc, y, 'Nome', data.courierName);
      if (data.courierRating) y = field(doc, y, 'Classificação média', `${data.courierRating} / 5`);
      if (data.courierVehicle) y = field(doc, y, 'Veículo', data.courierVehicle);
      y += 10;
    }

    y = sectionTitle(doc, y, 'Artigos');
    y += 6;
    const tableTop = y;
    doc.rect(MARGIN, tableTop, CONTENT_W, 20).fill('#f3f4f6');
    doc.fillColor('#111').fontSize(9).font('Helvetica-Bold');
    doc.text('Descrição', MARGIN + 8, tableTop + 6, { width: 300 });
    doc.text('Qtd.', MARGIN + 320, tableTop + 6, { width: 40 });
    doc.text('SKU', MARGIN + 380, tableTop + 6, { width: 100 });
    y = tableTop + 24;
    doc.font('Helvetica').fontSize(9).fillColor('#333');

    if (!data.items.length) {
      y = field(doc, y, '', 'Sem detalhe de artigos registado.', { valueOnly: true });
    } else {
      for (const item of data.items) {
        if (y > 720) {
          doc.addPage();
          y = MARGIN;
        }
        doc.text(item.name.slice(0, 70), MARGIN + 8, y, { width: 300 });
        doc.text(String(item.qty), MARGIN + 320, y, { width: 40 });
        doc.text(item.sku || '—', MARGIN + 380, y, { width: 100 });
        y += 18;
      }
    }

    y += 8;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y).strokeColor('#e5e7eb').stroke();
    y += 16;
    if (data.goPointsUsed > 0) {
      y = field(doc, y, data.goPointsRedemption || 'Go Points', `${data.goPointsUsed} pts`);
    }

    doc.font('Helvetica-Bold').fontSize(13).fillColor(BRAND);
    doc.text('Total', MARGIN, y);
    doc.text(data.totalFormatted, MARGIN + 380, y, { width: CONTENT_W - 380, align: 'right' });
    y += 32;

    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text(
      `Avalia o estafeta em: ${data.reviewUrl}`,
      MARGIN,
      y,
      { width: CONTENT_W, lineGap: 2 },
    );
    y += 28;
    doc.text(
      'GoEverywhere, Lda. — Comprovativo de entrega e fatura simplificada. O PDF é gerado a partir dos dados do pedido (não fica guardado como ficheiro no servidor).',
      MARGIN,
      y,
      { width: CONTENT_W, lineGap: 2 },
    );

    doc.end();
  });
}

function sectionTitle(doc, y, title) {
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(11).text(title, MARGIN, y);
  return y + 18;
}

function field(doc, y, label, value, opts = {}) {
  const text = String(value ?? '—');
  const valueWidth = CONTENT_W - (VALUE_X - MARGIN);

  if (!opts.valueOnly && label) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED)
      .text(`${label}:`, MARGIN, y, { width: LABEL_W });
  }

  doc.font('Helvetica').fontSize(10).fillColor('#333')
    .text(text, opts.valueOnly ? MARGIN + 8 : VALUE_X, y, {
      width: opts.valueOnly ? CONTENT_W - 16 : valueWidth,
      lineGap: 2,
    });

  const height = doc.heightOfString(text, {
    width: opts.valueOnly ? CONTENT_W - 16 : valueWidth,
  });
  return y + Math.max(16, height + 6);
}

function formatLineDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT');
  } catch {
    return String(iso);
  }
}

module.exports = { generateInvoicePdf };
