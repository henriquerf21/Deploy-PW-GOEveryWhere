// Using global native fetch available in Node.js 18+

export async function startGpsSimulator(strapi: any, orderId: number | string, startLat: number, startLng: number, endLat: number, endLng: number) {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) {
      strapi.log.warn('[GPS Simulator] Falha ao obter rota OSRM');
      return;
    }
    const data: any = await response.json();
    if (!data.routes || data.routes.length === 0) {
      strapi.log.warn('[GPS Simulator] Nenhuma rota encontrada');
      return;
    }
    
    // geometries=geojson returns coordinates as [lng, lat]
    const coordinates = data.routes[0].geometry.coordinates; // array of [lng, lat]
    if (!coordinates || coordinates.length === 0) return;

    let index = 0;
    const room = `order_${orderId}`;
    
    strapi.log.info(`[GPS Simulator] Iniciado para order ${orderId} com ${coordinates.length} pontos. Sala: ${room}`);

    const intervalId = setInterval(() => {
      if (index >= coordinates.length) {
        clearInterval(intervalId);
        strapi.log.info(`[GPS Simulator] Finalizado para order ${orderId}`);
        return;
      }
      
      const [lng, lat] = coordinates[index];
      const payload = {
        room,
        lat,
        lng,
        orderId,
        timestamp: new Date().toISOString(),
        isSimulated: true
      };
      
      // Emit to PWA and BO
      if (strapi.io) {
        strapi.io.to(room).emit('gps_update', payload);
        // Also emit globally if needed
        strapi.io.emit('global_gps_update', payload);
      }
      
      index++;
    }, 10000); // 10 seconds

  } catch (error) {
    strapi.log.error('[GPS Simulator] Erro:', error);
  }
}
