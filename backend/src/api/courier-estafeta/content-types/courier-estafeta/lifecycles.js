"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_js_1 = require("../../utils/password.js");
const bo_event_bus_js_1 = require("../../../back-office/utils/bo-event-bus.js");
function splitFullName(fullName) {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length)
        return { firstName: '', lastName: '' };
    if (parts.length === 1)
        return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
/** Mantém fullName ↔ firstName/lastName alinhados (Content Manager ordena por firstName). */
function syncCourierNameFields(data) {
    if (!data || typeof data !== 'object')
        return;
    const hasFull = data.fullName != null && String(data.fullName).trim() !== '';
    const hasParts = (data.firstName != null && String(data.firstName).trim() !== '')
        || (data.lastName != null && String(data.lastName).trim() !== '');
    if (hasFull) {
        const { firstName, lastName } = splitFullName(data.fullName);
        data.firstName = firstName;
        data.lastName = lastName;
        return;
    }
    if (hasParts) {
        const fn = String(data.firstName || '').trim();
        const ln = String(data.lastName || '').trim();
        data.fullName = `${fn} ${ln}`.trim();
    }
}
exports.default = {
    async beforeCreate(event) {
        const { data } = event.params || {};
        syncCourierNameFields(data);
        if (!data?.password || (0, password_js_1.isCourierPasswordHash)(data.password))
            return;
        data.password = (0, password_js_1.hashCourierPassword)(data.password);
    },
    async beforeUpdate(event) {
        const { data } = event.params || {};
        syncCourierNameFields(data);
        if (!data?.password || (0, password_js_1.isCourierPasswordHash)(data.password))
            return;
        data.password = (0, password_js_1.hashCourierPassword)(data.password);
    },
    async afterUpdate(event) {
        const { result } = event;
        // Notificar Back-Office via SSE quando o estado do estafeta muda
        try {
            (0, bo_event_bus_js_1.emitBoChange)({
                entity: 'courier',
                id: result.documentId || result.id,
                action: 'update',
                meta: {
                    isOnline: result.isOnline,
                    status: result.courier_status
                }
            });
        }
        catch (e) {
            console.warn('[BO-Bus] falha ao emitir mudança no lifecycle do estafeta:', e.message);
        }
    },
};
