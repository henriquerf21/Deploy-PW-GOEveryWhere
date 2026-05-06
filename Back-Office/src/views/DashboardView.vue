<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Visão geral</p>
        <h1 class="bo-page-head__title">Dashboard operacional</h1>
        <p class="bo-page-head__sub">
          Indicadores em tempo real: SLA, volume horário, distribuição por estado, custo entregue e atividade recente.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <button type="button" class="bo-btn bo-btn--outline" :disabled="reportsBusy" @click="syncReports">
          {{ reportsBusy ? 'Relatórios…' : 'Atualizar relatórios' }}
        </button>
        <RouterLink to="/orders" class="bo-btn bo-btn--outline">Ir para pedidos</RouterLink>
        <RouterLink to="/map" class="bo-btn bo-btn--primary">Abrir mapa</RouterLink>
      </div>
    </header>

    <div class="bo-kpi-grid">
      <article v-for="(k, idx) in kpiItems" :key="k.label" class="bo-kpi" :class="kpiVariant(idx)">
        <span class="bo-kpi__label">{{ k.label }}</span>
        <span class="bo-kpi__value">{{ k.value }}</span>
        <span class="bo-kpi__hint">{{ k.hint }}</span>
      </article>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">SLA operacional</h3>
            <p class="bo-card__sub">Tempos médios por estado e backlog de pendentes parados.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div class="sla-grid">
            <div class="sla-tile">
              <span class="bo-eyebrow">Média em pendente</span>
              <span class="sla-tile__v">{{ fmtMin(sla?.avgMinutesInPending) }}</span>
            </div>
            <div class="sla-tile">
              <span class="bo-eyebrow">Média em aprovado</span>
              <span class="sla-tile__v">{{ fmtMin(sla?.avgMinutesInApproved) }}</span>
            </div>
            <div class="sla-tile">
              <span class="bo-eyebrow">Média em atribuído+</span>
              <span class="sla-tile__v">{{ fmtMin(sla?.avgMinutesInAssigned) }}</span>
            </div>
            <div class="sla-tile">
              <span class="bo-eyebrow">Média até atribuição</span>
              <span class="sla-tile__v">{{ fmtMin(sla?.avgMinutesUntilAssigned) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Backlog crítico</h3>
            <p class="bo-card__sub">Pendentes parados há mais de {{ sla?.stuckPendingThresholdMinutes ?? 45 }} min, agrupados por zona.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!slaBacklog.length" class="bo-muted" style="font-size: 13px;">Sem pendentes acima do limiar nas últimas amostras.</p>
          <div v-else class="area-bars">
            <div v-for="a in slaBacklog" :key="a.zone" class="area-bars__row">
              <span class="area-bars__label">{{ a.zone }}</span>
              <div class="area-bars__track"><div class="area-bars__fill area-bars__fill--risk" :style="{ width: (a.count / maxBacklog) * 100 + '%' }" /></div>
              <span class="area-bars__num bo-num">{{ a.count }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Volume horário</h3>
            <p class="bo-card__sub">Pedidos criados por hora (0-23, hora local).</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!hasHourlyData" class="bo-muted" style="font-size: 13px;">Ainda não há pedidos suficientes.</p>
          <div v-else class="hist24" role="img" aria-label="Histograma de pedidos por hora">
            <div v-for="(h, i) in logistics.hourlyVolume" :key="i" class="hist24__col">
              <div class="hist24__bar" :style="{ height: (h / maxH) * 100 + '%' }" :title="`${h} pedidos às ${i}h`" />
              <span class="hist24__x bo-num">{{ i }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Distribuição por estado</h3>
            <p class="bo-card__sub">Snapshot da carteira atual de pedidos.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!donutTotal" class="bo-muted" style="font-size: 13px;">Sem pedidos no painel.</p>
          <div v-else class="donut-wrap">
            <div class="donut" :style="donutStyle" />
            <ul class="donut-legend">
              <li v-for="s in donutLeg" :key="s.k">
                <span class="donut-legend__chip" :style="{ background: s.c }" />
                <span class="donut-legend__label">{{ s.k }}</span>
                <span class="bo-num bo-muted">({{ s.n }})</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Pedidos por zona</h3>
            <p class="bo-card__sub">Contagem por zona (excluí rejeitados).</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!logistics.deliveriesByZone.length" class="bo-muted" style="font-size: 13px;">Sem pedidos elegíveis.</p>
          <div v-else class="area-bars">
            <div v-for="a in logistics.deliveriesByZone" :key="a.zone" class="area-bars__row">
              <span class="area-bars__label">{{ a.zone }}</span>
              <div class="area-bars__track"><div class="area-bars__fill" :style="{ width: (a.count / maxZ) * 100 + '%' }" /></div>
              <span class="area-bars__num bo-num">{{ a.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Custo entregue (últimos 6 meses, k€)</h3>
            <p class="bo-card__sub">Soma dos custos dos pedidos entregues, por mês de criação. Valores em milhares de euros.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div class="month-bars">
            <div v-for="m in monthlyRevenueFromOrders" :key="m.month" class="month-bars__col">
              <div class="month-bars__bar" :style="{ height: (m.k / maxRev) * 100 + '%' }" :title="`${m.k} k€`" />
              <span class="month-bars__x bo-num">{{ m.month }}</span>
              <span class="month-bars__k bo-num">{{ m.k }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Pedidos por loja (recolha)</h3>
            <p class="bo-card__sub">Contagem por Continente de recolha.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!pickupsByStore.length" class="bo-muted" style="font-size: 13px;">Sem pedidos com loja atribuída.</p>
          <div v-else class="area-bars">
            <div v-for="s in pickupsByStore" :key="s.storeId" class="area-bars__row">
              <span class="area-bars__label">{{ s.name }}</span>
              <div class="area-bars__track"><div class="area-bars__fill area-bars__fill--store" :style="{ width: (s.count / maxStore) * 100 + '%' }" /></div>
              <span class="area-bars__num bo-num">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Atividade recente</h3>
            <p class="bo-card__sub">Últimos 12 eventos do painel.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <ul class="activity">
            <li v-for="a in logistics.activityLog.slice(0, 12)" :key="a.id" class="activity__row">
              <time class="activity__time bo-mono bo-muted">{{ a.at.slice(11, 16) }}</time>
              <span class="activity__text">{{ a.text }}</span>
            </li>
            <li v-if="!logistics.activityLog.length" class="bo-muted" style="font-size: 13px;">Sem atividade registada.</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  logistics,
  kpiSummary,
  monthlyRevenueFromOrders,
  pickupsByStore,
  refreshServerReports,
  ORDER_STATUS,
  orderStatusLabels,
} from '../stores/logisticsStore.js';
import { toast } from '../utils/notify.js';

const reportsBusy = ref(false);

async function syncReports() {
  reportsBusy.value = true;
  try {
    await refreshServerReports();
    toast('Relatórios sincronizados com o servidor.', 'success');
  } catch (e) {
    toast(e?.message || 'Falha ao atualizar relatórios.', 'error');
  } finally {
    reportsBusy.value = false;
  }
}

const sla = computed(() => logistics.slaMetrics || null);
const slaBacklog = computed(() => (Array.isArray(sla.value?.backlogStuckByZone) ? sla.value.backlogStuckByZone : []));
const maxBacklog = computed(() => Math.max(...slaBacklog.value.map((z) => z.count), 1));

function fmtMin(v) {
  if (v == null) return '—';
  return `${v} min`;
}

const hasHourlyData = computed(() => logistics.hourlyVolume.some((h) => h > 0));
const maxH = computed(() => Math.max(...logistics.hourlyVolume, 1));
const maxRev = computed(() => Math.max(...monthlyRevenueFromOrders.value.map((m) => m.k), 0.1));
const maxZ = computed(() => Math.max(...logistics.deliveriesByZone.map((z) => z.count), 1));
const maxStore = computed(() => Math.max(...pickupsByStore.value.map((s) => s.count), 1));

const kpiItems = computed(() => {
  const k = kpiSummary.value;
  return [
    { label: 'Pedidos hoje', value: k.ordersToday, hint: 'Criados na data de hoje' },
    { label: 'Pedidos ativos', value: k.active, hint: 'Pendente, info, aprovado, atribuído, em trânsito' },
    { label: 'Estafetas online', value: k.online, hint: 'E-06 com sessão ativa' },
    { label: 'Custo em pipeline', value: `€${k.revenuePipeline.toFixed(2)}`, hint: 'Soma custos: aprovado + atribuído + em trânsito' },
    { label: 'Custo entregues', value: `€${k.revenueDelivered.toFixed(2)}`, hint: 'Soma custos dos pedidos entregues' },
    { label: 'Produtos ativos', value: `${k.productsActive} / ${k.totalProducts}`, hint: 'SKU ativos no catálogo' },
    { label: 'Alertas stock', value: k.lowStockCount, hint: 'Ativos com stock abaixo do limiar' },
    { label: 'Clientes', value: k.totalCustomers, hint: 'Registos na base' },
    { label: 'Rejeitados', value: `${k.rejectedCount} (${k.rejectionRatePct}%)`, hint: 'Pedidos rejeitados / total' },
  ];
});

function kpiVariant(idx) {
  const variants = ['', 'bo-kpi--alt', 'bo-kpi--info', 'bo-kpi--warn', '', 'bo-kpi--alt', 'bo-kpi--warn', 'bo-kpi--info', 'bo-kpi--danger'];
  return variants[idx] || '';
}

const statusColors = {
  [ORDER_STATUS.PENDING]: '#d97706',
  [ORDER_STATUS.INFO_REQUESTED]: '#7c3aed',
  [ORDER_STATUS.REJECTED]: '#dc2626',
  [ORDER_STATUS.APPROVED]: '#2563eb',
  [ORDER_STATUS.ASSIGNED]: '#0d9488',
  [ORDER_STATUS.IN_TRANSIT]: '#1b8a4a',
  [ORDER_STATUS.DELIVERED]: '#64748b',
  [ORDER_STATUS.CANCELLED_ADMIN]: '#b91c1c',
};

const donutLeg = computed(() => {
  const map = {};
  for (const o of logistics.orders) {
    map[o.status] = (map[o.status] || 0) + 1;
  }
  return Object.entries(map).map(([st, n]) => ({
    k: orderStatusLabels[st] || st,
    n,
    c: statusColors[st] || '#94a3b8',
  }));
});

const donutTotal = computed(() => donutLeg.value.reduce((a, p) => a + p.n, 0));

const donutStyle = computed(() => {
  const parts = donutLeg.value;
  if (!parts.length) return { background: '#e5e7eb' };
  const total = parts.reduce((a, p) => a + p.n, 0);
  let acc = 0;
  const segs = parts.map((p) => {
    const pct = (p.n / total) * 100;
    const s = `${p.c} ${acc}% ${acc + pct}%`;
    acc += pct;
    return s;
  });
  return { background: `conic-gradient(${segs.join(', ')})` };
});
</script>

<style scoped>
.sla-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sla-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: var(--bo-radius);
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
}

.sla-tile__v {
  font-family: var(--bo-font-display);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.area-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.area-bars__row {
  display: grid;
  grid-template-columns: 130px 1fr 40px;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.area-bars__label {
  color: var(--bo-text);
  font-weight: 500;
}

.area-bars__track {
  height: 10px;
  background: var(--bo-page);
  border-radius: 999px;
  overflow: hidden;
}

.area-bars__fill {
  height: 100%;
  background: var(--bo-brand);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.area-bars__fill--store { background: linear-gradient(90deg, #0d9488, var(--bo-brand)); }
.area-bars__fill--risk { background: linear-gradient(90deg, #f97316, var(--bo-danger)); }

.area-bars__num {
  text-align: right;
  font-weight: 700;
  color: var(--bo-text);
}

.hist24 {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 140px;
}

.hist24__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hist24__bar {
  width: 100%;
  background: linear-gradient(180deg, var(--bo-brand-mid), var(--bo-brand));
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.4s ease;
}

.hist24__x {
  font-size: 9px;
  color: var(--bo-text-secondary);
}

.donut-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.donut {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.donut::after {
  content: '';
  position: absolute;
  inset: 24%;
  border-radius: 50%;
  background: var(--bo-surface);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04) inset;
}

.donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.donut-legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.donut-legend__chip {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.donut-legend__label { font-weight: 500; color: var(--bo-text); }

.month-bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 160px;
}

.month-bars__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.month-bars__bar {
  width: 100%;
  max-width: 36px;
  min-height: 4px;
  background: linear-gradient(180deg, var(--bo-brand-mid), var(--bo-brand));
  border-radius: 6px 6px 2px 2px;
  transition: height 0.4s ease;
}

.month-bars__x { color: var(--bo-text-secondary); font-weight: 600; }
.month-bars__k { font-size: 11px; font-weight: 700; color: var(--bo-text); }

.activity {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.activity__row {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bo-border);
  font-size: 13px;
}

.activity__row:last-child { border-bottom: none; }

.activity__time {
  min-width: 44px;
  font-size: 12px;
}

.activity__text {
  flex: 1;
  line-height: 1.45;
}
</style>
