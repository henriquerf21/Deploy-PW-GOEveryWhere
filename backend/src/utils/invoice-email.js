'use strict';

const { generateInvoicePdf } = require('./invoice-pdf.js');
const { escapeHtml, formatDatePt, buildInvoicePayload } = require('./order-invoice-data.js');

const RESEND_URL = 'https://api.resend.com/emails';

function buildItemsHtml(items) {
  if (!items?.length) {
    return '<tr><td colspan="2" style="padding:8px;color:#6b7280;">Sem artigos detalhados no pedido.</td></tr>';
  }
  return items.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}${item.sku ? ` <span style="color:#9ca3af;font-size:12px;">(${escapeHtml(item.sku)})</span>` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
    </tr>`).join('');
}

function buildInvoiceEmailHtml(data) {
  const courierBlock = data.courierName
    ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#166534;font-weight:700;">O teu estafeta</p>
        <p style="margin:0;font-size:16px;color:#111;"><strong>${escapeHtml(data.courierName)}</strong></p>
        ${data.courierRating ? `<p style="margin:8px 0 0;font-size:13px;color:#374151;">Classificação média: ${escapeHtml(data.courierRating)} ★</p>` : ''}
        ${data.courierVehicle ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(data.courierVehicle)}</p>` : ''}
      </div>`
    : '';

  const reviewBlock = data.alreadyRated
    ? `<p style="color:#6b7280;font-size:14px;">Já avaliaste esta entrega. Obrigado pelo teu feedback!</p>`
    : `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 12px;font-size:15px;color:#92400e;font-weight:600;">Como correu a entrega?</p>
        <p style="margin:0 0 16px;font-size:14px;color:#78350f;">
          ${data.courierName ? `Avalia o serviço de <strong>${escapeHtml(data.courierName)}</strong> — ` : ''}
          ajuda-nos a melhorar e reconhece o trabalho do estafeta.
        </p>
        <a href="${escapeHtml(data.reviewUrl)}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;">
          Avaliar estafeta
        </a>
      </div>`;

  return `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
      <p style="margin:0 0 8px;font-size:13px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">GoEverywhere</p>
      <h1 style="margin:0 0 8px;font-size:24px;color:#111;">Encomenda entregue</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">Olá <strong>${escapeHtml(data.clientName)}</strong>, a tua encomenda foi entregue com sucesso.</p>

      <table style="width:100%;margin:24px 0;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;">Pedido</td><td style="padding:6px 0;text-align:right;font-weight:600;">${escapeHtml(data.publicId)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Entregue em</td><td style="padding:6px 0;text-align:right;">${escapeHtml(formatDatePt(data.deliveredAt))}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Loja</td><td style="padding:6px 0;text-align:right;">${escapeHtml(data.storeName)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Destino</td><td style="padding:6px 0;text-align:right;">${escapeHtml([data.deliveryAddress, data.deliveryCity].filter(Boolean).join(', ') || '—')}</td></tr>
        ${data.clientNif ? `<tr><td style="padding:6px 0;color:#6b7280;">NIF</td><td style="padding:6px 0;text-align:right;">${escapeHtml(data.clientNif)}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b7280;">Total</td><td style="padding:6px 0;text-align:right;font-size:18px;font-weight:700;color:#16a34a;">${escapeHtml(data.totalFormatted)}</td></tr>
        ${data.goPointsUsed > 0 ? `<tr><td style="padding:6px 0;color:#6b7280;">Go Points</td><td style="padding:6px 0;text-align:right;">${data.goPointsUsed} pts${data.goPointsRedemption ? ` (${escapeHtml(data.goPointsRedemption)})` : ''}</td></tr>` : ''}
      </table>

      <h2 style="font-size:15px;color:#111;margin:0 0 12px;">Artigos</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;">Produto</th>
            <th style="padding:8px;text-align:center;font-size:12px;color:#6b7280;width:48px;">Qtd</th>
          </tr>
        </thead>
        <tbody>${buildItemsHtml(data.items)}</tbody>
      </table>

      ${courierBlock}
      ${reviewBlock}

      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
        A <strong>fatura em PDF</strong> vai em anexo a este email.
        Também podes consultar o histórico em
        <a href="${escapeHtml(data.historyUrl)}" style="color:#16a34a;">área de cliente</a>.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">GoEverywhere — Entregas rápidas e de confiança.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * @param {{ to: string, order: object }} params
 */
async function sendOrderInvoiceEmail({ to, order }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('RESEND_API_KEY não configurada');
    err.code = 'missing_resend_key';
    throw err;
  }

  const data = buildInvoicePayload(order);
  const pdfBuffer = await generateInvoicePdf(data);
  const safeFileId = String(data.publicId).replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `fatura-${safeFileId}.pdf`;

  const from = process.env.RESEND_FROM || 'GoEverywhere <onboarding@resend.dev>';
  const subject = `GoEverywhere — Encomenda ${data.publicId} entregue (fatura em anexo)`;

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: buildInvoiceEmailHtml(data),
      attachments: [
        {
          filename,
          content: pdfBuffer.toString('base64'),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend: ${errText}`);
  }
  return res.json();
}

module.exports = {
  sendOrderInvoiceEmail,
  buildInvoiceEmailHtml,
  buildInvoicePayload,
};
