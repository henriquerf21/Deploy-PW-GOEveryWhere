<template>
  <div v-if="!order" class="bo-card bo-card--padded">
    <div class="bo-empty">
      <h3 class="bo-empty__title">Pedido não encontrado</h3>
      <p class="bo-empty__hint">Volta à lista para escolher um pedido válido.</p>
      <RouterLink to="/orders" class="bo-btn bo-btn--outline" style="margin-top: 12px;">Voltar à lista</RouterLink>
    </div>
  </div>

  <div v-else class="bo-page">
    <RouterLink to="/orders" class="back-link"><ArrowLeft :size="14" /> Voltar à lista de pedidos</RouterLink>

    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Pedido · {{ orderTypeLabels[order.type] }}</p>
        <h1 class="bo-page-head__title">{{ order.orderId || order.id }}</h1>
        <p class="bo-page-head__sub">
          Cliente <strong>{{ order.clientName }}</strong> · {{ order.clientEmail }} · zona {{ order.zone }}
        </p>
      </div>
      <div class="bo-page-head__actions">
        <span class="bo-badge" :class="statusBadgeClass(order.status)">{{ orderStatusLabels[order.status] }}</span>
        <span class="bo-badge bo-badge--neutral">P{{ order.priority }} · {{ priorityLabels[order.priority] }}</span>
        <span v-if="order.is_urgent" class="bo-badge bo-badge--danger">Urgente</span>
      </div>
    </header>

    <div v-if="order.priority === 5" class="urgent-banner" role="alert" style="margin-bottom: 16px;">
      <strong>Prioridade máxima 5 — Urgente.</strong> Tratamento imediato obrigatório.
    </div>

    <div v-if="order.deliveryImpossibleReason && order.status === 'UNDELIVERABLE'" class="urgent-banner" role="alert" style="margin-bottom: 16px;">
      <strong>Aviso do Estafeta (Entrega Impossível):</strong> {{ order.deliveryImpossibleReason }}
    </div>

    <div class="layout">
      <div class="layout__main bo-stack--lg">
        <section class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Resumo do pedido</h3>
              <p class="bo-card__sub">Dados de cliente, encomenda e morada de entrega.</p>
            </div>
          </header>
          <div class="bo-card__body">
            <div class="info-grid">
              <div>
                <h4 class="info-grid__h">Cliente</h4>
                <dl class="bo-dl">
                  <dt>Nome</dt><dd>{{ order.clientName }}</dd>
                  <dt>Email</dt><dd>{{ order.clientEmail }}</dd>
                  <dt>Telefone</dt><dd>{{ order.clientPhone || '—' }}</dd>
                  <dt>NIF</dt><dd class="bo-mono">{{ order.clientNif || '—' }}</dd>
                  <dt>Cidade</dt><dd>{{ order.clientCity || order.city || '—' }}</dd>
                  <dt>Morada</dt><dd>{{ order.clientAddress || '—' }}</dd>
                </dl>
              </div>
              <div>
                <h4 class="info-grid__h">Encomenda</h4>
                <dl class="bo-dl">
                  <dt>Zona</dt><dd>{{ order.zone }}</dd>
                  <dt>Loja</dt><dd>{{ order.storeName || '—' }}</dd>
                  <dt>Custo</dt><dd>{{ order.costEuro != null ? order.costEuro.toFixed(2) + ' €' : '—' }}</dd>
                  <dt>ETA</dt><dd>{{ order.etaMinutes ? order.etaMinutes + ' min' : '—' }}</dd>
                  <dt>Estafeta</dt><dd>{{ order.courierName || '—' }}</dd>
                  <dt v-if="order.cancelReason">Motivo cancelamento operação</dt>
                  <dd v-if="order.cancelReason">{{ order.cancelReason }}</dd>
                  <dt v-if="order.adminInternalNote">Nota interna última</dt>
                  <dd v-if="order.adminInternalNote">{{ order.adminInternalNote }}</dd>
                  <dt>Data</dt><dd class="bo-mono">{{ order.createdAt?.slice(0,16).replace('T',' ') }}</dd>
                  <dt>GO Points</dt><dd>+{{ order.costEuro ? Math.floor(order.costEuro * 10) : 0 }} pts</dd>
                  <dt>Avaliação</dt><dd>{{ order.rating != null ? order.rating + ' / 5' : '—' }}</dd>
                </dl>
              </div>
              <div>
                <h4 class="info-grid__h">Produtos</h4>
                <ul v-if="order.items && order.items.length" class="items-list">
                  <li v-for="(item, idx) in order.items" :key="idx" class="items-list__row">
                    <span>{{ item.name }}</span>
                    <span class="items-list__qty">x{{ item.qty }}</span>
                  </li>
                </ul>
                <p v-else class="bo-muted" style="font-size: 13px;">Sem itens detalhados.</p>

                <h4 class="info-grid__h" style="margin-top: 16px;">Entrega</h4>
                <dl class="bo-dl">
                  <dt>Morada</dt><dd>{{ order.deliveryAddress || '—' }}</dd>
                  <dt>Cidade</dt><dd>{{ order.deliveryCity || '—' }}</dd>
                  <dt>Notas do Cliente</dt><dd>{{ order.notes || '—' }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Mapa do pedido</h3>
              <p class="bo-card__sub">Loja Continente, cliente e estafeta quando atribuído.</p>
            </div>
          </header>
          <div class="bo-card__body" style="padding: 0;">
            <DeliveryRouteMap
              v-if="order"
              :key="order.id"
              :store-lat="mapStoreLat"
              :store-lng="mapStoreLng"
              :dest-lat="Number(order.destLat)"
              :dest-lng="Number(order.destLng)"
              :courier-lat="mapCourierLat"
              :courier-lng="mapCourierLng"
              height="300px"
            />
          </div>
        </section>

        <section v-if="order.clientReply || order.infoRequestMessage" class="bo-card s03-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Histórico do pedido de informação extra solicitada</h3>
              <p class="bo-card__sub">Diálogo com o cliente sobre informação adicional solicitada.</p>
            </div>
          </header>
          <div class="bo-card__body bo-stack">
            <div v-if="order.infoRequestMessage" class="s03-block">
              <span class="bo-eyebrow">Mensagem enviada ao cliente</span>
              <p class="s03-block__text">{{ order.infoRequestMessage }}</p>
            </div>
            <div v-if="order.clientReply" class="s03-block s03-block--reply">
              <span class="bo-eyebrow">Resposta do cliente</span>
              <p class="s03-block__text">{{ order.clientReply }}</p>
            </div>
            <p v-else-if="order.status === ORDER_STATUS.INFO_REQUESTED" class="bo-muted" style="font-weight: 600; color: #92400e;">
              Aguarda resposta do cliente.
            </p>
          </div>
        </section>

        <section class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Histórico do pedido</h3>
              <p class="bo-card__sub">Sequência de transições, com quem fez cada ação e quando.</p>
            </div>
          </header>
          <div class="bo-card__body">
            <div v-if="timelineEntries.length" class="timeline-legend">
              <span class="legend-item" title="Ações feitas pelo Cliente"><span class="legend-dot" style="background: #6366f1;"></span> Cliente</span>
              <span class="legend-item" title="Ações feitas pelo Estafeta"><span class="legend-dot" style="background: #0ea5e9;"></span> Estafeta</span>
              <span class="legend-item" title="Ações e atualizações feitas pelo Operador/Sistema"><span class="legend-dot" style="background: #8b5cf6;"></span> Admin</span>
              <span class="legend-item" title="Avisos e Trânsito"><span class="legend-dot" style="background: #f97316;"></span> Em Trânsito / Avisos</span>
              <span class="legend-item" title="Entrega concluída ou Sucesso"><span class="legend-dot" style="background: #10b981;"></span> Concluído</span>
              <span class="legend-item" title="Rejeições ou Cancelamentos"><span class="legend-dot" style="background: #ef4444;"></span> Cancelado</span>
            </div>
            
            <ol v-if="timelineEntries.length" class="timeline">
              <li v-for="(ev, idx) in timelineEntries" :key="idx" class="timeline__row" :class="`timeline__row--${ev.kind}`">
                <span class="timeline__dot" aria-hidden="true" />
                <div class="timeline__content">
                  <div class="timeline__head">
                    <span class="timeline__title">{{ ev.title }}</span>
                    <span class="timeline__when bo-mono">{{ formatTimelineDate(ev.at) }}</span>
                  </div>
                  <p class="timeline__sub">
                    <span class="timeline__actor">{{ ev.actorName }}</span>
                    <template v-if="ev.transition"> · <span class="bo-mono">{{ ev.transition }}</span></template>
                  </p>
                  <p v-if="ev.detail" class="timeline__detail">{{ ev.detail }}</p>
                </div>
              </li>
            </ol>
            <p v-else class="bo-muted" style="font-size: 13px;">Sem registos de transição.</p>
          </div>
        </section>

      </div>

      <aside class="layout__side bo-stack">
        <section v-if="canApprove" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Aprovar pedido</h3>
              <p class="bo-card__sub">Confirma loja de recolha, custo e ETA.</p>
            </div>
          </header>
          <div class="bo-card__body">
            <form class="bo-stack" @submit.prevent="doApprove">
              <div class="bo-field">
                <label class="bo-field__label">Loja Continente <span class="bo-required">*</span></label>
                <select v-model="ap.storeId" class="bo-select" required>
                  <option disabled value="">Selecionar...</option>
                  <option v-for="s in logistics.continentStores" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
                <span v-if="order.storeName" class="bo-field__hint">Loja original (Front-Office): {{ order.storeName }}</span>
              </div>
              <div class="bo-row" style="gap: 12px;">
                <div class="bo-field" style="flex: 1;">
                  <label class="bo-field__label">Custo (€)</label>
                  <input v-model.number="ap.costEuro" type="number" step="0.01" min="0" class="bo-input" required />
                </div>
                <div class="bo-field" style="flex: 1;">
                  <label class="bo-field__label">ETA (min)</label>
                  <input v-model.number="ap.etaMinutes" type="number" min="1" class="bo-input" required />
                </div>
              </div>

              <button type="submit" class="bo-btn bo-btn--primary">Aprovar pedido</button>
            </form>
          </div>
        </section>

        <section class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Prioridade</h3>
              <p class="bo-card__sub">Ajusta a prioridade entre 1 (baixa) e 5 (urgente).</p>
            </div>
          </header>
          <div class="bo-card__body">
            <fieldset class="bo-stack" :disabled="!canEditPriority" style="border: none; padding: 0; margin: 0;">
              <div class="priority-row">
                <input v-model.number="pri" type="range" min="1" max="5" step="1" class="priority-row__range" />
                <span class="bo-badge" :class="['bo-badge', 'priority-row__pill', 'p' + pri]">P{{ pri }} · {{ priorityLabels[pri] }}</span>
              </div>
              <button type="button" class="bo-btn bo-btn--outline" @click="doPriority">Atualizar prioridade</button>
            </fieldset>
          </div>
        </section>

        <section v-if="canAssignSection" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Atribuir estafeta</h3>
              <p class="bo-card__sub">Estafetas disponíveis:</p>
            </div>
          </header>
          <div class="bo-card__body bo-stack">
            <fieldset class="bo-stack" :disabled="!canAssignSection" style="border: none; padding: 0; margin: 0;">
              <div v-if="order.courierName" class="current-courier-banner">
                <span class="bo-badge bo-badge--success">Ativo</span>
                <span>Estafeta atribuído: <strong>{{ order.courierName }}</strong></span>
              </div>
              <p v-if="!available.length && !order.courierName" class="bo-muted" style="font-size: 13px;">Sem estafetas elegíveis para esta zona.</p>
              <div v-else class="assign-list">
                <label v-for="c in available" :key="c.id" class="assign-row" :class="{ 'is-selected': pickCourier === c.id }">
                  <input v-model="pickCourier" type="radio" :value="c.id" />
                  <span>
                    <strong>{{ c.name }}</strong>
                    <span class="assign-row__meta">{{ c.vehicle?.type || '—' }} · max {{ c.maxConcurrent }} simult.</span>
                  </span>
                </label>
              </div>
              <div class="bo-row">
                <button type="button" class="bo-btn bo-btn--primary" :disabled="!pickCourier" @click="doAssign">{{ order.courierName ? 'Re-atribuir' : 'Atribuir' }}</button>
                <button v-if="order.status === ORDER_STATUS.ASSIGNED" type="button" class="bo-btn bo-btn--outline" @click="doStartTransit">Marcar em trânsito</button>
              </div>
            </fieldset>
          </div>
        </section>

        <section v-if="order.status === ORDER_STATUS.IN_TRANSIT" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Concluir entrega</h3>
              <p class="bo-card__sub">Marca como entregue após a confirmação do estafeta.</p>
            </div>
          </header>
          <div class="bo-card__body">
            <button type="button" class="bo-btn bo-btn--success" @click="doComplete">Marcar como entregue</button>
          </div>
        </section>

        <section v-if="canRequestInfo" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Pedir informação adicional</h3>
              <p class="bo-card__sub">Email enviado ao cliente; estado passa a "Info adicional solicitada".</p>
            </div>
          </header>
          <div class="bo-card__body bo-stack">
            <fieldset class="bo-stack" :disabled="!canRequestInfo" style="border: none; padding: 0; margin: 0;">
              <textarea v-model="infoText" class="bo-textarea" rows="3" placeholder="O que precisas do cliente?" />
              <button type="button" class="bo-btn bo-btn--outline" :disabled="!infoText.trim()" @click="doInfo">Enviar pedido de info</button>
            </fieldset>
          </div>
        </section>


        <section v-if="canAdminCorrect" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Correção administrativa</h3>
              <p class="bo-card__sub">Ajusta morada de entrega ou deixa nota interna. Não substitui aprovação.</p>
            </div>
          </header>
          <div class="bo-card__body bo-stack">
            <div class="bo-field">
              <label class="bo-field__label">Morada de entrega</label>
              <input v-model="adminPatch.deliveryAddress" type="text" class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Cidade (entrega)</label>
              <input v-model="adminPatch.deliveryCity" type="text" class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Nota interna</label>
              <textarea v-model="adminPatch.internalNote" class="bo-textarea" rows="2" placeholder="Visível na ficha do pedido..." />
            </div>
            <button type="button" class="bo-btn bo-btn--outline" @click="doAdminPatch">Guardar correções</button>
          </div>
        </section>

                <section v-if="canReject" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Rejeitar pedido</h3>
              <p class="bo-card__sub">Justificação obrigatória. Cliente é notificado.</p>
            </div>
          </header>
          <div class="bo-card__body bo-stack">
            <fieldset class="bo-stack" :disabled="!canReject" style="border: none; padding: 0; margin: 0;">
              <textarea v-model="rejectText" class="bo-textarea" rows="3" placeholder="Motivo da rejeição..." />
              <button type="button" class="bo-btn bo-btn--danger" :disabled="!rejectText.trim()" @click="doReject">Rejeitar pedido</button>
            </fieldset>
          </div>
        </section>

        <section v-if="canCancelAdmin" class="bo-card">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Cancelar pela operação</h3>
            </div>
          </header>
          <div class="bo-card__body bo-stack">
            <textarea v-model="cancelReasonText" class="bo-textarea" rows="3" placeholder="Motivo do cancelamento obrigatório…" />
            <button type="button" class="bo-btn bo-btn--danger" :disabled="!cancelReasonText.trim()" @click="doCancelAdmin">Cancelar pedido</button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import DeliveryRouteMap from '@/components/DeliveryRouteMap.vue';
import {
  logistics, getOrderById, getCourierById, approveOrder, rejectOrder, requestOrderInfo,
  assignCourierToOrder, setOrderPriority, availableCouriersForOrder,
  startTransit, completeDelivery, refreshOrderFromServer,
  cancelOrderByAdmin, patchOrderAdmin,
  ORDER_STATUS, orderStatusLabels,
} from '../stores/logisticsStore.js';
import { orderTypeLabels, priorityLabels } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const route = useRoute();
const orderId = computed(() => route.params.id);
const order = computed(() => getOrderById(orderId.value));

const ap = reactive({ storeId: '', costEuro: 0, etaMinutes: 0 });
const pri = ref(3);
const rejectText = ref('');
const infoText = ref('');
const pickCourier = ref('');
const adminPatch = reactive({ deliveryAddress: '', deliveryCity: '', internalNote: '' });
const cancelReasonText = ref('');

const mapStore = computed(() => logistics.continentStores.find(s => s.id === ap.storeId) || null);
const mapStoreLat = computed(() => mapStore.value?.lat != null ? Number(mapStore.value.lat) : Number(order.value?.pickupLat));
const mapStoreLng = computed(() => mapStore.value?.lng != null ? Number(mapStore.value.lng) : Number(order.value?.pickupLng));

const mapCourier = computed(() => order.value?.courierId ? getCourierById(order.value.courierId) : null);
const mapCourierLat = computed(() => mapCourier.value?.lat != null ? Number(mapCourier.value.lat) : null);
const mapCourierLng = computed(() => mapCourier.value?.lng != null ? Number(mapCourier.value.lng) : null);

const suggested = computed(() => {
  const list = order.value?.suggestedCouriers;
  return Array.isArray(list) ? list : [];
});

watch(order, (o) => {
  if (o) {
    pri.value = o.priority;
    pickCourier.value = '';
    adminPatch.deliveryAddress = o.deliveryAddress || '';
    adminPatch.deliveryCity = o.deliveryCity || '';
    adminPatch.internalNote = '';
    ap.costEuro = Number.isFinite(Number(o.costEuro)) ? Number(o.costEuro) : 0;
    ap.etaMinutes = Number.isFinite(Number(o.etaMinutes)) ? Number(o.etaMinutes) : 0;
    ap.resources = o.resources || '';

    // Tentar pré-selecionar a loja enviada pelo FO
    if (o.storeName && !ap.storeId) {
      const match = logistics.continentStores.find(s => 
        s.name.toLowerCase().trim() === o.storeName.toLowerCase().trim()
      );
      if (match) ap.storeId = match.id;
    }
  }
}, { immediate: true });

async function syncOrderDetail() {
  const id = orderId.value;
  if (!id) return;
  try { await refreshOrderFromServer(id); } catch { /* silently fail */ }
}
onMounted(() => { void syncOrderDetail(); });
watch(orderId, () => { void syncOrderDetail(); });

const TIMELINE_LABELS = {
  created: { title: 'Pedido criado', kind: 'client' },
  approve: { title: 'Pedido aprovado', kind: 'admin' },
  reject: { title: 'Pedido rejeitado', kind: 'admin_danger' },
  request_info: { title: 'Informação solicitada ao cliente', kind: 'admin_warn' },
  assign_courier: { title: 'Estafeta atribuído', kind: 'admin' },
  start_transit: { title: 'Em trânsito', kind: 'admin_transit' },
  complete: { title: 'Entrega concluída', kind: 'admin_success' },
  set_priority: { title: 'Prioridade alterada', kind: 'admin_warn' },
  cancel_admin: { title: 'Cancelado pela operação', kind: 'admin_danger' },
  admin_patch: { title: 'Correção administrativa', kind: 'admin' },
  
  courier_status: { title: 'Atualização', kind: 'courier' },
  client_status: { title: 'Atualização', kind: 'client' },
  admin_status: { title: 'Atualização', kind: 'admin' },
  status_update: { title: 'Atualização de Estado', kind: 'generic' }
};

const timelineEntries = computed(() => {
  const list = order.value?.timeline;
  if (!Array.isArray(list)) return [];
  return list.map((ev) => {
    const cfg = TIMELINE_LABELS[ev.action] || { title: ev.action || '—', kind: 'generic' };
    const meta = ev.meta || {};
    let detail = '';
    let title = cfg.title;

    switch (ev.action) {
      case 'approve':
        detail = [meta.storeName ? `Loja: ${meta.storeName}` : null, meta.costEuro != null ? `Custo: ${Number(meta.costEuro).toFixed(2)}€` : null, meta.etaMinutes != null ? `ETA: ${meta.etaMinutes} min` : null]
          .filter(Boolean).join(' · ');
        break;
      case 'reject':
        detail = meta.reason ? `Motivo: ${meta.reason}` : '';
        break;
      case 'request_info':
        detail = meta.message ? `Mensagem: ${meta.message}` : '';
        break;
      case 'assign_courier':
        detail = meta.courierName ? `Estafeta: ${meta.courierName}` : '';
        break;
      case 'set_priority':
        detail = (meta.from != null && meta.to != null) ? `P${meta.from} → P${meta.to}` : '';
        break;
      case 'cancel_admin':
        detail = meta.reason ? `Motivo: ${meta.reason}` : '';
        break;
      case 'admin_patch':
        detail = Array.isArray(meta.fields) ? `Campos: ${meta.fields.join(', ')}` : '';
        break;
      case 'courier_status':
      case 'client_status':
      case 'admin_status':
      case 'status_update':
        if (meta.status) title = meta.status;
        if (meta.fromStatus && meta.status) {
          detail = `${meta.fromStatus.split(' ')[0]} → ${meta.status.split(' ')[0]}`;
        }
        break;
      default:
        detail = '';
    }

    return {
      title,
      kind: cfg.kind,
      at: ev.at,
      actorName: ev.actor?.name || 'Sistema',
      transition: (ev.from && ev.to) ? `${ev.from} → ${ev.to}` : null,
      detail,
    };
  });
});

function formatTimelineDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso).slice(0, 16).replace('T', ' ');
  }
}

const terminalStatuses = ['REJECTED', 'DELIVERED', 'CANCELLED_ADMIN', 'CANCELLED_CLIENT'];

const canApprove = computed(() => order.value && ['PENDING', 'INFO_REQUESTED'].includes(order.value.status));
const canEditPriority = computed(() => order.value && !terminalStatuses.includes(order.value.status));
const canReject = computed(() => order.value && ['PENDING', 'INFO_REQUESTED'].includes(order.value.status));
const canRequestInfo = computed(() => order.value && ['PENDING', 'INFO_REQUESTED'].includes(order.value.status));
const canAssignSection = computed(() => order.value && ['APPROVED', 'ASSIGNED', 'UNDELIVERABLE'].includes(order.value.status));
const canAdminCorrect = computed(() => order.value && !terminalStatuses.includes(order.value.status));
const canCancelAdmin = computed(() => order.value && ['APPROVED', 'ASSIGNED', 'IN_TRANSIT', 'UNDELIVERABLE'].includes(order.value.status));
const available = computed(() => (order.value ? availableCouriersForOrder(order.value.id) : []));


function statusBadgeClass(status) {
  switch (status) {
    case ORDER_STATUS.PENDING: return 'bo-badge--warn';
    case ORDER_STATUS.INFO_REQUESTED: return 'bo-badge--purple';
    case ORDER_STATUS.REJECTED: return 'bo-badge--danger';
    case ORDER_STATUS.APPROVED: return 'bo-badge--info';
    case ORDER_STATUS.ASSIGNED: return 'bo-badge--info';
    case ORDER_STATUS.IN_TRANSIT: return 'bo-badge--brand';
    case ORDER_STATUS.DELIVERED: return 'bo-badge--success';
    case ORDER_STATUS.CANCELLED_CLIENT: return 'bo-badge--danger';
    case ORDER_STATUS.CANCELLED_ADMIN: return 'bo-badge--danger';
    default: return 'bo-badge--neutral';
  }
}

async function doApprove() {
  if (!ap.storeId) {
    toast('Seleciona uma loja antes de aprovar.', 'error');
    return;
  }
  if (!(Number(ap.costEuro) > 0)) {
    toast('Define um custo válido (> 0).', 'error');
    return;
  }
  if (!(Number(ap.etaMinutes) > 0)) {
    toast('Define um ETA válido (> 0).', 'error');
    return;
  }
  const r = await approveOrder(order.value.id, { ...ap });
  toast(r.ok ? 'Pedido aprovado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) void syncOrderDetail();
}
async function doReject() {
  const r = await rejectOrder(order.value.id, rejectText.value);
  toast(r.ok ? 'Pedido rejeitado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) { rejectText.value = ''; void syncOrderDetail(); }
}
async function doInfo() {
  const r = await requestOrderInfo(order.value.id, infoText.value);
  toast(r.ok ? 'Pedido de informação enviado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) { infoText.value = ''; void syncOrderDetail(); }
}
async function doAssign() {
  const r = await assignCourierToOrder(order.value.id, pickCourier.value);
  toast(r.ok ? 'Estafeta atribuído.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) void syncOrderDetail();
}
async function doPriority() {
  const r = await setOrderPriority(order.value.id, pri.value);
  toast(r.ok ? 'Prioridade atualizada.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) void syncOrderDetail();
}
async function doStartTransit() {
  const r = await startTransit(order.value.id);
  toast(r.ok ? 'Pedido em trânsito.' : 'Não aplicável', r.ok ? 'success' : 'error');
  if (r.ok) void syncOrderDetail();
}
async function doComplete() {
  const r = await completeDelivery(order.value.id);
  toast(r.ok ? 'Pedido marcado como entregue.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) void syncOrderDetail();
}

async function doAdminPatch() {
  const p = {};
  const addr = adminPatch.deliveryAddress.trim();
  const city = adminPatch.deliveryCity.trim();
  const note = adminPatch.internalNote.trim();
  if (addr) p.deliveryAddress = addr;
  if (city) p.deliveryCity = city;
  if (note) p.internalNote = note;
  if (!Object.keys(p).length) {
    toast('Sem alterações para guardar.', 'error');
    return;
  }
  const r = await patchOrderAdmin(order.value.id, p);
  toast(r.ok ? 'Correções guardadas.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) {
    adminPatch.internalNote = '';
    void syncOrderDetail();
  }
}

async function doCancelAdmin() {
  const r = await cancelOrderByAdmin(order.value.id, cancelReasonText.value);
  toast(r.ok ? 'Pedido cancelado pela operação.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) {
    cancelReasonText.value = '';
    void syncOrderDetail();
  }
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
  width: fit-content;
}

.back-link:hover { opacity: 0.75; }

.urgent-banner {
  padding: 14px 18px;
  background: var(--bo-danger-soft);
  border: 1px solid #fecaca;
  border-left: 4px solid var(--bo-danger);
  border-radius: var(--bo-radius);
  color: #991b1b;
  font-size: 14px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 22px;
  align-items: flex-start;
}

@media (max-width: 1100px) {
  .layout { grid-template-columns: 1fr; }
  .layout__side { position: static; }
}

.layout__side {
  position: sticky;
  top: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 22px;
}

.info-grid__h {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bo-text-secondary);
}

.items-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.items-list__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bo-page);
  border-radius: 8px;
  font-size: 13px;
}

.items-list__qty {
  font-weight: 700;
  color: var(--bo-brand);
  font-variant-numeric: tabular-nums;
}

.order-map {
  width: 100%;
  height: 320px;
  border-top: 1px solid var(--bo-border);
}

.s03-card { border-left: 3px solid var(--bo-warning); }

.s03-block {
  padding: 12px 14px;
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  border-radius: 10px;
}

.s03-block--reply {
  background: var(--bo-success-soft);
  border-color: #a7f3d0;
}

.s03-block__text {
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--bo-text);
}

.priority-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.priority-row__range { flex: 1; accent-color: var(--bo-brand); }

.priority-row__pill {
  font-variant-numeric: tabular-nums;
}

.priority-row__pill.p1 { background: #f3f4f6; color: #6b7280; border-color: #e5e7eb; }
.priority-row__pill.p2 { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
.priority-row__pill.p3 { background: var(--bo-success-soft); color: var(--bo-success); border-color: #a7f3d0; }
.priority-row__pill.p4 { background: var(--bo-warning-soft); color: #b45309; border-color: #fde68a; }
.priority-row__pill.p5 { background: var(--bo-danger-soft); color: var(--bo-danger); border-color: #fecaca; }

.suggest {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bo-brand-soft);
  border: 1px dashed var(--bo-brand-mid);
}

.suggest__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.suggest__row {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--bo-surface);
  border: 1px solid transparent;
  cursor: pointer;
  transition: border-color var(--bo-transition-fast);
}

.suggest__row:hover { border-color: var(--bo-brand-mid); }

.suggest__row.is-selected {
  border-color: var(--bo-brand);
  box-shadow: 0 0 0 3px rgba(27, 138, 74, 0.12);
}

.suggest__row > div { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.suggest__score { font-size: 11px; font-weight: 700; color: var(--bo-brand-hover); background: var(--bo-brand-soft); padding: 2px 8px; border-radius: 999px; }
.suggest__meta { margin: 4px 0 0; font-size: 11.5px; color: var(--bo-text-secondary); line-height: 1.4; }

.assign-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.assign-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--bo-border);
  background: var(--bo-surface);
  font-size: 13.5px;
  cursor: pointer;
  transition: border-color var(--bo-transition-fast);
}

.assign-row:hover { border-color: var(--bo-brand-mid); background: var(--bo-brand-soft); }

.assign-row.is-selected {
  border-color: var(--bo-brand);
  box-shadow: 0 0 0 3px rgba(27, 138, 74, 0.12);
}

.assign-row input { accent-color: var(--bo-brand); }

.assign-row__meta {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.current-courier-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  font-size: 13px;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 4px 0 4px 8px;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: 13px;
  width: 2px;
  background: var(--bo-border, #e2e8f0);
  border-radius: 2px;
}

.timeline__row {
  position: relative;
  padding-left: 30px;
  padding-bottom: 16px;
}

.timeline__row:last-child { padding-bottom: 0; }

.timeline__dot {
  position: absolute;
  left: 6px;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #94a3b8;
  border: 3px solid var(--bo-surface, #fff);
  box-shadow: 0 0 0 1px var(--bo-border, #e2e8f0);
}

.timeline__row--client .timeline__dot { background: #6366f1; } /* Indigo for Client */
.timeline__row--courier .timeline__dot { background: #0ea5e9; } /* Light Blue for Courier */
.timeline__row--admin .timeline__dot { background: #8b5cf6; } /* Purple for Admin actions */
.timeline__row--admin_warn .timeline__dot { background: #f59e0b; } /* Amber for Admin warnings */
.timeline__row--admin_danger .timeline__dot { background: #ef4444; } /* Red for Admin reject/cancel */
.timeline__row--admin_transit .timeline__dot { background: #f97316; } /* Orange for Admin transit */
.timeline__row--admin_success .timeline__dot { background: #10b981; } /* Emerald for Admin success */
.timeline__row--admin_info .timeline__dot { background: #a855f7; }
.timeline__row--generic .timeline__dot { background: #94a3b8; }

.timeline-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px dashed var(--bo-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--bo-text-secondary);
  font-weight: 500;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 1px var(--bo-border, #e2e8f0);
}

.timeline__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--bo-text, #0f172a);
}

.timeline__when {
  font-size: 11.5px;
  color: var(--bo-text-secondary, #64748b);
  white-space: nowrap;
}

.timeline__sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--bo-text-secondary, #64748b);
}

.timeline__actor {
  font-weight: 600;
  color: var(--bo-text, #0f172a);
}

.timeline__detail {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--bo-text-secondary, #475569);
  line-height: 1.5;
}

.current-courier-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: var(--bo-radius-sm);
  margin-bottom: 16px;
}

.cc-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #166534;
}

.assign-title {
  font-size: 12px;
  font-weight: 700;
  margin: 16px 0 8px;
  color: var(--bo-text-secondary);
  text-transform: uppercase;
}

.pill--success {
  background: #22c55e;
  color: #fff;
}
</style>
