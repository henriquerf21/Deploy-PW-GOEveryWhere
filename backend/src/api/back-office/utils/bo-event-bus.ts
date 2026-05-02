/**
 * Event bus interno do Back-Office.
 * Usado pelos serviços para emitir mudanças (orders/couriers/customers/...) e
 * consumido pelo controlador `stream` (SSE) para notificar o BO em tempo real.
 *
 * Não armazena estado; é apenas pub/sub.
 */
import { EventEmitter } from 'events';

export type BoChangePayload = {
  entity: 'order' | 'courier' | 'customer' | 'store' | 'product' | 'inventory' | 'review';
  id?: string | number | null;
  action?: 'create' | 'update' | 'delete' | 'transition';
  meta?: Record<string, any>;
};

const bus = new EventEmitter();
bus.setMaxListeners(64);

export const BO_BUS = bus;

export function emitBoChange(payload: BoChangePayload) {
  try {
    bus.emit('change', { ...payload, at: new Date().toISOString() });
  } catch {
    /* swallow — bus is best effort */
  }
}
