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
          <span class="today-count">{{ todayHistory.length }} entregas</span>
          <span class="today-avg">Média: €{{ avgPerDeliveryToday }}/entrega</span>
        </div>
      </div>
    </div>

    <!-- History list -->
    <div class="page-body">
      <p v-if="!isLoading && history.length === 0" class="empty-hint">Ainda não tens entregas concluídas.</p>
      <div class="history-list">
        <div v-for="item in history" :key="item.id" class="history-card" :class="{ failed: item.isFailed }">
          <div class="hc-avatar" :class="{ failed: item.isFailed }">
            <svg v-if="item.isFailed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div class="hc-info">
            <div class="hc-top">
              <span class="hc-name">{{ item.clientName }}</span>
              <span class="hc-order">{{ item.orderId }}</span>
            </div>
            <span class="hc-time">{{ item.dateLabel }} · {{ item.time }} · {{ item.duration }} min</span>
          </div>
          <div class="hc-right">
            <span class="hc-price" :class="{ muted: item.isFailed }">€{{ item.earning.toFixed(2) }}</span>
            <span v-if="item.rating" class="hc-rating">
              {{ item.rating }} <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg>
            </span>
          </div>
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
import { deliveryCompletedAtIso, isDeliveryOnDate } from '../utils/deliveryDistance.js';

const isLoading = ref(true);

function mapHistoryItem(d) {
  const completedAt = deliveryCompletedAtIso(d);
  const isFailed = d.state === 'E-14';
  return {
    id: d.id,
    clientName: d.destination?.name || 'Cliente',
    orderId: d.orderId || `#ORD-${d.id}`,
    completedAt,
    isToday: isDeliveryOnDate(completedAt),
    isFailed,
    dateLabel: completedAt
      ? new Date(completedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
      : '',
    time: completedAt
      ? new Date(completedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
      : '--:--',
    duration: d.timestamps?.['E-09'] && completedAt
      ? Math.max(1, Math.round((new Date(completedAt) - new Date(d.timestamps['E-09'])) / 60000))
      : 0,
    earning: d.costEuro || 0,
    rating: d.rating,
  };
}

const history = computed(() => store.completedDeliveries.map(mapHistoryItem));

const todayHistory = computed(() => history.value.filter((h) => h.isToday));

const todayTotal = computed(() => todayHistory.value.reduce((s, h) => s + h.earning, 0));
const avgPerDeliveryToday = computed(() => (
  todayHistory.value.length ? (todayTotal.value / todayHistory.value.length).toFixed(2) : '0.00'
));

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

.empty-hint {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  margin: 8px 0 16px;
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
.history-card.failed {
  border-color: #fecaca;
}
.hc-avatar {
  width: 36px; height: 36px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hc-avatar.failed {
  background: #fee2e2;
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
.hc-right {
  display: flex; flex-direction: column; align-items: flex-end;
  flex-shrink: 0;
}
.hc-price {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #1b8a4a;
}
.hc-price.muted {
  color: #9ca3af;
}
.hc-rating {
  font-size: 11px; font-weight: 600; color: #111827;
  display: flex; align-items: center; gap: 2px; margin-top: 2px;
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
