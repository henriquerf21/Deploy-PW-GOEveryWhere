<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Sub-header -->
    <div class="sub-header">
      <button class="back-btn" @click="$router.push('/deliveries')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Histórico de entregas</h2>
    </div>

    <!-- Today summary -->
    <div class="today-card">
      <span class="today-label">Total hoje</span>
      <div class="today-row">
        <span class="today-amount">€{{ todayTotal.toFixed(2) }}</span>
        <span class="today-divider"></span>
        <div class="today-details">
          <span class="today-count">{{ history.length }} entregas</span>
          <span class="today-avg">Média: €{{ avgPerDelivery }}/entrega</span>
        </div>
      </div>
    </div>

    <!-- History list -->
    <div class="page-body">
      <div class="history-list">
        <div v-for="item in history" :key="item.id" class="history-card">
          <div class="hc-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div class="hc-info">
            <div class="hc-top">
              <span class="hc-name">{{ item.clientName }}</span>
              <span class="hc-order">{{ item.orderId }}</span>
            </div>
            <span class="hc-time">{{ item.time }} · {{ item.duration }} min</span>
          </div>
          <span class="hc-price">€{{ item.earning.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-brand">
        <span class="footer-g">G</span>
        <span class="footer-name">GoEverywhere</span>
      </div>
      <p class="footer-copy">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { store, fetchCompletedDeliveries } from '../stores/courierStore.js';

const isLoading = ref(true);

const history = computed(() => {
  return store.completedDeliveries.map(d => ({
    id: d.id,
    clientName: d.destination?.name || 'Cliente',
    orderId: d.orderId || `#ORD-${d.id}`,
    time: d.timestamps?.['E-09'] ? new Date(d.timestamps['E-09']).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    duration: d.timestamps?.['E-09'] && d.timestamps?.['E-13']
      ? Math.max(1, Math.round((new Date(d.timestamps['E-13']) - new Date(d.timestamps['E-09'])) / 60000))
      : d.etaMinutes || 20,
    earning: d.costEuro || 0,
  }));
});

const todayTotal = computed(() => history.value.reduce((s, h) => s + h.earning, 0));
const avgPerDelivery = computed(() => history.value.length ? (todayTotal.value / history.value.length).toFixed(2) : '0.00');

onMounted(async () => {
  try {
    await fetchCompletedDeliveries();
  } catch (e) { /* fallback to existing */ }
  isLoading.value = false;
});
</script>

<style scoped>
.logo-mini {
  width: 36px; height: 34px;
  border-radius: 14px; object-fit: cover;
}
.header-title {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.sub-header {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 16px;
  background: #fff;
  border-top: 0.72px solid #e5e7eb;
}
.back-btn {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: #111827;
}
.sub-header h2 {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  margin: 0; color: #111827;
}

/* Today card */
.today-card {
  margin: 12px 16px;
  padding: 16px;
  background: var(--ge-history-green);
  border-radius: 16px;
  color: #fff;
}
.today-label {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  display: block;
  margin-bottom: 4px;
}
.today-row {
  display: flex; align-items: center; gap: 16px;
}
.today-amount {
  font-family: var(--ge-font-display);
  font-size: 24px; font-weight: 700;
}
.today-divider {
  width: 1px; height: 24px;
  background: rgba(255,255,255,0.1);
}
.today-details {
  display: flex; flex-direction: column;
}
.today-count {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
}
.today-avg {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
}

/* History list */
.history-list {
  display: flex; flex-direction: column; gap: 12px;
}
.history-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
}
.hc-avatar {
  width: 36px; height: 36px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hc-info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 0;
}
.hc-top {
  display: flex; align-items: center; gap: 8px;
}
.hc-name {
  font-size: 12px; font-weight: 500; color: #111827;
}
.hc-order {
  font-size: 9px; color: #9ca3af;
}
.hc-time {
  font-size: 10px; color: #9ca3af;
}
.hc-price {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #1b8a4a;
  flex-shrink: 0;
}

/* Footer */
.app-footer {
  text-align: center;
  padding: 32px 28px;
}
.footer-brand {
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  margin-bottom: 8px;
}
.footer-g {
  width: 28px; height: 28px;
  background: #1b8a4a; color: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
}
.footer-name {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.footer-copy {
  font-size: 11px; color: #9ca3af; margin: 0;
}
</style>
