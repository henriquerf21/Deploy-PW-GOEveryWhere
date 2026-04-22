<template>
  <div class="page">
    <div class="page__head card">
      <div>
        <p class="page__desc">
          Filtra por estado, prioridade, intervalo de datas, tipo de serviço e zona. Pesquisa por ID, cliente ou email (também
          disponível na barra superior com Enter).
        </p>
      </div>
    </div>

    <div class="filters card">
      <select v-model="f.status" class="sel">
        <option value="">Estado (todos)</option>
        <option v-for="(lab, key) in orderStatusLabels" :key="key" :value="key">{{ lab }}</option>
      </select>
      <select v-model="f.priority" class="sel">
        <option value="">Prioridade (todas)</option>
        <option v-for="p in 5" :key="p" :value="String(p)">{{ priorityLabels[p] }}</option>
      </select>
      <select v-model="f.type" class="sel">
        <option value="">Tipo (todos)</option>
        <option v-for="(lab, key) in orderTypeLabels" :key="key" :value="key">{{ lab }}</option>
      </select>
      <select v-model="f.zone" class="sel">
        <option value="">Zona (todas)</option>
        <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
      </select>
      <label class="date-lab">
        De
        <input v-model="f.dateFrom" type="date" class="sel" />
      </label>
      <label class="date-lab">
        Até
        <input v-model="f.dateTo" type="date" class="sel" />
      </label>
      <input v-model="f.q" type="search" class="sel grow" placeholder="Pesquisar ID, cliente, email…" />
    </div>

    <div class="presets card">
      <div class="presets__row">
        <label class="preset-name">
          <span>Nome do filtro guardado</span>
          <input v-model="presetName" type="text" class="inp" placeholder="Ex.: Urgentes Gaia" />
        </label>
        <button type="button" class="btn" @click="savePreset">Guardar filtro atual</button>
      </div>
      <div v-if="savedPresets.length" class="chips">
        <button v-for="p in savedPresets" :key="p.id" type="button" class="chip" @click="applyPreset(p)">
          {{ p.name }}
        </button>
      </div>
      <p v-else class="muted">Ainda não há filtros guardados neste browser.</p>
      <p v-if="activePresetLabel" class="preset-active">Ativo: {{ activePresetLabel }}</p>
    </div>

    <div class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Zona</th>
            <th>Tipo</th>
            <th>Prio</th>
            <th>Estado</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="!rows.length">
            <tr>
              <td colspan="8" class="empty-row">Nenhum pedido corresponde aos filtros ou à pesquisa.</td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="o in rows" :key="o.id">
              <td class="mono">{{ o.id }}</td>
              <td>{{ o.clientName }}</td>
              <td>{{ o.zone }}</td>
              <td>{{ orderTypeLabels[o.type] }}</td>
              <td><span :class="['prio', 'p' + o.priority]">{{ o.priority }}</span></td>
              <td>{{ orderStatusLabels[o.status] }}</td>
              <td class="muted">{{ o.createdAt.slice(0, 10) }}</td>
              <td>
                <RouterLink class="link" :to="{ name: 'order-detail', params: { id: o.id } }">Operar</RouterLink>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { logistics, filterOrders, orderStatusLabels } from '../stores/logisticsStore.js';
import { orderTypeLabels, priorityLabels, ZONES } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const route = useRoute();

const f = reactive({
  status: '',
  priority: '',
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

void logistics;
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.page__head {
  padding: 20px 22px;
}

.page__desc {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px;
  align-items: flex-end;
}

.presets {
  padding: 14px 16px;
}

.presets__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}

.preset-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--bo-text-secondary);
  flex: 1;
  min-width: 220px;
}

.inp {
  padding: 10px 12px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  font-size: 14px;
}

.btn {
  padding: 10px 14px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chip {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--bo-border);
  background: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.chip:hover {
  border-color: var(--bo-brand);
}

.preset-active {
  margin: 10px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--bo-brand-hover);
}

.presets .muted {
  margin: 10px 0 0;
  color: var(--bo-text-secondary);
  font-size: 13px;
}

.sel {
  padding: 10px 12px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  font-size: 13px;
  min-width: 140px;
}

.sel.grow {
  flex: 1;
  min-width: 200px;
}

.date-lab {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--bo-text-secondary);
}

.table-wrap {
  overflow: auto;
  padding: 0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--bo-border);
}

.data-table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--bo-text-secondary);
  background: var(--bo-page);
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}

.muted {
  color: var(--bo-text-secondary);
  font-size: 14px;
}

.prio {
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--bo-page);
}

.prio.p5 {
  background: #fef3c7;
  color: #b45309;
}

.link {
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.empty-row {
  text-align: center;
  padding: 28px 16px !important;
  color: var(--bo-text-secondary);
  font-size: 14px;
}
</style>
