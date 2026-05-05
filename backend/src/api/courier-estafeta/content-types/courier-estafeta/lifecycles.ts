export default {
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
