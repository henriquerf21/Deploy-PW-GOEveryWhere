import { hashCourierPassword, isCourierPasswordHash } from '../../utils/password';

export default {
  async beforeCreate(event: any) {
    const { data } = event.params || {};
    if (!data?.password || isCourierPasswordHash(data.password)) return;
    data.password = hashCourierPassword(data.password);
  },

  async beforeUpdate(event: any) {
    const { data } = event.params || {};
    if (!data?.password || isCourierPasswordHash(data.password)) return;
    data.password = hashCourierPassword(data.password);
  },

  async afterUpdate(event: any) {
    const { result } = event;
    
    // Notificar Back-Office via SSE quando o estado do estafeta muda (isOnline, status, etc)
    try {
      const { emitBoChange } = require('../../../back-office/utils/bo-event-bus');
      emitBoChange({
        entity: 'courier',
        id: result.documentId || result.id,
        action: 'update',
        meta: { 
          isOnline: result.isOnline,
          status: result.courier_status 
        }
      });
    } catch (e) {
      console.warn('[BO-Bus] falha ao emitir mudança no lifecycle do estafeta:', e.message);
    }
  },
};
