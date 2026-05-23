'use strict';

function parseTime(value) {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
}

function normalizeChatMessage(raw, index = 0) {
    if (!raw || typeof raw !== 'object') return null;
    const text = String(raw.text || '').trim();
    if (!text) return null;
    const time = raw.time ? new Date(raw.time).toISOString() : new Date().toISOString();
    const sender = String(raw.sender || 'unknown').toLowerCase();
    const id = raw.id
        ? String(raw.id)
        : `msg-${parseTime(time)}-${sender}-${index}`;
    return {
        id,
        sender,
        text,
        time,
        ...(raw.actorName ? { actorName: String(raw.actorName) } : {}),
        ...(raw.channel ? { channel: String(raw.channel) } : {}),
    };
}

function normalizeChatHistory(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((m, i) => normalizeChatMessage(m, i))
        .filter(Boolean);
}

function sortChatHistory(messages) {
    return [...messages].sort((a, b) => {
        const ta = parseTime(a.time);
        const tb = parseTime(b.time);
        if (ta !== tb) return ta - tb;
        return String(a.id).localeCompare(String(b.id));
    });
}

function messageKey(m) {
    return m.id || `${m.sender}|${m.time}|${m.text}`;
}

function mergeChatHistory(serverHistory, incomingHistory) {
    const map = new Map();
    for (const m of normalizeChatHistory(serverHistory)) {
        map.set(messageKey(m), m);
    }
    for (const m of normalizeChatHistory(incomingHistory)) {
        map.set(messageKey(m), m);
    }
    return sortChatHistory([...map.values()]);
}

async function findPublishedOrderByToken(strapi, token) {
    const id = String(token || '').trim();
    if (!id) return null;
    let order = await strapi.documents('api::order.order').findOne({
        documentId: id,
        status: 'published',
        populate: ['user'],
    });
    if (order) return order;
    const numeric = Number(id);
    if (Number.isFinite(numeric)) {
        const rows = await strapi.documents('api::order.order').findMany({
            filters: { id: { $eq: numeric } },
            status: 'published',
            populate: ['user'],
            pagination: { page: 1, pageSize: 1 },
        });
        order = rows?.[0] || null;
    }
    return order;
}

function emitOrderChat(strapi, orderDocumentId, payload) {
    const room = String(orderDocumentId);
    strapi.io?.emit('chat_message', {
        room,
        message: payload.message,
        chatHistory: payload.chatHistory,
    });
}

/**
 * Lê o histórico na BD, acrescenta uma mensagem (sem perder as anteriores) e grava.
 */
async function appendOrderChatMessage(strapi, orderToken, input = {}) {
    const text = String(input.text || '').trim();
    if (!text) return { ok: false, error: 'Mensagem vazia.' };

    const order = await findPublishedOrderByToken(strapi, orderToken);
    if (!order) return { ok: false, error: 'Pedido não encontrado.' };

    const sender = String(input.sender || 'unknown').toLowerCase();
    const newMessage = normalizeChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sender,
        text,
        time: new Date().toISOString(),
        actorName: input.actorName || null,
        channel: input.channel || null,
    });

    const chatHistory = mergeChatHistory(order.chatHistory, [newMessage]);

    await strapi.documents('api::order.order').update({
        documentId: order.documentId,
        data: { chatHistory },
        status: 'published',
    });

    emitOrderChat(strapi, order.documentId, { message: newMessage, chatHistory });

    return { ok: true, message: newMessage, chatHistory, orderDocumentId: order.documentId };
}

module.exports = {
    normalizeChatHistory,
    sortChatHistory,
    mergeChatHistory,
    appendOrderChatMessage,
    findPublishedOrderByToken,
};
