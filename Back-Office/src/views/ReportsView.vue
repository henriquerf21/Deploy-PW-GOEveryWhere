<template>
  <div class="page">
    <div class="head card">
      <p class="lead">Indicadores comerciais e operacionais. Exporta os dados em CSV para análise externa.</p>
      <div class="exports">
        <button type="button" class="btn" @click="exportOrders">Exportar pedidos (CSV)</button>
        <button type="button" class="btn btn--go" @click="exportFull">Exportar relatório completo (CSV)</button>
      </div>
    </div>

    <div class="metrics">
      <article class="metric card">
        <h3>Taxa de cancelamento</h3>
        <p class="big">{{ cancelPct }}%</p>
        <p class="muted">Rácio de pedidos rejeitados sobre o total registado</p>
      </article>
    </div>

    <div class="row">
      <section class="card block">
        <h3>Receita mensal (k€)</h3>
        <div class="bars">
          <div v-for="m in monthlyRevenueSeries" :key="m.month" class="bar-col">
            <div class="bar" :style="{ height: (m.k / maxR) * 100 + '%' }" />
            <span>{{ m.month }}</span>
            <span class="k">{{ m.k }}k</span>
          </div>
        </div>
      </section>

      <section class="card block">
        <h3>Packs mais vendidos</h3>
        <ol class="packs">
          <li v-for="(p, i) in logistics.packSales" :key="p.sku">
            <span class="rank">{{ i + 1 }}</span>
            <div>
              <strong>{{ p.name }}</strong>
              <div class="muted">{{ p.sku }}</div>
            </div>
            <span class="units">{{ p.units }} u.</span>
          </li>
        </ol>
      </section>
    </div>

    <section class="card block full">
      <h3>Top zonas (entregas)</h3>
      <div class="zones">
        <div v-for="z in logistics.deliveriesByZone" :key="z.zone" class="zrow">
          <span>{{ z.zone }}</span>
          <div class="zbar"><div :style="{ width: (z.count / maxZ) * 100 + '%' }" /></div>
          <strong>{{ z.count }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  logistics,
  monthlyRevenueSeries,
  cancellationRatePct,
  exportOrdersCsv,
  exportFullReportCsv,
} from '../stores/logisticsStore.js';
import { toast } from '../utils/notify.js';

const cancelPct = computed(() => cancellationRatePct());

const maxR = computed(() => Math.max(...monthlyRevenueSeries.map((m) => m.k), 1));
const maxZ = computed(() => Math.max(...logistics.deliveriesByZone.map((z) => z.count), 1));

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

function exportFull() {
  download(`goeverywhere_relatorio_${Date.now()}.csv`, exportFullReportCsv());
}
</script>

<style scoped>
.page {
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

.head {
  padding: 20px 22px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.lead {
  margin: 0;
  max-width: 560px;
  font-size: 14px;
  color: var(--bo-text-secondary);
  line-height: 1.5;
}

.exports {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border-radius: var(--bo-radius-sm);
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn--go {
  background: var(--bo-brand);
  color: #fff;
  border-color: transparent;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.metric {
  padding: 20px;
}

.metric h3 {
  margin: 0 0 8px;
  font-size: 14px;
}

.big {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  font-family: var(--bo-font-display);
}

.muted {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--bo-text-secondary);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 800px) {
  .row {
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

.block.full {
  grid-column: 1 / -1;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 160px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--bo-text-secondary);
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #6ee7b7, var(--bo-brand));
  border-radius: 6px 6px 2px 2px;
  min-height: 4px;
}

.k {
  font-weight: 700;
  color: var(--bo-text);
}

.packs {
  list-style: none;
  margin: 0;
  padding: 0;
}

.packs li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--bo-border);
}

.rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--bo-brand-soft);
  color: var(--bo-brand);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.units {
  margin-left: auto;
  font-weight: 700;
}

.zones {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.zrow {
  display: grid;
  grid-template-columns: 140px 1fr 40px;
  gap: 12px;
  align-items: center;
  font-size: 14px;
}

.zbar {
  height: 10px;
  background: var(--bo-page);
  border-radius: 5px;
  overflow: hidden;
}

.zbar div {
  height: 100%;
  background: var(--bo-brand);
  border-radius: 5px;
}
</style>
