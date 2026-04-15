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
import { computed } from 'vue';

const history = [
  { id: 1, clientName: 'Pedro F.', orderId: '#ORD-2847', time: '12:45', duration: 18, earning: 4.20 },
  { id: 2, clientName: 'Sofia L.', orderId: '#ORD-2846', time: '11:30', duration: 25, earning: 5.50 },
  { id: 3, clientName: 'Tiago M.', orderId: '#ORD-2845', time: '10:15', duration: 32, earning: 6.80 },
  { id: 4, clientName: 'Rita G.', orderId: '#ORD-2844', time: '09:22', duration: 15, earning: 3.90 },
  { id: 5, clientName: 'Carlos A.', orderId: '#ORD-2843', time: '08:50', duration: 22, earning: 4.60 },
  { id: 6, clientName: 'Ana R.', orderId: '#ORD-2842', time: '08:15', duration: 19, earning: 5.10 },
  { id: 7, clientName: 'Bruno M.', orderId: '#ORD-2841', time: '07:40', duration: 28, earning: 7.20 },
  { id: 8, clientName: 'Marta S.', orderId: '#ORD-2840', time: '07:10', duration: 20, earning: 10.00 },
];

const todayTotal = computed(() => history.reduce((s, h) => s + h.earning, 0));
const avgPerDelivery = computed(() => (todayTotal.value / history.length).toFixed(2));
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
