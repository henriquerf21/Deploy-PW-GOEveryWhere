<template>
  <div class="page-wrapper">
    <SiteHeader />

    <!-- Wizard Steps -->
    <div class="wizard-steps">
      <router-link to="/order/select" class="step done">
        <div class="step-dot"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span>Carrinho</span>
      </router-link>
      <div class="step-line done-line"></div>
      <router-link to="/order/delivery" class="step done">
        <div class="step-dot"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <span>Entrega</span>
      </router-link>
      <div class="step-line done-line"></div>
      <div class="step active"><div class="step-dot"></div><span>Pagamento</span></div>
    </div>

    <main class="payment-main">
      <div class="payment-layout">
        <!-- Left: Order Summary -->
        <div class="summary-card">
          <h2>Resumo</h2>
          <div v-for="item in cartItems" :key="item.id" class="summary-line">
            <span class="summary-product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#00c853" stroke="none"><circle cx="12" cy="12" r="6"/></svg>
              {{ item.qty }}x {{ item.name }}
            </span>
            <span>€{{ item.lineTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-line muted">
            <span>Subtotal</span><span>€{{ subTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-line muted">
            <span class="summary-product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Entrega
            </span>
            <span :class="{ 'free-delivery': deliveryFeeVal === 0 }">
              {{ deliveryFeeVal === 0 ? 'Grátis' : '€' + deliveryFeeVal.toFixed(2) }}
            </span>
          </div>
          <div v-if="urgentFeeVal > 0" class="summary-line urgent-line">
            <span class="summary-product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e65100" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Taxa urgente
            </span>
            <span>€{{ urgentFeeVal.toFixed(2) }}</span>
          </div>
          <div v-if="discountVal > 0" class="summary-line discount-line">
            <span class="summary-product">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Desconto GoPoints
            </span>
            <span>-€{{ discountVal.toFixed(2) }}</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-line total">
            <span>Total</span><span>€{{ total.toFixed(2) }}</span>
          </div>

          <div class="points-earned">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f57f17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            <span>+{{ pointsEarned }} GoPoints com esta compra</span>
          </div>
        </div>

        <!-- Right: Delivery + Payment -->
        <div class="details-card">
          <section class="delivery-section">
            <h3>Entrega</h3>
            <div class="detail-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{{ store.delivery.name }} · {{ store.delivery.phone }}</span>
            </div>
            <div class="detail-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>{{ store.delivery.address }}, {{ store.delivery.postalCode }} {{ store.delivery.city }}</span>
            </div>
            <div class="detail-row" v-if="store.delivery.assignedStore">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{{ store.delivery.assignedStore.name }}</span>
            </div>
            <div class="detail-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>~{{ eta }} min{{ store.cart.urgentDelivery ? ' (urgente)' : '' }}</span>
            </div>
            <div v-if="store.cart.urgentDelivery" class="urgent-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Entrega Urgente Ativada
            </div>
          </section>

          <div class="section-divider"></div>

          <!-- GoPoints Redemption (RF12) -->
          <section v-if="store.goPoints.balance >= 500" class="gopoints-section">
            <h3>GoPoints</h3>
            <p class="gopoints-balance">Saldo: <strong>{{ store.goPoints.balance }} pts</strong></p>
            <div class="gopoints-options">
              <div
                class="gopoints-option"
                :class="{ active: store.payment.useGoPoints && store.payment.goPointsRedemption === 'delivery_free' }"
                @click="togglePoints('delivery_free')"
                v-if="store.goPoints.balance >= 500"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <div>
                  <span class="gp-title">Entrega Grátis</span>
                  <span class="gp-cost">500 pts</span>
                </div>
              </div>
              <div
                class="gopoints-option"
                :class="{ active: store.payment.useGoPoints && store.payment.goPointsRedemption === 'product_free' }"
                @click="togglePoints('product_free')"
                v-if="store.goPoints.balance >= 1000"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                <div>
                  <span class="gp-title">Produto Grátis</span>
                  <span class="gp-cost">1000 pts</span>
                </div>
              </div>
            </div>
          </section>

          <div v-if="store.goPoints.balance >= 500" class="section-divider"></div>

          <section class="payment-section">
            <h3>Método de pagamento</h3>
            <div class="payment-methods">
              <button class="pay-method" :class="{ active: store.payment.method === 'card' }" @click="setMethod('card')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Cartão
              </button>
              <button class="pay-method" :class="{ active: store.payment.method === 'mbway' }" @click="setMethod('mbway')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                MB Way
              </button>
              <button class="pay-method" :class="{ active: store.payment.method === 'multibanco' }" @click="setMethod('multibanco')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><rect x="6" y="14" width="4" height="2" rx="1"/></svg>
                Multibanco
              </button>
            </div>

            <!-- Card fields -->
            <div v-if="store.payment.method === 'card'" class="payment-fields">
              <div class="form-group">
                <label for="card-name">Nome no cartão</label>
                <input id="card-name" type="text" v-model="store.payment.cardName" placeholder="Nome completo" />
              </div>
              <div class="form-group">
                <label for="card-number">Número do cartão</label>
                <input id="card-number" type="text" v-model="store.payment.cardNumber" placeholder="4242 4242 4242 4242" maxlength="19" />
              </div>
              <div class="form-row-2col">
                <div class="form-group">
                  <label for="card-expiry">Validade</label>
                  <input id="card-expiry" type="text" v-model="store.payment.cardExpiry" placeholder="MM/AA" maxlength="5" />
                </div>
                <div class="form-group">
                  <label for="card-cvv">CVV</label>
                  <input id="card-cvv" type="password" v-model="store.payment.cardCvv" placeholder="•••" maxlength="4" />
                </div>
              </div>
            </div>

            <!-- MB Way fields -->
            <div v-if="store.payment.method === 'mbway'" class="payment-fields">
              <div class="form-group">
                <label for="mbway-phone">Número de telemóvel</label>
                <input id="mbway-phone" type="tel" v-model="store.payment.mbwayPhone" placeholder="912 345 678" />
              </div>
              <div class="info-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <span>Receberás uma notificação no teu telemóvel para confirmar o pagamento.</span>
              </div>
            </div>

            <!-- Multibanco reference -->
            <div v-if="store.payment.method === 'multibanco'" class="payment-fields">
              <div class="mb-reference">
                <div class="mb-row"><span class="mb-label">Entidade:</span><span class="mb-value">21 312</span></div>
                <div class="mb-row"><span class="mb-label">Referência:</span><span class="mb-value">{{ mbRef }}</span></div>
                <div class="mb-row"><span class="mb-label">Montante:</span><span class="mb-value">€{{ total.toFixed(2) }}</span></div>
              </div>
              <div class="info-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>Paga no Multibanco ou homebanking. A encomenda será processada após confirmação.</span>
              </div>
            </div>
          </section>

          <p class="estafeta-note">Um estafeta GoEverywhere será atribuído automaticamente à tua encomenda.</p>

          <button
            class="btn-continue"
            @click="confirmOrder"
            :disabled="processing"
          >
            <svg v-if="processing" class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span v-if="processing">A processar...</span>
            <span v-else>Confirmar e Pagar — €{{ total.toFixed(2) }}</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Notification Toast -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-notification">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>Pedido submetido com sucesso! A redirecionar para tracking...</span>
      </div>
    </Transition>

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
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  useOrderStore, cartProducts, subtotal, deliveryFee, urgentFee,
  productDiscount, orderTotal, estimatedETA, pointsToEarn,
  setPaymentMethod, toggleGoPoints, submitOrder, isCartValid, isDeliveryValid
} from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const cartItems = cartProducts;
const subTotal = subtotal;
const deliveryFeeVal = deliveryFee;
const urgentFeeVal = urgentFee;
const discountVal = productDiscount;
const total = orderTotal;
const eta = estimatedETA;
const pointsEarned = pointsToEarn;

const processing = ref(false);
const showToast = ref(false);

const mbRef = computed(() => {
  const r = Math.floor(Math.random() * 900000000) + 100000000;
  return String(r).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
});

onMounted(() => {
  if (!isCartValid()) {
    router.replace('/order/select');
  } else if (!isDeliveryValid()) {
    router.replace('/order/delivery');
  }
});

function setMethod(method) {
  setPaymentMethod(method);
}

function togglePoints(type) {
  toggleGoPoints(type);
}

function confirmOrder() {
  processing.value = true;
  showToast.value = true;

  setTimeout(() => {
    submitOrder();
    processing.value = false;
    router.push('/order/tracking');
  }, 1500);
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

.wizard-steps { max-width: 400px; margin: 28px auto 12px; display: flex; align-items: center; gap: 8px; padding: 0 32px; }
.step { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #9ca3af; text-decoration: none; cursor: default; }
.step.active { color: #00c853; }
.step.done { color: #00c853; cursor: pointer; }
.step-dot { width: 12px; height: 12px; border-radius: 50%; background: #d1d5db; display: flex; align-items: center; justify-content: center; transition: all 0.25s; }
.step.active .step-dot { background: #00c853; box-shadow: 0 0 0 4px rgba(0,200,83,0.15); }
.step.done .step-dot { background: #00c853; width: 18px; height: 18px; }
.step-line { flex: 1; height: 2px; background: #e5e7eb; border-radius: 1px; }
.done-line { background: #00c853; }

.payment-main { flex: 1; padding: 12px 32px 60px; animation: contentIn 0.5s ease-out; }
@keyframes contentIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.payment-layout { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }

/* Summary */
.summary-card { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.03); position: sticky; top: 90px; }
.summary-card h2 { font-family: 'Lora', serif; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; }
.summary-line { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: 500; }
.summary-product { display: flex; align-items: center; gap: 8px; }
.summary-line.muted { color: #6b7280; }
.summary-line.urgent-line { color: #e65100; }
.summary-line.discount-line { color: #059669; }
.summary-line.total { font-family: 'Lora', serif; font-size: 20px; font-weight: 700; color: #00c853; }
.summary-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
.free-delivery { color: #059669; font-weight: 700; }
.points-earned { display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #fffde7, #fff8e1); border: 1px solid #ffd54f; border-radius: 12px; padding: 14px 16px; font-size: 13px; font-weight: 600; color: #f57f17; margin-top: 18px; }

/* Details */
.details-card { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.03); }
.details-card h3 { font-family: 'Lora', serif; font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
.detail-row { display: flex; align-items: center; gap: 12px; font-size: 14px; padding: 6px 0; }
.urgent-badge { display: inline-flex; align-items: center; gap: 8px; background: #fff3e0; color: #e65100; font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: 10px; margin-top: 14px; }

.section-divider { height: 1px; background: #e5e7eb; margin: 24px 0; }

/* GoPoints */
.gopoints-balance { font-size: 14px; color: #6b7280; margin-bottom: 14px; }
.gopoints-options { display: flex; gap: 12px; }
.gopoints-option { flex: 1; display: flex; align-items: center; gap: 14px; padding: 18px; border: 2px solid #e5e7eb; border-radius: 14px; cursor: pointer; transition: all 0.25s ease; color: #374151; }
.gopoints-option:hover { border-color: #fbbf24; background: #fffbeb; }
.gopoints-option.active { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 2px 8px rgba(245,158,11,0.1); }
.gp-title { display: block; font-weight: 700; font-size: 14px; }
.gp-cost { display: block; font-size: 12px; color: #9ca3af; }

/* Payment Methods */
.payment-methods { display: flex; gap: 12px; margin-bottom: 18px; }
.pay-method { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: 2px solid #e5e7eb; border-radius: 14px; background: #fff; font-family: 'Raleway', sans-serif; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.25s ease; color: #374151; }
.pay-method.active { border-color: #00c853; background: #f0fdf4; color: #00c853; }
.pay-method:hover { border-color: #00c853; }

.payment-fields { animation: fadeIn 0.3s ease; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.form-group input { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; font-size: 14px; font-family: 'Poppins', sans-serif; background: #f9fafb; outline: none; transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease; }
.form-group input:focus { border-color: #00c853; background: #fff; box-shadow: 0 0 0 3px rgba(0,200,83,0.08); }
.form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.info-note { display: flex; align-items: flex-start; gap: 10px; background: #f0fdf4; border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #059669; margin-top: 8px; line-height: 1.5; }
.mb-reference { background: #f9fafb; border-radius: 14px; padding: 22px; border: 1px solid #e5e7eb; }
.mb-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 15px; }
.mb-label { color: #6b7280; }
.mb-value { font-weight: 700; font-family: 'Lora', serif; font-size: 16px; }

.estafeta-note { font-size: 13px; color: #6b7280; margin: 22px 0 10px; text-align: center; }

.btn-continue { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #00c853; color: #fff; padding: 16px; border-radius: 14px; font-weight: 700; font-size: 15px; border: none; cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(0,200,83,0.25); letter-spacing: 0.01em; }
.btn-continue:hover:not(:disabled) { background: #00b048; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,200,83,0.35); }
.btn-continue:active:not(:disabled) { transform: translateY(0); }
.btn-continue:disabled { opacity: 0.7; cursor: wait; }
.spinner-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Toast */
.toast-notification { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #059669; color: #fff; padding: 16px 28px; border-radius: 14px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 999; }
.toast-enter-active { animation: toastIn 0.4s ease; }
.toast-leave-active { animation: toastOut 0.3s ease; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes toastOut { from { opacity: 1; } to { opacity: 0; transform: translateX(-50%) translateY(20px); } }

.site-footer { background: #111827; color: #fff; padding: 32px; }
.footer-inner { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-family: 'Lora', serif; }
.footer-logo { width: 34px; height: 34px; border-radius: 10px; background: #00c853; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.copyright { font-size: 13px; color: #9ca3af; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .payment-layout { grid-template-columns: 1fr; }
  .payment-methods { flex-direction: column; }
  .gopoints-options { flex-direction: column; }
  .summary-card { position: static; }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
}
</style>
