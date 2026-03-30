<template>
  <div class="page-wrapper">
    <SiteHeader />

    <!-- Wizard Steps -->
    <div class="wizard-steps">
      <div class="step active">
        <div class="step-dot"></div>
        <span>Carrinho</span>
      </div>
      <div class="step-line"></div>
      <div class="step">
        <div class="step-dot"></div>
        <span>Entrega</span>
      </div>
      <div class="step-line"></div>
      <div class="step">
        <div class="step-dot"></div>
        <span>Pagamento</span>
      </div>
    </div>

    <main class="order-main">
      <div class="order-layout">
        <!-- Left: Product Image -->
        <div class="product-preview">
          <img src="https://codia-f2c.s3.us-west-1.amazonaws.com/default/image/2026-03-27/d5dfe9dc-7849-4fbd-a8e1-02eeb49c15b8.png" alt="GoGummies" />
        </div>

        <!-- Right: Selection -->
        <div class="order-content">
          <h2>Escolhe o teu pack</h2>

          <!-- Pack Cards -->
          <div
            v-for="product in products"
            :key="product.id"
            class="pack-card"
            :class="{ selected: store.cart.items[product.id] > 0 }"
            @click="selectPack(product.id)"
          >
            <div class="pack-info">
              <div class="pack-title-row">
                <span class="pack-title">{{ product.name }}</span>
                <span v-if="product.popular" class="popular-badge">Popular</span>
              </div>
              <span class="pack-desc">{{ product.desc }}</span>
            </div>
            <span class="pack-price">€{{ product.price.toFixed(2) }}</span>
            <div class="qty-control" @click.stop>
              <button class="qty-btn" @click="changeQty(product.id, -1)" aria-label="Diminuir quantidade">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span class="qty-val">{{ store.cart.items[product.id] }}</span>
              <button class="qty-btn plus" @click="changeQty(product.id, 1)" aria-label="Aumentar quantidade">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>

          <!-- Urgent Delivery (RF10) -->
          <div class="urgent-card" :class="{ active: store.cart.urgentDelivery }">
            <div class="urgent-header">
              <div>
                <span class="urgent-title">Entrega Urgente</span>
                <span class="urgent-price">+€1.50</span>
              </div>
              <p class="urgent-desc">Prioridade máxima — entrega em ~15 min</p>
            </div>
            <div class="urgent-toggle" @click="toggleUrgentFn">
              <div class="toggle" :class="{ active: store.cart.urgentDelivery }">
                <div class="toggle-dot"></div>
              </div>
            </div>
            <div v-if="store.cart.urgentDelivery" class="urgent-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>A encomenda será atribuída ao estafeta mais perto com prioridade máxima</span>
            </div>
            <div v-if="urgentAvailable" class="urgent-available">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#059669" stroke="none"><circle cx="12" cy="12" r="10"/></svg>
              <span>Estafeta disponível na tua zona</span>
            </div>
          </div>

          <!-- GoPoints Preview (RF12) -->
          <div v-if="pointsEarned > 0" class="points-preview">
            <svg class="points-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f57f17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            <div class="points-info">
              <span class="points-earn">+{{ pointsEarned }} GoPoints com esta compra</span>
              <span class="points-balance">Saldo atual: {{ store.goPoints.balance }} pts</span>
            </div>
          </div>

          <!-- Summary Bar -->
          <div class="summary-bar">
            <div class="summary-info">
              <span class="summary-items">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'itens' }}{{ store.cart.urgentDelivery ? ' · Urgente' : '' }}</span>
              <span class="summary-total">€{{ total.toFixed(2) }}</span>
            </div>
            <button
              class="btn-continue"
              :class="{ disabled: itemCount === 0 }"
              :disabled="itemCount === 0"
              @click="goToDelivery"
            >
              Continuar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
      </div>
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore, PRODUCTS, setCartQty, toggleUrgent, subtotal, urgentFee, cartItemCount, pointsToEarn } from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();
const products = PRODUCTS;

const itemCount = cartItemCount;
const total = computed(() => subtotal.value + urgentFee.value);
const pointsEarned = pointsToEarn;
const urgentAvailable = ref(true);

function selectPack(id) {
  if (store.cart.items[id] === 0) {
    setCartQty(id, 1);
  }
}

function changeQty(id, delta) {
  setCartQty(id, store.cart.items[id] + delta);
}

function toggleUrgentFn() {
  toggleUrgent();
}

function goToDelivery() {
  if (cartItemCount.value > 0) {
    router.push('/order/delivery');
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: #f6f7f7; color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

/* Header */
.site-header { background: rgba(255,255,255,0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 32px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111827; transition: opacity 0.2s; }
.logo:hover { opacity: 0.8; }
.logo-img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; }
.logo-text { font-family: 'Lora', serif; font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
.header-actions { display: flex; gap: 16px; }
.action-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; text-decoration: none; color: #6b7280; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; transition: color 0.2s; }
.action-btn:hover { color: #111827; }
.action-btn.active-link { color: #00c853; }

/* Wizard Steps */
.wizard-steps { max-width: 400px; margin: 28px auto 12px; display: flex; align-items: center; gap: 8px; padding: 0 32px; }
.step { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #9ca3af; letter-spacing: 0.01em; }
.step.active { color: #00c853; }
.step-dot { width: 10px; height: 10px; border-radius: 50%; background: #d1d5db; transition: background 0.25s, box-shadow 0.25s; }
.step.active .step-dot { background: #00c853; box-shadow: 0 0 0 4px rgba(0,200,83,0.15); }
.step-line { flex: 1; height: 2px; background: #e5e7eb; border-radius: 1px; }

/* Main */
.order-main { flex: 1; padding: 12px 32px 60px; animation: contentIn 0.5s ease-out; }
@keyframes contentIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.order-layout { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
.product-preview { background: linear-gradient(145deg, #e8f5e9, #f1f8e9); border-radius: 24px; overflow: hidden; display: flex; align-items: center; justify-content: center; padding: 40px; position: sticky; top: 90px; }
.product-preview img { max-width: 100%; height: auto; max-height: 460px; border-radius: 16px; transition: transform 0.4s ease; }
.product-preview:hover img { transform: scale(1.02); }

.order-content { display: flex; flex-direction: column; gap: 16px; }
.order-content h2 { font-family: 'Lora', serif; font-size: 24px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.02em; color: #111827; }

/* Pack Cards */
.pack-card { background: #fff; border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px 22px; display: flex; align-items: center; gap: 16px; transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease; cursor: pointer; }
.pack-card:hover { border-color: #00c853; box-shadow: 0 4px 16px rgba(0,200,83,0.10); }
.pack-card.selected { border-color: #00c853; background: #f0fdf4; box-shadow: 0 2px 8px rgba(0,200,83,0.08); }
.pack-info { flex: 1; }
.pack-title-row { display: flex; align-items: center; gap: 8px; }
.pack-title { font-weight: 700; font-size: 15px; display: block; color: #111827; }
.pack-desc { font-size: 13px; color: #6b7280; display: block; margin-top: 3px; }
.pack-price { font-family: 'Lora', serif; font-size: 22px; font-weight: 700; color: #00c853; letter-spacing: -0.02em; }
.popular-badge { background: #ff9800; color: #fff; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.qty-control { display: flex; align-items: center; gap: 6px; }
.qty-btn { width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid #d1d5db; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; color: #374151; }
.qty-btn.plus { background: #00c853; color: #fff; border-color: #00c853; }
.qty-btn:hover { border-color: #00c853; background: #f0fdf4; }
.qty-btn.plus:hover { background: #00b048; }
.qty-val { font-weight: 700; min-width: 24px; text-align: center; font-size: 15px; }

/* Urgent */
.urgent-card { background: #fff; border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px 22px; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
.urgent-card.active { border-color: #ff9800; box-shadow: 0 4px 16px rgba(255,152,0,0.08); }
.urgent-header { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
.urgent-header > div { display: flex; align-items: center; gap: 12px; }
.urgent-title { font-weight: 700; font-size: 16px; color: #111827; }
.urgent-price { color: #ff9800; font-weight: 700; font-size: 14px; }
.urgent-desc { font-size: 13px; color: #6b7280; }
.urgent-toggle { margin-bottom: 12px; cursor: pointer; }
.toggle { width: 48px; height: 26px; background: #d1d5db; border-radius: 13px; position: relative; cursor: pointer; transition: background 0.3s ease; }
.toggle.active { background: #00c853; }
.toggle-dot { width: 22px; height: 22px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform 0.3s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
.toggle.active .toggle-dot { transform: translateX(22px); }
.urgent-note { display: flex; align-items: flex-start; gap: 10px; background: #fff3e0; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #e65100; animation: fadeIn 0.3s ease; line-height: 1.5; }
.urgent-available { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #059669; margin-top: 10px; font-weight: 500; }

/* GoPoints */
.points-preview { display: flex; align-items: center; gap: 16px; background: linear-gradient(135deg, #fffde7, #fff8e1); border: 1.5px solid #ffd54f; border-radius: 16px; padding: 18px 22px; transition: box-shadow 0.3s ease; }
.points-preview:hover { box-shadow: 0 4px 16px rgba(255,213,79,0.15); }
.points-icon { flex-shrink: 0; }
.points-info { display: flex; flex-direction: column; gap: 3px; }
.points-earn { font-weight: 700; font-size: 14px; color: #f57f17; }
.points-balance { font-size: 12px; color: #9ca3af; }

/* Summary Bar */
.summary-bar { background: #fff; border-radius: 16px; padding: 22px 26px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 20px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); }
.summary-info { display: flex; flex-direction: column; gap: 3px; }
.summary-items { font-size: 13px; color: #6b7280; font-weight: 500; }
.summary-total { font-family: 'Lora', serif; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.btn-continue { display: flex; align-items: center; gap: 8px; background: #00c853; color: #fff; padding: 14px 32px; border-radius: 14px; font-weight: 700; font-size: 15px; border: none; cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(0,200,83,0.25); letter-spacing: 0.01em; }
.btn-continue:hover:not(.disabled) { background: #00b048; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,200,83,0.35); }
.btn-continue:active:not(.disabled) { transform: translateY(0); }
.btn-continue.disabled { background: #d1d5db; cursor: not-allowed; box-shadow: none; }

/* Footer */
.site-footer { background: #111827; color: #fff; padding: 32px; }
.footer-inner { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-family: 'Lora', serif; }
.footer-logo { width: 34px; height: 34px; border-radius: 10px; background: #00c853; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.copyright { font-size: 13px; color: #9ca3af; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .order-layout { grid-template-columns: 1fr; }
  .product-preview { max-height: 300px; position: static; }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
}
</style>
