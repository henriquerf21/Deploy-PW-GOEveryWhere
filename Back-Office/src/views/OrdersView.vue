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
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { logistics, filterOrders, orderStatusLabels } from '../stores/logisticsStore.js';
import { orderTypeLabels, priorityLabels, ZONES } from '../constants/logistics.js';

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
</style>
