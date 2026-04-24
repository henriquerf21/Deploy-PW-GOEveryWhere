<template>
  <div v-if="!order" class="missing card">Pedido não encontrado.</div>
  <div v-else class="detail">
    <RouterLink to="/orders" class="back">← Lista de pedidos</RouterLink>

    <header class="head card">
      <div>
        <h2 class="title">{{ order.id }}</h2>
        <p class="sub">{{ order.clientName }} · {{ order.clientEmail }} · {{ order.zone }}</p>
      </div>
      <div class="badges">
        <span class="pill">{{ orderStatusLabels[order.status] }}</span>
        <span class="pill pill--pri">P{{ order.priority }} — {{ priorityLabels[order.priority] }}</span>
        <span class="pill">{{ orderTypeLabels[order.type] }}</span>
      </div>
    </header>

    <div v-if="order.priority === 5" class="urgent card" role="alert">
      Prioridade máxima (5 — Urgente): tratamento imediato obrigatório.
    </div>

    <div class="grid">
      <div
        v-if="order.storeId && order.courierId && [ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_TRANSIT].includes(order.status)"
        class="card block wide"
      >
        <div class="row-links">
          <RouterLink class="map-link" :to="{ name: 'map', query: { order: order.id } }">
            Ver rota no mapa →
          </RouterLink>
        </div>
      </div>

      <section v-if="canApprove" class="card block">
        <h3>Aprovar pedido</h3>
        <p class="hint">Loja Continente de recolha, custo, tempo estimado e recursos necessários.</p>
        <form class="form" @submit.prevent="doApprove">
          <label>Loja Continente</label>
          <select v-model="ap.storeId" class="inp" required>
            <option disabled value="">Selecionar…</option>
            <option v-for="s in logistics.continentStores" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <label>Custo (€)</label>
          <input v-model.number="ap.costEuro" type="number" step="0.01" min="0" class="inp" required />
          <label>Tempo estimado (min)</label>
          <input v-model.number="ap.etaMinutes" type="number" min="1" class="inp" required />
          <label>Recursos necessários</label>
          <textarea v-model="ap.resources" class="inp ta" rows="2" required placeholder="Ex.: Mota, caixa isotérmica M" />
          <button type="submit" class="btn btn--go">Aprovar</button>
        </form>
      </section>

      <section class="card block">
        <h3>Prioridade</h3>
        <p class="hint">Escala 1 (baixa) a 5 (urgente). Prioridade máxima gera alerta imediato no painel.</p>
        <fieldset class="fieldset" :disabled="!canEditPriority">
        <div class="pri-row">
          <input v-model.number="pri" type="range" min="1" max="5" step="1" class="range" />
          <span class="pri-val">{{ pri }} — {{ priorityLabels[pri] }}</span>
        </div>
        <button type="button" class="btn btn--sec" @click="doPriority">Atualizar prioridade</button>
        </fieldset>
      </section>

      <section class="card block">
        <h3>Rejeitar pedido</h3>
        <p class="hint">Justificação obrigatória. É enviada notificação por email ao cliente (simulação).</p>
        <fieldset class="fieldset" :disabled="!canReject">
        <textarea v-model="rejectText" class="inp ta" rows="3" placeholder="Motivo da rejeição…" />
        <button type="button" class="btn btn--danger" :disabled="!rejectText.trim()" @click="doReject">Rejeitar pedido</button>
        </fieldset>
      </section>

      <section class="card block">
        <h3>Pedir mais informações</h3>
        <p class="hint">Email ao cliente e estado «Info adicional solicitada».</p>
        <fieldset class="fieldset" :disabled="!canRequestInfo">
        <textarea v-model="infoText" class="inp ta" rows="3" placeholder="O que precisas do cliente?" />
        <button type="button" class="btn btn--sec" :disabled="!infoText.trim()" @click="doInfo">Enviar pedido de info</button>
        </fieldset>
      </section>

      <!-- S-03: Resposta do Cliente ao Pedido de Info -->
      <section v-if="order.clientReply || order.infoRequestMessage" class="card block wide s03-admin-card">
        <h3 class="s03-admin-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Esclarecimento S-03
        </h3>

        <div v-if="order.infoRequestMessage" class="s03-admin-sent">
          <span class="s03-label">Mensagem enviada ao cliente:</span>
          <p class="s03-text">{{ order.infoRequestMessage }}</p>
        </div>

        <div v-if="order.clientReply" class="s03-admin-reply">
          <span class="s03-label s03-label--reply">Resposta do Cliente:</span>
          <p class="s03-text s03-text--reply">{{ order.clientReply }}</p>
        </div>

        <div v-else-if="order.status === ORDER_STATUS.INFO_REQUESTED" class="s03-admin-waiting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Aguardando resposta do cliente…</span>
        </div>
      </section>

      <section class="card block wide">
        <h3>Atribuir estafeta</h3>
        <p class="hint">Apenas estafetas online na zona do pedido, dentro do limite de entregas simultâneas.</p>
        <fieldset class="fieldset" :disabled="!canAssignSection">
        <div v-if="suggested.length" class="suggest">
          <h4 class="suggest__title">Sugestão assistida (score)</h4>
          <p class="hint">Ordenado por zona, disponibilidade, carga e distância à loja. A decisão final é sempre tua.</p>
          <ul class="suggest-list">
            <li v-for="s in suggested" :key="s.id" class="suggest-li">
              <div class="suggest-top">
                <strong>{{ s.name }}</strong>
                <span class="suggest-score">score {{ s.score }}</span>
              </div>
              <div class="muted small">
                {{ (s.reasons || []).join(' · ') }}
                <template v-if="s.distanceKm != null"> · ~{{ s.distanceKm }} km à loja</template>
              </div>
              <button type="button" class="btn btn--sec btn--xs" @click="pickCourier = s.id">Pré-selecionar</button>
            </li>
          </ul>
        </div>
        <ul v-if="!available.length" class="muted">Sem estafetas elegíveis para esta zona.</ul>
        <div v-else class="assign-list">
          <label v-for="c in available" :key="c.id" class="radio-line">
            <input v-model="pickCourier" type="radio" :value="c.id" />
            <span>{{ c.name }} · {{ c.vehicle?.type }} · max {{ c.maxConcurrent }} simult.</span>
          </label>
        </div>
        <button type="button" class="btn btn--go" :disabled="!pickCourier" @click="doAssign">Atribuir</button>
        <button
          v-if="order.status === ORDER_STATUS.ASSIGNED"
          type="button"
          class="btn btn--sec btn--mt"
          @click="doStartTransit"
        >
          Marcar em trânsito
        </button>
        </fieldset>
      </section>

      <section v-if="order.status === ORDER_STATUS.IN_TRANSIT" class="card block wide">
        <h3>Concluir entrega</h3>
        <p class="hint">Marca o pedido como entregue, liberta o estafeta e atualiza a posição do estafeta para a morada do cliente (demo).</p>
        <button type="button" class="btn btn--go" @click="doComplete">Marcar entregue</button>
      </section>

      <section class="card block wide">
        <h3>Notificações por email</h3>
        <ul class="mail-list">
          <li v-for="m in orderMails" :key="m.id" class="mail-li">
            <strong>{{ m.kind }}</strong> → {{ m.to }} · {{ m.at.slice(0, 16).replace('T', ' ') }}
            <div class="mail-body">{{ m.body.slice(0, 120) }}{{ m.body.length > 120 ? '…' : '' }}</div>
          </li>
          <li v-if="!orderMails.length" class="muted">Nenhum email registado para este pedido.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  logistics,
  getOrderById,
  approveOrder,
  rejectOrder,
  requestOrderInfo,
  assignCourierToOrder,
  setOrderPriority,
  availableCouriersForOrder,
  startTransit,
  completeDelivery,
  refreshOrderFromServer,
  ORDER_STATUS,
  orderStatusLabels,
} from '../stores/logisticsStore.js';
import { orderTypeLabels, priorityLabels } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const route = useRoute();
const orderId = computed(() => route.params.id);

const order = computed(() => getOrderById(orderId.value));

const ap = reactive({ storeId: '', costEuro: 6.5, etaMinutes: 35, resources: 'Mota, caixa isotérmica' });
const pri = ref(3);
const rejectText = ref('');
const infoText = ref('');
const pickCourier = ref('');

const suggested = computed(() => {
  const list = order.value?.suggestedCouriers;
  return Array.isArray(list) ? list : [];
});

watch(
  order,
  (o) => {
    if (o) {
      pri.value = o.priority;
      pickCourier.value = '';
    }
  },
  { immediate: true }
);

async function syncOrderDetail() {
  const id = orderId.value;
  if (!id) return;
  try {
    await refreshOrderFromServer(id);
  } catch (e) {
    toast(e?.message || 'Não foi possível carregar o pedido.', 'error');
  }
}

onMounted(() => {
  void syncOrderDetail();
});

watch(orderId, () => {
  void syncOrderDetail();
});

const canApprove = computed(() => {
  const o = order.value;
  return o && (o.status === ORDER_STATUS.PENDING || o.status === ORDER_STATUS.INFO_REQUESTED);
});

const canEditPriority = computed(() => {
  const o = order.value;
  return o && ![ORDER_STATUS.REJECTED, ORDER_STATUS.DELIVERED].includes(o.status);
});

const canReject = computed(() => {
  const o = order.value;
  return o && ![ORDER_STATUS.REJECTED, ORDER_STATUS.DELIVERED].includes(o.status);
});

const canRequestInfo = computed(() => {
  const o = order.value;
  return o && ![ORDER_STATUS.REJECTED, ORDER_STATUS.DELIVERED].includes(o.status);
});

const canAssignSection = computed(() => {
  const o = order.value;
  return o && [ORDER_STATUS.APPROVED, ORDER_STATUS.ASSIGNED].includes(o.status);
});

const available = computed(() => (order.value ? availableCouriersForOrder(order.value.id) : []));

const orderMails = computed(() =>
  logistics.emailLog.filter((e) => e.orderId === orderId.value)
);

async function doApprove() {
  const r = await approveOrder(order.value.id, { ...ap });
  toast(r.ok ? 'Pedido aprovado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) void syncOrderDetail();
}

async function doReject() {
  const r = await rejectOrder(order.value.id, rejectText.value);
  toast(r.ok ? 'Pedido rejeitado. Email enviado ao cliente (sim.).' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) rejectText.value = '';
  if (r.ok) void syncOrderDetail();
}

async function doInfo() {
  const r = await requestOrderInfo(order.value.id, infoText.value);
  toast(r.ok ? 'Pedido de informação enviado.' : r.error, r.ok ? 'success' : 'error');
  if (r.ok) infoText.value = '';
  if (r.ok) void syncOrderDetail();
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
</script>

<style scoped>
.missing {
  padding: 24px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back {
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.head {
  padding: 20px 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.title {
  margin: 0 0 6px;
  font-family: var(--bo-font-display);
  font-size: 22px;
}

.sub {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--bo-page);
  color: var(--bo-text-secondary);
}

.pill--pri {
  background: #fef3c7;
  color: #b45309;
}

.urgent {
  padding: 14px 18px;
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.block {
  padding: 20px;
}

.block.wide {
  grid-column: 1 / -1;
}

.block h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.hint {
  margin: 0 0 14px;
  font-size: 13px;
  color: var(--bo-text-secondary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 12px;
  font-weight: 600;
  margin-top: 6px;
}

.inp {
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  padding: 10px 12px;
  font-size: 14px;
}

.ta {
  resize: vertical;
}

.pri-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.range {
  flex: 1;
}

.pri-val {
  font-size: 13px;
  font-weight: 600;
  min-width: 140px;
}

.btn {
  margin-top: 10px;
  padding: 10px 16px;
  border-radius: var(--bo-radius-sm);
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.btn--go {
  background: var(--bo-brand);
  color: #fff;
}

.btn--sec {
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  color: var(--bo-text);
}

.btn--danger {
  background: #dc2626;
  color: #fff;
}

.btn--mt {
  margin-left: 8px;
}

.btn--xs {
  margin-top: 8px;
  padding: 6px 10px;
  font-size: 12px;
}

.suggest {
  margin: 12px 0 14px;
  padding: 12px 14px;
  border-radius: var(--bo-radius-sm);
  background: var(--bo-page);
  border: 1px dashed var(--bo-border);
}

.suggest__title {
  margin: 0 0 6px;
  font-size: 13px;
}

.suggest-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggest-li {
  padding-bottom: 10px;
  border-bottom: 1px solid var(--bo-border);
}

.suggest-li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.suggest-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.suggest-score {
  font-size: 12px;
  font-weight: 700;
  color: var(--bo-brand-hover);
}

.small {
  font-size: 12px;
  line-height: 1.35;
}

.assign-list {
  margin-bottom: 12px;
}

.radio-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin-bottom: 8px;
}

.mail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mail-li {
  padding: 12px 0;
  border-bottom: 1px solid var(--bo-border);
  font-size: 13px;
}

.mail-body {
  margin-top: 6px;
  color: var(--bo-text-secondary);
  white-space: pre-wrap;
}

.muted {
  color: var(--bo-text-secondary);
  font-size: 14px;
}

.row-links {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.map-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.map-link:hover {
  text-decoration: underline;
}

.fieldset {
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}

.fieldset:disabled .inp,
.fieldset:disabled .btn {
  opacity: 0.55;
  cursor: not-allowed;
}

/* S-03: Esclarecimento — Admin View */
.s03-admin-card {
  border-left: 4px solid #f59e0b;
  background: #fffdf5;
}

.s03-admin-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 15px;
  color: #92400e;
}

.s03-admin-sent {
  margin-bottom: 14px;
  padding: 12px 14px;
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
}

.s03-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--bo-text-secondary);
  margin-bottom: 4px;
}

.s03-label--reply {
  color: #065f46;
}

.s03-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--bo-text);
}

.s03-admin-reply {
  padding: 14px 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: var(--bo-radius-sm);
}

.s03-text--reply {
  font-weight: 600;
  color: #065f46;
}

.s03-admin-waiting {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--bo-radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
}
</style>
