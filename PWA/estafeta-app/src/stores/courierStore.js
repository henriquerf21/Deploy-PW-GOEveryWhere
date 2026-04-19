import { reactive, computed } from 'vue';
import { DELIVERY_STATE, COURIER_STATE, NEXT_STATE } from '../constants.js';

const STORAGE_KEY = 'ge-estafeta';

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
        }));
    } catch { /* ignore */ }
}

/** Demo deliveries seed */
function seedDeliveries() {
    return [
        {
            id: 'GE-24100',
            orderId: '#ORD-2850',
            type: 'EXPRESS',
            priority: 5,
            state: DELIVERY_STATE.E08,
            pickup: {
                name: 'Continente Braga',
                address: 'Rua 25 de Abril 1090, 4710-913 Braga',
                lat: 41.5503, lng: -8.4200,
                distance: 3.2,
            },
            destination: {
                name: 'Maria Santos',
                address: 'Rua do Carmo 45, 4050-164 Braga',
                phone: '+351 912 345 678',
                lat: 41.5450, lng: -8.4260,
                distance: 5.1,
            },
            items: [
                { name: 'GoGummies Original', qty: 4, unit: 'frascos' },
            ],
            weight: '0.4kg',
            size: 'Médio',
            instructions: 'Tocar à campainha 2 vezes. Portão com código 1234#.',
            costEuro: 6.50,
            etaMinutes: 25,
            timestamps: {},
            confirmation: null,
            notes: '',
            photos: [],
            timerStart: null,
        },
        {
            id: 'GE-24101',
            orderId: '#ORD-2851',
            type: 'STANDARD',
            priority: 3,
            state: DELIVERY_STATE.E08,
            pickup: {
                name: 'Continente Gaia',
                address: 'Av. República 320, 4430-190 Vila Nova de Gaia',
                lat: 41.1235, lng: -8.6120,
                distance: 7.8,
            },
            destination: {
                name: 'João Costa',
                address: 'Rua Heroísmo 90, 4300-259 Porto',
                phone: '+351 934 000 002',
                lat: 41.1480, lng: -8.5980,
                distance: 12.4,
            },
            items: [
                { name: 'GoGummies Boost', qty: 2, unit: 'frascos' },
                { name: 'GoGummies Night', qty: 1, unit: 'frasco' },
            ],
            weight: '0.3kg',
            size: 'Pequeno',
            instructions: '',
            costEuro: 4.90,
            etaMinutes: 35,
            timestamps: {},
            confirmation: null,
            notes: '',
            photos: [],
            timerStart: null,
        },
        {
            id: 'GE-24102',
            orderId: '#ORD-2852',
            type: 'STANDARD',
            priority: 2,
            state: DELIVERY_STATE.E08,
            pickup: {
                name: 'Continente Matosinhos',
                address: 'Rua Brito Capelo 220, 4450-072 Matosinhos',
                lat: 41.1850, lng: -8.6900,
                distance: 15.3,
            },
            destination: {
                name: 'Ana Ribeiro',
                address: 'Av. Brasil 44, 4150-150 Porto',
                phone: '+351 965 000 003',
                lat: 41.1600, lng: -8.6700,
                distance: 18.0,
            },
            items: [
                { name: 'GoGummies Original', qty: 6, unit: 'frascos' },
            ],
            weight: '0.6kg',
            size: 'Grande',
            instructions: 'Deixar na portaria se não atender. Nome: Ana.',
            costEuro: 5.20,
            etaMinutes: 40,
            timestamps: {},
            confirmation: null,
            notes: '',
            photos: [],
            timerStart: null,
        },
        {
            id: 'GE-24103',
            orderId: '#ORD-2853',
            type: 'EXPRESS',
            priority: 4,
            state: DELIVERY_STATE.E08,
            pickup: {
                name: 'Continente Gaia',
                address: 'Av. República 320, 4430-190 Vila Nova de Gaia',
                lat: 41.1235, lng: -8.6120,
                distance: 2.1,
            },
            destination: {
                name: 'Pedro Almeida',
                address: 'Rua Cândido dos Reis 15, 4400-070 Gaia',
                phone: '+351 918 765 432',
                lat: 41.1310, lng: -8.6050,
                distance: 4.5,
            },
            items: [
                { name: 'GoGummies Boost', qty: 3, unit: 'frascos' },
            ],
            weight: '0.3kg',
            size: 'Pequeno',
            instructions: 'Entrega urgente — cliente premium.',
            costEuro: 8.00,
            etaMinutes: 15,
            timestamps: {},
            confirmation: null,
            notes: '',
            photos: [],
            timerStart: null,
        },
    ];
}

export const store = reactive({
    auth: {
        loggedIn: false,
        phone: '',
        countryCode: '+351',
    },
    profile: {
        name: 'Miguel Santos',
        phone: '+351 910 100 201',
        email: 'm.santos@mail.pt',
        birthDate: '1992-05-14',
        address: 'Rua da Alegria 12, Porto',
        iban: 'PT50 0002 0123 12345678901 45',
        zone: 'Porto Centro',
        state: COURIER_STATE.E06,
        vehicle: {
            type: 'Mota',
            brand: 'Honda',
            model: 'PCX 125',
            color: 'Cinzento',
            plate: 'AB-12-CD',
        },
        docs: {
            cc: true,
            license: true,
            insurance: true,
        },
        rating: 4.7,
        totalDeliveries: 420,
        onTimePct: 94,
    },
    filters: {
        type: 'all', // 'all' | 'STANDARD' | 'EXPRESS'
        maxPickupDist: 50,
        maxDeliveryDist: 50,
        maxTime: 120,
        zone: 'all',
    },
    deliveries: [],
    completedDeliveries: [],
    activeDeliveryId: null,
    shiftActive: false,
    shiftMetrics: {
        revenue: 0,
        completed: 0,
        failed: 0,
        distanceKm: 0,
        ratingsReceived: [],
    },
    // Computed-like getters for UI
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
            rating: this.profile.rating,
            onTimeRate: this.profile.onTimePct,
        };
    },
});

// Init
const saved = loadState();
if (saved) {
    if (saved.auth) Object.assign(store.auth, saved.auth);
    if (saved.profile) Object.assign(store.profile, saved.profile);
    if (saved.filters) Object.assign(store.filters, saved.filters);
    if (saved.shiftMetrics) Object.assign(store.shiftMetrics, saved.shiftMetrics);
}
store.deliveries = seedDeliveries();

/** Computed: filtered deliveries for list */
export const filteredDeliveries = computed(() => {
    return store.deliveries.filter(d => {
        if (d.state !== DELIVERY_STATE.E08) return false; // Only show pending
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

function guessZone(address) {
    const a = (address || '').toLowerCase();
    if (a.includes('porto')) return 'Porto Centro';
    if (a.includes('matosinhos')) return 'Matosinhos';
    if (a.includes('gaia')) return 'Vila Nova de Gaia';
    if (a.includes('maia')) return 'Maia';
    if (a.includes('gondomar')) return 'Gondomar';
    if (a.includes('braga')) return 'Braga';
    if (a.includes('guimarães') || a.includes('guimaraes')) return 'Guimarães';
    return null;
}

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

/** Aggregated courier metrics for the MetricsView */
export const courierMetrics = computed(() => {
    const sm = store.shiftMetrics;
    const all = [...store.deliveries, ...store.completedDeliveries];
    const completed = all.filter(d => d.state === 'E-13');
    const inProgress = store.deliveries.filter(d => !['E-13', 'E-14'].includes(d.state));
    return {
        totalDeliveries: completed.length + sm.failed,
        completedDeliveries: completed.length,
        inProgressDeliveries: inProgress.length,
        totalEarnings: sm.revenue || completed.reduce((s, d) => s + (d.costEuro || 0), 0),
        totalDistanceKm: sm.distanceKm || completed.reduce((s, d) => s + (d.pickup?.distance || 0) + (d.destination?.distance || 0), 0),
        avgRating: shiftAvgRating.value,
    };
});

/** Actions */

export function login(phone, countryCode, _password) {
    store.auth.loggedIn = true;
    store.auth.phone = phone;
    store.auth.countryCode = countryCode;
    saveState();
    return true;
}

export function logout() {
    store.auth.loggedIn = false;
    store.activeDeliveryId = null;
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

export function updateFilters(patch) {
    Object.assign(store.filters, patch);
    saveState();
}

export function updateProfile(patch) {
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
        p.vehicle.type = patch.vehicle.type != null ? String(patch.vehicle.type).trim() || p.vehicle.type : p.vehicle.type;
        p.vehicle.brand = patch.vehicle.brand != null ? String(patch.vehicle.brand).trim() : p.vehicle.brand;
        p.vehicle.model = patch.vehicle.model != null ? String(patch.vehicle.model).trim() : p.vehicle.model;
        p.vehicle.color = patch.vehicle.color != null ? String(patch.vehicle.color).trim() : p.vehicle.color;
        p.vehicle.plate = patch.vehicle.plate != null ? String(patch.vehicle.plate).trim() : p.vehicle.plate;
    }

    saveState();
    return true;
}

export function acceptDelivery(deliveryId) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E08) return false;
    d.state = DELIVERY_STATE.E09;
    d.timestamps['E-08'] = d.timerStart || new Date().toISOString();
    d.timestamps['E-09'] = new Date().toISOString();
    store.activeDeliveryId = deliveryId;
    saveState();
    return true;
}

export function advanceDeliveryState(deliveryId) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d) return false;
    const next = NEXT_STATE[d.state];
    if (!next || next === 'E-13') return false; // E-13 handled by confirmDelivery
    d.state = next;
    d.timestamps[next] = new Date().toISOString();
    saveState();
    return true;
}

export function confirmDelivery(deliveryId, confirmation) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d || d.state !== DELIVERY_STATE.E12) return false;
    d.state = DELIVERY_STATE.E13;
    d.timestamps['E-13'] = new Date().toISOString();
    d.confirmation = confirmation;

    // Update metrics
    store.shiftMetrics.completed++;
    store.shiftMetrics.revenue += d.costEuro || 0;
    store.shiftMetrics.distanceKm += (d.pickup.distance || 0) + (d.destination.distance || 0);
    // Simulate a rating
    const rating = Math.random() > 0.2 ? 5 : 4;
    store.shiftMetrics.ratingsReceived.push(rating);

    // Move to completed
    store.completedDeliveries.push({ ...d });
    store.activeDeliveryId = null;
    saveState();
    return true;
}

export function markDeliveryImpossible(deliveryId, reason, photo) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d) return false;
    d.state = DELIVERY_STATE.E14;
    d.timestamps['E-14'] = new Date().toISOString();
    d.confirmation = { type: 'impossible', reason, photo };

    store.shiftMetrics.failed++;
    store.completedDeliveries.push({ ...d });
    store.activeDeliveryId = null;
    saveState();
    return true;
}

export function addDeliveryNotes(deliveryId, notes, photos) {
    const d = store.deliveries.find(x => x.id === deliveryId);
    if (!d) return false;
    d.notes = notes;
    if (photos && photos.length) d.photos = [...d.photos, ...photos];
    saveState();
    return true;
}

export function getDeliveryById(id) {
    return store.deliveries.find(d => d.id === id) || store.completedDeliveries.find(d => d.id === id) || null;
}

/** Waze deep link */
export function wazeLink(lat, lng) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}
