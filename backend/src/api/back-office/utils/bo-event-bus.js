"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitBoChange = exports.BO_BUS = void 0;
/**
 * Event bus interno do Back-Office.
 * Usado pelos serviços para emitir mudanças (orders/couriers/customers/...) e
 * consumido pelo controlador `stream` (SSE) para notificar o BO em tempo real.
 *
 * Não armazena estado; é apenas pub/sub.
 */
const events_1 = require("events");
const bus = new events_1.EventEmitter();
bus.setMaxListeners(64);
exports.BO_BUS = bus;
function emitBoChange(payload) {
    try {
        bus.emit('change', { ...payload, at: new Date().toISOString() });
    }
    catch {
        /* swallow — bus is best effort */
    }
}
exports.emitBoChange = emitBoChange;
