/** Estados de pedido / encomenda (Centro Logístico) */
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  INFO_REQUESTED: 'INFO_REQUESTED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  ASSIGNED: 'ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
};

export const orderStatusLabels = {
  [ORDER_STATUS.PENDING]: 'Pendente aprovação',
  [ORDER_STATUS.INFO_REQUESTED]: 'Info adicional solicitada',
  [ORDER_STATUS.REJECTED]: 'Rejeitado',
  [ORDER_STATUS.APPROVED]: 'Aprovado',
  [ORDER_STATUS.ASSIGNED]: 'Estafeta atribuído',
  [ORDER_STATUS.IN_TRANSIT]: 'Em trânsito',
  [ORDER_STATUS.DELIVERED]: 'Entregue',
};

/** RF: tipo de pedido */
export const ORDER_TYPES = {
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
  SCHEDULED: 'SCHEDULED',
  B2B: 'B2B',
};

export const orderTypeLabels = {
  [ORDER_TYPES.STANDARD]: 'Standard',
  [ORDER_TYPES.EXPRESS]: 'Expresso',
  [ORDER_TYPES.SCHEDULED]: 'Agendada',
  [ORDER_TYPES.B2B]: 'B2B',
};

export const ZONES = ['Porto Centro', 'Matosinhos', 'Vila Nova de Gaia', 'Maia', 'Gondomar', 'Braga', 'Outro'];

export const priorityLabels = {
  1: '1 — Baixa',
  2: '2',
  3: '3 — Normal',
  4: '4 — Alta',
  5: '5 — Urgente',
};

/** Estados do estafeta (admin) RF */
export const COURIER_STATE = {
  E01: 'E-01',
  E02: 'E-02',
  E03: 'E-03',
  E04: 'E-04',
  E05: 'E-05',
  E06: 'E-06',
};

export const courierStateLabels = {
  'E-01': 'Pendente Verificação',
  'E-02': 'Verificado',
  'E-03': 'Rejeitado',
  'E-04': 'Suspenso',
  'E-05': 'Offline',
  'E-06': 'Online — Disponível',
};
