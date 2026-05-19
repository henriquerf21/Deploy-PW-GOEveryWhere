export const DELIVERY_TO_ORDER_STATUS: Record<string, string> = {
  'E-08 Pedido Recebido': 'S-06 Aguardando Aceitação',
  'E-09 A Caminho da Loja': 'S-07 Aceite pelo Estafeta',
  'E-10 Na Loja / Em Recolha': 'S-08 Em Recolha',
  'E-11 Em Trânsito para Cliente': 'S-09 Em Trânsito',
  'E-12 No Destino': 'S-10 No Destino',
  'E-13 Entrega Confirmada': 'S-11 Entregue',
  'E-14 Entrega Impossível': 'S-12 Não Foi Possível Entregar',
};

export const DELIVERY_ALLOWED_NEXT: Record<string, string[]> = {
  'E-08': ['E-09', 'E-14'],
  'E-09': ['E-10', 'E-11', 'E-14'],
  'E-10': ['E-11', 'E-12', 'E-14'],
  'E-11': ['E-12', 'E-13', 'E-14'],
  'E-12': ['E-13', 'E-14'],
  'E-13': [],
  'E-14': [],
};

export function deliveryCode(status: string | null | undefined) {
  return String(status || '').slice(0, 4).toUpperCase();
}

export function orderCode(status: string | null | undefined) {
  return String(status || '').slice(0, 4).toUpperCase();
}

export function normalizeOrderStatus(strapiStatus?: string) {
  const code = orderCode(strapiStatus);
  if (code === 'S-01') return 'PENDING';
  if (code === 'S-02') return 'PENDING';
  if (code === 'S-03') return 'INFO_REQUESTED';
  if (code === 'S-04') return 'REJECTED';
  if (code === 'S-05') return 'APPROVED';
  if (code === 'S-06' || code === 'S-07' || code === 'S-08') return 'ASSIGNED';
  if (code === 'S-09' || code === 'S-10') return 'IN_TRANSIT';
  if (code === 'S-11' || code === 'S-15' || code === 'S-16') return 'DELIVERED';
  if (code === 'S-12') return 'UNDELIVERABLE';
  if (code === 'S-13') return 'CANCELLED_CLIENT';
  if (code === 'S-14') return 'CANCELLED_ADMIN';
  return 'PENDING';
}

export function isOrderTerminal(normalizedOrderStatus: string) {
  return ['DELIVERED', 'UNDELIVERABLE', 'CANCELLED_ADMIN', 'CANCELLED_CLIENT', 'REJECTED'].includes(normalizedOrderStatus);
}

export function canTransitionDelivery(currentStatus: string, nextStatus: string) {
  const current = deliveryCode(currentStatus);
  const next = deliveryCode(nextStatus);
  if (!current || !next) return false;
  if (current === next) return true;
  const allowed = DELIVERY_ALLOWED_NEXT[current] || [];
  return allowed.includes(next);
}
