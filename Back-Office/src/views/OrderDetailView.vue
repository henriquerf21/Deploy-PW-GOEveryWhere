<template>
  <div v-if="!order" class="bo-card bo-card--padded">
    <div class="bo-empty">
      <h3 class="bo-empty__title">Pedido não encontrado</h3>
      <p class="bo-empty__hint">Volta à lista para escolher um pedido válido.</p>
      <RouterLink to="/orders" class="bo-btn bo-btn--outline" style="margin-top: 12px;">Voltar à lista</RouterLink>
    </div>
  </div>

  <div v-else class="bo-page order-detail-page">
    <RouterLink to="/orders" class="back-link"><ArrowLeft :size="14" /> Voltar à lista de pedidos</RouterLink>

    <header class="order-hero" :class="`order-hero--${order.status}`">
      <div class="order-hero__main">
        <p class="order-hero__eyebrow">Pedido · {{ orderTypeLabels[order.type] }} · {{ order.zone }}</p>
        <h1 class="order-hero__title">{{ order.orderId || order.id }}</h1>
        <p class="order-hero__sub">
          <span class="order-hero__client">{{ order.clientName }}</span>
          <span class="order-hero__sep">·</span>
          <span>{{ order.clientEmail }}</span>
        </p>
      </div>
      <div class="order-hero__badges">
        <span class="order-hero__status">{{ orderStatusLabels[order.status] }}</span>
        <span class="order-hero__pill">Prioridade {{ order.priority }} — {{ priorityLabels[order.priority] }}</span>
        <span v-if="order.is_urgent" class="order-hero__pill order-hero__pill--urgent">Urgente</span>
      </div>
    </header>

    <div class="order-kpis">
      <div class="order-kpi">
        <span class="order-kpi__label">Custo</span>
        <span class="order-kpi__value">{{ order.costEuro != null ? order.costEuro.toFixed(2) + ' €' : '—' }}</span>
      </div>
      <div class="order-kpi">
        <span class="order-kpi__label">ETA</span>
        <span class="order-kpi__value">{{ order.etaMinutes ? order.etaMinutes + ' min' : '—' }}</span>
      </div>
      <div class="order-kpi">
        <span class="order-kpi__label">Loja</span>
        <span class="order-kpi__value order-kpi__value--sm">{{ order.storeName || '—' }}</span>
      </div>
      <div class="order-kpi">
        <span class="order-kpi__label">Estafeta</span>
        <span class="order-kpi__value order-kpi__value--sm">{{ order.courierName || 'Por atribuir' }}</span>
      </div>
    </div>

    <div v-if="order.priority === 5" class="urgent-banner" role="alert">
      <strong>Prioridade máxima 5 — Urgente.</strong> Tratamento imediato obrigatório.
    </div>

    <div v-if="impossibleReview" class="impossible-review-banner" role="alert">
      <strong>Entrega impossível (antes da recolha)</strong>
      <p>{{ order.deliveryNotes || order.impossibleReport?.reason || 'Sem motivo registado.' }}</p>
      <p class="impossible-review-banner__hint">Reatribui outro estafeta ou cancela o pedido. O cliente não é cancelado automaticamente.</p>
    </div>

    <div class="layout">
      <div class="layout__main bo-stack--lg">
        <section class="bo-card bo-card--summary">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Resumo do pedido</h3>
              <p class="bo-card__sub">Cliente, linhas da encomenda e morada de entrega.</p>
            </div>
            <time class="bo-card__meta-time">{{ formatTimelineDate(order.createdAt) }}</time>
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

        <section v-if="showClientComms" class="bo-card comm-hub">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Comunicação com o cliente</h3>
              <p class="bo-card__sub">Pedidos de esclarecimento (S-03), emails e respostas — num único diálogo cronológico.</p>
            </div>
            <span v-if="clientThread.length" class="comm-hub__count">{{ clientThread.length }} mensagens</span>
          </header>
          <div class="bo-card__body">
            <div v-if="order.status === ORDER_STATUS.INFO_REQUESTED && !hasClientReply" class="comm-hub__await">
              <MessageSquare :size="18" />
              <span>Aguarda resposta do cliente ao pedido de informação.</span>
            </div>
            <div v-if="clientThread.length" class="comm-thread">
              <article
                v-for="msg in clientThread"
                :key="msg.id"
                class="comm-bubble"
                :class="`comm-bubble--${msg.direction}`"
              >
                <div class="comm-bubble__meta">
                  <span class="comm-bubble__who">{{ msg.who }}</span>
                  <span class="comm-bubble__tag">{{ msg.label }}</span>
                  <time class="comm-bubble__time">{{ formatTimelineDate(msg.at) }}</time>
                </div>
                <p class="comm-bubble__text">{{ msg.body }}</p>
                <p v-if="msg.to" class="comm-bubble__to">Para {{ msg.to }}</p>
                <p v-if="msg.emailError" class="comm-bubble__err">{{ msg.emailError }}</p>
                <span v-else-if="msg.emailSent === false" class="comm-bubble__warn">Envio por email não confirmado</span>
              </article>
            </div>
            <p v-else-if="!hasClientReply && order.status !== ORDER_STATUS.INFO_REQUESTED" class="comm-hub__empty">
              Ainda não há mensagens registadas para este pedido.
            </p>
            <div class="comm-compose">
              <label class="comm-compose__label" for="bo-chat-input">Nova mensagem (cliente / estafeta)</label>
              <textarea
                id="bo-chat-input"
                v-model="boChatText"
                class="bo-textarea comm-compose__input"
                rows="2"
                placeholder="Escreve uma mensagem…"
                @keydown.ctrl.enter.prevent="sendBoChat"
              />
              <button
                type="button"
                class="bo-btn bo-btn--primary comm-compose__btn"
                :disabled="!boChatText.trim() || boChatSending"
                @click="sendBoChat"
              >
                {{ boChatSending ? 'A enviar…' : 'Enviar mensagem' }}
              </button>
            </div>
          </div>
        </section>

        <section class="bo-card bo-card--timeline">
          <header class="bo-card__head">
            <div>
              <h3 class="bo-card__title">Histórico do pedido</h3>
              <p class="bo-card__sub">Do mais recente ao mais antigo — quem fez o quê e como mudou o estado.</p>
            </div>
            <span v-if="timelineEntries.length" class="tl-count">{{ timelineEntries.length }} eventos</span>
          </header>
          <div class="bo-card__body">
            <ol v-if="timelineEntries.length" class="tl">
              <li
                v-for="(ev, idx) in timelineEntries"
                :key="`${ev.at}-${ev.action}-${idx}`"
                class="tl-item"
                :class="[`tl-item--${ev.kind}`, { 'tl-item--latest': idx === 0 }]"
              >
                <div class="tl-item__rail" aria-hidden="true">
                  <span class="tl-item__node" :class="`tl-item__node--${ev.kind}`">
                    <component :is="ev.icon" :size="15" stroke-width="2.25" />
                  </span>
                </div>
                <article class="tl-item__card">
                  <div class="tl-item__top">
                    <div class="tl-item__labels">
                      <span v-if="idx === 0" class="tl-chip tl-chip--latest">Mais recente</span>
                      <span class="tl-chip" :class="`tl-chip--${ev.kind}`">{{ ev.title }}</span>
                    </div>
                    <time class="tl-item__time">{{ formatTimelineDate(ev.at) }}</time>
                  </div>
                  <div class="tl-item__who">
                    <span class="tl-item__actor">{{ ev.actorName }}</span>
                    <span class="tl-item__role">{{ ev.actorRole }}</span>
                  </div>
                  <div v-if="ev.fromLabel || ev.toLabel" class="tl-transition">
                    <span v-if="ev.fromLabel" class="tl-state tl-state--from">{{ ev.fromLabel }}</span>
                    <span v-if="ev.fromLabel && ev.toLabel" class="tl-transition__arrow" aria-hidden="true">→</span>
                    <span v-if="ev.toLabel" class="tl-state tl-state--to">{{ ev.toLabel }}</span>
                  </div>
                  <ul v-if="ev.facts.length" class="tl-facts">
                    <li v-for="fact in ev.facts" :key="fact.label" class="tl-facts__row">
                      <span class="tl-facts__label">{{ fact.label }}</span>
                      <span class="tl-facts__value">{{ fact.value }}</span>
                    </li>
                  </ul>
                  <p v-else-if="ev.message" class="tl-item__message">{{ ev.message }}</p>
                </article>
              </li>
            </ol>
            <p v-else class="bo-muted tl-empty">Sem registos de transição.</p>
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
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  MessageSquare,
  UserPlus,
  Truck,
  Star,
  Ban,
  Settings2,
  ClipboardList,
} from 'lucide-vue-next';
import DeliveryRouteMap from '@/components/DeliveryRouteMap.vue';
import { isGpsPlausibleForRoute } from '@/utils/geo.js';
import {
  logistics, getOrderById, getCourierById, approveOrder, rejectOrder, requestOrderInfo,
  assignCourierToOrder, setOrderPriority, availableCouriersForOrder,
  startTransit, completeDelivery, refreshOrderFromServer,
  cancelOrderByAdmin, patchOrderAdmin,
  ORDER_STATUS, orderStatusLabels,
} from '../stores/logisticsStore.js';
import { orderTypeLabels, priorityLabels } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';
import { boPostOrderChatMessage } from '../api/backofficeApi.js';

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
const boChatText = ref('');
const boChatSending = ref(false);

const mapStore = computed(() => logistics.continentStores.find(s => s.id === ap.storeId) || null);
const mapStoreLat = computed(() => mapStore.value?.lat != null ? Number(mapStore.value.lat) : Number(order.value?.pickupLat));
const mapStoreLng = computed(() => mapStore.value?.lng != null ? Number(mapStore.value.lng) : Number(order.value?.pickupLng));

const mapCourier = computed(() => order.value?.courierId ? getCourierById(order.value.courierId) : null);
function plausibleCourierLatLng(lat, lng) {
  const o = order.value;
  if (lat == null || lng == null || !o) return null;
  const storeLat = mapStoreLat.value;
  const storeLng = mapStoreLng.value;
  const destLat = Number(o.destLat);
  const destLng = Number(o.destLng);
  if (!isGpsPlausibleForRoute(lat, lng, storeLat, storeLng, destLat, destLng)) return null;
  return { lat, lng };
}

const mapCourierLat = computed(() => {
  const o = order.value;
  if (o?.courierLiveLat != null && Number.isFinite(Number(o.courierLiveLat))) {
    return Number(o.courierLiveLat);
  }
  if (mapCourier.value?.lat != null && Number.isFinite(Number(mapCourier.value.lat))) {
    const p = plausibleCourierLatLng(Number(mapCourier.value.lat), Number(mapCourier.value.lng));
    if (p) return p.lat;
  }
  return null;
});
const mapCourierLng = computed(() => {
  const o = order.value;
  if (o?.courierLiveLat != null && Number.isFinite(Number(o.courierLiveLng))) {
    return Number(o.courierLiveLng);
  }
  if (mapCourier.value?.lat != null && Number.isFinite(Number(mapCourier.value.lat))) {
    const p = plausibleCourierLatLng(Number(mapCourier.value.lat), Number(mapCourier.value.lng));
    if (p) return p.lng;
  }
  return null;
});

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
  try { await refreshOrderFromServer(id, { silent: true }); } catch { /* silently fail */ }
}
onMounted(() => { void syncOrderDetail(); });
watch(orderId, () => { void syncOrderDetail(); });

const TIMELINE_CONFIG = {
  created: { title: 'Pedido criado', kind: 'created', icon: Package },
  approve: { title: 'Pedido aprovado', kind: 'approved', icon: CheckCircle2 },
  reject: { title: 'Pedido rejeitado', kind: 'rejected', icon: XCircle },
  request_info: { title: 'Info solicitada ao cliente', kind: 'info', icon: MessageSquare },
  assign_courier: { title: 'Estafeta atribuído', kind: 'assigned', icon: UserPlus },
  start_transit: { title: 'Em trânsito', kind: 'transit', icon: Truck },
  complete: { title: 'Entrega concluída', kind: 'delivered', icon: CheckCircle2 },
  set_priority: { title: 'Prioridade alterada', kind: 'priority', icon: Star },
  cancel_admin: { title: 'Cancelado pela operação', kind: 'rejected', icon: Ban },
  admin_patch: { title: 'Correção administrativa', kind: 'info', icon: Settings2 },
};

function statusHumanLabel(code) {
  if (!code) return null;
  return orderStatusLabels[code] || String(code).replace(/_/g, ' ').toLowerCase();
}

function resolveTimelineActorRole(ev) {
  if (ev.action === 'created') return 'Cliente';
  const name = ev.actor?.name || '';
  if (!name || name === 'Sistema') return 'Sistema';
  if (ev.action === 'assign_courier') return 'Operação';
  return 'Operação';
}

function buildTimelineFacts(action, meta) {
  const m = meta || {};
  switch (action) {
    case 'approve':
      return [
        m.storeName ? { label: 'Loja', value: m.storeName } : null,
        m.costEuro != null ? { label: 'Custo', value: `${Number(m.costEuro).toFixed(2)} €` } : null,
        m.etaMinutes != null ? { label: 'ETA', value: `${m.etaMinutes} min` } : null,
      ].filter(Boolean);
    case 'reject':
    case 'cancel_admin':
      return m.reason ? [{ label: 'Motivo', value: m.reason }] : [];
    case 'request_info':
      return [{ label: 'Diálogo', value: 'Ver secção «Comunicação com o cliente»' }];
    case 'assign_courier':
      return m.courierName ? [{ label: 'Estafeta', value: m.courierName }] : [];
    case 'set_priority':
      return (m.from != null && m.to != null)
        ? [{ label: 'Prioridade', value: `P${m.from} → P${m.to}` }]
        : [];
    case 'admin_patch':
      return Array.isArray(m.fields) && m.fields.length
        ? [{ label: 'Campos alterados', value: m.fields.join(', ') }]
        : [];
    default:
      return [];
  }
}

const timelineEntries = computed(() => {
  const list = order.value?.timeline;
  if (!Array.isArray(list)) return [];
  const mapped = list.map((ev) => {
    const cfg = TIMELINE_CONFIG[ev.action] || { title: ev.action || 'Evento', kind: 'generic', icon: ClipboardList };
    const facts = buildTimelineFacts(ev.action, ev.meta);
    const message = !facts.length && ev.meta?.message ? String(ev.meta.message) : '';
    return {
      action: ev.action,
      title: cfg.title,
      kind: cfg.kind,
      icon: cfg.icon,
      at: ev.at,
      actorName: ev.actor?.name || 'Sistema',
      actorRole: resolveTimelineActorRole(ev),
      fromLabel: statusHumanLabel(ev.from),
      toLabel: statusHumanLabel(ev.to),
      facts,
      message,
    };
  });
  return mapped.slice().reverse();
});

const COMM_KIND_LABELS = {
  info_adicional: 'Pedido de informação',
  approval: 'Aprovação',
  rejection: 'Rejeição',
  delivery: 'Entrega',
};

function commKindLabel(kind) {
  return COMM_KIND_LABELS[kind] || kind || 'Comunicação';
}

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
const impossibleReview = computed(() => order.value && String(order.value.deliveryStatus || '').startsWith('E-14'));
const canAssignSection = computed(() => order.value && ['APPROVED', 'ASSIGNED'].includes(order.value.status));
const canAdminCorrect = computed(() => order.value && !terminalStatuses.includes(order.value.status));
const canCancelAdmin = computed(() => order.value && ['APPROVED', 'ASSIGNED', 'IN_TRANSIT'].includes(order.value.status));
const available = computed(() => (order.value ? availableCouriersForOrder(order.value.id) : []));
const orderMails = computed(() => {
  const o = order.value;
  const fromServer = o?.communicationLog;
  if (Array.isArray(fromServer) && fromServer.length) {
    return fromServer.map((c) => ({
      id: c.id || `${c.at}-${c.kind}`,
      kind: c.kind || c.channel || 'registo',
      to: c.to || '',
      at: c.at || '',
      body: c.body || '',
      emailSent: c.emailSent,
      emailError: c.emailError || '',
    }));
  }
  return logistics.emailLog.filter((e) => e.orderId === orderId.value);
});

function normalizeBody(text) {
  return String(text || '').trim().toLowerCase();
}

function findTimelineAt(action) {
  const list = order.value?.timeline;
  if (!Array.isArray(list)) return null;
  const hit = list.find((e) => e.action === action);
  return hit?.at || null;
}

const hasClientReply = computed(() => !!String(order.value?.clientReply || '').trim());

function chatSenderLabel(sender, o) {
  const s = String(sender || '').toLowerCase();
  if (s === 'client') return o.clientName || 'Cliente';
  if (s === 'courier') return o.courierName || 'Estafeta';
  if (s === 'admin' || s === 'bo') return 'Operação (Back-Office)';
  return 'Sistema';
}

function chatDirection(sender) {
  const s = String(sender || '').toLowerCase();
  if (s === 'client') return 'in';
  if (s === 'courier') return 'in';
  return 'out';
}

function chatLabel(sender, channel) {
  const s = String(sender || '').toLowerCase();
  if (s === 'courier') return 'Chat — estafeta';
  if (s === 'client') return 'Chat — cliente';
  if (channel) return commKindLabel(channel);
  return 'Mensagem';
}

const clientThread = computed(() => {
  const o = order.value;
  if (!o) return [];
  const items = [];
  const seenIds = new Set();
  const chatBodyKeys = new Set(
    (o.chatHistory || []).map((m) => `${String(m.sender || '').toLowerCase()}|${normalizeBody(m.text)}`),
  );

  const pushMsg = (msg) => {
    if (!msg?.body || !String(msg.body).trim()) return;
    const id = msg.id || `msg-${msg.at}-${msg.direction}-${normalizeBody(msg.body).slice(0, 24)}`;
    if (seenIds.has(id)) return;
    seenIds.add(id);
    items.push({ ...msg, id });
  };

  for (const m of o.chatHistory || []) {
    const sender = String(m.sender || '').toLowerCase();
    pushMsg({
      id: m.id || `chat-${m.time}-${sender}`,
      at: m.time || o.createdAt,
      direction: chatDirection(sender),
      who: m.actorName || chatSenderLabel(sender, o),
      label: chatLabel(sender, m.channel),
      body: m.text,
    });
  }

  for (const m of orderMails.value) {
    const key = `admin|${normalizeBody(m.body)}`;
    if (chatBodyKeys.has(key)) continue;
    pushMsg({
      id: m.id,
      at: m.at || o.createdAt,
      direction: 'out',
      who: 'Operação (Back-Office)',
      label: commKindLabel(m.kind),
      body: m.body,
      to: m.to,
      emailSent: m.emailSent,
      emailError: m.emailError,
    });
  }

  if (o.infoRequestMessage && !chatBodyKeys.has(`admin|${normalizeBody(o.infoRequestMessage)}`)) {
    pushMsg({
      id: 'info-request',
      at: findTimelineAt('request_info') || o.createdAt,
      direction: 'out',
      who: 'Operação (Back-Office)',
      label: 'Pedido de informação (S-03)',
      body: o.infoRequestMessage,
      to: o.clientEmail,
    });
  }

  if (o.clientReply && !chatBodyKeys.has(`client|${normalizeBody(o.clientReply)}`)) {
    pushMsg({
      id: 'client-reply-legacy',
      at: findTimelineAt('approve') || o.createdAt,
      direction: 'in',
      who: o.clientName || 'Cliente',
      label: 'Resposta do cliente (legado)',
      body: o.clientReply,
    });
  }

  return items.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
});

async function sendBoChat() {
  const id = orderId.value;
  const text = boChatText.value.trim();
  if (!id || !text) return;
  boChatSending.value = true;
  try {
    await boPostOrderChatMessage(id, text);
    boChatText.value = '';
    await refreshOrderFromServer(id, { silent: true });
    toast.success('Mensagem guardada.');
  } catch (e) {
    toast.error(e?.message || 'Não foi possível enviar a mensagem.');
  } finally {
    boChatSending.value = false;
  }
}

const showClientComms = computed(() => {
  const o = order.value;
  if (!o) return true;
  return (
    clientThread.value.length > 0
    || o.status === ORDER_STATUS.INFO_REQUESTED
    || !!o.infoRequestMessage
    || hasClientReply.value
    || (o.chatHistory?.length > 0)
  );
});

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

.order-detail-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.order-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: var(--bo-shadow-md);
}

.order-hero--INFO_REQUESTED {
  border-color: #e9d5ff;
  background: linear-gradient(135deg, #faf5ff 0%, #ffffff 55%);
}

.order-hero--APPROVED,
.order-hero--ASSIGNED {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 55%);
}

.order-hero--IN_TRANSIT {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 55%);
}

.order-hero--DELIVERED {
  border-color: #a7f3d0;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 55%);
}

.order-hero--REJECTED,
.order-hero--CANCELLED_ADMIN,
.order-hero--CANCELLED_CLIENT {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 55%);
}

.order-hero__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bo-text-secondary);
}

.order-hero__title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--bo-text);
}

.order-hero__sub {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.order-hero__client {
  font-weight: 700;
  color: var(--bo-text);
}

.order-hero__sep {
  margin: 0 6px;
  opacity: 0.45;
}

.order-hero__badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.order-hero__status {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 8px 14px;
  border-radius: 10px;
  background: var(--bo-brand);
  color: #fff;
  box-shadow: 0 4px 14px rgba(27, 138, 74, 0.25);
}

.order-hero--INFO_REQUESTED .order-hero__status { background: #7c3aed; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25); }
.order-hero--IN_TRANSIT .order-hero__status { background: #059669; }
.order-hero--REJECTED .order-hero__status,
.order-hero--CANCELLED_ADMIN .order-hero__status { background: #dc2626; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.2); }

.order-hero__pill {
  font-size: 12px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  background: #fff;
  border: 1px solid var(--bo-border);
  border-radius: 999px;
  padding: 4px 10px;
}

.order-hero__pill--urgent {
  color: #991b1b;
  background: var(--bo-danger-soft);
  border-color: #fecaca;
}

.order-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 900px) {
  .order-kpis { grid-template-columns: repeat(2, 1fr); }
}

.order-kpi {
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius);
  padding: 14px 16px;
  box-shadow: var(--bo-shadow);
}

.order-kpi__label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--bo-text-secondary);
  margin-bottom: 4px;
}

.order-kpi__value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--bo-text);
  font-variant-numeric: tabular-nums;
}

.order-kpi__value--sm {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.35;
}

.bo-card--summary {
  box-shadow: var(--bo-shadow);
}

.bo-card__meta-time {
  font-size: 12px;
  color: var(--bo-text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.bo-card--timeline {
  box-shadow: var(--bo-shadow);
}

.comm-hub {
  border-left: 4px solid #7c3aed;
  box-shadow: var(--bo-shadow-md);
}

.comm-hub__count {
  font-size: 12px;
  font-weight: 600;
  color: #6d28d9;
  background: #f5f3ff;
  border-radius: 999px;
  padding: 4px 10px;
}

.comm-hub__await {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: var(--bo-radius-sm);
  background: var(--bo-warning-soft);
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
}

.comm-hub__empty {
  margin: 0;
  font-size: 13px;
  color: var(--bo-text-secondary);
}

.comm-compose {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--bo-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comm-compose__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--bo-text-secondary);
}

.comm-compose__input {
  min-height: 72px;
}

.comm-compose__btn {
  align-self: flex-end;
}

.comm-thread {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px 2px 8px;
}

.comm-bubble {
  max-width: 88%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--bo-border);
  background: #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

.comm-bubble--out {
  align-self: flex-end;
  margin-left: auto;
  border-color: #e0e7ff;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-bottom-right-radius: 4px;
}

.comm-bubble--in {
  align-self: flex-start;
  border-color: #a7f3d0;
  background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
  border-bottom-left-radius: 4px;
}

.comm-bubble__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-bottom: 8px;
}

.comm-bubble__who {
  font-size: 12px;
  font-weight: 700;
  color: var(--bo-text);
}

.comm-bubble__tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bo-text-secondary);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--bo-border);
  border-radius: 4px;
  padding: 2px 6px;
}

.comm-bubble--in .comm-bubble__tag {
  color: #047857;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.comm-bubble__time {
  margin-left: auto;
  font-size: 11px;
  color: var(--bo-text-secondary);
  font-variant-numeric: tabular-nums;
}

.comm-bubble__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--bo-text);
  white-space: pre-wrap;
}

.comm-bubble__to {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--bo-text-secondary);
}

.comm-bubble__err {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--bo-danger);
}

.comm-bubble__warn {
  display: inline-block;
  margin-top: 6px;
  font-size: 10px;
  font-weight: 600;
  color: #b45309;
}

.impossible-review-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: var(--bo-radius);
  border: 1px solid #fcd34d;
  background: #fffbeb;
  color: #92400e;
  font-size: 13px;
  line-height: 1.45;
}

.impossible-review-banner strong {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.impossible-review-banner__hint {
  margin: 8px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

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
  padding: 10px 12px;
  background: linear-gradient(90deg, var(--bo-brand-soft) 0%, var(--bo-page) 100%);
  border: 1px solid #d1fae5;
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

.mail-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }

.mail-list__row {
  padding: 12px 14px;
  border: 1px solid var(--bo-border);
  border-radius: 10px;
  background: var(--bo-surface);
}

.mail-list__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.mail-list__body {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--bo-text);
  white-space: pre-wrap;
}

.bo-card--timeline .bo-card__head {
  align-items: flex-start;
}

.tl-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  border-radius: 999px;
  padding: 4px 10px;
  white-space: nowrap;
}

.tl-empty {
  font-size: 13px;
  margin: 0;
}

.tl {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tl-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.tl-item__rail {
  display: flex;
  justify-content: center;
  padding-top: 14px;
}

.tl-item__node {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: #fff;
  box-shadow: var(--bo-shadow);
  flex-shrink: 0;
}

.tl-item__node--created { background: linear-gradient(145deg, #6366f1, #4f46e5); }
.tl-item__node--approved { background: linear-gradient(145deg, #10b981, #059669); }
.tl-item__node--rejected { background: linear-gradient(145deg, #ef4444, #dc2626); }
.tl-item__node--info { background: linear-gradient(145deg, #a855f7, #9333ea); }
.tl-item__node--assigned { background: linear-gradient(145deg, #0ea5e9, #0284c7); }
.tl-item__node--transit { background: linear-gradient(145deg, #f59e0b, #d97706); }
.tl-item__node--delivered { background: linear-gradient(145deg, #22c55e, #16a34a); }
.tl-item__node--priority { background: linear-gradient(145deg, #ec4899, #db2777); }
.tl-item__node--generic { background: linear-gradient(145deg, #64748b, #475569); }

.tl-item__card {
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tl-item--latest .tl-item__card {
  border-color: var(--bo-brand-mid);
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 48%);
  box-shadow: var(--bo-shadow-md);
}

.tl-item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.tl-item__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.tl-chip {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  line-height: 1.3;
}

.tl-chip--latest {
  background: var(--bo-brand);
  color: #fff;
}

.tl-chip--created { background: #eef2ff; color: #4338ca; }
.tl-chip--approved { background: #ecfdf5; color: #047857; }
.tl-chip--rejected { background: #fef2f2; color: #b91c1c; }
.tl-chip--info { background: #faf5ff; color: #7e22ce; }
.tl-chip--assigned { background: #eff6ff; color: #1d4ed8; }
.tl-chip--transit { background: #fffbeb; color: #b45309; }
.tl-chip--delivered { background: #f0fdf4; color: #15803d; }
.tl-chip--priority { background: #fdf2f8; color: #be185d; }
.tl-chip--generic { background: #f1f5f9; color: #475569; }

.tl-item__time {
  font-size: 12px;
  color: var(--bo-text-secondary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tl-item__who {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tl-item__actor {
  font-size: 14px;
  font-weight: 700;
  color: var(--bo-text);
}

.tl-item__role {
  font-size: 11px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  background: #fff;
  border: 1px solid var(--bo-border);
  border-radius: 999px;
  padding: 2px 8px;
}

.tl-transition {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tl-state {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  line-height: 1.3;
}

.tl-state--from {
  background: #f8fafc;
  color: #64748b;
  border: 1px dashed var(--bo-border);
}

.tl-state--to {
  background: var(--bo-brand-soft);
  color: #047857;
  border: 1px solid #bbf7d0;
}

.tl-transition__arrow {
  color: var(--bo-text-secondary);
  font-weight: 700;
  font-size: 14px;
}

.tl-facts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  border-top: 1px solid var(--bo-border);
  padding-top: 8px;
}

.tl-facts__row {
  display: grid;
  grid-template-columns: minmax(88px, 34%) 1fr;
  gap: 8px;
  font-size: 13px;
  line-height: 1.45;
}

.tl-facts__label {
  color: var(--bo-text-secondary);
  font-weight: 600;
}

.tl-facts__value {
  color: var(--bo-text);
  word-break: break-word;
}

.tl-item__message {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--bo-text);
  background: #fff;
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  padding: 10px 12px;
  white-space: pre-wrap;
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
