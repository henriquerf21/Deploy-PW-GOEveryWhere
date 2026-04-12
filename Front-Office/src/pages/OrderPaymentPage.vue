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
          </section>

          <hr class="cf-divider" />

          <section class="pay-section" aria-labelledby="pay-methods-h">
            <h2 id="pay-methods-h" class="side-title">Método</h2>
            <div class="payment-methods" role="radiogroup">
              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'card' }" @click="setMethod('card')">
                <CreditCard :size="20" /> Cartão
              </button>
              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'mbway' }" @click="setMethod('mbway')">
                <Smartphone :size="20" /> MB Way
              </button>
              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'multibanco' }" @click="setMethod('multibanco')">
                <Building2 :size="20" /> Multibanco
              </button>
            </div>

            <div v-if="store.payment.method === 'mbway'" class="payment-fields">
              <div class="cf-field">
                <label class="cf-label">Telemóvel MB Way</label>
                <input v-model="store.payment.mbwayPhone" class="cf-input" type="tel" placeholder="912 345 678" />
              </div>
            </div>

            <div v-if="store.payment.method === 'card'" class="payment-fields">
              <input v-model="store.payment.cardName" class="cf-input" type="text" placeholder="Nome no cartão" style="margin-bottom: 10px;"/>
              <input v-model="store.payment.cardNumber" class="cf-input" type="text" placeholder="Número do cartão" />
            </div>

            <div v-if="store.payment.method === 'multibanco'" class="payment-fields">
              <div class="mb-reference">
                <div class="mb-row"><span class="mb-label">Entidade</span><span class="mb-value">21 312</span></div>
                <div class="mb-row"><span class="mb-label">Referência</span><span class="mb-value">{{ mbRef }}</span></div>
              </div>
            </div>
          </section>

          <button type="button" class="cf-btn-primary pay-submit" :disabled="processing" @click="handleConfirmOrder">
            <Loader2 v-if="processing" class="spin" :size="18" />
            <span v-if="processing">A processar…</span>
            <span v-else>Pagar €{{ total.toFixed(2) }}</span>
          </button>
        </div>
      </div>
    </main>

    <Transition name="toast">
      <div v-if="showToast" class="toast-notification" role="status">
        <CheckCircle2 :size="18" />
        <span>Encomenda registada. A abrir o acompanhamento…</span>
      </div>
    </Transition>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import CheckoutWizardSteps from '../components/CheckoutWizardSteps.vue';

// Ícones
import { 
  User, Home, Store, Clock, Award, CreditCard, Smartphone, 
  Building2, Loader2, CheckCircle2, Zap, Truck, Tag, Info, Lock, ShieldCheck 
} from 'lucide-vue-next';

// Store
import { 
  useOrderStore, orderTotal, subtotal, deliveryFee, 
  urgentFee, productDiscount, cartProducts, pointsToEarn, 
  estimatedETA, setPaymentMethod, toggleGoPoints, submitOrder,
  isCartValid, isDeliveryValid
} from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const processing = ref(false);
const showToast = ref(false);

// Bloqueio de segurança: Se o carrinho estiver vazio, volta para trás
onMounted(() => {
  if (!isCartValid()) {
    router.replace('/order/select');
  } else if (!isDeliveryValid()) {
    router.replace('/order/delivery');
  }
});

// Referência Multibanco Dinâmica
const mbRef = computed(() => {
  const r = Math.floor(Math.random() * 900000000) + 100000000;
  return String(r).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
});

// Computed Mappings
const cartItems = computed(() => cartProducts.value);
const subTotal = computed(() => subtotal.value);
const deliveryFeeVal = computed(() => deliveryFee.value);
const urgentFeeVal = computed(() => urgentFee.value);
const discountVal = computed(() => productDiscount.value);
const total = computed(() => orderTotal.value);
const pointsEarned = computed(() => pointsToEarn.value);
const eta = computed(() => estimatedETA.value);

// Ações
function setMethod(m) { setPaymentMethod(m); }
function togglePoints(type) { toggleGoPoints(type); }

/**
 * handleConfirmOrder: Agora 100% ligada ao servidor
 */
async function handleConfirmOrder() {
  if (processing.value) return;
  processing.value = true;

  // Chamada real à API (via store)
  const result = await submitOrder();

  if (result && result.success) {
    // SUCESSO: Mostra Toast e redireciona
    showToast.value = true;
    setTimeout(() => {
      router.push('/order/tracking');
    }, 2000);
  } else {
    // ERRO: Para o carregamento e avisa o Henrique do erro do Strapi
    processing.value = false;
    alert(`Erro ao finalizar encomenda: ${result?.error || 'Verifica a consola do servidor.'}`);
  }
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
