import { reactive, computed, ref, watch } from 'vue';
import { io } from 'socket.io-client';
import { DELIVERY_STATE, COURIER_STATE, NEXT_STATE } from '../constants.js';
import { API_URL, BACKEND_URL, SOCKET_URL } from '../config/env.js';

// ── Config ───────────────────────────────────────────────────────
const STORAGE_KEY = 'ge-estafeta';

// Global GPS coords for distances
let lastGpsCoords = null;

export const socket = io(SOCKET_URL, {
    autoConnect: true // PWA is always connected
});

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
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
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
    'E-14': 'S-12 Não Foi Possível Entregar',
};

function strapiStatusToCode(strapiStatus) {
    if (!strapiStatus) return null;
    return strapiStatus.substring(0, 4); // "E-08 Pedido Recebido" → "E-08"
}

// ── Helpers: Distance (Haversine) ────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Map Strapi delivery+order to local format ────────────────────
function mapDelivery(d) {
    const attrs = d.attributes || d;
    const order = attrs.order?.data?.attributes || attrs.order || {};
    const items = order.items || [{ name: 'GoGummies', qty: 1, unit: 'frasco' }];
    // Extract delivery coordinates from the items JSON (set by Front-Office)
    const itemsJson = (typeof order.items === 'object' && !Array.isArray(order.items)) ? order.items : {};
    const deliveryCoords = itemsJson.deliveryCoords || {};

    // Use real coordinates from the order, falling back to items JSON, then to approximate
    const pickupLat = Number(order.storeLatitude) || 41.5518;
    const pickupLng = Number(order.storeLongitude) || -8.4229;
    const destLat = Number(order.deliveryLatitude) || Number(deliveryCoords.lat) || pickupLat + 0.005;
    const destLng = Number(order.deliveryLongitude) || Number(deliveryCoords.lng) || pickupLng + 0.003;

    // Extract delivery address from order or items JSON
    const deliveryAddress = order.deliveryAddress || deliveryCoords.address || '';

    // Mapeamento extra para User/Cliente
    const userData = order.user?.data?.attributes || order.user?.attributes || order.user || {};

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

    return {
        id: String(d.id),
        documentId: attrs.documentId || d.documentId,
        orderId: order.publicId || (orderDocId ? `GE-${orderDocId}` : `GE-${attrs.order?.data?.id || attrs.order?.id}`),
        orderStrapiId: attrs.order?.data?.id || attrs.order?.id || null,
        orderDocumentId: orderDocId,
        type: order.priority >= 4 ? 'EXPRESS' : 'STANDARD',
        priority: order.priority || 3,
        state: (function() {
            let s = strapiStatusToCode(attrs.delivery_status) || DELIVERY_STATE.E08;
            if (!order || !order.id) return DELIVERY_STATE.E14; // Orfão / Pedido eliminado
            
            const oStatus = String(attrs.order?.data?.attributes?.order_status || attrs.order?.order_status || order.order_status || '').toUpperCase();
            if (['DELIVERED', 'S-11'].includes(oStatus) || oStatus.includes('ENTREGUE')) {
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
            'E-13': attrs.endTime || null,
        },
        confirmation: null,
        notes: attrs.notes || '',
        photos: [],
        timerStart: attrs.createdAt || null,
        chatHistory: Array.isArray(order.chatHistory) ? order.chatHistory : [],
        rating: order.rating || null,
    };
}

// ── Store ─────────────────────────────────────────────────────────
const saved = loadState();

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

export const shiftAvgRating = computed(() => {
    const r = store.shiftMetrics.ratingsReceived;
    if (r.length === 0) return store.profile.rating;
    return +(r.reduce((a, b) => a + b, 0) / r.length).toFixed(1);
});

export const courierMetrics = computed(() => {
    const sm = store.shiftMetrics;
    const all = [...store.deliveries, ...store.completedDeliveries];
    const completed = all.filter(d => d.state === 'E-13');
    return {
        totalDeliveries: completed.length + sm.failed,
        completedDeliveries: completed.length,
        inProgressDeliveries: store.deliveries.filter(d => !['E-13', 'E-14'].includes(d.state)).length,
        totalEarnings: sm.revenue || completed.reduce((s, d) => s + (d.costEuro || 0), 0),
        totalDistanceKm: sm.distanceKm || completed.reduce((s, d) => s + (d.pickup?.distance || 0) + (d.destination?.distance || 0), 0),
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
            state: strapiStatusToCode(courierStatus) || COURIER_STATE.E06,
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
            rating: (courierAttrs.totalDeliveries > 0) ? (courierAttrs.rating || 4.5) : 0,
            totalDeliveries: courierAttrs.totalDeliveries || 0,
            onTimePct: (courierAttrs.totalDeliveries > 0) ? (courierAttrs.onTimePct || 94) : 0,
            documentId: courier.documentId || null,
            profilePhotoUrl: profilePhotoUrl,
        };

        saveState();

        // 4. Presence defaults on app open + load deliveries
        store.activeDeliveryId = null; // will be repopulated by fetchDeliveries if active
        await setPausedOnAppOpen();
        await fetchDeliveries();

        return { success: true };
    } catch (err) {
        store.error = err.message;
        return { success: false, error: err.message };
    } finally {
        store.loading = false;
    }
}

export function logout() {
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

export async function fetchDeliveries() {
    if (!store.courierId) {
        store.deliveries = [];
        return;
    }

    store.loading = true;
    try {
        // Use the dedicated courier endpoint that validates the courier JWT directly.
        // The generic /deliveries endpoint silently returns empty because the courier
        // JWT (scope:'courier') is not recognized by Strapi's standard auth middleware.
        const res = await apiGet('/courier-estafetas/my-deliveries');
        
        // Sync local courier status with backend
        if (res.meta && res.meta.courier_status) {
            const serverCode = strapiStatusToCode(res.meta.courier_status);
            if (serverCode && store.profile.state !== serverCode) {
                store.profile.state = serverCode;
                saveState();
            }
        }
        
        const apiDeliveries = (res.data || []).map(d => mapDelivery(d));

        if (apiDeliveries.length > 0) {
            store.deliveries = apiDeliveries;
            
            // Lock the UI only when the courier has already accepted (E-09+).
            const inProgress = apiDeliveries.find(d => ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state));
            if (inProgress) {
                store.activeDeliveryId = inProgress.id;
            } else {
                store.activeDeliveryId = null;
            }
        } else {
            store.deliveries = [];
        }
    } catch (err) {
        console.warn('fetchDeliveries error:', err.message);
        if (store.deliveries.length === 0) store.deliveries = [];
    } finally {
        store.loading = false;
    }
}


export async function fetchCompletedDeliveries() {
    if (!store.courierId) return [];
    try {
        const res = await apiGet(`/deliveries?filters[delivery_status][$in][0]=${encodeURIComponent('E-13 Entrega Confirmada')}&filters[delivery_status][$in][1]=${encodeURIComponent('E-14 Entrega Impossível')}&filters[courier][documentId][$eq]=${store.profile.documentId || store.courierId}&populate[order][populate]=user&sort=endTime:desc&status=published`);
        const deliveries = (res.data || []).map(d => mapDelivery(d));
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

    // Update shift metrics
    store.shiftMetrics.completed++;
    store.shiftMetrics.revenue += d.costEuro || 0;
    store.shiftMetrics.distanceKm += (d.pickup.distance || 0) + (d.destination.distance || 0);
    // Rating real vem do cliente (FO), não deve ser simulado na PWA.

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

export async function togglePause() {
    const wasPaused = store.profile.state === COURIER_STATE.E05 || store.profile.state === COURIER_STATE.E07;
    const nextState = wasPaused ? COURIER_STATE.E06 : COURIER_STATE.E07;
    const nextStrapiStatus = wasPaused ? 'E-06 Online' : 'E-07 Em Pausa';
    const nextIsOnline = wasPaused;

    const prevState = store.profile.state;
    store.profile.state = nextState;
    saveState();

    if (store.profile.documentId) {
        try {
            await apiCourierSelfPut({ courier_status: nextStrapiStatus, isOnline: nextIsOnline });
        } catch (err) {
            store.profile.state = prevState;
            saveState();
            console.error('togglePause sync error:', err);
            throw err;
        }
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
        console.error('syncPresenceStatus error:', err);
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

// ── Lifecycle Hooks ───────────────────────────────────────────────
if (typeof window !== 'undefined') {
    const sendOfflineKeepAlive = () => {
        if (store.auth.loggedIn && store.profile.documentId) {
            const url = `${API_URL}/courier-estafetas/me`;
            const payload = JSON.stringify({
                data: { courier_status: 'E-05 Offline', isOnline: false }
            });
            store.profile.state = COURIER_STATE.E05;
            saveState();
            fetch(url, {
                method: 'PUT',
                headers: authHeaders(),
                body: payload,
                keepalive: true
            }).catch(() => {});
        }
    };
    window.addEventListener('beforeunload', sendOfflineKeepAlive);
    window.addEventListener('pagehide', sendOfflineKeepAlive);
}


// ── Actions: GPS Tracking (RNF02 — every 10s) ───────────────────

let gpsWatchId = null;
let gpsIntervalId = null;

export function startGpsTracking() {
    if (gpsWatchId !== null) return; // already tracking
    if (!('geolocation' in navigator)) {
        console.warn('Geolocation not available');
        return;
    }

    const handlePos = (pos) => {
        store.gpsCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    };

    const handleErr = (err) => {
        console.warn('High-accuracy GPS failed, falling back to low accuracy:', err.message);
        if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
        
        gpsWatchId = navigator.geolocation.watchPosition(
            handlePos,
            (e) => {
                console.warn('Low-accuracy GPS failed:', e.message);
                // Desktop development fallback: fake coordinate in Porto if completely failing
                if (store.gpsCoords.lat === 0 && store.gpsCoords.lng === 0) {
                    store.gpsCoords = { lat: 41.15, lng: -8.63 }; 
                }
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
        );
    };

    // Use watchPosition for continuous updates
    gpsWatchId = navigator.geolocation.watchPosition(
        handlePos,
        handleErr,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Send to Strapi via API every 30 seconds for persistence, but emit to Socket every 5 seconds for real-time tracking
    if (gpsIntervalId !== null) {
        clearInterval(gpsIntervalId);
    }
    
    gpsIntervalId = setInterval(() => {
        if (store.gpsCoords) {
            // Do not send or emit if coordinates are exactly 0 (uninitialized)
            if (store.gpsCoords.lat === 0 && store.gpsCoords.lng === 0) return;

            if (socket.connected) {
                // Emit a generic courier_gps_update that BO could listen to if needed (optional)
                socket.emit('courier_gps_update', {
                    courierId: store.courierId,
                    lat: store.gpsCoords.lat,
                    lng: store.gpsCoords.lng
                });
                
                // If on an active delivery, also emit to the order room so the FO client sees the live movement
                if (store.activeDeliveryId) {
                    const d = store.deliveries.find(x => x.id === store.activeDeliveryId);
                    if (d && d.orderDocumentId && ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state)) {
                        socket.emit('gps_update', {
                            room: d.orderDocumentId,
                            lat: store.gpsCoords.lat,
                            lng: store.gpsCoords.lng
                        });
                    }
                }
            }

            // Persist to DB occasionally (every 30s instead of 5s to reduce DB load)
            if (Date.now() % 30000 < 5000) {
                // ALWAYS update the courier's own model in the backend, even if they have no active delivery
                apiCourierPut(`/courier-estafetas/me`, {
                    data: {
                        lat: store.gpsCoords.lat,
                        lng: store.gpsCoords.lng,
                    }
                }).catch(err => console.warn('GPS sync error (me):', err.message));

                // Also update the delivery record if there's an active delivery
                if (store.activeDeliveryId) {
                    const d = store.deliveries.find(x => x.id === store.activeDeliveryId);
                    if (d && d.documentId && ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state)) {
                        apiCourierPut(`/courier-estafetas/deliveries/${d.documentId}`, {
                            data: {
                                courierLatitude: store.gpsCoords.lat,
                                courierLongitude: store.gpsCoords.lng,
                            }
                        }).catch(err => console.warn('GPS sync error (delivery):', err.message));
                    }
                }
            }
        }
    }, 5000);
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
    lastGpsCoords = null;
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
        socket.emit('chat_message', {
            room: orderDocumentId,
            message: newMessage,
        });

        return true;
    } catch (err) {
        console.error('Chat error:', err);
        return false;
    }
}

// ── Getters ──────────────────────────────────────────────────────

export function getDeliveryById(id) {
    return store.deliveries.find(d => d.id === id) 
        || store.completedDeliveries.find(d => d.id === id)
        || null;
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
    setPausedOnAppOpen();
    fetchDeliveries();
}

export const isSimulatingRoute = ref(false);
let simulationIntervalId = null;

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

export function stopSimulatedRoute() {
    if (simulationIntervalId) {
        clearInterval(simulationIntervalId);
        simulationIntervalId = null;
    }
    isSimulatingRoute.value = false;
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
                store.gpsCoords = { lat, lng };
                
                // The global gpsIntervalId will automatically pick up store.gpsCoords
                // and emit/persist it correctly without us doing it manually here.
                
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
