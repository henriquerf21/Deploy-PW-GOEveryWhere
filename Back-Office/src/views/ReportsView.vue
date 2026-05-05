<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Análise</p>
        <h1 class="bo-page-head__title">Relatórios</h1>
        <p class="bo-page-head__sub">
          Indicadores comerciais e operacionais. Exporta os dados em CSV para análise externa.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <button type="button" class="bo-btn bo-btn--outline" :disabled="reportsBusy" @click="syncReports">
          {{ reportsBusy ? 'A sincronizar…' : 'Sincronizar com servidor' }}
        </button>
        <button type="button" class="bo-btn bo-btn--outline" @click="exportOrders">Exportar pedidos</button>
        <button type="button" class="bo-btn bo-btn--primary" @click="exportFull">Exportar relatório completo</button>
      </div>
    </header>

    <div class="bo-kpi-grid">
      <article class="bo-kpi bo-kpi--danger">
        <span class="bo-kpi__label">Taxa de cancelamento</span>
        <span class="bo-kpi__value">{{ cancelPct }}%</span>
        <span class="bo-kpi__hint">Rácio de pedidos rejeitados sobre o total registado.</span>
      </article>
      <article class="bo-kpi bo-kpi--alt">
        <span class="bo-kpi__label">Pedidos no painel</span>
        <span class="bo-kpi__value">{{ logistics.orders.length }}</span>
        <span class="bo-kpi__hint">Total acumulado entre todas as zonas.</span>
      </article>
      <article class="bo-kpi bo-kpi--info">
        <span class="bo-kpi__label">Estafetas operacionais</span>
        <span class="bo-kpi__value">{{ activeCouriers }}</span>
        <span class="bo-kpi__hint">E-06 ou E-05 com sessão ativa.</span>
      </article>
      <article class="bo-kpi">
        <span class="bo-kpi__label">Clientes registados</span>
        <span class="bo-kpi__value">{{ logistics.customers.length }}</span>
        <span class="bo-kpi__hint">Base persistida em Strapi.</span>
      </article>
    </div>

    <div class="bo-grid bo-grid--2">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Custo entregues por mês (k€)</h3>
            <p class="bo-card__sub">Últimos 6 meses. Soma dos custos dos pedidos entregues por mês de criação.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div class="month-bars">
            <div v-for="m in monthlyRevenueFromOrders" :key="m.month" class="month-bars__col">
              <div class="month-bars__bar" :style="{ height: (m.k / maxR) * 100 + '%' }" :title="`${m.k} k€`" />
              <span class="month-bars__x bo-num">{{ m.month }}</span>
              <span class="month-bars__k bo-num">{{ m.k }}k</span>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Packs mais vendidos</h3>
            <p class="bo-card__sub">Ranking de unidades acumuladas por SKU.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <ol class="packs">
            <li v-for="(p, i) in logistics.packSales" :key="p.sku" class="packs__row">
              <span class="packs__rank">{{ i + 1 }}</span>
              <div class="packs__info">
                <strong>{{ p.name }}</strong>
                <span class="bo-mono bo-muted">{{ p.sku }}</span>
              </div>
              <span class="packs__units bo-num">{{ p.units }} u.</span>
            </li>
            <li v-if="!logistics.packSales.length" class="bo-muted" style="font-size: 13px;">Sem vendas registadas.</li>
          </ol>
        </div>
      </section>
    </div>

    <section class="bo-card">
      <header class="bo-card__head">
        <div>
          <h3 class="bo-card__title">Top zonas (entregas)</h3>
          <p class="bo-card__sub">Distribuição agregada de pedidos por zona de operação.</p>
        </div>
      </header>
      <div class="bo-card__body">
        <div class="zones">
          <div v-for="z in logistics.deliveriesByZone" :key="z.zone" class="zones__row">
            <span class="zones__label">{{ z.zone }}</span>
            <div class="zones__track"><div class="zones__fill" :style="{ width: (z.count / maxZ) * 100 + '%' }" /></div>
            <strong class="bo-num">{{ z.count }}</strong>
          </div>
          <p v-if="!logistics.deliveriesByZone.length" class="bo-muted" style="font-size: 13px;">Sem dados para apresentar.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  logistics,
  monthlyRevenueFromOrders,
  cancellationRatePct,
  exportOrdersCsv,
  exportFullReportCsv,
  refreshServerReports,
} from '../stores/logisticsStore.js';
import { toast } from '../utils/notify.js';

const reportsBusy = ref(false);

async function syncReports() {
  reportsBusy.value = true;
  try {
    await refreshServerReports();
    toast('Indicadores alinhados com GET /bo/reports.', 'success');
  } catch (e) {
    toast(e?.message || 'Falha ao sincronizar.', 'error');
  } finally {
    reportsBusy.value = false;
  }
}

onMounted(() => {
  void syncReports();
});

const cancelPct = computed(() => cancellationRatePct());

const maxR = computed(() => Math.max(...monthlyRevenueFromOrders.value.map((m) => m.k), 0.1));
const maxZ = computed(() => Math.max(...logistics.deliveriesByZone.map((z) => z.count), 1));
const activeCouriers = computed(() => logistics.couriers.filter((c) => c.online).length);

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
.month-bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 170px;
}

.month-bars__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--bo-text-secondary);
}

.month-bars__bar {
  width: 100%;
  max-width: 36px;
  min-height: 4px;
  background: linear-gradient(180deg, var(--bo-brand-mid), var(--bo-brand));
  border-radius: 6px 6px 2px 2px;
  transition: height 0.4s ease;
}

.month-bars__x { font-weight: 600; }
.month-bars__k { font-size: 11px; font-weight: 700; color: var(--bo-text); }

.packs {
  list-style: none;
  margin: 0;
  padding: 0;
}

.packs__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--bo-border);
}

.packs__row:last-child { border-bottom: none; }

.packs__rank {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--bo-brand-soft);
  color: var(--bo-brand-hover);
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-family: var(--bo-font-display);
}

.packs__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.packs__info strong { font-size: 13.5px; }

.packs__units {
  font-weight: 700;
  font-size: 13px;
  color: var(--bo-text);
  white-space: nowrap;
}

.zones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.zones__row {
  display: grid;
  grid-template-columns: 150px 1fr 50px;
  gap: 12px;
  align-items: center;
  font-size: 13.5px;
}

.zones__label { color: var(--bo-text); font-weight: 500; }

.zones__track {
  height: 10px;
  background: var(--bo-page);
  border-radius: 999px;
  overflow: hidden;
}

.zones__fill {
  height: 100%;
  background: var(--bo-brand);
  border-radius: 999px;
  transition: width 0.4s ease;
}
</style>
