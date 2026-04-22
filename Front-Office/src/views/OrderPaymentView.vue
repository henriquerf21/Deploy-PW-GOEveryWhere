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
            <span>Desconto</span>
            <span>−€{{ discountVal.toFixed(2) }}</span>
          </div>
          
          <hr class="inner-rule" />
          
          <div class="summary-line total-line">
            <span>Total</span>
            <span>€{{ total.toFixed(2) }}</span>
          </div>

          <div class="points-reward-box">
            <div class="points-earned">
              <Award :size="18" :stroke-width="1.75" aria-hidden="true" />
              <div class="points-stack">
                <span class="points-gain">+{{ pointsEarned }} GoPoints </span>
                <span class="points-label">nesta encomenda</span>
              </div>
            </div>
            <div class="points-balance-footer">
              Saldo atual: <strong>{{ currentBalance }} pts</strong>
            </div>
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
            <h2 id="pay-methods-h" class="side-title">Método de Pagamento</h2>
            <div class="payment-methods" role="radiogroup" aria-label="Método de pagamento">
              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'mbway' }" @click="setMethod('mbway')">
                <div class="pay-logo-mbway-wrap">
                  <img :src="mbwayLogoSrc" alt="MB WAY" class="pay-logo-mbway" loading="lazy" />
                </div>
                <span class="pay-method-label">MB Way</span>
              </button>

              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'applepay' }" @click="setMethod('applepay')">
                <svg class="pay-logo pay-logo--applepay" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z" />
                </svg>
                <span class="pay-method-label">Apple&nbsp;Pay</span>
              </button>

              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'googlepay' }" @click="setMethod('googlepay')">
                <svg class="pay-logo pay-logo--googlepay" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 12.2c0-.63-.06-1.25-.16-1.84H12v3.49h3.19c-.14.72-.54 1.35-1.15 1.76v2.46h1.87c1.08-1 1.73-2.46 1.73-4.87z"/>
                  <path fill="#34A853" d="M12 18c1.62 0 2.98-.54 3.97-1.46l-1.87-2.46c-.5.35-1.15.55-2.1.55-1.61 0-2.98-1.09-3.47-2.55H6.55v2.55C7.54 16.63 9.61 18 12 18z"/>
                  <path fill="#FBBC05" d="M8.53 12.09c-.12-.37-.19-.77-.19-1.19s.07-.82.19-1.19V7.16H6.55c-.41.83-.64 1.77-.64 2.74s.23 1.91.64 2.74l1.98-2.55z"/>
                  <path fill="#EA4335" d="M12 5.92c.88 0 1.67.3 2.3.9l1.72-1.72C14.98 4.09 13.62 3.5 12 3.5c-2.39 0-4.46 1.37-5.45 3.66l1.98 2.55c.49-1.46 1.86-2.55 3.47-2.55z"/>
                </svg>
                <span class="pay-method-label">Google Pay</span>
              </button>

              <button type="button" class="pay-method" :class="{ active: store.payment.method === 'card' }" @click="setMethod('card')">
                <span class="pay-logo pay-logo--cards" aria-hidden="true">
                  <svg class="pay-logo__visa" viewBox="0 0 24 24"><path fill="#1A1F71" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/></svg>
                  <svg class="pay-logo__mc" viewBox="0 0 24 24"><path fill="currentColor" d="M11.343 18.031c.058.049.12.098.181.146-1.177.783-2.59 1.238-4.107 1.238C3.32 19.416 0 16.096 0 12c0-4.095 3.32-7.416 7.416-7.416 1.518 0 2.931.456 4.105 1.238-.06.051-.12.098-.165.15C9.6 7.489 8.595 9.688 8.595 12c0 2.311 1.001 4.51 2.748 6.031zm5.241-13.447c-1.52 0-2.931.456-4.105 1.238.06.051.12.098.165.15C14.4 7.489 15.405 9.688 15.405 12c0 2.31-1.001 4.507-2.748 6.031-.058.049-.12.098-.181.146 1.177.783 2.588 1.238 4.107 1.238C20.68 19.416 24 16.096 24 12c0-4.094-3.32-7.416-7.416-7.416zM12 6.174c-.096.075-.189.15-.28.231C10.156 7.764 9.169 9.765 9.169 12c0 2.236.987 4.236 2.551 5.595.09.08.185.158.28.232.096-.074.189-.152.28-.232 1.563-1.359 2.551-3.359 2.551-5.595 0-2.235-.987-4.236-2.551-5.595-.09-.08-.184-.156-.28-.231z"/></svg>
                </span>
                <span class="pay-method-label">Cartão</span>
              </button>
            </div>

            <div v-if="store.payment.method === 'mbway'" class="payment-fields">
              <div class="cf-field">
                <label class="cf-label">Telemóvel MB Way</label>
                <input 
                  :value="store.payment.mbwayPhone" 
                  @input="handlePhoneInput"
                  @keypress="onlyNumbers"
                  class="cf-input" 
                  type="tel" 
                  inputmode="numeric" 
                  placeholder="912 345 678" 
                  maxlength="9" 
                />
              </div>
            </div>

            <div v-if="store.payment.method === 'card'" class="payment-fields">
              <div class="card-grid">
                <div class="cf-field span-full">
                  <label class="cf-label">Nome no cartão</label>
                  <input v-model="store.payment.cardName" class="cf-input" type="text" placeholder="Nome impresso" autocomplete="cc-name" />
                </div>
                <div class="cf-field span-full">
                  <label class="cf-label">Número do cartão</label>
                  <input 
                    :value="store.payment.cardNumber" 
                    @input="handleCardNumberInput"
                    @keypress="onlyNumbers"
                    class="cf-input" 
                    type="tel" 
                    inputmode="numeric" 
                    placeholder="0000 0000 0000 0000" 
                    maxlength="19" 
                  />
                </div>
                <div class="cf-field">
                  <label class="cf-label">Validade (MM/AA)</label>
                  <input 
                    :value="store.payment.cardExpiry" 
                    @input="handleExpiryInput"
                    @keypress="onlyNumbers"
                    class="cf-input" 
                    type="tel" 
                    inputmode="numeric"
                    placeholder="MM/AA" 
                    maxlength="5" 
                  />
                </div>
                <div class="cf-field">
                  <label class="cf-label">CVC</label>
                  <input 
                    :value="store.payment.cardCvc" 
                    @input="handleCvcInput"
                    @keypress="onlyNumbers"
                    class="cf-input" 
                    type="tel" 
                    inputmode="numeric" 
                    placeholder="123" 
                    maxlength="3" 
                  />
                </div>
              </div>
            </div>

            <p v-if="['applepay', 'googlepay'].includes(store.payment.method)" class="wallet-hint">
              O pagamento será processado via Secure Gateway no passo seguinte.
            </p>
          </section>

          <button 
            type="button" 
            class="cf-btn-primary pay-submit" 
            :disabled="processing || !isFormValid" 
            @click="handleConfirmOrder"
          >
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
        <span>Encomenda registada com sucesso!</span>
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
import { User, Home, Store, Clock, Award, Loader2, CheckCircle2 } from 'lucide-vue-next';

import { 
  useOrderStore, 
  orderTotal, 
  subtotal, 
  deliveryFee, 
  urgentFee, 
  productDiscount, 
  cartProducts, 
  pointsToEarn, 
  userPointsBalance, 
  estimatedETA, 
  setPaymentMethod, 
  setPaymentField,
  submitOrder,
  isCartValid, 
  isDeliveryValid 
} from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const processing = ref(false);
const showToast = ref(false);
const mbwayLogoSrc = `${import.meta.env.BASE_URL}payment/mbway-logo.png`;

onMounted(() => {
  if (!isCartValid()) {
    router.replace('/order/select');
  } else if (!isDeliveryValid()) {
    router.replace('/order/delivery');
  }
});

// Computed Mappings
const cartItems = computed(() => cartProducts.value);
const subTotal = computed(() => subtotal.value);
const deliveryFeeVal = computed(() => deliveryFee.value);
const urgentFeeVal = computed(() => urgentFee.value);
const discountVal = computed(() => productDiscount.value);
const total = computed(() => orderTotal.value);
const pointsEarned = computed(() => pointsToEarn.value);
const currentBalance = computed(() => userPointsBalance.value);
const eta = computed(() => estimatedETA.value);

// Validação de Formulário
const isFormValid = computed(() => {
  if (store.payment.method === 'mbway') {
    return store.payment.mbwayPhone?.length === 9;
  }
  if (store.payment.method === 'card') {
    return (
      store.payment.cardName?.length > 2 &&
      store.payment.cardNumber?.replace(/\s/g, '').length === 16 &&
      store.payment.cardExpiry?.length === 5 &&
      store.payment.cardCvc?.length === 3
    );
  }
  return true;
});

// --- NOVO: Helper para bloquear teclas não numéricas ---
function onlyNumbers(e) {
  // Permite apenas números (0-9). 
  // Caracteres especiais de controlo como Backspace funcionam por defeito no keypress de browsers modernos
  if (!/[0-9]/.test(e.key)) {
    e.preventDefault();
  }
}

// Handlers com Máscaras e Limpeza Forçada
function handlePhoneInput(e) {
  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
  e.target.value = val; // Força a limpeza no elemento visual
  setPaymentField('mbwayPhone', val);
}

function handleCardNumberInput(e) {
  const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
  const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  e.target.value = formatted; // Força a limpeza e formatação no elemento visual
  setPaymentField('cardNumber', formatted);
}

function handleExpiryInput(e) {
  let digits = e.target.value.replace(/\D/g, '').slice(0, 4);
  let formatted = digits;
  if (digits.length >= 3) {
    formatted = digits.slice(0, 2) + '/' + digits.slice(2);
  }
  e.target.value = formatted;
  setPaymentField('cardExpiry', formatted);
}

function handleCvcInput(e) {
  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
  e.target.value = val;
  setPaymentField('cardCvc', val);
}

function setMethod(m) { setPaymentMethod(m); }

async function handleConfirmOrder() {
  if (processing.value || !isFormValid.value) return;
  processing.value = true;

  const result = await submitOrder();

  if (result && result.success) {
    showToast.value = true;
    setTimeout(() => {
      router.push('/order/tracking');
    }, 2000);
  } else {
    processing.value = false;
    alert(`Erro ao finalizar encomenda: ${result?.error || 'Erro interno.'}`);
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

.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
}

.span-full {
  grid-column: span 2;
}

.pay-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .payment-methods {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.pay-method-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
  line-height: 1.15;
  max-width: 100%;
}

/* MB WAY: marca preto + vermelho em fundo branco (asset em public/) */
.pay-logo-mbway-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 120px;
  padding: 0.3rem 0.4rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--cf-line);
}

.pay-method.active .pay-logo-mbway-wrap {
  border-color: var(--cf-cta);
  box-shadow: 0 0 0 1px var(--cf-cta-soft);
}

.pay-logo-mbway {
  display: block;
  height: 28px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.pay-logo {
  display: block;
  max-width: 100%;
}

.pay-logo--applepay,
.pay-logo--googlepay {
  width: 32px;
  height: 32px;
  color: var(--cf-ink);
}

.pay-method.active .pay-logo--applepay,
.pay-method.active .pay-logo--googlepay {
  color: initial;
}

.pay-logo--cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 28px;
  color: #eb001b;
}

.pay-logo__visa,
.pay-logo__mc {
  height: 22px;
  width: auto;
}

.pay-logo__visa {
  width: 36px;
}

.wallet-hint {
  margin: 0.75rem 0 0;
  padding: 0.75rem 0.875rem;
  border-radius: var(--cf-radius);
  background: #f8fafc;
  border: 1px solid var(--cf-line);
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--cf-muted);
}

.pay-method {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 5.5rem;
  padding: 0.65rem 0.4rem;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .gopoints-options {
    flex-direction: column;
  }

  .form-row-2col {
    grid-template-columns: 1fr;
  }
}
</style>
