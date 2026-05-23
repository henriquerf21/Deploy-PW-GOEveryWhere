"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGpsSimulator = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const activeSimulators = new Map();
async function startGpsSimulator(strapi, roomId, startLat, startLng, endLat, endLng, courierDocumentId) {
    const room = String(roomId || '').trim();
    if (!room)
        return;
    const existing = activeSimulators.get(room);
    if (existing)
        clearInterval(existing);
    try {
        const url = `http://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const response = await (0, node_fetch_1.default)(url);
        if (!response.ok) {
            strapi.log.warn('[GPS Simulator] Falha ao obter rota OSRM');
            return;
        }
        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            strapi.log.warn('[GPS Simulator] Nenhuma rota encontrada');
            return;
        }
        const coordinates = data.routes[0].geometry.coordinates;
        if (!coordinates || coordinates.length === 0)
            return;
        let index = 0;
        strapi.log.info(`[GPS Simulator] Sala ${room} (${coordinates.length} pontos)`);
        const intervalId = setInterval(() => {
            if (index >= coordinates.length) {
                clearInterval(intervalId);
                activeSimulators.delete(room);
                strapi.log.info(`[GPS Simulator] Finalizado sala ${room}`);
                return;
            }
            const [lng, lat] = coordinates[index];
            const payload = {
                room,
                lat,
                lng,
                isSimulated: true,
                timestamp: new Date().toISOString(),
            };
            if (courierDocumentId) {
                payload.courierId = String(courierDocumentId);
            }
            if (strapi.io) {
                strapi.io.to(room).emit('gps_update', payload);
                if (courierDocumentId) {
                    strapi.io.emit('courier_gps_update', {
                        courierId: String(courierDocumentId),
                        lat,
                        lng,
                        isSimulated: true,
                    });
                }
            }
            index += 1;
        }, 10000);
        activeSimulators.set(room, intervalId);
    }
    catch (error) {
        strapi.log.error('[GPS Simulator] Erro:', error);
    }
}
exports.startGpsSimulator = startGpsSimulator;
