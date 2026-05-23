"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_js_1 = require("../../utils/password.js");
const bo_event_bus_js_1 = require("../../../back-office/utils/bo-event-bus.js");
exports.default = {
    async beforeCreate(event) {
        const { data } = event.params || {};
        if (!data?.password || (0, password_js_1.isCourierPasswordHash)(data.password))
            return;
        data.password = (0, password_js_1.hashCourierPassword)(data.password);
    },
    async beforeUpdate(event) {
        const { data } = event.params || {};
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
