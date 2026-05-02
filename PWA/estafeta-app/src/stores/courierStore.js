import { reactive, computed, ref, watch } from 'vue';
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

    // Mapeamento extra para User/Cliente
    const userData = order.user?.data?.attributes || order.user?.attributes || order.user || {};

    return {
        id: String(d.id),
        documentId: attrs.documentId || d.documentId,
        orderId: order.publicId || `#ORD-${d.id}`,
        orderStrapiId: attrs.order?.data?.id || null,
        orderDocumentId: attrs.order?.data?.documentId || null,
        type: order.priority >= 4 ? 'EXPRESS' : 'STANDARD',
        priority: order.priority || 3,
        state: strapiStatusToCode(attrs.delivery_status) || DELIVERY_STATE.E08,
        pickup: {
            name: order.store_name || 'Continente Braga',
            address: order.pickupAddress || 'Braga Parque',
            lat: parseFloat(pickupLat),
            lng: parseFloat(pickupLng),
            distance: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
        },
        destination: {
            name: userData.fullName || userData.username || 'Cliente',
            address: order.deliveryAddress || '',
            phone: userData.phone || '',
            lat: parseFloat(destLat),
            lng: parseFloat(destLng),
            distance: parseFloat((Math.random() * 5 + 1).toFixed(1)),
        },
        // Extrair items da estrutura JSON ou Array
        items: order.items?.items || (Array.isArray(order.items) ? order.items : [{ name: 'GoGummies', qty: 1, unit: 'frasco' }]),
        weight: order.items?.weight || '0.5kg',
        size: order.items?.size || 'Médio',
        instructions: order.notes || '',
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
        chatHistory: order.chatHistory || [],
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

        // Build profile photo URL from docSelfie
        let profilePhotoUrl = null;
        const selfie = courierAttrs.docSelfie;
        if (selfie) {
            const selfieData = selfie.data?.attributes || selfie;
            const photoPath = selfieData?.url || selfieData?.formats?.thumbnail?.url || null;
            if (photoPath) {
                profilePhotoUrl = photoPath.startsWith('http') ? photoPath : `http://localhost:1337${photoPath}`;
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

        // 4. Load deliveries
        // Se a entrega foi concluída ou cancelada, limpamos o ID ativo
        if (['E-13', 'E-14'].includes(next)) {
            store.activeDeliveryId = null;
        }
        
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

        const courierId = store.profile.documentId || store.courierId;
        const idFilterKey = (typeof courierId === 'string' && courierId.length > 5) ? 'documentId' : 'id';
        
        // População simplificada para evitar erro 500 e trazer dados da Order + User
        const res = await apiGet(`/deliveries?filters[courier][${idFilterKey}][$eq]=${courierId}&populate[order][populate]=user&sort=createdAt:desc&status=published`);
        
        console.log('[fetchDeliveries] Resposta do Servidor:', res);

        const apiDeliveries = (res.data || []).map(d => mapDelivery(d));

        if (apiDeliveries.length > 0) {
            store.deliveries = apiDeliveries;
            
            // Set active delivery if any is assigned (including E-08)
            const inProgress = apiDeliveries.find(d => ['E-08', 'E-09', 'E-10', 'E-11', 'E-12'].includes(d.state));
            if (inProgress) {
                store.activeDeliveryId = inProgress.id;
                console.log('[fetchDeliveries] Entrega ativa detetada:', inProgress.id);
            }
        } else {
            // Only show seeds if NOT logged in (guest mode demo)
            if (!store.auth.loggedIn) {
                store.deliveries = seedDeliveries();
            } else {
                store.deliveries = [];
            }
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
    if (!delivery.documentId) return;
    try {
        const payload = {
            data: {
                delivery_status: STATUS_MAP[newState],
                ...extraData,
            }
        };
        await apiPut(`/deliveries/${delivery.documentId}`, payload);
        // O estado da Order é agora sincronizado automaticamente pelo backend (Lifecycle Hook)
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

    if (next === 'E-14') {
        store.activeDeliveryId = null;
    }
    
    await fetchDeliveries();
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
    stopGpsTracking(); // Stop GPS when delivery completed
    saveState();

    // Sync to Strapi
    if (d.documentId) {
        try {
            const extraData = {
                endTime: now,
                confirmationGps: confirmation.gps || confirmation.location || null,
                notes: d.notes || '',
            };

            // Upload photo (always required)
            if (confirmation.photo) {
                try {
                    const blob = await fetch(confirmation.photo).then(r => r.blob());
                    const file = new File([blob], 'confirmation.jpg', { type: 'image/jpeg' });
                    const photoId = await apiUploadFile(file);
                    if (photoId) extraData.confirmationPhoto = photoId;
                } catch (e) { console.warn('Photo upload failed:', e); }
            }

            // Save signature as base64 string (always required)
            if (confirmation.signature) {
                extraData.confirmationSignature = confirmation.signature;
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
    stopGpsTracking(); // Stop GPS when delivery marked impossible
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

// ── Actions: Pause / Online Toggle (E-07 / E-06) ────────────────

export async function togglePause() {
    const isPaused = store.profile.state === COURIER_STATE.E05 || store.profile.state === 'E-07';
    const newState = isPaused ? COURIER_STATE.E06 : 'E-07';
    const newStrapiStatus = isPaused ? 'E-06 Online' : 'E-05 Offline';
    const newIsOnline = isPaused;

    store.profile.state = newState;
    saveState();

    // Sync to Strapi
    if (store.profile.documentId) {
        try {
            await apiPut(`/courier-estafetas/${store.profile.documentId}`, {
                data: { courier_status: newStrapiStatus, isOnline: newIsOnline }
            });
        } catch (err) {
            console.error('togglePause sync error:', err);
        }
    }
    return newState;
}

export function isPaused() {
    return store.profile.state === 'E-07' || store.profile.state === COURIER_STATE.E05;
}

// ── Actions: GPS Tracking (RNF02 — every 10s) ───────────────────

let gpsWatchId = null;
let gpsIntervalId = null;
let lastGpsCoords = null;

export function startGpsTracking() {
    if (gpsWatchId !== null) return; // already tracking
    if (!('geolocation' in navigator)) {
        console.warn('Geolocation not available');
        return;
    }

    // Use watchPosition for continuous updates
    gpsWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            lastGpsCoords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            };
        },
        (err) => console.warn('GPS error:', err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    // Send to Strapi every 10 seconds
    gpsIntervalId = setInterval(() => {
        if (lastGpsCoords && store.activeDeliveryId) {
            const d = store.deliveries.find(x => x.id === store.activeDeliveryId);
            if (d && d.documentId && ['E-09', 'E-10', 'E-11', 'E-12'].includes(d.state)) {
                apiPut(`/deliveries/${d.documentId}`, {
                    data: {
                        courierLatitude: lastGpsCoords.lat,
                        courierLongitude: lastGpsCoords.lng,
                    }
                }).catch(err => console.warn('GPS sync error:', err.message));
            }
        }
    }, 10000);
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
                await apiPut(`/orders/${d.orderDocumentId}`, {
                    data: { order_status: 'S-06 Aguardando Aceitação' }
                });
            }
        } catch (err) {
            console.error('declineDeliveryTimeout sync error:', err);
        }
    }
    return true;
}

// ── Actions: Profile (Read-only — changes via request) ───────────

export async function submitDataChangeRequest({ field, newValue, reason }) {
    if (!store.profile.documentId) {
        throw new Error('Perfil não encontrado. Faz login novamente.');
    }

    // Build the change request object
    const changeRequest = {
        field,
        newValue,
        reason,
        courierName: store.profile.name,
        courierPhone: store.profile.phone,
        submittedAt: new Date().toISOString(),
        status: 'pending',
    };

    // Save to Strapi as a JSON field on the courier
    try {
        await apiPut(`/courier-estafetas/${store.profile.documentId}`, {
            data: {
                dataChangeRequest: changeRequest,
            }
        });
    } catch (err) {
        console.error('Data change request error:', err);
        throw new Error('Não foi possível enviar o pedido. Tenta novamente.');
    }

    return true;
}

export async function sendDeliveryChatMessage(orderDocumentId, text) {
    if (!orderDocumentId) return false;
    try {
        const orderRes = await apiGet(`/orders/${orderDocumentId}`);
        const order = orderRes.data?.attributes || orderRes.data || {};
        const currentHistory = order.chatHistory || [];
        
        currentHistory.push({
            sender: 'courier',
            text,
            time: new Date().toISOString()
        });

        await apiPut(`/orders/${orderDocumentId}`, {
            data: { chatHistory: currentHistory }
        });
        
        const active = store.deliveries.find(d => d.orderDocumentId === orderDocumentId);
        if (active) active.chatHistory = currentHistory;

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

/** Waze deep link */
export function wazeLink(lat, lng) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

// ── Init: load deliveries if already logged in ───────────────────
if (store.auth.loggedIn && store.courierId) {
    fetchDeliveries();
}
