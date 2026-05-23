import { reactive, computed, ref, watch } from 'vue';
import { io } from 'socket.io-client';
import { DELIVERY_STATE, COURIER_STATE, NEXT_STATE } from '../constants.js';
import { API_URL, BACKEND_URL, SOCKET_URL } from '../config/env.js';
import { resolveStoreCoords } from '../data/continent-stores.js';
import { haversineKm, isGpsNearDelivery, isValidGpsPoint } from '../utils/geo.js';
import {
  accumulateGpsOnDelivery,
  enrichDeliveriesRouteKm,
  resolveDeliveryDistanceKm,
  deliveryCompletedAtIso,
  isDeliveryInLastDays,
  isDeliveryThisMonth,
} from '../utils/deliveryDistance.js';
import {
  fetchMapboxRoute, coordsFromGeometry, isValidCoord, calculateBearing, geocodeAddress,
} from '../utils/mapbox.js';
import { sendNotification } from '../utils/notifications.js';

// ── Config ───────────────────────────────────────────────────────
const STORAGE_KEY = 'ge-estafeta';

// Global GPS coords for distances
let lastGpsCoords = null;

export const socket = io(SOCKET_URL, {
    autoConnect: true // PWA is always connected
});

let socketListenersReady = false;
let deliveriesRefreshTimer = null;

function findDeliveryByOrderRoom(room) {
    const key = String(room || '');
    return store.deliveries.find((d) => String(d.orderDocumentId) === key)
        || store.completedDeliveries.find((d) => String(d.orderDocumentId) === key)
        || null;
}

/** Atualiza só o chat local — sem refetch da página */
export function applyIncomingChatMessage(room, message, chatHistory) {
    const d = findDeliveryByOrderRoom(room);
    if (!d) return;
    if (Array.isArray(chatHistory)) {
        d.chatHistory = chatHistory;
    } else if (message) {
        const history = d.chatHistory || [];
        const last = history[history.length - 1];
        const dup = last
            && last.text === message.text
            && last.sender === message.sender
            && last.time === message.time;
        if (!dup) d.chatHistory = [...history, message];
    }
}

export function joinOrderRoom(orderDocumentId) {
    if (!orderDocumentId) return;
    socket.emit('join_room', String(orderDocumentId));
}

function scheduleDeliveriesRefresh(delayMs = 3000) {
    clearTimeout(deliveriesRefreshTimer);
    deliveriesRefreshTimer = setTimeout(() => {
        fetchDeliveries({ silent: true });
    }, delayMs);
}

export function initCourierSocket() {
    if (socketListenersReady) return;
    socketListenersReady = true;

    socket.on('chat_message', (data) => {
        const room = data?.room != null ? String(data.room) : '';
        const d = findDeliveryByOrderRoom(room);
        const wasClient = data?.message?.sender === 'client';
        applyIncomingChatMessage(room, data?.message, data?.chatHistory);
        if (wasClient && d && data?.message?.text) {
            sendNotification('GoEverywhere — Nova mensagem', {
                body: String(data.message.text).slice(0, 120),
                tag: `chat-${room}`,
            });
        }
    });

    socket.on('order_status_update', (data) => {
        const d = findDeliveryByOrderRoom(data?.room);
        if (!d || !data?.status) return;
        const code = strapiStatusToCode(data.status);
        if (code && code !== d.state) d.state = code;
    });

    socket.on('global_order_status_update', (data) => {
        const room = data?.room != null ? String(data.room) : '';
        const d = findDeliveryByOrderRoom(room);
        if (d && data?.status) {
            const code = strapiStatusToCode(data.status);
            if (code && code !== d.state) d.state = code;
            return;
        }
        scheduleDeliveriesRefresh();
    });
}

initCourierSocket();

// ── Helpers: persistence ─────────────────────────────────────────
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            auth: store.auth,
            profile: store.profile,
            filters: store.filters,
            shiftMetrics: store.shiftMetrics,
            courierId: store.courierId,
        }));
    } catch { /* ignore */ }
}

// ── Helpers: API ─────────────────────────────────────────────────
function authHeaders() {
    return store.auth.token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${store.auth.token}` }
        : { 'Content-Type': 'application/json' };
}

async function apiGet(path) {
    const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
}

async function apiPut(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json();
}

async function apiCourierPut(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
    });
    if (!res.ok) {
        let detail = '';
        try {
            const errJson = await res.json();
            detail = errJson?.error?.message || errJson?.message || '';
        } catch { /* ignore */ }
        throw new Error(`PUT ${path} failed: ${res.status}${detail ? ` — ${detail}` : ''}`);
    }
    return res.json();
}

async function apiCourierSelfPut(data) {
    return apiCourierPut('/courier-estafetas/me', { data });
}

async function apiUploadFile(file) {
    const fd = new FormData();
    fd.append('files', file);
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data[0]?.id || null;
}

// ── Delivery status enum mapping ─────────────────────────────────
// Strapi uses "E-08 Pedido Recebido" format, PWA uses "E-08"
const STATUS_MAP = {
    'E-07': 'E-07 Em Pausa',
    'E-08': 'E-08 Pedido Recebido',
    'E-09': 'E-09 A Caminho da Loja',
    'E-10': 'E-10 Na Loja / Em Recolha',
    'E-11': 'E-11 Em Trânsito para Cliente',
    'E-12': 'E-12 No Destino',
    'E-13': 'E-13 Entrega Confirmada',
    'E-14': 'E-14 Entrega Impossível',
};

const ORDER_STATUS_MAP = {
    'E-09': 'S-07 Aceite pelo Estafeta',
    'E-10': 'S-08 Em Recolha',
    'E-11': 'S-09 Em Trânsito',
    'E-12': 'S-10 No Destino',
    'E-13': 'S-11 Entregue',
    'E-14': 'S-06 Aguardando Aceitação',
};

function strapiStatusToCode(strapiStatus) {
    if (!strapiStatus) return null;
    return strapiStatus.substring(0, 4); // "E-08 Pedido Recebido" → "E-08"
}

function isRealDeviceGps() {
    return store.gpsFromDevice
        && !store.gpsSimulated
        && isValidGpsPoint(store.gpsCoords);
}

/** Posição do estafeta no mapa — GPS real do telemóvel; simulação só se activa */
export function getMapCourierPosition(delivery, { allowServer = false } = {}) {
    if (!delivery) return null;
    if (isSimulatingRoute.value && isValidGpsPoint(store.gpsCoords)) {
        return { lat: store.gpsCoords.lat, lng: store.gpsCoords.lng };
    }
    if (isRealDeviceGps()) {
        return { lat: store.gpsCoords.lat, lng: store.gpsCoords.lng };
    }
    if (allowServer && delivery.courierLat != null && delivery.courierLng != null) {
        const fromServer = { lat: Number(delivery.courierLat), lng: Number(delivery.courierLng) };
        if (isValidGpsPoint(fromServer) && isGpsNearDelivery(fromServer, delivery)) {
            return fromServer;
        }
    }
    return null;
}

/** Garante que o GPS emite para a sala da entrega visível no ecrã */
export function setActiveDeliveryForView(deliveryId) {
    if (deliveryId == null) return;
    store.activeDeliveryId = deliveryId;
}

// ── Map Strapi delivery+order to local format ────────────────────
function mapDelivery(d) {
    const attrs = d.attributes || d;
    const order = attrs.order?.data?.attributes || attrs.order || {};
    const items = order.items || [{ name: 'GoGummies', qty: 1, unit: 'frasco' }];
    // Extract delivery coordinates from the items JSON (set by Front-Office)
    const itemsJson = (typeof order.items === 'object' && !Array.isArray(order.items)) ? order.items : {};
    const deliveryCoords = itemsJson.deliveryCoords || {};

    const storeName = order.store_name || order.storeName || '';
    const storeCoords = resolveStoreCoords(storeName);
    const rawPickupLat = Number(order.storeLatitude);
    const rawPickupLng = Number(order.storeLongitude);
    const pickupLat = Number.isFinite(rawPickupLat) && rawPickupLat !== 0
        ? rawPickupLat
        : (storeCoords?.lat ?? 41.163563);
    const pickupLng = Number.isFinite(rawPickupLng) && rawPickupLng !== 0
        ? rawPickupLng
        : (storeCoords?.lng ?? -8.584454);
    const rawDestLat = Number(order.deliveryLatitude) || Number(deliveryCoords.lat);
    const rawDestLng = Number(order.deliveryLongitude) || Number(deliveryCoords.lng);
    const destLat = Number.isFinite(rawDestLat) && rawDestLat !== 0
        ? rawDestLat
        : pickupLat + 0.008;
    const destLng = Number.isFinite(rawDestLng) && rawDestLng !== 0
        ? rawDestLng
        : pickupLng + 0.006;

    // Extract delivery address from order or items JSON
    const deliveryAddress = order.deliveryAddress || deliveryCoords.address || '';

    // Mapeamento extra para User/Cliente
    const userData = order.user?.data?.attributes || order.user?.attributes || order.user || {};

    const review = order.review?.data?.attributes || order.review?.attributes || order.review || {};

    // Resolve orderDocumentId: Strapi v5 flat vs v4 nested
    const orderDocId = attrs.order?.data?.documentId
        || attrs.order?.documentId
        || order.documentId
        || null;

    // Resolve items from JSON or Array structures
    const rawItems = order.items;
    let itemsList = [{ name: 'GoGummies', qty: 1, unit: 'frasco' }];
    if (rawItems) {
        if (rawItems.list && Array.isArray(rawItems.list)) {
            itemsList = rawItems.list;
        } else if (rawItems.items && Array.isArray(rawItems.items)) {
            itemsList = rawItems.items;
        } else if (Array.isArray(rawItems)) {
            itemsList = rawItems;
        }
    }

    // Compute real distance if we have GPS
    let distPickup = null;
    let distDest = null;
    if (lastGpsCoords) {
        const p = haversineKm(lastGpsCoords.lat, lastGpsCoords.lng, pickupLat, pickupLng);
        const d = haversineKm(lastGpsCoords.lat, lastGpsCoords.lng, destLat, destLng);
        if (p !== null) distPickup = parseFloat(p.toFixed(1));
        if (d !== null) distDest = parseFloat(d.toFixed(1));
    } else {
        // Fallback determinístico sem valores aleatórios
        const total = haversineKm(pickupLat, pickupLng, destLat, destLng);
        if (total !== null) {
            distPickup = parseFloat(total.toFixed(1));
            distDest = parseFloat(total.toFixed(1));
        }
    }

    const courierLat = Number(attrs.courierLatitude);
    const courierLng = Number(attrs.courierLongitude);

    return {
        id: String(d.id),
        documentId: attrs.documentId || d.documentId,
        courierLat: Number.isFinite(courierLat) ? courierLat : null,
        courierLng: Number.isFinite(courierLng) ? courierLng : null,
        orderId: order.orderId || order.publicId || (orderDocId ? `GE-${orderDocId}` : `GE-${attrs.order?.data?.id || attrs.order?.id}`),
        orderStrapiId: attrs.order?.data?.id || attrs.order?.id || null,
        orderDocumentId: orderDocId,
        type: order.priority >= 4 ? 'EXPRESS' : 'STANDARD',
        priority: order.priority || 3,
        state: (function() {
            let s = strapiStatusToCode(attrs.delivery_status) || DELIVERY_STATE.E08;
            if (!order || !order.id) return DELIVERY_STATE.E14; // Orfão / Pedido eliminado
            
            const oStatus = String(attrs.order?.data?.attributes?.order_status || attrs.order?.order_status || order.order_status || '').toUpperCase();
            const oCode = oStatus.slice(0, 4);
            if (['S-11', 'S-15', 'S-16'].includes(oCode) || oStatus.includes('ENTREGUE')) {
                return DELIVERY_STATE.E13;
            } else if (['REJECTED', 'CANCELLED_ADMIN', 'CANCELLED_CLIENT', 'S-12', 'S-13'].includes(oStatus) || oStatus.includes('CANCEL') || oStatus.includes('REJEIT')) {
                return DELIVERY_STATE.E14;
            }
            return s;
        })(),
        pickup: {
            name: order.store_name || 'Continente',
            address: order.pickupAddress || order.store_name || '',
            lat: parseFloat(pickupLat),
            lng: parseFloat(pickupLng),
            distance: distPickup,
        },
        destination: {
            name: order.clientName || userData.fullName || userData.username || 'Cliente',
            address: deliveryAddress,
            phone: userData.phone || '',
            lat: parseFloat(destLat),
            lng: parseFloat(destLng),
            distance: distDest,
        },
        items: itemsList,
        weight: rawItems?.weight || '0.5kg',
        size: rawItems?.size || 'Médio',
        instructions: order.notes || '',
        deliveryNotes: order.deliveryNotes || order.delivery_notes || '',
        costEuro: parseFloat(order.total_price) || 6.50,
        etaMinutes: order.estimatedTime || 30,
        timestamps: {
            'E-08': attrs.createdAt || null,
            'E-09': attrs.startTime || null,
            'E-10': attrs.timestamps?.['E-10'] || null,
            'E-11': attrs.timestamps?.['E-11'] || null,
            'E-12': attrs.timestamps?.['E-12'] || null,
            'E-13': attrs.endTime || attrs.timestamps?.['E-13'] || null,
            'E-14': attrs.timestamps?.['E-14'] || null,
        },
        confirmation: attrs.confirmationGps ? { gps: attrs.confirmationGps } : null,
        notes: attrs.notes || '',
        photos: [],
        timerStart: attrs.createdAt || null,
        endTime: attrs.endTime || null,
        chatHistory: Array.isArray(order.chatHistory) ? order.chatHistory : [],
        rating: order.rating ?? review.rating ?? null,
        ratingComment: review.comment || null,
        routeDistanceKm: null,
        gpsTrackDistanceKm: 0,
    };
}

// ── Store ─────────────────────────────────────────────────────────
const saved = loadState();
if (saved?.profile?.documentId && /^\d+$/.test(String(saved.profile.documentId))) {
    saved.profile.documentId = null;
}

export const store = reactive({
    auth: saved?.auth || { loggedIn: false, phone: '', countryCode: '+351', token: null },
    courierId: saved?.courierId || null,
    profile: saved?.profile || {
        name: '', phone: '', email: '', birthDate: '', address: '',
        iban: '', zone: '', state: COURIER_STATE.E05,
        vehicle: { type: '', brand: '', model: '', color: '', plate: '' },
        docs: { cc: false, license: false, insurance: false },
        rating: 0, totalDeliveries: 0, onTimePct: 0,
    },
    filters: saved?.filters || {
        type: 'all', maxPickupDist: 50, maxDeliveryDist: 50, maxTime: 120, zone: 'all',
    },
    deliveries: [],
    completedDeliveries: [],
    activeDeliveryId: null,
    shiftActive: false,
    shiftMetrics: saved?.shiftMetrics || {
        revenue: 0, completed: 0, failed: 0, distanceKm: 0, ratingsReceived: [],
    },
    loading: false,
    error: null,
    gpsCoords: null,
    gpsHeading: 0,
    gpsFromDevice: false,
    gpsSimulated: false,
    gpsUpdatedAt: null,
    currentRouteGeoJSON: null,

    get shiftStats() {
        const completed = this.completedDeliveries.filter(d => d.state === 'E-13');
        return {
            earnings: this.shiftMetrics.revenue || completed.reduce((s, d) => s + (d.costEuro || 0), 0),
            completed: completed.length || this.shiftMetrics.completed,
        };
    },
    get courier() {
        return {
            name: this.profile.name,
            rating: this.profile.rating || 0,
            onTimeRate: this.profile.onTimePct || 0,
        };
    },
});

// ── Computed ──────────────────────────────────────────────────────

function guessZone(address) {
    const a = (address || '').toLowerCase();
    if (a.includes('porto')) return 'Porto Centro';
    if (a.includes('matosinhos')) return 'Matosinhos';
    if (a.includes('gaia')) return 'Vila Nova de Gaia';
    if (a.includes('braga')) return 'Braga';
    return null;
}

export const filteredDeliveries = computed(() => {
    return store.deliveries.filter(d => {
        if (d.state !== DELIVERY_STATE.E08) return false;
        const f = store.filters;
        if (f.type !== 'all' && d.type !== f.type) return false;
        if (d.pickup.distance > f.maxPickupDist) return false;
        if (d.destination.distance > f.maxDeliveryDist) return false;
        if (d.etaMinutes > f.maxTime) return false;
        if (f.zone !== 'all') {
            const destZone = guessZone(d.destination.address);
            if (destZone && destZone !== f.zone) return false;
        }
        return true;
    });
});

export const activeDelivery = computed(() => {
    if (!store.activeDeliveryId) return null;
    return store.deliveries.find(d => d.id === store.activeDeliveryId) || null;
});

export const shiftCompletionRate = computed(() => {
    const total = store.shiftMetrics.completed + store.shiftMetrics.failed;
    return total === 0 ? 100 : Math.round((store.shiftMetrics.completed / total) * 100);
});

function completedRatingsList() {
    const fromHistory = store.completedDeliveries
        .filter((d) => d.state === 'E-13')
        .map((d) => Number(d.rating))
        .filter((n) => n >= 1 && n <= 5);
    if (fromHistory.length) return fromHistory;
    return store.shiftMetrics.ratingsReceived.filter((n) => n >= 1 && n <= 5);
}

export const shiftAvgRating = computed(() => {
    const r = completedRatingsList();
    if (!r.length) return 0;
    return +(r.reduce((a, b) => a + b, 0) / r.length).toFixed(1);
});

export const courierMetrics = computed(() => {
    const sm = store.shiftMetrics;
    const all = [...store.deliveries, ...store.completedDeliveries];
    const completed = all.filter((d) => d.state === 'E-13');
    const completedHistory = store.completedDeliveries.filter((d) => d.state === 'E-13');
    const sumRouteKm = (list) => list.reduce((s, d) => s + (Number(d.routeDistanceKm) || 0), 0);
    const sumEarnings = (list) => list.reduce((s, d) => s + (d.costEuro || 0), 0);

    const weekCompleted = completedHistory.filter((d) => isDeliveryInLastDays(deliveryCompletedAtIso(d), 7));
    const monthCompleted = completedHistory.filter((d) => isDeliveryThisMonth(deliveryCompletedAtIso(d)));

    const routeKmAll = sumRouteKm(completedHistory);
    const routeKmWeek = sumRouteKm(weekCompleted);

    return {
        totalDeliveries: completed.length + sm.failed,
        completedDeliveries: completed.length,
        completedDeliveriesThisMonth: monthCompleted.length,
        inProgressDeliveries: store.deliveries.filter((d) => !['E-13', 'E-14'].includes(d.state)).length,
        totalEarnings: sumEarnings(completedHistory) || sm.revenue,
        earningsThisWeek: sumEarnings(weekCompleted) || sm.revenue,
        totalDistanceKm: Math.round((routeKmAll || sm.distanceKm) * 10) / 10,
        distanceKmThisWeek: Math.round((routeKmWeek || sm.distanceKm) * 10) / 10,
        avgRating: shiftAvgRating.value,
    };
});

// ── Actions: Auth ────────────────────────────────────────────────

export async function login(phone, countryCode, password) {
    store.loading = true;
    store.error = null;
    try {
        // 1. Auth dedicated to courier-estafetas
        const loginRes = await fetch(`${API_URL}/courier-estafetas/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, countryCode, password }),
        });
        const loginJson = await loginRes.json().catch(() => ({}));
        if (!loginRes.ok || !loginJson?.courier) {
            throw new Error(loginJson?.error?.message || loginJson?.message || 'Credenciais inválidas.');
        }

        const courier = loginJson.courier;
        const courierAttrs = courier.attributes || courier;

        const courierStatus = courierAttrs.courier_status || '';

        // 2. Check courier status
        if (courierStatus.startsWith('E-01')) {
            throw new Error('A tua conta está pendente de verificação.');
        }
        if (courierStatus.startsWith('E-03')) {
            throw new Error('A tua conta foi rejeitada. Contacta o suporte.');
        }
        if (courierStatus.startsWith('E-04')) {
            throw new Error('A tua conta está suspensa.');
        }

        // 3. Set state
        store.auth = { loggedIn: true, phone, countryCode, token: loginJson.token || null };
        store.courierId = courier.id || courier.documentId;

        // Build profile photo URL from docSelfie
        let profilePhotoUrl = null;
        const selfie = courierAttrs.docSelfie;
        if (selfie) {
            const selfieData = selfie.data?.attributes || selfie;
            const photoPath = selfieData?.url || selfieData?.formats?.thumbnail?.url || null;
            if (photoPath) {
                profilePhotoUrl = photoPath.startsWith('http') ? photoPath : `${BACKEND_URL}${photoPath}`;
            }
        }

        store.profile = {
            name: courierAttrs.fullName || phone,
            phone: courierAttrs.phone || `${countryCode}${phone}`,
            email: courierAttrs.email || '',
            birthDate: courierAttrs.birthDate || '',
            address: courierAttrs.address || '',
            iban: courierAttrs.iban || '',
            zone: courierAttrs.zone || '',
            state: presenceStateFromServer(courierStatus, courierAttrs.isOnline),
            vehicle: {
                type: courierAttrs.vehicleType || '',
                brand: courierAttrs.vehicleBrand || '',
                model: courierAttrs.vehicleModel || '',
                color: courierAttrs.vehicleColor || '',
                plate: courierAttrs.vehiclePlate || '',
            },
            docs: {
                cc: !!courierAttrs.docCc,
                license: !!courierAttrs.drivingLicense,
                insurance: !!courierAttrs.insurance,
            },
            rating: Number.isFinite(Number(courierAttrs.rating)) ? Number(courierAttrs.rating) : 0,
            totalDeliveries: courierAttrs.totalDeliveries || 0,
            onTimePct: Number.isFinite(Number(courierAttrs.onTimePct)) ? Number(courierAttrs.onTimePct) : 0,
            documentId: courier.documentId || courierAttrs.documentId || null,
            profilePhotoUrl: profilePhotoUrl,
        };

        saveState();

        // 4. Load deliveries; keep server presence (do not force pause on login)
        store.activeDeliveryId = null;
        await Promise.all([
            fetchDeliveries({ silent: true }),
            fetchCompletedDeliveries(),
        ]);
        if (hasActiveDeliveryInProgress() && !isPaused()) {
            startGpsTracking();
        }

        return { success: true };
    } catch (err) {
        store.error = err.message;
        return { success: false, error: err.message };
    } finally {
        store.loading = false;
    }
}

export async function logout() {
    stopGpsTracking();
    if (store.profile.documentId) {
        try {
            await apiCourierSelfPut({ courier_status: 'E-05 Offline', isOnline: false });
        } catch { /* ignore */ }
    }
    store.auth = { loggedIn: false, phone: '', countryCode: '+351', token: null };
    store.courierId = null;
    store.profile = {
        name: '', phone: '', email: '', birthDate: '', address: '',
        iban: '', zone: '', state: 'E-05 Offline',
        vehicle: { type: '', brand: '', model: '', color: '', plate: '' },
        docs: { cc: false, license: false, insurance: false },
        rating: 0, totalDeliveries: 0, onTimePct: 0,
    };
    store.activeDeliveryId = null;
    store.deliveries = [];
    store.completedDeliveries = [];
    store.shiftMetrics = {
        revenue: 0, completed: 0, failed: 0, distanceKm: 0, ratingsReceived: [],
    };
    saveState();
}

// ── Actions: Deliveries ──────────────────────────────────────────

function mergeDeliveriesList(incoming) {
    if (!incoming.length) {
        store.deliveries = [];
        return;
    }
    const prevById = new Map(store.deliveries.map((d) => [d.id, d]));
    store.deliveries = incoming.map((item) => {
        const prev = prevById.get(item.id);
        if (!prev) return item;
        const merged = Object.assign(prev, item);
        if ((item.chatHistory?.length || 0) >= (prev.chatHistory?.length || 0)) {
            merged.chatHistory = item.chatHistory;
        } else {
            merged.chatHistory = prev.chatHistory;
        }
        return merged;
    });
}

export async function fetchDeliveries(options = {}) {
    const silent = !!options.silent;
    if (!store.courierId) {
        store.deliveries = [];
        return;
    }

    if (silent) deliveriesSyncing.value = true;
    else store.loading = true;
    try {
        // Use the dedicated courier endpoint that validates the courier JWT directly.
        // The generic /deliveries endpoint silently returns empty because the courier
        // JWT (scope:'courier') is not recognized by Strapi's standard auth middleware.
        const res = await apiGet('/courier-estafetas/my-deliveries');
        
        applyServerPresence(res.meta);
        
        const apiDeliveries = (res.data || []).map(d => mapDelivery(d));

        if (apiDeliveries.length > 0) {
            mergeDeliveriesList(apiDeliveries);

            const inProgress = apiDeliveries.find(d => ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state));
            if (inProgress) {
                const keepCurrent = store.activeDeliveryId
                    && apiDeliveries.some((d) => d.id === store.activeDeliveryId);
                if (!keepCurrent) store.activeDeliveryId = inProgress.id;
            } else if (!['E-09', 'E-10', 'E-11', 'E-12'].includes(
                apiDeliveries.find((d) => d.id === store.activeDeliveryId)?.state,
            )) {
                store.activeDeliveryId = null;
            }
        } else {
            store.deliveries = [];
            store.activeDeliveryId = null;
        }

        if (hasActiveDeliveryInProgress() && !isPaused()) {
            startGpsTracking();
        }
    } catch (err) {
        console.warn('fetchDeliveries error:', err.message);
        if (store.deliveries.length === 0) store.deliveries = [];
    } finally {
        if (silent) deliveriesSyncing.value = false;
        else store.loading = false;
    }
}


export async function fetchCompletedDeliveries() {
    if (!store.courierId) return [];
    try {
        const res = await apiGet('/courier-estafetas/my-completed-deliveries');
        const deliveries = (res.data || []).map(d => mapDelivery(d));
        await enrichDeliveriesRouteKm(deliveries);
        store.completedDeliveries = deliveries;
        return deliveries;
    } catch (err) {
        console.warn('fetchCompletedDeliveries error:', err.message);
        return [];
    }
}

// ── Actions: State transitions ───────────────────────────────────

async function updateDeliveryOnStrapi(delivery, newState, extraData = {}) {
    const payload = {
        data: {
            delivery_status: STATUS_MAP[newState],
            ...extraData,
        }
    };

    let lastErr = null;
    const candidateIds = [delivery.documentId, delivery.id].filter(Boolean);

    for (const candidate of candidateIds) {
        try {
            await apiCourierPut(`/courier-estafetas/deliveries/${candidate}`, payload);
            // O estado da Order é agora sincronizado automaticamente pelo backend (Lifecycle Hook)
            socket.emit('order_status_update', { room: delivery.orderDocumentId, status: newState });
            return true;
        } catch (err) {
            lastErr = err;
        }
    }

    throw (lastErr || new Error('Falha ao sincronizar entrega no backend.'));
}

export async function acceptDelivery(deliveryId) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E08) return false;

    const now = new Date().toISOString();
    const prevState = d.state;
    const prevActive = store.activeDeliveryId;
    const prevTimestamps = { ...d.timestamps };
    d.state = DELIVERY_STATE.E09;
    d.timestamps['E-08'] = d.timerStart || now;
    d.timestamps['E-09'] = now;
    d.gpsTrackDistanceKm = 0;
    d._gpsTrackLast = null;
    d.routeDistanceKm = null;
    store.activeDeliveryId = deliveryId;
    saveState();

    try {
        await updateDeliveryOnStrapi(d, 'E-09', { startTime: now, timestamps: d.timestamps });
        return true;
    } catch (err) {
        // Evita loop de "aceitar novamente" quando o backend não persiste a transição.
        d.state = prevState;
        d.timestamps = prevTimestamps;
        store.activeDeliveryId = prevActive;
        store.error = err.message || 'Não foi possível aceitar a entrega.';
        saveState();
        return false;
    }
}

export async function advanceDeliveryState(deliveryId) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d) return false;
    const next = NEXT_STATE[d.state];
    if (!next || next === 'E-13') return false;

    const now = new Date().toISOString();
    d.state = next;
    d.timestamps[next] = now;
    saveState();

    await updateDeliveryOnStrapi(d, next, { timestamps: d.timestamps });

    if (next === 'E-14') {
        store.activeDeliveryId = null;
    }
    
    await fetchDeliveries();
    return true;
}

export async function confirmDelivery(deliveryId, confirmation) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E12 || !d.documentId) return false;

    const now = new Date().toISOString();
    const prevState = d.state;
    const prevTimestamps = { ...d.timestamps };
    const prevConfirmation = d.confirmation;
    const prevShiftMetrics = JSON.parse(JSON.stringify(store.shiftMetrics));
    const prevCompleted = [...store.completedDeliveries];
    const prevActive = store.activeDeliveryId;
    const prevTotalDeliveries = store.profile.totalDeliveries || 0;

    d.state = DELIVERY_STATE.E13;
    d.timestamps['E-13'] = now;
    d.confirmation = confirmation;

    const routeKm = await resolveDeliveryDistanceKm(d);

    store.shiftMetrics.completed++;
    store.shiftMetrics.revenue += d.costEuro || 0;
    store.shiftMetrics.distanceKm += routeKm;

    store.completedDeliveries.push({ ...d });
    store.activeDeliveryId = null;
    stopGpsTracking(); // Stop GPS when delivery completed
    saveState();

    // Sync to Strapi
    try {
        const extraData = {
            endTime: now,
            timestamps: d.timestamps,
            confirmationGps: confirmation.gps || confirmation.location || null,
            notes: d.notes || '',
        };

            // Optional proof: photo
            if (confirmation.photo) {
                try {
                    const blob = await fetch(confirmation.photo).then(r => r.blob());
                    const file = new File([blob], 'confirmation.jpg', { type: 'image/jpeg' });
                    const photoId = await apiUploadFile(file);
                    if (photoId) extraData.confirmationPhoto = photoId;
                } catch (e) { console.warn('Photo upload failed:', e); }
            }

            // Optional proof: signature
            if (confirmation.signature) {
                extraData.confirmationSignature = confirmation.signature;
            }

            // Optional proof: QR code
            if (confirmation.qrCode) {
                extraData.confirmationQrCode = String(confirmation.qrCode).trim();
            }

        await updateDeliveryOnStrapi(d, 'E-13', extraData);
        void fetchCompletedDeliveries();

        // Update courier totalDeliveries
        if (store.profile.documentId) {
            try {
                await apiCourierSelfPut({ totalDeliveries: (store.profile.totalDeliveries || 0) + 1 });
                store.profile.totalDeliveries = (store.profile.totalDeliveries || 0) + 1;
            } catch (e) { /* ignore */ }
        }
    } catch (err) {
        d.state = prevState;
        d.timestamps = prevTimestamps;
        d.confirmation = prevConfirmation;
        store.shiftMetrics = prevShiftMetrics;
        store.completedDeliveries = prevCompleted;
        store.activeDeliveryId = prevActive;
        store.profile.totalDeliveries = prevTotalDeliveries;
        saveState();
        console.error('confirmDelivery sync error:', err);
        return false;
    }

    return true;
}

export async function markDeliveryImpossible(deliveryId, reason, photo) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || !d.documentId) return false;
    if (!['E-08', 'E-09'].includes(d.state)) {
        store.error = 'Só podes marcar impossível antes da recolha na loja.';
        return false;
    }

    const now = new Date().toISOString();
    const prevState = d.state;
    const prevTimestamps = { ...d.timestamps };
    const prevConfirmation = d.confirmation;
    const prevShiftMetrics = JSON.parse(JSON.stringify(store.shiftMetrics));
    const prevCompleted = [...store.completedDeliveries];
    const prevActive = store.activeDeliveryId;
    d.state = DELIVERY_STATE.E14;
    d.timestamps['E-14'] = now;
    d.confirmation = { type: 'impossible', reason, photo };

    store.shiftMetrics.failed++;
    store.completedDeliveries.push({ ...d });
    store.activeDeliveryId = null;
    stopGpsTracking(); // Stop GPS when delivery marked impossible
    saveState();

    try {
        await updateDeliveryOnStrapi(d, 'E-14', { endTime: now, notes: reason });
        return true;
    } catch (err) {
        d.state = prevState;
        d.timestamps = prevTimestamps;
        d.confirmation = prevConfirmation;
        store.shiftMetrics = prevShiftMetrics;
        store.completedDeliveries = prevCompleted;
        store.activeDeliveryId = prevActive;
        saveState();
        return false;
    }
}

// ── Actions: Notes & Photos ──────────────────────────────────────

export function addDeliveryNotes(deliveryId, notes, photos) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d) return false;
    d.notes = notes;
    if (photos && photos.length) d.photos = [...d.photos, ...photos];
    saveState();
    return true;
}

// ── Actions: Filters & Shift ─────────────────────────────────────

export function updateFilters(patch) {
    Object.assign(store.filters, patch);
    saveState();
}

export function startShift() {
    store.shiftActive = true;
    store.shiftMetrics = { revenue: 0, completed: 0, failed: 0, distanceKm: 0, ratingsReceived: [] };
    saveState();
}

export function endShift() {
    store.shiftActive = false;
    saveState();
}

// ── Actions: Pause / Online Toggle (E-07 / E-06) ────────────────

function presenceStateFromServer(strapiStatus, isOnline) {
    const code = strapiStatusToCode(strapiStatus);
    if (code === COURIER_STATE.E07) return COURIER_STATE.E07;
    if (code === COURIER_STATE.E05 && hasActiveDeliveryInProgress()) {
        return COURIER_STATE.E06;
    }
    if (code === COURIER_STATE.E05) return COURIER_STATE.E05;
    if (isOnline || code === COURIER_STATE.E06) return COURIER_STATE.E06;
    if (hasActiveDeliveryInProgress()) return COURIER_STATE.E06;
    return code || COURIER_STATE.E06;
}

function applyServerPresence(meta) {
    if (!meta) return;
    const next = presenceStateFromServer(meta.courier_status, meta.isOnline);
    if (next && store.profile.state !== next) {
        store.profile.state = next;
        saveState();
    }
    if (hasActiveDeliveryInProgress() && next === COURIER_STATE.E06 && meta.isOnline === false) {
        void apiCourierSelfPut({ courier_status: 'E-06 Online', isOnline: true }).catch(() => {});
    }
}

export async function togglePause() {
    const wasPaused = store.profile.state === COURIER_STATE.E07;
    const nextState = wasPaused ? COURIER_STATE.E06 : COURIER_STATE.E07;
    const nextStrapiStatus = wasPaused ? 'E-06 Online' : 'E-07 Em Pausa';
    const nextIsOnline = wasPaused;

    const prevState = store.profile.state;
    store.profile.state = nextState;
    saveState();

    if (!store.profile.documentId) {
        console.warn('togglePause: sem documentId — faz login outra vez para sincronizar com o servidor.');
        return nextState;
    }
    try {
        await apiCourierSelfPut({ courier_status: nextStrapiStatus, isOnline: nextIsOnline });
    } catch (err) {
        store.profile.state = prevState;
        saveState();
        console.error('togglePause sync error:', err);
        store.error = 'Não foi possível atualizar o estado. Tenta sair e voltar a entrar.';
        return prevState;
    }
    if (nextIsOnline && hasActiveDeliveryInProgress()) {
        startGpsTracking();
    } else if (!nextIsOnline) {
        stopGpsTracking();
    }

    return nextState;
}

export function isPaused() {
    return store.profile.state === COURIER_STATE.E07 || store.profile.state === COURIER_STATE.E05;
}

async function syncPresenceStatus({ localState, strapiStatus, isOnline }) {
    if (!store.auth.loggedIn || !store.profile.documentId) return;
    store.profile.state = localState;
    saveState();
    try {
        await apiCourierSelfPut({ courier_status: strapiStatus, isOnline });
    } catch (err) {
        console.warn('syncPresenceStatus error:', err.message || err);
    }
}

export async function setPausedOnAppOpen() {
    await syncPresenceStatus({
        localState: COURIER_STATE.E07,
        strapiStatus: 'E-07 Em Pausa',
        isOnline: false,
    });
}

export async function setOfflineOnAppClose() {
    await syncPresenceStatus({
        localState: COURIER_STATE.E05,
        strapiStatus: 'E-05 Offline',
        isOnline: false,
    });
}

// Não marcar offline em refresh — só em logout() explícito.


// ── Actions: GPS Tracking (RNF02 — continuous while on shift) ───

let gpsWatchId = null;
let gpsIntervalId = null;
let gpsVisibilityHooked = false;
let lastGpsPersistAt = 0;
let lastSimGpsPersistAt = 0;
let lastGpsSocketEmitAt = 0;
let gpsPersistInFlight = false;
const SIM_GPS_PERSIST_MS = 5000;

const GPS_WATCH_HIGH = { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 };
const GPS_WATCH_LOW = { enableHighAccuracy: false, timeout: 30000, maximumAge: 3000 };

export function hasActiveDeliveryInProgress() {
    return store.deliveries.some((d) => ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state));
}

function emitGpsToSocket(force = false) {
    if (!socket.connected || !isValidGpsPoint(store.gpsCoords)) return;
    if (!isRealDeviceGps() && !isSimulatingRoute.value) return;

    const now = Date.now();
    const minGap = isSimulatingRoute.value ? 900 : 1000;
    if (!force && now - lastGpsSocketEmitAt < minGap) return;
    lastGpsSocketEmitAt = now;

    const isSimulated = isSimulatingRoute.value || store.gpsSimulated;
    const payload = {
        courierId: store.courierId,
        lat: store.gpsCoords.lat,
        lng: store.gpsCoords.lng,
        isSimulated: !!isSimulated,
    };

    socket.emit('courier_gps_update', payload);

    const active = store.deliveries.find((x) => String(x.id) === String(store.activeDeliveryId));
    if (active?.orderDocumentId && ['E-09', 'E-10', 'E-11', 'E-12'].includes(active.state)) {
        socket.emit('gps_update', {
            room: String(active.orderDocumentId),
            courierId: store.courierId,
            lat: store.gpsCoords.lat,
            lng: store.gpsCoords.lng,
            isSimulated: !!isSimulated,
        });
    }
}

function applyGpsPosition(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const active = store.deliveries.find((x) => String(x.id) === String(store.activeDeliveryId));

    store.gpsCoords = { lat, lng };
    store.gpsFromDevice = true;
    store.gpsSimulated = false;
    store.gpsUpdatedAt = Date.now();
    lastGpsCoords = store.gpsCoords;

    if (active) {
        active.courierLat = lat;
        active.courierLng = lng;
        if (['E-09', 'E-10', 'E-11', 'E-12'].includes(active.state)) {
            accumulateGpsOnDelivery(active, lat, lng);
        }
    }

    emitGpsToSocket();
}

let lastSimPoint = null;

/** GPS simulado ou injectado — atualiza store + socket + entrega activa */
export function applySimulatedGps(lat, lng, { emitSocket = true } = {}) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const active = store.deliveries.find((x) => String(x.id) === String(store.activeDeliveryId));
    const next = { lat, lng };
    if (lastSimPoint) {
        store.gpsHeading = calculateBearing(lastSimPoint, next);
    }
    lastSimPoint = next;
    store.gpsCoords = next;
    store.gpsFromDevice = false;
    store.gpsSimulated = true;
    store.gpsUpdatedAt = Date.now();
    lastGpsCoords = store.gpsCoords;
    if (active) {
        active.courierLat = lat;
        active.courierLng = lng;
        if (['E-09', 'E-10', 'E-11', 'E-12'].includes(active.state)) {
            accumulateGpsOnDelivery(active, lat, lng);
        }
    }
    if (emitSocket) emitGpsToSocket(true);

    const now = Date.now();
    if (isSimulatingRoute.value && now - lastSimGpsPersistAt >= SIM_GPS_PERSIST_MS) {
        lastSimGpsPersistAt = now;
        void persistGpsToServer();
    }
}

function applyDevGpsFallback() {
    if (store.gpsFromDevice || store.gpsSimulated) return;
    console.warn('[GPS] Localização indisponível — activa a permissão no browser (sem fallback para Porto).');
}

function ensureGpsVisibilityListener() {
    if (gpsVisibilityHooked || typeof document === 'undefined') return;
    gpsVisibilityHooked = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        if (!store.auth.loggedIn || isPaused()) return;
        if (hasActiveDeliveryInProgress() || store.activeDeliveryId) {
            restartGpsTracking();
        }
    });
}

export function restartGpsTracking() {
    if (isSimulatingRoute.value) return;
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    startGpsTracking();
}

export function startGpsTracking() {
    if (isSimulatingRoute.value) return;
    if (gpsWatchId !== null) return;
    if (!('geolocation' in navigator)) {
        console.warn('Geolocation not available');
        applyDevGpsFallback();
        return;
    }

    ensureGpsVisibilityListener();

    const handleErr = (err) => {
        console.warn('High-accuracy GPS failed, falling back to low accuracy:', err?.message || err);
        if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);

        gpsWatchId = navigator.geolocation.watchPosition(
            applyGpsPosition,
            (e) => {
                console.warn('Low-accuracy GPS failed:', e?.message || e);
                applyDevGpsFallback();
            },
            GPS_WATCH_LOW,
        );
    };

    gpsWatchId = navigator.geolocation.watchPosition(
        applyGpsPosition,
        handleErr,
        GPS_WATCH_HIGH,
    );

    ensureGpsEmitInterval();
}

async function persistGpsToServer() {
    if (gpsPersistInFlight || !isValidGpsPoint(store.gpsCoords)) return;
    if (!isRealDeviceGps() && !isSimulatingRoute.value) return;

    const active = store.deliveries.find((x) => String(x.id) === String(store.activeDeliveryId));
    const lat = Math.round(store.gpsCoords.lat * 1e6) / 1e6;
    const lng = Math.round(store.gpsCoords.lng * 1e6) / 1e6;

    gpsPersistInFlight = true;
    try {
        if (store.profile.documentId) {
            await apiCourierSelfPut({ lat, lng });
        }
        if (active?.documentId && ['E-09', 'E-10', 'E-11', 'E-12'].includes(active.state)) {
            await apiCourierPut(`/courier-estafetas/deliveries/${active.documentId}`, {
                data: { courierLatitude: lat, courierLongitude: lng },
            });
            active.courierLat = lat;
            active.courierLng = lng;
        }
    } catch (err) {
        console.warn('GPS sync error:', err.message || err);
    } finally {
        gpsPersistInFlight = false;
    }
}

export function stopGpsTracking() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    if (gpsIntervalId !== null) {
        clearInterval(gpsIntervalId);
        gpsIntervalId = null;
    }
}

// ── Actions: Timer expiry (E-08 → decline) ──────────────────────

export async function declineDeliveryTimeout(deliveryId) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E08) return false;

    // Remove from local list
    store.deliveries = store.deliveries.filter(x => x.id !== deliveryId);
    if (store.activeDeliveryId === deliveryId) store.activeDeliveryId = null;
    saveState();

    // Notify Strapi so admin can reassign
    if (d.documentId) {
        try {
            await apiPut(`/deliveries/${d.documentId}`, {
                data: {
                    delivery_status: 'E-08 Pedido Recebido',
                    notes: 'Expirou o tempo de aceitação pelo estafeta.',
                }
            });
            // Also revert order to S-06 (Aguardando Aceitação) for reassignment
            if (d.orderDocumentId) {
                await apiCourierPut(`/courier-estafetas/orders/${d.orderDocumentId}`, {
                    data: { order_status: 'S-06 Aguardando Aceitação' }
                });
                socket.emit('order_status_update', { room: d.orderDocumentId, status: 'S-06' });
                socket.emit('global_order_status_update', { status: 'S-06' });
            }
        } catch (err) {
            console.error('declineDeliveryTimeout sync error:', err);
        }
    }
    return true;
}

// ── Actions: Profile (Read-only — changes via request) ───────────

export async function updateProfile(updates) {
    if (!store.profile.documentId) {
        throw new Error('Perfil não encontrado. Faz login novamente.');
    }

    // Build the flat Strapi payload
    const strapiPayload = { ...updates };

    // If vehicle sub-object provided, flatten it to vehicleType/vehicleBrand/…
    if (updates.vehicle && typeof updates.vehicle === 'object') {
        if (updates.vehicle.type  != null) strapiPayload.vehicleType  = updates.vehicle.type;
        if (updates.vehicle.brand != null) strapiPayload.vehicleBrand = updates.vehicle.brand;
        if (updates.vehicle.model != null) strapiPayload.vehicleModel = updates.vehicle.model;
        if (updates.vehicle.color != null) strapiPayload.vehicleColor = updates.vehicle.color;
        if (updates.vehicle.plate != null) strapiPayload.vehiclePlate = updates.vehicle.plate;
        delete strapiPayload.vehicle;
    }

    try {
        await apiCourierSelfPut(strapiPayload);

        // Sync flat scalar fields onto profile
        const { vehicleType, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate, vehicle: _v, ...rest } = strapiPayload;
        Object.assign(store.profile, rest);

        // Sync nested vehicle object
        if (!store.profile.vehicle) store.profile.vehicle = {};
        if (vehicleType  != null) store.profile.vehicle.type  = vehicleType;
        if (vehicleBrand != null) store.profile.vehicle.brand = vehicleBrand;
        if (vehicleModel != null) store.profile.vehicle.model = vehicleModel;
        if (vehicleColor != null) store.profile.vehicle.color = vehicleColor;
        if (vehiclePlate != null) store.profile.vehicle.plate = vehiclePlate;

        // Also handle the vehicle sub-object if it was present in updates
        if (updates.vehicle) {
            Object.assign(store.profile.vehicle, updates.vehicle);
        }

        saveState();
    } catch (err) {
        console.error('Update profile error:', err);
        throw new Error('Não foi possível atualizar o perfil. Tenta novamente.');
    }

    return true;
}

export async function sendDeliveryChatMessage(orderDocumentId, text) {
    if (!orderDocumentId) return false;
    try {
        // Read current chat history from local delivery state (already fetched via my-deliveries)
        const active = store.deliveries.find(d => d.orderDocumentId === orderDocumentId);
        const currentHistory = [...(active?.chatHistory || [])];
        
        const newMessage = {
            sender: 'courier',
            text,
            time: new Date().toISOString()
        };
        currentHistory.push(newMessage);

        // Use the authenticated courier endpoint to update the order's chatHistory
        await apiCourierPut(`/courier-estafetas/orders/${orderDocumentId}`, {
            data: { chatHistory: currentHistory }
        });
        
        // Update local state
        if (active) active.chatHistory = currentHistory;

        // Emit via WebSocket for real-time delivery to Front-Office
        joinOrderRoom(orderDocumentId);
        socket.emit('chat_message', {
            room: orderDocumentId,
            message: newMessage,
            chatHistory: currentHistory,
        });

        return true;
    } catch (err) {
        console.error('Chat error:', err);
        return false;
    }
}

// ── Getters ──────────────────────────────────────────────────────

function deliveryIdMatches(d, id) {
    const key = String(id || '').trim();
    if (!key) return false;
    return String(d.id) === key
        || String(d.documentId) === key
        || (d.orderDocumentId && String(d.orderDocumentId) === key);
}

export function getDeliveryById(id) {
    return store.deliveries.find((d) => deliveryIdMatches(d, id))
        || store.completedDeliveries.find((d) => deliveryIdMatches(d, id))
        || null;
}

/** Corrige destino colado à loja (fallback antigo) via geocoding da morada */
export async function ensureDeliveryCoords(delivery) {
    if (!delivery?.pickup || !delivery?.destination) return delivery;
    const p = delivery.pickup;
    const d = delivery.destination;
    const km = haversineKm(p.lat, p.lng, d.lat, d.lng);
    if (km != null && km >= 0.8) return delivery;
    const addr = String(d.address || '').trim();
    if (addr.length < 6) return delivery;
    const geo = await geocodeAddress(addr, { proximityLngLat: p });
    if (geo && isValidCoord(geo)) {
        d.lat = geo.lat;
        d.lng = geo.lng;
        d.distance = haversineKm(p.lat, p.lng, d.lat, d.lng);
    }
    return delivery;
}

/** Garante que a entrega do URL está em memória; devolve a entrega ou null */
export async function ensureDeliveryLoaded(routeId) {
    const key = String(routeId || '').trim();
    if (!key) return null;

    let found = getDeliveryById(key);
    if (found) {
        await ensureDeliveryCoords(found);
        store.activeDeliveryId = found.id;
        return found;
    }

    await fetchDeliveries({ silent: true });
    found = getDeliveryById(key);
    if (found) {
        await ensureDeliveryCoords(found);
        store.activeDeliveryId = found.id;
        return found;
    }

    const inProgress = store.deliveries.find((d) => ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state));
    if (inProgress) {
        store.activeDeliveryId = inProgress.id;
        return inProgress;
    }

    return null;
}

export function getLastGpsCoords() {
    return store.gpsCoords;
}

/** Waze deep link */
export function wazeLink(lat, lng) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

// ── Init: load deliveries if already logged in ───────────────────
if (store.auth.loggedIn && store.courierId) {
    Promise.all([
        fetchDeliveries({ silent: true }),
        fetchCompletedDeliveries(),
    ]).then(() => {
        if (hasActiveDeliveryInProgress()) {
            if (!isPaused()) restartGpsTracking();
            else if (store.profile.state !== COURIER_STATE.E07) {
                store.profile.state = COURIER_STATE.E06;
                saveState();
            }
        }
    });
}

export const isSimulatingRoute = ref(false);
/** Sincronização silenciosa da lista (socket) — loader só na secção da lista */
export const deliveriesSyncing = ref(false);
let simulationIntervalId = null;
let simPhase = null;
let simSteps = [];
let simTickIndex = 0;
let simDeliveryId = null;
let simPhaseBusy = false;

const QUICK_SIM_LEG_MS = 120000;
const QUICK_SIM_TICK_MS = 1000;

function resampleRouteToSteps(routeCoords, durationSec) {
    if (!routeCoords?.length) return [];
    if (routeCoords.length === 1) {
        return Array.from({ length: durationSec + 1 }, () => ({ ...routeCoords[0] }));
    }
    const steps = [];
    for (let s = 0; s <= durationSec; s += 1) {
        const t = s / durationSec;
        const f = t * (routeCoords.length - 1);
        const i = Math.floor(f);
        const frac = f - i;
        const a = routeCoords[i];
        const b = routeCoords[Math.min(i + 1, routeCoords.length - 1)];
        steps.push({
            lat: a.lat + (b.lat - a.lat) * frac,
            lng: a.lng + (b.lng - a.lng) * frac,
        });
    }
    return steps;
}

async function fetchRoutePoints(origin, target) {
    if (!isValidCoord(target)) return { points: [], geometry: null };
    const start = isValidCoord(origin)
        ? origin
        : { lat: target.lat + 0.015, lng: target.lng - 0.02 };
    const route = await fetchMapboxRoute([start, target]);
    const pts = coordsFromGeometry(route?.geometry);
    const points = pts.length >= 2 ? pts : [start, target];
    return { points, geometry: route?.geometry || null };
}

async function beginQuickSimPhase(phaseName, delivery) {
    simPhase = phaseName;
    simTickIndex = 0;
    const target = phaseName === 'to_store' ? delivery.pickup : delivery.destination;
    const { points, geometry } = await fetchRoutePoints(store.gpsCoords, target);
    simSteps = resampleRouteToSteps(points, Math.floor(QUICK_SIM_LEG_MS / QUICK_SIM_TICK_MS));
    if (geometry && points.length >= 4) store.currentRouteGeoJSON = geometry;
}

function deliveryStatePhase(state) {
    if (['E-11', 'E-12'].includes(state)) return 'to_client';
    if (['E-08', 'E-09', 'E-10'].includes(state)) return 'to_store';
    return null;
}

export async function fetchRouteGeoJSON(pickup, destination) {
    if (store.currentRouteGeoJSON) return store.currentRouteGeoJSON;
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
            store.currentRouteGeoJSON = data.routes[0].geometry; // Save the full GeoJSON geometry
            return data.routes[0].geometry;
        }
    } catch (err) {
        console.error("OSRM fetch error", err);
    }
    return null;
}

/** Força leitura imediata do GPS real do telemóvel */
export function refreshDeviceGps() {
    if (isSimulatingRoute.value) return;
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
        applyGpsPosition,
        (err) => console.warn('[GPS] getCurrentPosition:', err?.message || err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
}

export function stopSimulatedRoute() {
    if (simulationIntervalId) {
        clearInterval(simulationIntervalId);
        simulationIntervalId = null;
    }
    isSimulatingRoute.value = false;
    simPhase = null;
    simSteps = [];
    simTickIndex = 0;
    simDeliveryId = null;
    lastSimPoint = null;
    store.gpsHeading = 0;
    store.gpsSimulated = false;
    lastSimGpsPersistAt = 0;
    if (isValidGpsPoint(store.gpsCoords)) {
        void persistGpsToServer();
    }
    if (hasActiveDeliveryInProgress() && !isPaused()) {
        restartGpsTracking();
        refreshDeviceGps();
    }
}

function ensureGpsEmitInterval() {
    if (gpsIntervalId !== null) return;
    gpsIntervalId = setInterval(() => {
        if (!isRealDeviceGps()) return;
        emitGpsToSocket();
        const now = Date.now();
        if (now - lastGpsPersistAt < 28000 || gpsPersistInFlight) return;
        lastGpsPersistAt = now;
        void persistGpsToServer();
    }, 2000);
}

/**
 * Simulação rápida: ~2 min até ao Continente, depois ao mudar para E-11 ~2 min até ao cliente.
 * Atualiza GPS a cada 1s (mapa, navegação, FO/BO via socket).
 */
export async function startQuickDeliverySimulation(delivery) {
    if (!delivery?.pickup || !delivery?.destination) return;
    stopSimulatedRoute();
    setActiveDeliveryForView(delivery.id);
    simDeliveryId = delivery.id;

    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    isSimulatingRoute.value = true;
    lastSimPoint = null;
    store.gpsHeading = 0;
    ensureGpsEmitInterval();

    if (delivery.orderDocumentId) {
        joinOrderRoom(delivery.orderDocumentId);
    }

    const initialPhase = deliveryStatePhase(delivery.state) || 'to_store';
    await beginQuickSimPhase(initialPhase, delivery);
    if (simSteps.length && simSteps[0]) {
        applySimulatedGps(simSteps[0].lat, simSteps[0].lng);
        simTickIndex = 1;
    }

    simulationIntervalId = setInterval(async () => {
        const d = store.deliveries.find((x) => String(x.id) === String(simDeliveryId)) || delivery;
        if (!d || !isSimulatingRoute.value) {
            stopSimulatedRoute();
            return;
        }

        const wantedPhase = deliveryStatePhase(d.state);
        if (!wantedPhase) {
            stopSimulatedRoute();
            return;
        }

        if (wantedPhase === 'to_client' && simPhase === 'to_store' && !simPhaseBusy) {
            simPhaseBusy = true;
            await beginQuickSimPhase('to_client', d);
            simPhaseBusy = false;
            return;
        }
        if (simPhaseBusy) return;

        if (simTickIndex < simSteps.length) {
            const p = simSteps[simTickIndex];
            simTickIndex += 1;
            applySimulatedGps(p.lat, p.lng);
        } else if (simPhase === 'to_store' && wantedPhase === 'to_store') {
            const last = simSteps[simSteps.length - 1];
            if (last) applySimulatedGps(last.lat, last.lng);
        } else if (simPhase === 'to_client') {
            const last = simSteps[simSteps.length - 1];
            if (last) applySimulatedGps(last.lat, last.lng);
            stopSimulatedRoute();
        }
    }, QUICK_SIM_TICK_MS);
}

export async function startSimulatedRoute(pickup, destination) {
    if (simulationIntervalId) stopSimulatedRoute();
    
    // Stop REAL GPS hardware tracking, but keep the syncing interval running!
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    
    isSimulatingRoute.value = true;
    
    try {
        let points = [];
        if (store.gpsCoords && store.gpsCoords.lat !== 0) {
            points.push(store.gpsCoords);
        }
        points.push(pickup);
        points.push(destination);

        const coordsStr = points.map(p => `${p.lng},${p.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        let geometry = null;
        if (data.routes && data.routes[0]) {
            geometry = data.routes[0].geometry;
            store.currentRouteGeoJSON = geometry;
        }
        
        if (geometry && geometry.coordinates) {
            const coords = geometry.coordinates; // Array of [lng, lat]
            if (coords.length === 0) return;

            let currentIndex = 0;
            // Target ~30 steps = ~5 minutes total simulation (10s each step)
            const step = Math.max(1, Math.floor(coords.length / 30));
            
            simulationIntervalId = setInterval(() => {
                if (currentIndex >= coords.length) {
                    stopSimulatedRoute();
                    return;
                }
                
                const [lng, lat] = coords[currentIndex];
                applySimulatedGps(lat, lng);

                currentIndex += step;
            }, 10000);
        }
    } catch (e) {
        console.error("Failed to simulate route", e);
    }
}

export function getCurrentRouteGeoJSON() {
    return store.currentRouteGeoJSON;
}
