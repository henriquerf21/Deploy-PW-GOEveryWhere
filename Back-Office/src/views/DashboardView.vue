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
        <h3>SLA operacional (aprox.)</h3>
        <p class="block__sub">
          Tempos médios desde a criação do pedido por estado atual; tempo até atribuição baseado na última atualização; backlog de
          pendentes parados &gt; {{ sla?.stuckPendingThresholdMinutes ?? 45 }} min por zona.
        </p>
        <ul class="sla-grid">
          <li>
            <span class="sla-k">Média em pendente</span>
            <span class="sla-v">{{ fmtMin(sla?.avgMinutesInPending) }}</span>
          </li>
          <li>
            <span class="sla-k">Média em aprovado</span>
            <span class="sla-v">{{ fmtMin(sla?.avgMinutesInApproved) }}</span>
          </li>
          <li>
            <span class="sla-k">Média em atribuído+</span>
            <span class="sla-v">{{ fmtMin(sla?.avgMinutesInAssigned) }}</span>
          </li>
          <li>
            <span class="sla-k">Média até atribuição</span>
            <span class="sla-v">{{ fmtMin(sla?.avgMinutesUntilAssigned) }}</span>
          </li>
        </ul>
      </section>

      <section class="card block">
        <h3>Backlog crítico (pendentes parados)</h3>
        <p v-if="!slaBacklog.length" class="empty-zones">Sem pendentes acima do limiar nas últimas amostras.</p>
        <div v-else class="area-bars">
          <div v-for="a in slaBacklog" :key="a.zone" class="ab">
            <span class="ab__z">{{ a.zone }}</span>
            <div class="ab__t"><div class="ab__f ab__f--risk" :style="{ width: (a.count / maxBacklog) * 100 + '%' }" /></div>
            <span class="ab__n">{{ a.count }}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="row2">
      <section class="card block">
        <h3>Volume horário por hora de criação</h3>
        <p class="block__sub">Pedidos criados por hora (0–23), hora local do browser.</p>
        <p v-if="!hasHourlyData" class="empty-zones">Ainda não há pedidos para desenhar o histograma.</p>
        <div v-else class="bars24" role="img" aria-label="Histograma de pedidos por hora">
          <div v-for="(h, i) in logistics.hourlyVolume" :key="i" class="b24">
            <div class="b24__f" :style="{ height: (h / maxH) * 100 + '%' }" :title="`${h} pedido(s) às ${i}h`" />
            <span class="b24__x">{{ i }}</span>
          </div>
        </div>
      </section>

      <section class="card block">
        <h3>Estados dos pedidos</h3>
        <p v-if="!donutTotal" class="empty-zones">Sem pedidos no painel.</p>
        <div v-else class="donut-wrap">
          <div class="donut" :style="donutStyle" />
          <ul class="leg">
            <li v-for="s in donutLeg" :key="s.k"><i :style="{ background: s.c }" />{{ s.k }} ({{ s.n }})</li>
          </ul>
        </div>
      </section>
    </div>

    <div class="row2">
      <section class="card block">
        <h3>Pedidos por zona</h3>
        <p class="block__sub">Contagem por zona (exclui apenas rejeitados).</p>
        <div v-if="!logistics.deliveriesByZone.length" class="empty-zones">Sem pedidos elegíveis para agregar por zona.</div>
        <div v-else class="area-bars">
          <div v-for="a in logistics.deliveriesByZone" :key="a.zone" class="ab">
            <span class="ab__z">{{ a.zone }}</span>
            <div class="ab__t"><div class="ab__f" :style="{ width: (a.count / maxZ) * 100 + '%' }" /></div>
            <span class="ab__n">{{ a.count }}</span>
          </div>
        </div>
      </section>

      <section class="card block">
        <h3>Custo entregues por mês (k€)</h3>
        <p class="block__sub">
          Soma dos custos dos pedidos <strong>entregues</strong> nos últimos 6 meses (mês de criação do pedido). Valores em milhares de euros.
        </p>
        <div class="rev-bars">
          <div v-for="m in monthlyRevenueFromOrders" :key="m.month" class="rb">
            <div class="rb__f" :style="{ height: (m.k / maxRev) * 100 + '%' }" :title="`${m.k} k€`" />
            <span>{{ m.month }}</span>
            <span class="rb__k">{{ m.k }}</span>
          </div>
        </div>
      </section>
    </div>

    <div class="row2">
      <section class="card block">
        <h3>Pedidos por loja (recolha)</h3>
        <p class="block__sub">Contagem por Continente de recolha (exclui rejeitados; sem loja não entra).</p>
        <p v-if="!pickupsByStore.length" class="empty-zones">Sem pedidos com loja atribuída.</p>
        <div v-else class="area-bars">
          <div v-for="s in pickupsByStore" :key="s.storeId" class="ab">
            <span class="ab__z">{{ s.name }}</span>
            <div class="ab__t"><div class="ab__f ab__f--store" :style="{ width: (s.count / maxStore) * 100 + '%' }" /></div>
            <span class="ab__n">{{ s.count }}</span>
          </div>
        </div>
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
import {
  logistics,
  kpiSummary,
  monthlyRevenueFromOrders,
  pickupsByStore,
  ORDER_STATUS,
  orderStatusLabels,
} from '../stores/logisticsStore.js';

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
    { label: 'Pedidos ativos', value: k.active, hint: 'Pendentes, info, aprovados, atribuídos, em trânsito' },
    { label: 'Estafetas online', value: k.online, hint: 'E-06 com sessão ativa' },
    {
      label: 'Custo em pipeline',
      value: `€${k.revenuePipeline.toFixed(2)}`,
      hint: 'Soma custos: aprovado + atribuído + em trânsito',
    },
    {
      label: 'Custo entregues',
      value: `€${k.revenueDelivered.toFixed(2)}`,
      hint: 'Soma custos dos pedidos entregues',
    },
    { label: 'Produtos ativos', value: `${k.productsActive} / ${k.totalProducts}`, hint: 'SKU ativos no catálogo' },
    { label: 'Alertas stock', value: k.lowStockCount, hint: 'Ativos com stock ≤ limiar' },
    { label: 'Clientes', value: k.totalCustomers, hint: 'Registos na base' },
    {
      label: 'Rejeitados',
      value: `${k.rejectedCount} (${k.rejectionRatePct}%)`,
      hint: 'Pedidos rejeitados / total no painel',
    },
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
  margin: 0 0 8px;
  font-size: 15px;
}

.block__sub {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--bo-text-secondary);
  line-height: 1.45;
}

.bars24 {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 132px;
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

.ab__f--store {
  background: linear-gradient(90deg, #0d9488, var(--bo-brand));
}

.ab__f--risk {
  background: linear-gradient(90deg, #f97316, #ef4444);
}

.sla-grid {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  font-size: 13px;
}

.sla-grid li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
}

.sla-k {
  color: var(--bo-text-secondary);
  font-weight: 600;
  font-size: 12px;
}

.sla-v {
  font-weight: 800;
  font-size: 18px;
  font-family: var(--bo-font-display);
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

.rb__k {
  font-size: 10px;
  font-weight: 700;
  color: var(--bo-text-secondary);
}

.act {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 14px;
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

.empty-zones {
  margin: 0;
  font-size: 13px;
  color: var(--bo-text-secondary);
}
</style>
