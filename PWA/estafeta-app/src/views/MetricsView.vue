<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Title bar -->
    <div class="title-bar">
      <h1>Registos e Métricas</h1>
    </div>

    <div class="page-body">
      <!-- Objetivo mensal -->
      <div class="metric-card">
        <h3>Objetivo mensal <span class="metric-pct-badge">{{ monthlyObjectivePct }}%</span></h3>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${monthlyObjectivePct}%` }"></div>
        </div>
        <p class="metric-desc">Atingiste {{ monthlyObjectivePct }}% do objetivo de entregas deste mês.</p>
      </div>

      <!-- Taxa de Faturação -->
      <div class="metric-card">
        <h3>Taxa de Faturação</h3>
        <div class="ring-row">
          <div class="ring" :style="{ '--pct': billingGoalPct }">
            <div class="ring-inner">
              <small>Total</small>
              <strong>{{ billingGoalPct }}%</strong>
            </div>
          </div>
          <div class="ring-side">
            <div class="ring-main">{{ metrics.earningsThisWeek.toFixed(0) }}<small>/{{ billingGoalEuro }}</small></div>
            <p class="metric-desc">Atingiste {{ billingGoalPct }}% do objetivo de faturação desta semana.</p>
          </div>
        </div>
      </div>

      <!-- Kilometros Semanais -->
      <div class="metric-card">
        <h3>Kilometros Semanais</h3>
        <div class="semi-wrap">
          <svg class="semi" viewBox="0 0 120 70" aria-hidden="true">
            <path d="M10 60 A50 50 0 0 1 110 60" class="semi-bg" />
            <path d="M10 60 A50 50 0 0 1 110 60" class="semi-fg" :style="{ '--km-pct': kmGoalPct }" />
          </svg>
          <div class="semi-center">
            <small>Total</small>
            <strong>{{ metrics.distanceKmThisWeek }}km</strong>
          </div>
        </div>
      </div>

      <!-- Avaliações -->
      <div class="metric-card">
        <h3>Avaliações <span class="rating-badge-sm">★</span></h3>
        <div class="rating-row">
          <div class="rating-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg>
          </div>
          <div class="rating-value">{{ metrics.avgRating > 0 ? metrics.avgRating : 'N/A' }}</div>
          <div class="rating-stars" v-if="metrics.avgRating > 0">
            <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= roundedRating }">★</span>
          </div>
        </div>

        <div class="ratings-history" v-if="ratingsHistory.length > 0">
          <h4 class="history-title">Histórico de Avaliações</h4>
          <div v-for="r in ratingsHistory" :key="r.id" class="rating-item">
            <div class="rating-item-header">
              <span class="rating-item-stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ on: i <= r.rating }">★</span>
              </span>
              <span class="rating-item-date">{{ r.date }}</span>
            </div>
            <p v-if="r.comment" class="rating-item-comment">"{{ r.comment }}"</p>
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
import { store, courierMetrics, fetchCompletedDeliveries } from '../stores/courierStore.js';

const metrics = computed(() => courierMetrics.value);
const monthlyTargetDeliveries = 40;
const billingGoalEuro = 500;
const weeklyKmGoal = 200;

const monthlyObjectivePct = computed(() => {
  const p = Math.round((metrics.value.completedDeliveriesThisMonth / monthlyTargetDeliveries) * 100);
  return Math.max(0, Math.min(100, p));
});
const billingGoalPct = computed(() => {
  const p = Math.round((metrics.value.earningsThisWeek / billingGoalEuro) * 100);
  return Math.max(0, Math.min(100, p));
});
const kmGoalPct = computed(() => {
  const p = (metrics.value.distanceKmThisWeek / weeklyKmGoal) * 100;
  return Math.max(0, Math.min(100, p));
});
const roundedRating = computed(() => Math.max(0, Math.min(5, Math.round(metrics.value.avgRating || 0))));

const ratingsHistory = computed(() => {
  return store.completedDeliveries
    .filter(d => d.rating)
    .map(d => ({
      id: d.id,
      rating: d.rating,
      comment: d.ratingComment || null,
      date: d.timestamps?.['E-13'] ? new Date(d.timestamps['E-13']).toLocaleDateString('pt-PT') : 'N/A'
    }))
    .slice(0, 10);
});

onMounted(async () => {
  await fetchCompletedDeliveries();
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
.title-bar {
  padding: 8px 16px;
  background: #fff;
  border-top: 0.72px solid #e5e7eb;
}
.title-bar h1 {
  font-family: var(--ge-font-display);
  font-size: 16px; font-weight: 700;
  margin: 0; color: #111827;
}

/* Metric cards */
.metric-card {
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.metric-card h3 {
  margin: 0 0 12px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  color: #111827;
  display: flex; align-items: center; gap: 8px;
}
.metric-pct-badge {
  background: #eff6ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: var(--ge-radius-full);
  font-size: 11px; font-weight: 700;
}
.metric-desc {
  font-size: 12px; color: #6b7280;
  margin: 10px 0 0;
}

/* Progress bar */
.progress-track {
  height: 10px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.5s var(--ge-ease);
}

/* Ring */
.ring-row {
  display: flex; gap: 16px; align-items: center;
}
.ring {
  --pct: 0;
  width: 100px; height: 100px;
  border-radius: 50%;
  background: conic-gradient(#14b8a6 calc(var(--pct) * 1%), #e5e7eb 0);
  padding: 8px;
  flex-shrink: 0;
}
.ring-inner {
  width: 100%; height: 100%;
  border-radius: 50%;
  background: #fff;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center;
}
.ring-inner small { font-size: 10px; color: #9ca3af; }
.ring-inner strong { font-size: 24px; font-weight: 700; }
.ring-side { flex: 1; }
.ring-main {
  font-size: 32px; font-weight: 700; line-height: 1;
}
.ring-main small { font-size: 18px; color: #9ca3af; }
.ring-side p { margin: 8px 0 0; }

/* Semi-circle */
.semi-wrap {
  position: relative;
  width: 100%; max-width: 240px;
  margin: 0 auto;
}
.semi { width: 100%; display: block; }
.semi-bg {
  fill: none; stroke: #e5e7eb;
  stroke-width: 10; stroke-linecap: round;
}
.semi-fg {
  --km-pct: 0;
  fill: none; stroke: #8b5cf6;
  stroke-width: 10; stroke-linecap: round;
  stroke-dasharray: 157;
  stroke-dashoffset: calc(157 - (157 * var(--km-pct) / 100));
  transition: stroke-dashoffset 0.5s var(--ge-ease);
}
.semi-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transform: translateY(8px);
  text-align: center;
}
.semi-center small { color: #9ca3af; font-size: 10px; }
.semi-center strong {
  font-size: 28px; font-weight: 700;
  font-family: var(--ge-font-display);
}

/* Rating */
.rating-badge-sm {
  color: #f59e0b; font-size: 14px;
}
.rating-row {
  display: flex; align-items: center; gap: 12px;
}
.rating-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #fffbeb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rating-value {
  font-size: 28px; font-weight: 700;
  font-family: var(--ge-font-display);
}
.rating-stars {
  display: flex; gap: 2px;
}
.star { color: #e5e7eb; font-size: 24px; transition: color 0.2s; }
.star.on { color: #f59e0b; }

.ratings-history {
  margin-top: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}
.history-title {
  font-family: var(--ge-font-display);
  font-size: 13px; font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}
.rating-item {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}
.rating-item-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
}
.rating-item-stars .star {
  font-size: 14px;
}
.rating-item-date {
  font-size: 11px;
  color: #9ca3af;
}
.rating-item-comment {
  font-size: 13px;
  color: #4b5563;
  margin: 0;
  font-style: italic;
}

/* Footer */
.app-footer {
  text-align: center; padding: 32px 28px;
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
.footer-copy { font-size: 11px; color: #9ca3af; margin: 0; }
</style>
