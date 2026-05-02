<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Operações</p>
        <h1 class="bo-page-head__title">Estafetas</h1>
        <p class="bo-page-head__sub">
          Frota completa: estados de verificação (E-01 a E-06), modo online, capacidade simultânea, zonas e estatísticas.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <RouterLink to="/couriers/new" class="bo-btn bo-btn--primary">
          <Plus :size="16" /> Novo estafeta
        </RouterLink>
      </div>
    </header>

    <section class="bo-card bo-card--padded">
      <div class="bo-row">
        <div class="bo-field" style="flex: 1; max-width: 320px;">
          <label class="bo-field__label">Pesquisa</label>
          <input v-model="search" type="search" class="bo-input" placeholder="Nome, email ou ID..." />
        </div>
        <div class="bo-field" style="min-width: 200px;">
          <label class="bo-field__label">Estado</label>
          <select v-model="stateFilter" class="bo-select">
            <option value="">Todos</option>
            <option v-for="(lab, code) in courierStateLabels" :key="code" :value="code">{{ code }} · {{ lab }}</option>
          </select>
        </div>
        <div class="bo-field" style="min-width: 160px;">
          <label class="bo-field__label">Modo</label>
          <select v-model="onlineFilter" class="bo-select">
            <option value="">Online e offline</option>
            <option value="online">Apenas online</option>
            <option value="offline">Apenas offline</option>
          </select>
        </div>
        <div style="flex: 1;"></div>
        <span class="bo-badge bo-badge--info">{{ filtered.length }} estafeta(s)</span>
      </div>
    </section>

    <div class="bo-table-wrap">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Estafeta</th>
            <th>Estado</th>
            <th>Modo</th>
            <th>Zonas</th>
            <th>Capacidade</th>
            <th>Documentos</th>
            <th class="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="7" class="bo-table__empty">
              <div class="bo-empty">
                <h3 class="bo-empty__title">Sem estafetas</h3>
                <p class="bo-empty__hint">Nenhum estafeta corresponde aos filtros aplicados.</p>
              </div>
            </td>
          </tr>
          <tr v-for="c in filtered" :key="c.id">
            <td>
              <div class="courier-cell">
                <div class="bo-avatar">{{ initials(c.name) }}</div>
                <div>
                  <div class="bo-table__primary">{{ c.name }}</div>
                  <div class="bo-table__secondary">{{ c.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="bo-badge" :class="stateBadgeClass(c.state)">{{ c.state }} · {{ courierStateLabels[c.state] }}</span>
            </td>
            <td>
              <span class="bo-badge" :class="c.online ? 'bo-badge--success' : 'bo-badge--neutral'">{{ c.online ? 'Online' : 'Offline' }}</span>
            </td>
            <td class="bo-muted" style="font-size: 13px;">{{ (c.zones || []).join(', ') || '—' }}</td>
            <td class="bo-num">{{ c.maxConcurrent }} simult.</td>
            <td>
              <div class="docs-cell">
                <span class="docs-cell__pip" :class="{ 'is-ok': c.docs?.idDoc }" title="ID/CC">CC</span>
                <span class="docs-cell__pip" :class="{ 'is-ok': c.docs?.license }" title="Carta">CART</span>
                <span class="docs-cell__pip" :class="{ 'is-ok': c.docs?.insurance }" title="Seguro">SEG</span>
                <span class="docs-cell__pip" :class="{ 'is-ok': c.docs?.inspection }" title="Inspeção">INSP</span>
              </div>
            </td>
            <td class="bo-table__actions">
              <RouterLink class="bo-btn bo-btn--sm bo-btn--outline" :to="{ name: 'courier-detail', params: { id: c.id } }">Detalhe</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import { logistics } from '../stores/logisticsStore.js';
import { courierStateLabels, COURIER_STATE } from '../constants/logistics.js';

const stateFilter = ref('');
const onlineFilter = ref('');
const search = ref('');

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return logistics.couriers.filter((c) => {
    if (stateFilter.value && c.state !== stateFilter.value) return false;
    if (onlineFilter.value === 'online' && !c.online) return false;
    if (onlineFilter.value === 'offline' && c.online) return false;
    if (!q) return true;
    return [c.name, c.email, c.id].some((v) => String(v || '').toLowerCase().includes(q));
  });
});

function initials(name = '') {
  const p = String(name).split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return (String(name).slice(0, 2) || 'ES').toUpperCase();
}

function stateBadgeClass(state) {
  switch (state) {
    case COURIER_STATE.E01: return 'bo-badge--warn';
    case COURIER_STATE.E02: return 'bo-badge--info';
    case COURIER_STATE.E03: return 'bo-badge--danger';
    case COURIER_STATE.E04: return 'bo-badge--danger';
    case COURIER_STATE.E05: return 'bo-badge--neutral';
    case COURIER_STATE.E06: return 'bo-badge--success';
    default: return 'bo-badge--neutral';
  }
}
</script>

<style scoped>
.col-actions { width: 130px; text-align: right; }

.courier-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.docs-cell {
  display: inline-flex;
  gap: 4px;
}

.docs-cell__pip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  min-width: 38px;
  padding: 0 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border-radius: 6px;
  background: #f3f4f6;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
}

.docs-cell__pip.is-ok {
  background: var(--bo-success-soft);
  color: var(--bo-success);
  border-color: #a7f3d0;
}
</style>
