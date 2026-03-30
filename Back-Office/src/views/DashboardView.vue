<template>
  <div class="dash">
    <div class="kpis">
      <article v-for="k in kpiItems" :key="k.label" class="kpi card">
        <p class="kpi__l">{{ k.label }}</p>
        <p class="kpi__v">{{ k.value }}</p>
        <p class="kpi__h">{{ k.hint }}</p>
      </article>
    </div>

    <div class="row2">
      <section class="card block">
        <h3>Volume horário (últimas 24h)</h3>
        <div class="bars24" role="presentation">
          <div v-for="(h, i) in logistics.hourlyVolume" :key="i" class="b24">
            <div class="b24__f" :style="{ height: (h / maxH) * 100 + '%' }" />
            <span class="b24__x">{{ i }}</span>
          </div>
        </div>
      </section>

      <section class="card block">
        <h3>Estados dos pedidos</h3>
        <div class="donut-wrap">
          <div class="donut" :style="donutStyle" />
          <ul class="leg">
            <li v-for="s in donutLeg" :key="s.k"><i :style="{ background: s.c }" />{{ s.k }} ({{ s.n }})</li>
          </ul>
        </div>
      </section>
    </div>

    <div class="row2">
      <section class="card block">
        <h3>Entregas por área</h3>
        <div class="area-bars">
          <div v-for="a in logistics.deliveriesByZone" :key="a.zone" class="ab">
            <span class="ab__z">{{ a.zone }}</span>
            <div class="ab__t"><div class="ab__f" :style="{ width: (a.count / maxZ) * 100 + '%' }" /></div>
            <span class="ab__n">{{ a.count }}</span>
          </div>
        </div>
      </section>

      <section class="card block">
        <h3>Gráfico de barras — receita (k€)</h3>
        <div class="rev-bars">
          <div v-for="m in monthlyRevenueSeries" :key="m.month" class="rb">
            <div class="rb__f" :style="{ height: (m.k / maxRev) * 100 + '%' }" />
            <span>{{ m.month }}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="row2">
      <section class="card block">
        <h3>Avaliações recentes</h3>
        <ul class="reviews">
          <li v-for="r in logistics.recentReviews" :key="r.at + r.client">
            <strong>{{ r.client }}</strong> · {{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}
            <p>{{ r.text }}</p>
            <time>{{ r.at.slice(0, 16).replace('T', ' ') }}</time>
          </li>
        </ul>
      </section>

      <section class="card block">
        <h3>Atividade recente</h3>
        <ul class="act">
          <li v-for="a in logistics.activityLog.slice(0, 12)" :key="a.id">
            <time>{{ a.at.slice(11, 16) }}</time>
            {{ a.text }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { logistics, kpiSummary, monthlyRevenueSeries, ORDER_STATUS, orderStatusLabels } from '../stores/logisticsStore.js';

const maxH = computed(() => Math.max(...logistics.hourlyVolume, 1));

const maxRev = computed(() => Math.max(...monthlyRevenueSeries.map((m) => m.k), 1));

const maxZ = computed(() => Math.max(...logistics.deliveriesByZone.map((z) => z.count), 1));

const kpiItems = computed(() => {
  const k = kpiSummary.value;
  return [
    { label: 'Pedidos hoje', value: k.ordersToday, hint: 'Novos registos' },
    { label: 'Pedidos ativos', value: k.active, hint: 'Em pipeline' },
    { label: 'Estafetas online', value: k.online, hint: 'E-06 disponíveis' },
    { label: 'Receita atribuída', value: `€${k.revenue.toFixed(2)}`, hint: 'Soma dos custos nos pedidos com valor' },
  ];
});

const statusColors = {
  [ORDER_STATUS.PENDING]: '#f59e0b',
  [ORDER_STATUS.INFO_REQUESTED]: '#8b5cf6',
  [ORDER_STATUS.REJECTED]: '#ef4444',
  [ORDER_STATUS.APPROVED]: '#3b82f6',
  [ORDER_STATUS.ASSIGNED]: '#06b6d4',
  [ORDER_STATUS.IN_TRANSIT]: '#10b981',
  [ORDER_STATUS.DELIVERED]: '#64748b',
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
.dash {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.kpi {
  padding: 18px 20px;
}

.kpi__l {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  text-transform: uppercase;
}

.kpi__v {
  margin: 8px 0 4px;
  font-size: 26px;
  font-weight: 800;
  font-family: var(--bo-font-display);
}

.kpi__h {
  margin: 0;
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 900px) {
  .row2 {
    grid-template-columns: 1fr;
  }
}

.block {
  padding: 20px;
}

.block h3 {
  margin: 0 0 16px;
  font-size: 15px;
}

.bars24 {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 120px;
}

.b24 {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.b24__f {
  width: 100%;
  background: linear-gradient(180deg, var(--bo-brand-mid), var(--bo-brand));
  border-radius: 3px 3px 0 0;
  min-height: 2px;
}

.b24__x {
  font-size: 8px;
  color: var(--bo-text-secondary);
}

.donut-wrap {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.donut {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  flex-shrink: 0;
}

.leg {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
}

.leg li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.leg i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  font-style: normal;
}

.area-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ab {
  display: grid;
  grid-template-columns: 120px 1fr 36px;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.ab__t {
  height: 10px;
  background: var(--bo-page);
  border-radius: 5px;
  overflow: hidden;
}

.ab__f {
  height: 100%;
  background: var(--bo-brand);
  border-radius: 5px;
}

.rev-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 140px;
}

.rb {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--bo-text-secondary);
}

.rb__f {
  width: 100%;
  background: linear-gradient(180deg, #6ee7b7, var(--bo-brand));
  border-radius: 6px 6px 2px 2px;
  min-height: 4px;
}

.reviews,
.act {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 14px;
}

.reviews li {
  padding: 12px 0;
  border-bottom: 1px solid var(--bo-border);
}

.reviews p {
  margin: 6px 0;
  color: var(--bo-text-secondary);
}

.reviews time {
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.act li {
  padding: 8px 0;
  border-bottom: 1px solid var(--bo-border);
  display: flex;
  gap: 10px;
  font-size: 13px;
}

.act time {
  color: var(--bo-text-secondary);
  font-family: ui-monospace, monospace;
  min-width: 40px;
}
</style>
