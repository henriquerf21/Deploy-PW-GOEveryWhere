import { reactive, computed, ref } from 'vue';
import { DELIVERY_STATE, COURIER_STATE, NEXT_STATE } from '../constants.js';

// ── Config ───────────────────────────────────────────────────────
const API_URL = 'http://localhost:1337/api';
const STORAGE_KEY = 'ge-estafeta';

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

// ── Map Strapi delivery+order to local format ────────────────────
function mapDelivery(d) {
    const attrs = d.attributes || d;
    const order = attrs.order?.data?.attributes || attrs.order || {};
    const items = order.items || [{ name: 'GoGummies', qty: 1, unit: 'frasco' }];

    // Calculate distances from courier position (rough estimate)
    const pickupLat = order.storeLatitude || 41.15;
    const pickupLng = order.storeLongitude || -8.63;
    const destLat = order.deliveryLatitude || 41.16;
    const destLng = order.deliveryLongitude || -8.62;

    return {
        id: String(d.id),
        documentId: attrs.documentId || d.documentId,
        orderId: order.documentId ? `#ORD-${d.id}` : `#ORD-${d.id}`,
        orderStrapiId: attrs.order?.data?.id || null,
        orderDocumentId: attrs.order?.data?.documentId || null,
        type: order.is_urgent ? 'EXPRESS' : 'STANDARD',
        priority: order.priority || 3,
        state: strapiStatusToCode(attrs.delivery_status) || DELIVERY_STATE.E08,
        pickup: {
            name: order.store_name || 'Continente',
            address: order.deliveryAddress || '',
            lat: parseFloat(pickupLat),
            lng: parseFloat(pickupLng),
            distance: parseFloat((Math.random() * 10 + 1).toFixed(1)),
        },
        destination: {
            name: order.user?.data?.attributes?.firstName || order.user?.data?.attributes?.username || 'Cliente',
            address: order.deliveryAddress || '',
            phone: '',
            lat: parseFloat(destLat),
            lng: parseFloat(destLng),
            distance: parseFloat((Math.random() * 15 + 2).toFixed(1)),
        },
        items: Array.isArray(items) ? items : [{ name: 'GoGummies', qty: 1, unit: 'frasco' }],
        weight: '0.3kg',
        size: 'Médio',
        instructions: '',
        costEuro: parseFloat(order.total_price) || 4.90,
        etaMinutes: order.estimatedTime || 30,
        timestamps: {
            'E-08': attrs.createdAt || null,
            'E-09': attrs.startTime || null,
        },
        confirmation: null,
        notes: attrs.notes || '',
        photos: [],
        timerStart: attrs.createdAt || null,
    };
}

// ── Seed fallback (when API is unreachable) ──────────────────────
function seedDeliveries() {
    return [
        {
            id: 'GE-24100', orderId: '#ORD-2850', type: 'EXPRESS', priority: 5,
            state: DELIVERY_STATE.E08,
            pickup: { name: 'Continente Braga', address: 'Rua 25 de Abril 1090, 4710-913 Braga', lat: 41.5503, lng: -8.4200, distance: 3.2 },
            destination: { name: 'Maria Santos', address: 'Rua do Carmo 45, 4050-164 Braga', phone: '+351 912 345 678', lat: 41.5450, lng: -8.4260, distance: 5.1 },
            items: [{ name: 'GoGummies Original', qty: 4, unit: 'frascos' }],
            weight: '0.4kg', size: 'Médio', instructions: 'Tocar à campainha 2 vezes.',
            costEuro: 6.50, etaMinutes: 25, timestamps: {}, confirmation: null, notes: '', photos: [], timerStart: null,
        },
        {
            id: 'GE-24101', orderId: '#ORD-2851', type: 'STANDARD', priority: 3,
            state: DELIVERY_STATE.E08,
            pickup: { name: 'Continente Gaia', address: 'Av. República 320, 4430-190 Vila Nova de Gaia', lat: 41.1235, lng: -8.6120, distance: 7.8 },
            destination: { name: 'João Costa', address: 'Rua Heroísmo 90, 4300-259 Porto', phone: '+351 934 000 002', lat: 41.1480, lng: -8.5980, distance: 12.4 },
            items: [{ name: 'GoGummies Boost', qty: 2, unit: 'frascos' }],
            weight: '0.3kg', size: 'Pequeno', instructions: '',
            costEuro: 4.90, etaMinutes: 35, timestamps: {}, confirmation: null, notes: '', photos: [], timerStart: null,
        },
    ];
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
        // 1. Find courier by phone
        let couriersRes;
        try {
            couriersRes = await apiGet(`/courier-estafetas?filters[phone][$eq]=${encodeURIComponent(countryCode + phone)}&populate=*&status=published`);
        } catch (err) {
            throw new Error('Não foi possível verificar os dados (Servidor offline ou sem permissões)');
        }
        
        const couriers = couriersRes.data || [];

        if (couriers.length === 0) {
            throw new Error('Estafeta não registado. Verifica o número de telemóvel.');
        }

        const courier = couriers[0];
        const courierAttrs = courier.attributes || courier;
        
        // Validate password
        if (courierAttrs.password !== password) {
            throw new Error('A password está incorreta.');
        }

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
        store.auth = { loggedIn: true, phone, countryCode, token: null };
        store.courierId = courier.id || courier.documentId;

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
            rating: courierAttrs.rating || 4.5,
            totalDeliveries: courierAttrs.totalDeliveries || 0,
            onTimePct: 94,
            documentId: courier.documentId || null,
        };

        saveState();

        // 4. Load deliveries
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
    store.activeDeliveryId = null;
    store.deliveries = [];
    store.completedDeliveries = [];
    saveState();
}

// ── Actions: Deliveries ──────────────────────────────────────────

export async function fetchDeliveries() {
    if (!store.courierId) {
        store.deliveries = seedDeliveries();
        return;
    }

    store.loading = true;
    try {
        // Fetch active deliveries for this courier
        const activeStatuses = [
            'E-08 Pedido Recebido',
            'E-09 A Caminho da Loja',
            'E-10 Na Loja / Em Recolha',
            'E-11 Em Trânsito para Cliente',
            'E-12 No Destino',
        ];

        const filters = activeStatuses
            .map((s, i) => `filters[delivery_status][$in][${i}]=${encodeURIComponent(s)}`)
            .join('&');

        const res = await apiGet(`/deliveries?${filters}&filters[courier][documentId][$eq]=${store.profile.documentId || store.courierId}&populate[order][populate]=user&sort=createdAt:desc&status=published`);

        const apiDeliveries = (res.data || []).map(d => mapDelivery(d));

        if (apiDeliveries.length > 0) {
            store.deliveries = apiDeliveries;
            // Set active delivery if any in progress
            const inProgress = apiDeliveries.find(d => !['E-08', 'E-13', 'E-14'].includes(d.state));
            if (inProgress) store.activeDeliveryId = inProgress.id;
        } else {
            // Fallback to seeds when no API deliveries exist
            store.deliveries = seedDeliveries();
        }
    } catch (err) {
        console.warn('fetchDeliveries fallback to seeds:', err.message);
        if (store.deliveries.length === 0) {
            store.deliveries = seedDeliveries();
        }
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
    if (!delivery.documentId) return; // seed delivery, skip API
    try {
        const payload = {
            data: {
                delivery_status: STATUS_MAP[newState],
                ...extraData,
            }
        };
        await apiPut(`/deliveries/${delivery.documentId}`, payload);

        // Also update order status
        if (delivery.orderDocumentId && ORDER_STATUS_MAP[newState]) {
            await apiPut(`/orders/${delivery.orderDocumentId}`, {
                data: { order_status: ORDER_STATUS_MAP[newState] }
            });
        }
    } catch (err) {
        console.error('Error syncing state to Strapi:', err.message);
    }
}

export async function acceptDelivery(deliveryId) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E08) return false;

    const now = new Date().toISOString();
    d.state = DELIVERY_STATE.E09;
    d.timestamps['E-08'] = d.timerStart || now;
    d.timestamps['E-09'] = now;
    store.activeDeliveryId = deliveryId;
    saveState();

    await updateDeliveryOnStrapi(d, 'E-09', { startTime: now });
    return true;
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

    await updateDeliveryOnStrapi(d, next);
    return true;
}

export async function confirmDelivery(deliveryId, confirmation) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E12) return false;

    const now = new Date().toISOString();
    d.state = DELIVERY_STATE.E13;
    d.timestamps['E-13'] = now;
    d.confirmation = confirmation;

    // Update shift metrics
    store.shiftMetrics.completed++;
    store.shiftMetrics.revenue += d.costEuro || 0;
    store.shiftMetrics.distanceKm += (d.pickup.distance || 0) + (d.destination.distance || 0);
    const rating = Math.random() > 0.2 ? 5 : 4;
    store.shiftMetrics.ratingsReceived.push(rating);

    store.completedDeliveries.push({ ...d });
    store.activeDeliveryId = null;
    saveState();

    // Sync to Strapi
    if (d.documentId) {
        try {
            const extraData = {
                endTime: now,
                confirmationGps: confirmation.gps || confirmation.location || null,
                notes: d.notes || '',
            };

            // Upload photo if present
            if (confirmation.photo && confirmation.method === 'photo') {
                try {
                    const blob = await fetch(confirmation.photo).then(r => r.blob());
                    const file = new File([blob], 'confirmation.jpg', { type: 'image/jpeg' });
                    const photoId = await apiUploadFile(file);
                    if (photoId) extraData.confirmationPhoto = photoId;
                } catch (e) { console.warn('Photo upload failed:', e); }
            }

            // Save signature as base64 string
            if (confirmation.signature && confirmation.method === 'signature') {
                extraData.confirmationSignature = confirmation.signature;
            }

            // Save QR Code
            if (confirmation.qrCode && confirmation.method === 'qrcode') {
                extraData.confirmationQrCode = confirmation.qrCode;
            }

            await updateDeliveryOnStrapi(d, 'E-13', extraData);

            // Update courier totalDeliveries
            if (store.profile.documentId) {
                try {
                    await apiPut(`/courier-estafetas/${store.profile.documentId}`, {
                        data: { totalDeliveries: (store.profile.totalDeliveries || 0) + 1 }
                    });
                    store.profile.totalDeliveries = (store.profile.totalDeliveries || 0) + 1;
                } catch (e) { /* ignore */ }
            }
        } catch (err) {
            console.error('confirmDelivery sync error:', err);
        }
    }

    return true;
}

export async function markDeliveryImpossible(deliveryId, reason, photo) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d) return false;

    const now = new Date().toISOString();
    d.state = DELIVERY_STATE.E14;
    d.timestamps['E-14'] = now;
    d.confirmation = { type: 'impossible', reason, photo };

    store.shiftMetrics.failed++;
    store.completedDeliveries.push({ ...d });
    store.activeDeliveryId = null;
    saveState();

    await updateDeliveryOnStrapi(d, 'E-14', { endTime: now, notes: reason });
    return true;
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

// ── Actions: Profile ─────────────────────────────────────────────

export async function updateProfile(patch) {
    if (!patch || typeof patch !== 'object') return false;
    const p = store.profile;

    if (patch.name != null) p.name = String(patch.name).trim() || p.name;
    if (patch.email != null) p.email = String(patch.email).trim() || p.email;
    if (patch.phone != null) p.phone = String(patch.phone).trim() || p.phone;
    if (patch.address != null) p.address = String(patch.address).trim() || p.address;
    if (patch.birthDate != null) p.birthDate = String(patch.birthDate).trim() || p.birthDate;
    if (patch.iban != null) p.iban = String(patch.iban).trim() || p.iban;
    if (patch.zone != null) p.zone = String(patch.zone).trim() || p.zone;

    if (patch.vehicle && typeof patch.vehicle === 'object') {
        Object.assign(p.vehicle, patch.vehicle);
    }

    saveState();

    // Sync to Strapi
    if (p.documentId) {
        try {
            await apiPut(`/courier-estafetas/${p.documentId}`, {
                data: {
                    fullName: p.name,
                    email: p.email,
                    phone: p.phone,
                    address: p.address,
                    iban: p.iban,
                    zone: p.zone,
                    vehicleType: p.vehicle.type,
                    vehicleBrand: p.vehicle.brand,
                    vehicleModel: p.vehicle.model,
                    vehicleColor: p.vehicle.color,
                    vehiclePlate: p.vehicle.plate,
                }
            });
        } catch (err) {
            console.error('Profile sync error:', err);
        }
    }

    return true;
}

// ── Getters ──────────────────────────────────────────────────────

export function getDeliveryById(id) {
    return store.deliveries.find(d => d.id === id)
        || store.completedDeliveries.find(d => d.id === id)
        || null;
}

/** Waze deep link */
export function wazeLink(lat, lng) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

// ── Init: load deliveries if already logged in ───────────────────
if (store.auth.loggedIn && store.courierId) {
    fetchDeliveries();
}
