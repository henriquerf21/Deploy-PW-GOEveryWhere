<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Operações</p>
        <h1 class="bo-page-head__title">Clientes</h1>
      </div>
    </header>

    <section class="bo-card bo-card--padded">
      <div class="bo-row" style="gap: 16px; align-items: flex-end;">
        <div class="bo-field" style="flex: 1; max-width: 380px;">
          <label class="bo-field__label">Pesquisa</label>
          <input v-model="q" type="search" class="bo-input" placeholder="Nome, email, NIF ou cidade..." />
        </div>
        <div style="flex: 1;"></div>
        <span class="bo-badge bo-badge--info">{{ filtered.length }} cliente(s)</span>
      </div>
    </section>

    <div class="bo-table-wrap">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Contacto</th>
            <th>NIF</th>
            <th>Cidade / Zona</th>
            <th>Encomendas</th>
            <th>Gasto</th>
            <th>Última</th>
            <th>Aval.</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="9" class="bo-table__empty">
              <div class="bo-empty">
                <h3 class="bo-empty__title">Sem clientes</h3>
                <p class="bo-empty__hint">Nenhum cliente encontrado. Ajusta a pesquisa ou aguarda novos registos via Front-Office.</p>
              </div>
            </td>
          </tr>
          <tr v-for="c in filtered" :key="c.id">
            <td>
              <div class="customer-cell">
                <div class="bo-avatar">{{ initials(c.name) }}</div>
                <div>
                  <div class="bo-table__primary">{{ c.name }}</div>
                  <div class="bo-table__secondary bo-mono">{{ c.id }}</div>
                </div>
              </div>
            </td>
            <td>
              <div>{{ c.email }}</div>
              <div class="bo-table__secondary">{{ c.phone || '—' }}</div>
            </td>
            <td class="bo-mono bo-muted">{{ c.nif || '—' }}</td>
            <td>
              <div>{{ c.city || '—' }}</div>
              <div class="bo-table__secondary">{{ c.zone }}</div>
            </td>
            <td class="bo-num">{{ c.ordersCount }}</td>
            <td class="bo-num">{{ formatMoney(c.totalSpent) }}</td>
            <td class="bo-mono bo-muted">{{ c.lastOrderAt?.slice(0, 10) || '—' }}</td>
            <td>
              <span class="bo-badge bo-badge--brand">{{ (Number(c.avgRating) || 0).toFixed(1) }} / 5</span>
            </td>
            <td class="bo-table__actions">
              <RouterLink class="bo-btn bo-btn--sm bo-btn--outline" :to="{ name: 'customer-detail', params: { id: c.id } }">Detalhe</RouterLink>
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

const q = ref('');

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  const all = Array.isArray(logistics.customers) ? logistics.customers : [];
  if (!s) return all;
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) ||
      (c.city || '').toLowerCase().includes(s) ||
      (c.nif || '').toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s)
  );
});

function initials(name = '') {
  const p = String(name).split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return (String(name).slice(0, 2) || 'CL').toUpperCase();
}

function formatMoney(n) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
}
</script>

<style scoped>
.col-actions { width: 100px; text-align: right; }

.customer-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
