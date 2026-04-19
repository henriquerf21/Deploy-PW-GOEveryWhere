<template>
  <div class="page completed-page">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Success icon -->
    <div class="success-circle">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
    </div>

    <!-- Title -->
    <div class="completed-header">
      <h1>Entrega concluída!</h1>
      <p>{{ delivery?.orderId }} · {{ delivery?.destination?.name }}</p>
    </div>

    <!-- Stats + Times card -->
    <div class="completed-card">
      <!-- Earning & Duration -->
      <div class="completed-stats">
        <div class="cs-item">
          <span class="cs-label">Ganho</span>
          <span class="cs-value cs-green">€{{ delivery?.costEuro?.toFixed(2) || '6.50' }}</span>
        </div>
        <div class="cs-item">
          <span class="cs-label">Duração</span>
          <span class="cs-value">{{ duration }} min</span>
        </div>
      </div>

      <!-- Times -->
      <div class="times-section">
        <span class="times-title">TEMPOS</span>
        <div class="time-row" v-for="(t, i) in times" :key="i">
          <span class="time-label">{{ t.label }}</span>
          <span class="time-value">{{ t.time }}</span>
        </div>
      </div>

      <!-- Confirmation badges -->
      <div class="confirm-section">
        <span class="confirm-title">CONFIRMAÇÃO</span>
        <div class="confirm-badges">
          <span class="confirm-badge" v-if="delivery?.confirmData?.photo">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
            Foto
          </span>
          <span class="confirm-badge" v-if="delivery?.confirmData?.location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
            GPS
          </span>
          <span class="confirm-badge" v-if="delivery?.confirmData?.signature">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
            Assinatura
          </span>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="completed-actions">
      <button class="next-btn" @click="$router.push('/deliveries')">
        <span>Próxima entrega</span>
      </button>
      <p class="praise">Excelente trabalho, {{ store.courier.name?.split(' ')[0] }}! 🎉</p>
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
import { useRoute } from 'vue-router';
import { store } from '../stores/courierStore.js';

const route = useRoute();
const id = route.params.id;

const delivery = computed(() =>
  store.deliveries.find((d) => d.id === id) ||
  store.deliveries.find((d) => d.id === Number(id))
);

const now = new Date();
const fmt = (d) => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const times = computed(() => {
  const ts = delivery.value?.timestamps || {};
  return [
    { label: 'Aceite', time: ts.accepted || '14:50' },
    { label: 'Em recolha', time: ts.pickup || '14:51' },
    { label: 'Em trânsito', time: ts.transit || '14:51' },
    { label: 'Chegou ao destino', time: ts.arrived || '14:51' },
    { label: 'Concluída', time: ts.completed || fmt(now) },
  ];
});

const duration = computed(() => {
  if (!delivery.value?.timestamps?.accepted) return 2;
  return Math.max(1, Math.round((now - new Date('2026-01-01T' + delivery.value.timestamps.accepted)) / 60000));
});
</script>

<style scoped>
.completed-page {
  background: #f8faf9;
  text-align: center;
}
.logo-mini {
  width: 36px; height: 34px;
  border-radius: 14px; object-fit: cover;
}
.header-title {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}

/* Success circle */
.success-circle {
  width: 80px; height: 80px;
  background: var(--ge-success-green);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 48px auto 24px;
  box-shadow: 0 8px 40px rgba(34,197,94,0.4);
  animation: pop-in 0.4s var(--ge-ease);
}
@keyframes pop-in {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Header */
.completed-header {
  margin-bottom: 0;
}
.completed-header h1 {
  font-family: var(--ge-font-display);
  font-size: 20px; font-weight: 700;
  color: #111827; margin: 0 0 4px;
}
.completed-header p {
  font-size: 14px; color: #6b7280;
  margin: 0;
}

/* Card */
.completed-card {
  margin: 24px 16px 0;
  padding: 20px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  text-align: left;
}
.completed-stats {
  display: flex; gap: 16px;
  margin-bottom: 16px;
}
.cs-item {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center;
}
.cs-label {
  font-size: 10px; color: #9ca3af;
  text-align: center;
}
.cs-value {
  font-family: var(--ge-font-display);
  font-size: 20px; font-weight: 700;
  color: #111827;
  text-align: center;
}
.cs-green { color: #1b8a4a; }

/* Times */
.times-section {
  padding-top: 16px;
  border-top: 0.72px solid #f1f5f2;
  border-bottom: 0.72px solid #f1f5f2;
  padding-bottom: 16px;
}
.times-title {
  font-family: var(--ge-font-display);
  font-size: 10px; font-weight: 600;
  color: #9ca3af;
  display: block;
  margin-bottom: 8px;
}
.time-row {
  display: flex; justify-content: space-between;
  padding: 4px 0;
}
.time-label {
  font-size: 12px; color: #6b7280;
}
.time-value {
  font-family: var(--ge-font-mono);
  font-size: 12px; color: #111827;
}

/* Confirmation badges */
.confirm-section {
  padding-top: 16px;
}
.confirm-title {
  font-family: var(--ge-font-display);
  font-size: 10px; font-weight: 600;
  color: #9ca3af;
  display: block;
  margin-bottom: 8px;
}
.confirm-badges {
  display: flex; gap: 8px;
}
.confirm-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  background: #dcfce7;
  border-radius: var(--ge-radius-full);
  font-size: 10px; color: #166534;
}

/* Actions */
.completed-actions {
  padding: 24px 16px;
}
.next-btn {
  width: 100%;
  padding: 16px;
  background: #1b8a4a;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  box-shadow: 0 8px 24px rgba(27,138,74,0.25);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.next-btn:active { transform: scale(0.97); }
.praise {
  font-size: 14px; color: #6b7280;
  margin: 12px 0 0;
  text-align: center;
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
