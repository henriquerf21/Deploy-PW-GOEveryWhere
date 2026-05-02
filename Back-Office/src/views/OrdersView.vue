<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Operações</p>
        <h1 class="bo-page-head__title">Pedidos</h1>
        <p class="bo-page-head__sub">
          Filtra por estado, prioridade, urgência, intervalo de datas, tipo de serviço e zona. A pesquisa cobre ID, cliente ou email.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <span class="bo-badge bo-badge--info">{{ rows.length }} resultado(s)</span>
      </div>
    </header>

    <section class="bo-card bo-card--padded">
      <div class="filters-grid">
        <div class="bo-field">
          <label class="bo-field__label" for="of-q">Pesquisa</label>
          <input id="of-q" v-model="f.q" type="search" class="bo-input" placeholder="ID, cliente, email..." />
        </div>
        <div class="bo-field">
          <label class="bo-field__label">Estado</label>
          <select v-model="f.status" class="bo-select">
            <option value="">Todos os estados</option>
            <option v-for="(lab, key) in orderStatusLabels" :key="key" :value="key">{{ lab }}</option>
          </select>
        </div>
        <div class="bo-field">
          <label class="bo-field__label">Prioridade</label>
          <select v-model="f.priority" class="bo-select">
            <option value="">Todas</option>
            <option v-for="p in 5" :key="p" :value="String(p)">{{ priorityLabels[p] }}</option>
          </select>
        </div>
        <div class="bo-field">
          <label class="bo-field__label">Urgência</label>
          <select v-model="f.urgent" class="bo-select">
            <option value="">Todos</option>
            <option value="urgent">Apenas urgentes</option>
            <option value="normal">Apenas normais</option>
          </select>
        </div>
        <div class="bo-field">
          <label class="bo-field__label">Tipo</label>
          <select v-model="f.type" class="bo-select">
            <option value="">Todos</option>
            <option v-for="(lab, key) in orderTypeLabels" :key="key" :value="key">{{ lab }}</option>
          </select>
        </div>
        <div class="bo-field">
          <label class="bo-field__label">Zona</label>
          <select v-model="f.zone" class="bo-select">
            <option value="">Todas</option>
            <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>
        <div class="bo-field">
          <label class="bo-field__label">De</label>
          <input v-model="f.dateFrom" type="date" class="bo-input" />
        </div>
        <div class="bo-field">
          <label class="bo-field__label">Até</label>
          <input v-model="f.dateTo" type="date" class="bo-input" />
        </div>
      </div>
    </section>

    <section class="bo-card">
      <header class="bo-card__head bo-card__head--soft">
        <div>
          <h3 class="bo-card__title">Filtros guardados</h3>
          <p class="bo-card__sub">Snapshots de filtros disponíveis apenas neste navegador.</p>
        </div>
        <div class="bo-row">
          <input v-model="presetName" type="text" class="bo-input" placeholder="Nome do filtro" style="min-width: 200px" />
          <button type="button" class="bo-btn bo-btn--outline bo-btn--sm" @click="savePreset">Guardar filtro atual</button>
        </div>
      </header>
      <div class="bo-card__body">
        <div v-if="savedPresets.length" class="presets-row">
          <button v-for="p in savedPresets" :key="p.id" type="button" class="bo-chip" @click="applyPreset(p)">
            {{ p.name }}
          </button>
        </div>
        <p v-else class="bo-muted" style="font-size: 13px; margin: 0;">Ainda não tens filtros guardados.</p>
        <p v-if="activePresetLabel" class="bo-eyebrow" style="margin-top: 10px; color: var(--bo-brand-hover);">Ativo · {{ activePresetLabel }}</p>
      </div>
    </section>

    <div class="bo-table-wrap">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Zona</th>
            <th>Tipo</th>
            <th>Prio</th>
            <th>Estado</th>
            <th>Criado em</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td colspan="8" class="bo-table__empty">
              <div class="bo-empty">
                <h3 class="bo-empty__title">Sem pedidos</h3>
                <p class="bo-empty__hint">Nenhum pedido corresponde aos filtros aplicados.</p>
              </div>
            </td>
          </tr>
          <tr v-for="o in rows" :key="o.id" :class="{ 'urgent-row': o.is_urgent }">
            <td>
              <span class="bo-mono">{{ o.id }}</span>
              <span v-if="o.is_urgent" class="bo-badge bo-badge--danger" style="margin-left: 6px;">Urgente</span>
            </td>
            <td>
              <span class="bo-table__primary">{{ o.clientName }}</span>
              <span class="bo-table__secondary">{{ o.clientEmail }}</span>
            </td>
            <td>{{ o.zone }}</td>
            <td>{{ orderTypeLabels[o.type] }}</td>
            <td>
              <span class="prio-pill" :class="'prio-pill--p' + o.priority">P{{ o.priority }}</span>
            </td>
            <td>
              <span class="bo-badge" :class="statusBadgeClass(o.status)">{{ orderStatusLabels[o.status] }}</span>
            </td>
            <td class="bo-mono bo-muted bo-num">{{ o.createdAt.slice(0, 10) }}</td>
            <td class="bo-table__actions">
              <RouterLink class="bo-btn bo-btn--sm bo-btn--outline" :to="{ name: 'order-detail', params: { id: o.id } }">Operar</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { logistics, filterOrders, orderStatusLabels } from '../stores/logisticsStore.js';
import { orderTypeLabels, priorityLabels, ZONES, ORDER_STATUS } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const route = useRoute();

const f = reactive({
  status: '',
  priority: '',
  urgent: '',
  type: '',
  zone: '',
  dateFrom: '',
  dateTo: '',
  q: '',
});

const LS_KEY = 'bo.orders.savedFilters.v1';
const savedPresets = ref([]);
const presetName = ref('');
const activePresetLabel = ref('');

function loadPresets() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    savedPresets.value = Array.isArray(parsed) ? parsed : [];
  } catch {
    savedPresets.value = [];
  }
}

function persistPresets() {
  localStorage.setItem(LS_KEY, JSON.stringify(savedPresets.value));
}

onMounted(() => {
  loadPresets();
});

watch(
  () => route.query.q,
  (q) => {
    f.q = typeof q === 'string' ? q : '';
  },
  { immediate: true }
);

const rows = computed(() =>
  filterOrders({
    status: f.status || undefined,
    priority: f.priority || undefined,
    urgent: f.urgent || undefined,
    type: f.type || undefined,
    zone: f.zone || undefined,
    dateFrom: f.dateFrom || undefined,
    dateTo: f.dateTo || undefined,
    q: f.q || undefined,
  })
);

function snapshotFilters() {
  return {
    status: f.status,
    priority: f.priority,
    urgent: f.urgent,
    type: f.type,
    zone: f.zone,
    dateFrom: f.dateFrom,
    dateTo: f.dateTo,
    q: f.q,
  };
}

function applyPreset(p) {
  const d = p.filters || {};
  f.status = d.status ?? '';
  f.priority = d.priority ?? '';
  f.urgent = d.urgent ?? '';
  f.type = d.type ?? '';
  f.zone = d.zone ?? '';
  f.dateFrom = d.dateFrom ?? '';
  f.dateTo = d.dateTo ?? '';
  f.q = d.q ?? '';
  activePresetLabel.value = p.name;
  toast(`Filtro «${p.name}» aplicado.`, 'info');
}

function savePreset() {
  const name = presetName.value.trim();
  if (!name) {
    toast('Indica um nome para guardar o filtro.', 'error');
    return;
  }
  const id = `pf-${Date.now()}`;
  const next = [{ id, name, filters: snapshotFilters() }, ...savedPresets.value.filter((p) => p.name !== name)].slice(0, 12);
  savedPresets.value = next;
  persistPresets();
  activePresetLabel.value = name;
  presetName.value = '';
  toast('Filtro guardado neste browser.', 'success');
}

function statusBadgeClass(status) {
  switch (status) {
    case ORDER_STATUS.PENDING: return 'bo-badge--warn';
    case ORDER_STATUS.INFO_REQUESTED: return 'bo-badge--purple';
    case ORDER_STATUS.REJECTED: return 'bo-badge--danger';
    case ORDER_STATUS.APPROVED: return 'bo-badge--info';
    case ORDER_STATUS.ASSIGNED: return 'bo-badge--info';
    case ORDER_STATUS.IN_TRANSIT: return 'bo-badge--brand';
    case ORDER_STATUS.DELIVERED: return 'bo-badge--success';
    default: return 'bo-badge--neutral';
  }
}

void logistics;
</script>

<style scoped>
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 16px;
}

.presets-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.col-actions {
  width: 120px;
  text-align: right;
}

.urgent-row td:first-child {
  position: relative;
}

.urgent-row td:first-child::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 2px;
  background: var(--bo-danger);
}

.prio-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: var(--bo-page);
  color: var(--bo-text);
}

.prio-pill--p1 { background: #f3f4f6; color: #6b7280; }
.prio-pill--p2 { background: #dbeafe; color: #1d4ed8; }
.prio-pill--p3 { background: #d1fae5; color: #047857; }
.prio-pill--p4 { background: #fef3c7; color: #b45309; }
.prio-pill--p5 { background: #fee2e2; color: #b91c1c; }
</style>
