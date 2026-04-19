/** Courier delivery states (PWA-side, E-07 → E-14) */
export const DELIVERY_STATE = {
    E07: 'E-07', // Em Pausa
    E08: 'E-08', // Pedido Recebido
    E09: 'E-09', // A Caminho da Loja
    E10: 'E-10', // Na Loja / Em Recolha
    E11: 'E-11', // Em Trânsito para Cliente
    E12: 'E-12', // No Destino
    E13: 'E-13', // Entrega Confirmada
    E14: 'E-14', // Entrega Impossível
};

export const deliveryStateLabels = {
    'E-07': 'Em Pausa',
    'E-08': 'Pedido Recebido',
    'E-09': 'A Caminho da Loja',
    'E-10': 'Na Loja / Em Recolha',
    'E-11': 'Em Trânsito para Cliente',
    'E-12': 'No Destino',
    'E-13': 'Entrega Confirmada',
    'E-14': 'Entrega Impossível',
};

export const deliveryStateColors = {
    'E-07': 'var(--ge-status-pause)',
    'E-08': 'var(--ge-status-pending)',
    'E-09': 'var(--ge-status-active)',
    'E-10': 'var(--ge-status-transit)',
    'E-11': 'var(--ge-status-transit)',
    'E-12': 'var(--ge-status-arrived)',
    'E-13': 'var(--ge-status-done)',
    'E-14': 'var(--ge-status-error)',
};

/** SVG icon snippets (20×20, stroke-based) */
const _i = (d) => `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${d}</svg>`;

export const SVG = {
    package: _i('<path d="M16.5 9.4l-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>'),
    bike: _i('<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>'),
    store: _i('<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>'),
    truck: _i('<rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
    mapPin: _i('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>'),
    check: _i('<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'),
    xCircle: _i('<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>'),
    clock: _i('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    navigation: _i('<polygon points="3 11 22 2 13 21 11 13 3 11"/>'),
    user: _i('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    phone: _i('<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>'),
    message: _i('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'),
    fileText: _i('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>'),
    paperclip: _i('<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>'),
    eye: _i('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: _i('<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'),
    camera: _i('<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>'),
    edit3: _i('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
    qrCode: _i('<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="4" height="4"/><path d="M22 14h-4v4"/><path d="M22 22h-4v-4"/>'),
    barChart: _i('<path d="M18 20V10M12 20V4M6 20v-6"/>'),
    wallet: _i('<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>'),
    road: _i('<path d="M18 6H5a2 2 0 00-2 2v9a2 2 0 002 2h13l4-6.5L18 6z"/>'),
    star: _i('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
    flame: _i('<path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>'),
    checkCircle: _i('<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'),
};

export const deliveryStateIcons = {
    'E-08': SVG.package,
    'E-09': SVG.bike,
    'E-10': SVG.store,
    'E-11': SVG.truck,
    'E-12': SVG.mapPin,
    'E-13': SVG.check,
    'E-14': SVG.xCircle,
};

/** Courier admin states (from Back-Office, E-01 → E-06) */
export const COURIER_STATE = {
    E01: 'E-01', // Pendente Verificação
    E02: 'E-02', // Verificado
    E03: 'E-03', // Rejeitado
    E04: 'E-04', // Suspenso
    E05: 'E-05', // Offline
    E06: 'E-06', // Online — Disponível
};

export const courierStateLabels = {
    'E-01': 'Pendente Verificação',
    'E-02': 'Verificado',
    'E-03': 'Rejeitado',
    'E-04': 'Suspenso',
    'E-05': 'Offline',
    'E-06': 'Disponível',
};

/** State flow: which state comes next */
export const NEXT_STATE = {
    'E-08': 'E-09',
    'E-09': 'E-10',
    'E-10': 'E-11',
    'E-11': 'E-12',
    'E-12': 'E-13', // or E-14 for impossible
};

/** CTA labels per state */
export const STATE_CTA = {
    'E-08': 'Aceitar Entrega',
    'E-09': 'Iniciar recolha',
    'E-10': 'Recolha feita — Iniciar trânsito',
    'E-11': 'Cheguei ao destino',
    'E-12': 'Confirmar entrega',
};

/** Priority labels */
export const PRIORITY_LABELS = {
    1: 'Baixa',
    2: 'Normal',
    3: 'Normal',
    4: 'Alta',
    5: 'Urgente',
};

export const PRIORITY_BADGE_CLASS = {
    1: 'badge-low',
    2: 'badge-low',
    3: 'badge-normal',
    4: 'badge-high',
    5: 'badge-urgent',
};

/** Zones */
export const ZONES = [
    'Porto Centro',
    'Matosinhos',
    'Vila Nova de Gaia',
    'Maia',
    'Gondomar',
    'Braga',
    'Guimarães',
];

/** Country codes for login */
export const COUNTRY_CODES = [
    { code: '+351', label: 'PT' },
    { code: '+34', label: 'ES' },
    { code: '+33', label: 'FR' },
    { code: '+44', label: 'UK' },
    { code: '+49', label: 'DE' },
];

/** Vehicle types */
export const VEHICLE_TYPES = ['Mota', 'Carro', 'Bicicleta', 'Bicicleta Elétrica', 'Scooter Elétrica', 'A pé'];
