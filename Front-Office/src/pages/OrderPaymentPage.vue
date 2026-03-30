<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />
    <CheckoutWizardSteps :current-step="3" />

    <main class="cf-checkout-main">
      <router-link to="/order/delivery" class="cf-back-link">← Voltar à entrega</router-link>

      <header class="cf-checkout-head">
        <p class="cf-checkout-kicker">Último passo</p>
        <h1 class="cf-checkout-title">Pagamento</h1>
        <p class="cf-checkout-sub">
          Confirma o resumo, escolhe o método e finaliza. O total inclui portes e opções que selecionaste.
        </p>
      </header>

      <div class="payment-layout">
        <aside class="summary-card cf-panel" aria-labelledby="summary-heading">
          <h2 id="summary-heading" class="side-title">Resumo</h2>
          <ul class="summary-list">
            <li v-for="item in cartItems" :key="item.id" class="summary-line">
              <span class="summary-product">{{ item.qty }}× {{ item.name }}</span>
              <span class="summary-amount">€{{ item.lineTotal.toFixed(2) }}</span>
            </li>
          </ul>
          <hr class="inner-rule" />
          <div class="summary-line muted">
            <span>Subtotal</span>
            <span>€{{ subTotal.toFixed(2) }}</span>
          </div>
          <div class="summary-line muted">
            <span>Portes</span>
            <span :class="{ 'price-free': deliveryFeeVal === 0 }">
              {{ deliveryFeeVal === 0 ? 'Grátis' : `€${deliveryFeeVal.toFixed(2)}` }}
            </span>
          </div>
          <div v-if="urgentFeeVal > 0" class="summary-line warn-line">
            <span>Urgente</span>
            <span>€{{ urgentFeeVal.toFixed(2) }}</span>
          </div>
          <div v-if="discountVal > 0" class="summary-line discount-line">
            <span>GoPoints</span>
            <span>−€{{ discountVal.toFixed(2) }}</span>
          </div>
          <hr class="inner-rule" />
          <div class="summary-line total-line">
            <span>Total</span>
            <span>€{{ total.toFixed(2) }}</span>
          </div>

          <div v-if="pointsEarned > 0" class="points-earned">
            <Award :size="18" :stroke-width="1.75" aria-hidden="true" />
            <span>+{{ pointsEarned }} GoPoints após confirmação</span>
          </div>
        </aside>

        <div class="details-card cf-panel">
          <section class="pay-section" aria-labelledby="delivery-review">
            <h2 id="delivery-review" class="side-title">Entrega</h2>
            <div class="detail-row">
              <User :size="16" :stroke-width="1.75" class="detail-ic" aria-hidden="true" />
              <span>{{ store.delivery.name }} · {{ store.delivery.phone }}</span>
            </div>
            <div class="detail-row">
              <Home :size="16" :stroke-width="1.75" class="detail-ic" aria-hidden="true" />
              <span>{{ store.delivery.address }}, {{ store.delivery.postalCode }} {{ store.delivery.city }}</span>
            </div>
            <div v-if="store.delivery.assignedStore" class="detail-row">
              <Store :size="16" :stroke-width="1.75" class="detail-ic" aria-hidden="true" />
              <span>{{ store.delivery.assignedStore.name }}</span>
            </div>
            <div class="detail-row">
              <Clock :size="16" :stroke-width="1.75" class="detail-ic" aria-hidden="true" />
              <span>Chegada indicativa ~{{ eta }} min{{ store.cart.urgentDelivery ? ' (urgente)' : '' }}</span>
            </div>
            <p v-if="store.cart.urgentDelivery" class="urgent-pill">
              <Zap :size="14" :stroke-width="1.75" aria-hidden="true" />
              Entrega urgente ativa
            </p>
          </section>

          <hr class="cf-divider" />

          <section v-if="store.goPoints.balance >= 500" class="pay-section" aria-labelledby="gopoints-h">
            <h2 id="gopoints-h" class="side-title">GoPoints</h2>
            <p class="gopoints-intro">Saldo: <strong>{{ store.goPoints.balance }} pts</strong></p>
            <div class="gopoints-options">
              <button
                v-if="store.goPoints.balance >= 500"
                type="button"
                class="gopoints-option"
                :class="{ active: store.payment.useGoPoints && store.payment.goPointsRedemption === 'delivery_free' }"
                @click="togglePoints('delivery_free')"
              >
                <Truck :size="22" :stroke-width="1.5" aria-hidden="true" />
                <span class="gp-title">Portes grátis</span>
                <span class="gp-cost">500 pts</span>
              </button>
              <button
                v-if="store.goPoints.balance >= 1000"
                type="button"
                class="gopoints-option"
                :class="{ active: store.payment.useGoPoints && store.payment.goPointsRedemption === 'product_free' }"
                @click="togglePoints('product_free')"
              >
                <Tag :size="22" :stroke-width="1.5" aria-hidden="true" />
                <span class="gp-title">Desconto em produto</span>
                <span class="gp-cost">1000 pts</span>
              </button>
            </div>
          </section>

          <hr v-if="store.goPoints.balance >= 500" class="cf-divider" />

          <section class="pay-section" aria-labelledby="pay-methods-h">
            <h2 id="pay-methods-h" class="side-title">Método</h2>
            <div class="payment-methods" role="radiogroup" aria-label="Método de pagamento">
              <button
                type="button"
                class="pay-method"
                :class="{ active: store.payment.method === 'card' }"
                role="radio"
                :aria-checked="store.payment.method === 'card'"
                @click="setMethod('card')"
              >
                <CreditCard :size="20" :stroke-width="1.5" aria-hidden="true" />
                Cartão
              </button>
              <button
                type="button"
                class="pay-method"
                :class="{ active: store.payment.method === 'mbway' }"
                role="radio"
                :aria-checked="store.payment.method === 'mbway'"
                @click="setMethod('mbway')"
              >
                <Smartphone :size="20" :stroke-width="1.5" aria-hidden="true" />
                MB Way
              </button>
              <button
                type="button"
                class="pay-method"
                :class="{ active: store.payment.method === 'multibanco' }"
                role="radio"
                :aria-checked="store.payment.method === 'multibanco'"
                @click="setMethod('multibanco')"
              >
                <Building2 :size="20" :stroke-width="1.5" aria-hidden="true" />
                Multibanco
              </button>
            </div>

            <div v-if="store.payment.method === 'card'" class="payment-fields">
              <div class="cf-field">
                <label class="cf-label" for="card-name">Nome no cartão</label>
                <input
                  id="card-name"
                  v-model="store.payment.cardName"
                  class="cf-input"
                  type="text"
                  autocomplete="cc-name"
                  placeholder="Como está no cartão"
                />
              </div>
              <div class="cf-field">
                <label class="cf-label" for="card-number">Número</label>
                <input
                  id="card-number"
                  v-model="store.payment.cardNumber"
                  class="cf-input"
                  type="text"
                  inputmode="numeric"
                  autocomplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  maxlength="19"
                />
              </div>
              <div class="form-row-2col">
                <div class="cf-field">
                  <label class="cf-label" for="card-expiry">Validade</label>
                  <input
                    id="card-expiry"
                    v-model="store.payment.cardExpiry"
                    class="cf-input"
                    type="text"
                    autocomplete="cc-exp"
                    placeholder="MM / AA"
                    maxlength="7"
                  />
                </div>
                <div class="cf-field">
                  <label class="cf-label" for="card-cvv">CVC</label>
                  <input
                    id="card-cvv"
                    v-model="store.payment.cardCvv"
                    class="cf-input"
                    type="password"
                    autocomplete="cc-csc"
                    placeholder="•••"
                    maxlength="4"
                  />
                </div>
              </div>
            </div>

            <div v-if="store.payment.method === 'mbway'" class="payment-fields">
              <div class="cf-field">
                <label class="cf-label" for="mbway-phone">Telemóvel MB Way</label>
                <input
                  id="mbway-phone"
                  v-model="store.payment.mbwayPhone"
                  class="cf-input"
                  type="tel"
                  inputmode="tel"
                  autocomplete="tel"
                  placeholder="912 345 678"
                />
              </div>
              <p class="info-note">
                <Info :size="16" :stroke-width="1.75" aria-hidden="true" />
                Vais receber um pedido de pagamento na app. Confirma para concluir a encomenda.
              </p>
            </div>

            <div v-if="store.payment.method === 'multibanco'" class="payment-fields">
              <div class="mb-reference">
                <div class="mb-row"><span class="mb-label">Entidade</span><span class="mb-value">21 312</span></div>
                <div class="mb-row"><span class="mb-label">Referência</span><span class="mb-value">{{ mbRef }}</span></div>
                <div class="mb-row"><span class="mb-label">Montante</span><span class="mb-value">€{{ total.toFixed(2) }}</span></div>
              </div>
              <p class="info-note">
                <Info :size="16" :stroke-width="1.75" aria-hidden="true" />
                Usa o teu homebanking ou ATM. A encomenda segue após confirmação do pagamento.
              </p>
            </div>
          </section>

          <div class="cf-trust-inline">
            <span><Lock :size="14" :stroke-width="1.75" aria-hidden="true" /> Ligação segura (simulação)</span>
            <span><ShieldCheck :size="14" :stroke-width="1.75" aria-hidden="true" /> Estafeta atribuído após pagamento</span>
          </div>

          <p class="estafeta-note">
            A GoEverywhere atribui automaticamente um estafeta disponível na tua zona.
          </p>

          <button type="button" class="cf-btn-primary pay-submit" :disabled="processing" @click="confirmOrder">
            <Loader2 v-if="processing" class="spin" :size="18" :stroke-width="2" aria-hidden="true" />
            <span v-if="processing">A processar…</span>
            <span v-else>Pagar €{{ total.toFixed(2) }}</span>
          </button>
        </div>
      </div>
    </main>

    <Transition name="toast">
      <div v-if="showToast" class="toast-notification" role="status">
        <CheckCircle2 :size="18" :stroke-width="1.75" aria-hidden="true" />
        <span>Encomenda registada. A abrir o acompanhamento…</span>
      </div>
    </Transition>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import CheckoutWizardSteps from '../components/CheckoutWizardSteps.vue';
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Award,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Store,
  Tag,
  Truck,
  User,
  Zap,
} from 'lucide-vue-next';
import {
  useOrderStore,
  cartProducts,
  subtotal,
  deliveryFee,
  urgentFee,
  productDiscount,
  orderTotal,
  estimatedETA,
  pointsToEarn,
  setPaymentMethod,
  toggleGoPoints,
  submitOrder,
  isCartValid,
  isDeliveryValid,
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
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.payment-layout {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
  max-width: 1000px;
  margin: 0 auto;
}

.summary-card,
.details-card {
  padding: 1.5rem 1.5rem 1.75rem;
}

.summary-card {
  position: sticky;
  top: 5.5rem;
}

.side-title {
  margin: 0 0 1rem;
  font-family: var(--cf-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cf-muted);
}

.summary-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.35rem 0;
  font-size: 0.875rem;
  font-weight: 500;
}

.summary-product {
  color: var(--cf-ink);
  line-height: 1.35;
}

.summary-amount {
  font-weight: 600;
  flex-shrink: 0;
}

.summary-line.muted {
  color: var(--cf-muted);
  font-size: 0.8125rem;
}

.warn-line {
  color: var(--cf-warn);
  font-size: 0.8125rem;
}

.discount-line {
  color: var(--cf-success);
  font-size: 0.8125rem;
}

.inner-rule {
  border: none;
  height: 1px;
  background: var(--cf-line);
  margin: 0.75rem 0;
}

.total-line {
  font-family: var(--cf-display);
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding-top: 0.25rem;
}

.total-line span:last-child {
  color: var(--cf-cta);
}

.price-free {
  font-weight: 700;
  color: var(--cf-success);
}

.points-earned {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 0.875rem;
  border-radius: var(--cf-radius);
  background: #fffbeb;
  border: 1px solid #fde68a;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #b45309;
}

.pay-section {
  margin: 0;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.875rem;
  line-height: 1.45;
  padding: 0.35rem 0;
  color: var(--cf-ink);
}

.detail-ic {
  flex-shrink: 0;
  color: var(--cf-muted);
  margin-top: 2px;
}

.urgent-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.75rem 0 0;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--cf-warn-soft);
  color: var(--cf-warn);
}

.gopoints-intro {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--cf-muted);
}

.gopoints-options {
  display: flex;
  gap: 0.75rem;
}

.gopoints-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 1rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #fff;
  cursor: pointer;
  text-align: left;
  font-family: var(--cf-font);
  color: var(--cf-ink);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.gopoints-option:hover {
  border-color: #cbd5e1;
}

.gopoints-option.active {
  border-color: var(--cf-cta);
  background: var(--cf-cta-soft);
  box-shadow: 0 0 0 1px var(--cf-cta-soft);
}

.gopoints-option svg {
  color: var(--cf-muted);
}

.gopoints-option.active svg {
  color: var(--cf-cta);
}

.gp-title {
  font-weight: 700;
  font-size: 0.875rem;
}

.gp-cost {
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.payment-methods {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.pay-method {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem 0.5rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #fff;
  font-family: var(--cf-font);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cf-muted);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.pay-method:hover {
  border-color: #cbd5e1;
  color: var(--cf-ink);
}

.pay-method.active {
  border-color: var(--cf-cta);
  background: var(--cf-cta-soft);
  color: var(--cf-cta-hover);
}

.pay-method:focus-visible {
  outline: 2px solid var(--cf-ink);
  outline-offset: 2px;
}

.payment-fields {
  margin-top: 0.25rem;
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0;
  padding: 0.875rem 1rem;
  border-radius: var(--cf-radius);
  background: #f8fafc;
  border: 1px solid var(--cf-line);
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--cf-muted);
}

.info-note svg {
  flex-shrink: 0;
  color: var(--cf-cta);
  margin-top: 2px;
}

.mb-reference {
  padding: 1.25rem;
  border-radius: var(--cf-radius);
  background: #f8fafc;
  border: 1px solid var(--cf-line);
}

.mb-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.35rem 0;
  font-size: 0.9375rem;
}

.mb-label {
  color: var(--cf-muted);
  font-size: 0.8125rem;
}

.mb-value {
  font-family: var(--cf-display);
  font-weight: 700;
  letter-spacing: 0.03em;
}

.estafeta-note {
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--cf-muted);
  text-align: center;
}

.pay-submit {
  margin-top: 0.25rem;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-notification {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.875rem 1.25rem;
  border-radius: var(--cf-radius);
  background: var(--cf-ink);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
  max-width: calc(100vw - 2rem);
}

.toast-enter-active {
  animation: toastIn 0.35s ease;
}

.toast-leave-active {
  animation: toastOut 0.25s ease;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastOut {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
}

@media (max-width: 900px) {
  .payment-layout {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: static;
  }

  .payment-methods {
    flex-direction: column;
  }

  .gopoints-options {
    flex-direction: column;
  }

  .form-row-2col {
    grid-template-columns: 1fr;
  }
}
</style>
