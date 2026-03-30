<template>
  <div class="page-wrapper">
    <SiteHeader />

    <main class="history-main">
      <!-- Tabs -->
      <div class="tabs">
        <router-link to="/order/tracking" class="tab">Encomenda Ativa</router-link>
        <button class="tab active">Histórico</button>
      </div>

      <!-- GoPoints Balance -->
      <div class="gopoints-bar">
        <div class="gp-left">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f57f17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
          <div>
            <span class="gp-balance">{{ store.goPoints.balance }} GoPoints</span>
            <span v-if="store.goPoints.pending > 0" class="gp-pending">+{{ store.goPoints.pending }} pts pendentes</span>
          </div>
        </div>
        <div class="gp-tiers">
          <span class="tier" :class="{ available: store.goPoints.balance >= 500 }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            500 pts = Entrega grátis
          </span>
          <span class="tier" :class="{ available: store.goPoints.balance >= 1000 }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            1000 pts = Produto grátis
          </span>
        </div>
      </div>

      <div class="orders-list" v-if="store.orderHistory.length > 0">
        <div
          v-for="order in store.orderHistory"
          :key="order.id"
          class="order-card"
        >
          <div class="order-top">
            <div>
              <h3>#{{ order.id }}</h3>
              <span class="order-date">{{ order.date }}</span>
            </div>
            <span class="status" :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
          </div>
          <div class="order-items">
            <span v-for="p in order.products" :key="p.name" class="order-product">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#00c853" stroke="none"><circle cx="12" cy="12" r="8"/></svg>
              {{ p.name }}
            </span>
            <span class="order-total">€{{ order.total.toFixed(2) }}</span>
          </div>
          <div class="order-meta">
            <span v-if="order.store" class="meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ order.store }}
            </span>
          </div>
          <div class="order-bottom">
            <div class="delivery-info">
              <span v-if="order.deliveryTime" class="info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ order.deliveryTime }} min
              </span>
              <span v-if="order.rating" class="info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ order.rating.toFixed(1) }}
              </span>
              <span v-else-if="order.status === 'S-11'" class="unrated">Sem avaliação</span>
            </div>
            <div class="order-actions">
              <button
                v-if="!order.rated && (order.status === 'S-11' || order.status === 'S-16')"
                class="btn-rate"
                @click="openRatingModal(order)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Avaliar
              </button>
              <button class="btn-repeat" @click="repeatOrder(order)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                Repetir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <h3>Sem histórico</h3>
        <p>Ainda não fizeste nenhuma encomenda.</p>
        <router-link to="/order/select" class="btn-new">Fazer a Primeira Encomenda →</router-link>
      </div>

      <!-- Rating Modal -->
      <Transition name="modal">
        <div v-if="showRatingModal" class="modal-overlay" @click.self="showRatingModal = false">
          <div class="modal-card">
            <h3>Avaliar Encomenda</h3>
            <p>Como foi a tua experiência com a encomenda <strong>#{{ ratingOrder?.id }}</strong>?</p>
            <div class="star-rating">
              <button
                v-for="s in 5"
                :key="s"
                class="star-btn"
                :class="{ filled: s <= ratingValue }"
                @click="ratingValue = s"
                :aria-label="'Avaliar ' + s + ' estrelas'"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" :fill="s <= ratingValue ? '#f59e0b' : 'none'" :stroke="s <= ratingValue ? '#f59e0b' : '#d1d5db'" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
            </div>
            <div v-if="ratingValue > 0" class="rating-label">
              {{ ratingLabels[ratingValue - 1] }}
            </div>
            <div class="modal-actions">
              <button class="btn-modal-cancel" @click="showRatingModal = false">Cancelar</button>
              <button class="btn-modal-confirm" @click="submitRating" :disabled="ratingValue === 0">
                Enviar
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand"><span class="footer-logo">G</span><span>GoEverywhere</span></div>
        <p class="copyright">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore, ORDER_STATES, reOrder, rateOrder } from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const showRatingModal = ref(false);
const ratingOrder = ref(null);
const ratingValue = ref(0);
const ratingLabels = ['Mau', 'Medíocre', 'Razoável', 'Bom', 'Excelente'];

function statusLabel(status) {
  return ORDER_STATES[status]?.label || status;
}

function statusClass(status) {
  if (['S-11', 'S-15', 'S-16'].includes(status)) return 'delivered';
  if (['S-04', 'S-12', 'S-13', 'S-14'].includes(status)) return 'cancelled';
  if (['S-07', 'S-08', 'S-09'].includes(status)) return 'active';
  return 'pending';
}

function openRatingModal(order) {
  ratingOrder.value = order;
  ratingValue.value = 0;
  showRatingModal.value = true;
}

function submitRating() {
  if (ratingOrder.value && ratingValue.value > 0) {
    rateOrder(ratingOrder.value.id, ratingValue.value);
    showRatingModal.value = false;
  }
}

function repeatOrder(order) {
  reOrder(order);
  router.push('/order/select');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: #f6f7f7; color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

.site-header { background: rgba(255,255,255,0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; padding: 14px 32px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111827; transition: opacity 0.2s; }
.logo:hover { opacity: 0.8; }
.logo-img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; }
.logo-text { font-family: 'Lora', serif; font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }

.history-main { flex: 1; padding: 32px; animation: contentIn 0.5s ease-out; }
@keyframes contentIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.tabs { display: flex; gap: 0; max-width: 700px; margin: 0 auto 28px; background: #e5e7eb; border-radius: 12px; padding: 4px; }
.tab { flex: 1; padding: 12px; text-align: center; border: none; background: transparent; font-family: 'Raleway', sans-serif; font-weight: 600; font-size: 14px; color: #6b7280; cursor: pointer; border-radius: 10px; text-decoration: none; transition: all 0.25s ease; }
.tab.active { background: #fff; color: #111827; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.tab:hover:not(.active) { color: #374151; }

/* GoPoints Bar */
.gopoints-bar { max-width: 700px; margin: 0 auto 28px; background: linear-gradient(135deg, #fffde7, #fff8e1); border: 1.5px solid #ffd54f; border-radius: 16px; padding: 22px 26px; display: flex; justify-content: space-between; align-items: center; }
.gp-left { display: flex; align-items: center; gap: 16px; }
.gp-balance { font-weight: 800; font-size: 20px; color: #f57f17; display: block; font-family: 'Lora', serif; }
.gp-pending { font-size: 12px; color: #9ca3af; display: block; }
.gp-tiers { display: flex; flex-direction: column; gap: 6px; }
.tier { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9ca3af; padding: 4px 10px; border-radius: 6px; font-weight: 500; }
.tier.available { color: #f57f17; background: rgba(245,127,23,0.08); font-weight: 600; }

/* Orders */
.orders-list { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

.order-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.03); transition: box-shadow 0.25s ease, transform 0.2s ease; }
.order-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-1px); }
.order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.order-top h3 { font-family: 'Lora', serif; font-size: 16px; font-weight: 700; }
.order-date { font-size: 12px; color: #9ca3af; }
.status { padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
.status.delivered { background: #e8f5e9; color: #2e7d32; }
.status.cancelled { background: #fef2f2; color: #ef4444; }
.status.active { background: #e3f2fd; color: #1565c0; }
.status.pending { background: #fff3e0; color: #e65100; }

.order-items { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
.order-product { display: flex; align-items: center; gap: 6px; }
.order-total { font-family: 'Lora', serif; font-weight: 700; font-size: 17px; }

.order-meta { padding: 10px 0 0; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9ca3af; }

.order-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.delivery-info { display: flex; gap: 16px; font-size: 13px; color: #6b7280; }
.info-item { display: flex; align-items: center; gap: 5px; }
.unrated { color: #d1d5db; font-style: italic; }
.order-actions { display: flex; gap: 8px; }
.btn-rate { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1.5px solid #fbbf24; border-radius: 10px; background: #fffbeb; font-family: 'Raleway', sans-serif; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.25s ease; color: #92400e; }
.btn-rate:hover { border-color: #f59e0b; background: #fef3c7; }
.btn-repeat { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #00c853; color: #fff; border-radius: 10px; font-weight: 600; font-size: 13px; border: none; cursor: pointer; font-family: 'Raleway', sans-serif; transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(0,200,83,0.2); }
.btn-repeat:hover { background: #00b048; transform: translateY(-1px); }

/* Empty State */
.empty-state { max-width: 400px; margin: 80px auto; text-align: center; }
.empty-state h3 { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; margin: 16px 0 8px; }
.empty-state p { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
.btn-new { display: inline-block; background: #00c853; color: #fff; padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; transition: all 0.25s ease; box-shadow: 0 4px 14px rgba(0,200,83,0.25); }
.btn-new:hover { background: #00b048; transform: translateY(-1px); }

/* Rating Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-card { background: #fff; border-radius: 20px; padding: 32px; max-width: 400px; width: 90%; box-shadow: 0 16px 48px rgba(0,0,0,0.15); text-align: center; }
.modal-card h3 { font-family: 'Lora', serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.modal-card p { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
.star-rating { display: flex; justify-content: center; gap: 8px; margin-bottom: 12px; }
.star-btn { background: none; border: none; cursor: pointer; transition: transform 0.2s ease; padding: 4px; }
.star-btn.filled { transform: scale(1.15); }
.star-btn:hover { transform: scale(1.25); }
.rating-label { font-size: 15px; font-weight: 600; color: #f59e0b; margin-bottom: 20px; }
.modal-actions { display: flex; gap: 12px; justify-content: center; }
.btn-modal-cancel { padding: 10px 20px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: #fff; font-family: 'Raleway', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-modal-cancel:hover { background: #f3f4f6; }
.btn-modal-confirm { display: flex; align-items: center; gap: 6px; padding: 10px 24px; background: #00c853; color: #fff; border: none; border-radius: 10px; font-family: 'Raleway', sans-serif; font-weight: 700; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(0,200,83,0.2); }
.btn-modal-confirm:hover:not(:disabled) { background: #00b048; }
.btn-modal-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalOut 0.2s ease; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes modalOut { from { opacity: 1; } to { opacity: 0; } }

.site-footer { background: #111827; color: #fff; padding: 32px; }
.footer-inner { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-family: 'Lora', serif; }
.footer-logo { width: 34px; height: 34px; border-radius: 10px; background: #00c853; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.copyright { font-size: 13px; color: #9ca3af; }

@media (max-width: 768px) {
  .gopoints-bar { flex-direction: column; gap: 14px; align-items: flex-start; }
  .order-bottom { flex-direction: column; gap: 12px; align-items: flex-start; }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
}
</style>
