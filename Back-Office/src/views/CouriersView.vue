<template>
  <div class="page">
    <div class="page__head card">
      <div>
        <h2 class="page__title">Estafetas</h2>
        <p class="page__desc">Frota, estados de verificação (E-01 a E-06), modo online e capacidade por estafeta.</p>
      </div>
      <RouterLink to="/couriers/new" class="btn-primary">+ Novo estafeta</RouterLink>
    </div>

    <div class="filters card">
      <select v-model="stateFilter" class="sel">
        <option value="">Estado (todos)</option>
        <option v-for="(lab, code) in courierStateLabels" :key="code" :value="code">{{ code }} — {{ lab }}</option>
      </select>
    </div>

    <div class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Estafeta</th>
            <th>Estado</th>
            <th>Online</th>
            <th>Zonas</th>
            <th>Max simult.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c.id">
            <td>
              <div class="strong">{{ c.name }}</div>
              <div class="muted">{{ c.email }}</div>
            </td>
            <td>{{ courierStateLabels[c.state] }}</td>
            <td>{{ c.online ? 'Sim' : 'Não' }}</td>
            <td class="muted">{{ c.zones.join(', ') }}</td>
            <td>{{ c.maxConcurrent }}</td>
            <td>
              <RouterLink class="link" :to="{ name: 'courier-detail', params: { id: c.id } }">Detalhe</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { logistics } from '../stores/logisticsStore.js';
import { courierStateLabels } from '../constants/logistics.js';

const stateFilter = ref('');

const filtered = computed(() => {
  if (!stateFilter.value) return logistics.couriers;
  return logistics.couriers.filter((c) => c.state === stateFilter.value);
});
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
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.page__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-family: var(--bo-font-display);
}

.page__desc {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.btn-primary {
  padding: 12px 18px;
  background: var(--bo-brand);
  color: #fff;
  font-weight: 600;
  border-radius: var(--bo-radius-sm);
  text-decoration: none;
}

.filters {
  padding: 12px 16px;
}

.sel {
  padding: 10px 14px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  min-width: 260px;
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
  border-bottom: 1px solid var(--bo-border);
  text-align: left;
}

.data-table th {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--bo-text-secondary);
  background: var(--bo-page);
}

.strong {
  font-weight: 600;
}

.muted {
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.link {
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}
</style>
