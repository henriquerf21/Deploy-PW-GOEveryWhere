<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Visão geral</p>
        <h1 class="bo-page-head__title">Dashboard operacional</h1>
        <p class="bo-page-head__sub">
          Entregas por zona, estafetas disponíveis e volume de pedidos com filtro de período.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <button type="button" class="bo-btn bo-btn--outline" :disabled="reportsBusy" @click="syncReports">
          {{ reportsBusy ? 'A atualizar…' : 'Atualizar dados' }}
        </button>
        <button type="button" class="bo-btn bo-btn--outline" @click="exportOrders">Exportar pedidos</button>
        <RouterLink to="/map" class="bo-btn bo-btn--primary">Abrir mapa</RouterLink>
      </div>
    </header>

    <div class="bo-kpi-grid bo-kpi-grid--4">
      <article v-for="(k, idx) in kpiItems" :key="k.label" class="bo-kpi" :class="kpiVariant(idx)">
        <span class="bo-kpi__label">{{ k.label }}</span>
        <span class="bo-kpi__value">{{ k.value }}</span>
        <span class="bo-kpi__hint">{{ k.hint }}</span>
      </article>
    </div>

    <!-- Obrigatórios -->
    <div class="bo-grid bo-grid--3 dash-mandatory">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Entregas por zona</h3>
            <p class="bo-card__sub">Pedidos entregues (S-11), agrupados por zona de operação.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!deliveriesByZone.length" class="bo-muted dash-empty">Sem entregas concluídas no período carregado.</p>
          <div v-else class="area-bars">
            <div v-for="a in deliveriesByZone" :key="a.zone" class="area-bars__row">
              <span class="area-bars__label">{{ a.zone }}</span>
              <div class="area-bars__track">
                <div class="area-bars__fill" :style="{ width: (a.count / maxZone) * 100 + '%' }" />
              </div>
              <span class="area-bars__num bo-num">{{ a.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Estafetas disponíveis</h3>
            <p class="bo-card__sub">E-06 online — capacidade livre para nova atribuição.</p>
          </div>
          <RouterLink to="/couriers" class="bo-btn bo-btn--ghost bo-btn--sm">Ver todos</RouterLink>
        </header>
        <div class="bo-card__body">
          <p v-if="!availableCouriers.length" class="bo-muted dash-empty">Nenhum estafeta online neste momento.</p>
          <ul v-else class="courier-avail">
            <li v-for="c in availableCouriers" :key="c.id" class="courier-avail__row">
              <div class="courier-avail__main">
                <strong>{{ c.name }}</strong>
                <span class="bo-muted">{{ c.zones }}</span>
              </div>
              <span class="courier-avail__cap bo-num" :class="{ 'courier-avail__cap--full': c.free === 0 }">
                {{ c.free }}/{{ c.max }} livre
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Volume de pedidos</h3>
            <p class="bo-card__sub">{{ volumeSubtitle }}</p>
          </div>
          <div class="period-tabs" role="tablist">
            <button
              v-for="p in periodOptions"
              :key="p.id"
              type="button"
              class="period-tabs__btn"
              :class="{ 'period-tabs__btn--on': volumePeriod === p.id }"
              @click="volumePeriod = p.id"
            >
              {{ p.label }}
            </button>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="volumeTotal === 0" class="bo-muted dash-empty">Sem pedidos neste período.</p>
          <div v-else-if="volumePeriod === 'today'" class="hist24" role="img" :aria-label="volumeSubtitle">
            <div v-for="(h, i) in volumeHourly" :key="i" class="hist24__col">
              <div class="hist24__bar" :style="{ height: (h / maxHour) * 100 + '%' }" :title="`${h} às ${i}h`" />
              <span class="hist24__x bo-num">{{ i }}</span>
            </div>
          </div>
          <div v-else class="day-bars" role="img" :aria-label="volumeSubtitle">
            <div v-for="(n, i) in volumeDaily.counts" :key="i" class="day-bars__col">
              <div class="day-bars__bar" :style="{ height: (n / maxDay) * 100 + '%' }" :title="`${n} pedidos`" />
              <span class="day-bars__x bo-num">{{ volumeDaily.labels[i] }}</span>
            </div>
          </div>
          <p class="volume-total bo-muted">Total no período: <strong class="bo-num">{{ volumeTotal }}</strong> pedidos</p>
        </div>
      </section>
    </div>

    <!-- Operacional -->
    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">SLA operacional</h3>
            <p class="bo-card__sub">Tempos médios por estado.</p>
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
            <p class="bo-card__sub">
              Pendentes parados &gt; {{ sla?.stuckPendingThresholdMinutes ?? 45 }} min, por zona.
            </p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!slaBacklog.length" class="bo-muted dash-empty">Sem pendentes acima do limiar.</p>
          <div v-else class="area-bars">
            <div v-for="a in slaBacklog" :key="a.zone" class="area-bars__row">
              <span class="area-bars__label">{{ a.zone }}</span>
              <div class="area-bars__track">
                <div class="area-bars__fill area-bars__fill--risk" :style="{ width: (a.count / maxBacklog) * 100 + '%' }" />
              </div>
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
            <h3 class="bo-card__title">Distribuição por estado</h3>
            <p class="bo-card__sub">Carteira atual de pedidos.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <p v-if="!donutTotal" class="bo-muted dash-empty">Sem pedidos no painel.</p>
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

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Atividade recente</h3>
            <p class="bo-card__sub">Últimos eventos registados.</p>
          </div>
          <RouterLink to="/orders" class="bo-btn bo-btn--ghost bo-btn--sm">Pedidos</RouterLink>
        </header>
        <div class="bo-card__body">
          <ul class="activity">
            <li v-for="a in logistics.activityLog.slice(0, 10)" :key="a.id" class="activity__row">
              <time class="activity__time bo-mono bo-muted">{{ a.at.slice(11, 16) }}</time>
              <span class="activity__text">{{ a.text }}</span>
            </li>
            <li v-if="!logistics.activityLog.length" class="bo-muted dash-empty">Sem atividade registada.</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import {
  logistics,
  kpiSummary,
  deliveriesByZoneDelivered,
  dashboardAvailableCouriers,
  backlogStuckTotal,
  ordersInPeriod,
  buildHourlyVolume,
  buildDailyVolume,
  refreshServerReports,
  initLogistics,
  exportOrdersCsv,
  ORDER_STATUS,
  orderStatusLabels,
} from '../stores/logisticsStore.js';
import { toast } from '../utils/notify.js';

const reportsBusy = ref(false);
const volumePeriod = ref('today');

const periodOptions = [
  { id: 'today', label: 'Hoje' },
  { id: '7d', label: '7 dias' },
  { id: '30d', label: '30 dias' },
];

const deliveriesByZone = deliveriesByZoneDelivered;
const availableCouriers = dashboardAvailableCouriers;

const volumeOrders = computed(() => ordersInPeriod(volumePeriod.value));

const volumeHourly = computed(() => buildHourlyVolume(volumeOrders.value));
const volumeDaily = computed(() => {
  const days = volumePeriod.value === '30d' ? 30 : 7;
  return buildDailyVolume(volumeOrders.value, days);
});
const volumeTotal = computed(() => volumeOrders.value.length);
const maxHour = computed(() => Math.max(...volumeHourly.value, 1));
const maxDay = computed(() => Math.max(...volumeDaily.value.counts, 1));

const volumeSubtitle = computed(() => {
  if (volumePeriod.value === 'today') return 'Pedidos criados hoje, por hora (0–23h).';
  if (volumePeriod.value === '7d') return 'Pedidos criados nos últimos 7 dias.';
  return 'Pedidos criados nos últimos 30 dias.';
});

async function syncReports() {
  reportsBusy.value = true;
  try {
    await initLogistics({ force: true, silent: true });
    await refreshServerReports();
    toast('Dados do dashboard atualizados.', 'success');
  } catch (e) {
    toast(e?.message || 'Falha ao atualizar.', 'error');
  } finally {
    reportsBusy.value = false;
  }
}

onMounted(() => {
  void syncReports();
});

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Ficheiro ${filename} gerado.`, 'success');
}

function exportOrders() {
  download(`goeverywhere_pedidos_${Date.now()}.csv`, exportOrdersCsv());
}

const sla = computed(() => logistics.slaMetrics || null);
const slaBacklog = computed(() => (Array.isArray(sla.value?.backlogStuckByZone) ? sla.value.backlogStuckByZone : []));
const maxBacklog = computed(() => Math.max(...slaBacklog.value.map((z) => z.count), 1));
const maxZone = computed(() => Math.max(...deliveriesByZone.value.map((z) => z.count), 1));

function fmtMin(v) {
  if (v == null) return '—';
  return `${v} min`;
}

const kpiItems = computed(() => {
  const k = kpiSummary.value;
  return [
    { label: 'Pedidos hoje', value: k.ordersToday, hint: 'Criados na data de hoje' },
    { label: 'Pedidos ativos', value: k.active, hint: 'Em fluxo operacional' },
    { label: 'Estafetas online', value: k.online, hint: 'E-06 com sessão ativa' },
    { label: 'Backlog crítico', value: backlogStuckTotal.value, hint: 'Pendentes parados por zona' },
  ];
});

function kpiVariant(idx) {
  const variants = ['', 'bo-kpi--alt', 'bo-kpi--info', 'bo-kpi--warn'];
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
.bo-kpi-grid--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .bo-kpi-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .dash-mandatory { grid-template-columns: 1fr; }
}

.dash-mandatory {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dash-empty {
  font-size: 13px;
  margin: 0;
}

.period-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.period-tabs__btn {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--bo-border);
  border-radius: 8px;
  background: var(--bo-page);
  color: var(--bo-text-secondary);
  cursor: pointer;
}

.period-tabs__btn--on {
  background: var(--bo-brand-soft);
  color: var(--bo-brand-hover);
  border-color: var(--bo-brand-mid);
}

.volume-total {
  margin: 12px 0 0;
  font-size: 12px;
  text-align: center;
}

.volume-total strong {
  color: var(--bo-text);
}

.courier-avail {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 220px;
  overflow-y: auto;
}

.courier-avail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bo-border);
  font-size: 13px;
}

.courier-avail__row:last-child { border-bottom: none; }

.courier-avail__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.courier-avail__main strong {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.courier-avail__main .bo-muted {
  font-size: 11px;
}

.courier-avail__cap {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--bo-brand-hover);
}

.courier-avail__cap--full {
  color: var(--bo-danger);
}

.day-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 140px;
}

.day-bars__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.day-bars__bar {
  width: 100%;
  background: linear-gradient(180deg, var(--bo-brand-mid), var(--bo-brand));
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.4s ease;
}

.day-bars__x {
  font-size: 8px;
  color: var(--bo-text-secondary);
  text-align: center;
  line-height: 1.1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

.area-bars__fill--risk {
  background: linear-gradient(90deg, #f97316, var(--bo-danger));
}

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

.activity {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 280px;
  overflow-y: auto;
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
