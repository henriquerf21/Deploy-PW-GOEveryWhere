<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />
    <CheckoutWizardSteps :current-step="1" />

    <main class="cf-checkout-main">
      <header class="cf-checkout-head">
        <p class="cf-checkout-kicker">Encomenda GoGummies</p>
        <h1 class="cf-checkout-title">Carrinho</h1>
      </header>

      <div class="order-shell cf-panel">
        <div class="order-layout">
          <div class="product-preview">
            <img
              :src="MEDIA.gogummies.productDetail"
              alt="Frasco GoGummies — produto que vais receber"
              width="520"
              height="520"
              loading="eager"
              decoding="async"
            />
          </div>

          <div class="order-content">
            <h2 class="order-content-title">Packs</h2>
            <p class="order-content-hint">Toca numa linha para selecionar; ajusta a quantidade com + e −.</p>

            <div
              v-for="product in products"
              :key="product.id"
              class="pack-card"
              :class="{ selected: store.cart.items[product.id] > 0 }"
              role="button"
              tabindex="0"
              @click="selectPack(product.id)"
              @keydown.enter.prevent="selectPack(product.id)"
              @keydown.space.prevent="selectPack(product.id)"
            >
              <div class="pack-info">
                <div class="pack-title-row">
                  <span class="pack-title">{{ product.name }}</span>
                  <span v-if="product.popular" class="popular-badge">Recomendado</span>
                </div>
                <span class="pack-desc">{{ product.desc }}</span>
              </div>
              <span class="pack-price">€{{ product.price.toFixed(2) }}</span>
              <div class="qty-control" @click.stop>
                <button
                  type="button"
                  class="qty-btn"
                  @click="changeQty(product.id, -1)"
                  aria-label="Diminuir quantidade"
                >
                  <Minus :size="16" :stroke-width="2" />
                </button>
                <span class="qty-val" aria-live="polite">{{ store.cart.items[product.id] }}</span>
                <button
                  type="button"
                  class="qty-btn qty-btn-plus"
                  @click="changeQty(product.id, 1)"
                  aria-label="Aumentar quantidade"
                >
                  <Plus :size="16" :stroke-width="2" />
                </button>
              </div>
            </div>

            <div class="urgent-card" :class="{ active: store.cart.urgentDelivery }">
              <div class="urgent-row">
                <div class="urgent-copy">
                  <div class="urgent-title-row">
                    <Zap :size="18" :stroke-width="1.75" class="urgent-ic" aria-hidden="true" />
                    <span class="urgent-title">Entrega urgente</span>
                    <span class="urgent-price">+€1,50</span>
                  </div>
                  <p class="urgent-desc">Prioridade na fila — indicativo ~15 min, conforme zona e tráfego.</p>
                </div>
                <button
                  type="button"
                  class="toggle"
                  :class="{ active: store.cart.urgentDelivery }"
                  :aria-pressed="store.cart.urgentDelivery"
                  aria-label="Ativar entrega urgente"
                  @click="toggleUrgentFn"
                >
                  <span class="toggle-dot" />
                </button>
              </div>
              <p v-if="store.cart.urgentDelivery" class="urgent-note">
                A tua encomenda entra com prioridade máxima na atribuição ao estafeta.
              </p>
              <p v-if="urgentAvailable" class="urgent-available">
                <span class="dot-ok" aria-hidden="true" />
                Cobertura disponível na tua área.
              </p>
            </div>

            <div v-if="pointsEarned > 0" class="points-preview">
              <Award :size="22" :stroke-width="1.5" class="points-ic" aria-hidden="true" />
              <div class="points-info">
                <span class="points-earn">+{{ pointsEarned }} GoPoints nesta compra</span>
                <span class="points-balance">Saldo: {{ store.goPoints.balance }} pts</span>
              </div>
            </div>

            <div class="summary-bar">
              <div class="summary-info">
                <span class="summary-items">
                  {{ itemCount }} {{ itemCount === 1 ? 'linha' : 'linhas' }}
                  <template v-if="store.cart.urgentDelivery"> · Urgente</template>
                </span>
                <span class="summary-total">€{{ total.toFixed(2) }}</span>
              </div>
              <button
                type="button"
                class="cf-btn-primary summary-cta"
                :disabled="itemCount === 0"
                @click="goToDelivery"
              >
                Continuar para entrega
                <ArrowRight :size="18" :stroke-width="1.75" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'; // Adicionado onMounted
import { useRouter, useRoute } from 'vue-router'; // Adicionado useRoute
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import CheckoutWizardSteps from '../components/CheckoutWizardSteps.vue';
import { MEDIA } from '../config/media.js';
import {
  ArrowRight,
  Award,
  Minus,
  Plus,
  Zap,
} from 'lucide-vue-next';
import {
  useOrderStore,
  PRODUCTS,
  setCartQty,
  toggleUrgent,
  subtotal,
  urgentFee,
  cartItemCount,
  pointsToEarn,
} from '../stores/orderStore.js';

const router = useRouter();
const route = useRoute(); // Para capturar os parâmetros da query (?pack=...)
const store = useOrderStore();
const products = PRODUCTS;

// --- Lógica para sincronizar com a página inicial ---
onMounted(() => {
  const packIdFromUrl = route.query.pack;

  if (packIdFromUrl) {
    // 1. Limpamos qualquer seleção anterior para não acumular packs
    Object.keys(store.cart.items).forEach(id => {
      setCartQty(id, 0);
    });

    // 2. Definimos a quantidade 1 para o pack que veio no URL
    setCartQty(packIdFromUrl, 1);
  }
});
// ----------------------------------------------------

const itemCount = cartItemCount;
const total = computed(() => subtotal.value + urgentFee.value);
const pointsEarned = pointsToEarn;
const urgentAvailable = ref(true);

function selectPack(id) {
  // Se o utilizador clicar noutro pack nesta página, 
  // limpamos os outros para manter apenas um pack ativo (opcional, mas recomendado)
  Object.keys(store.cart.items).forEach(key => setCartQty(key, 0));
  setCartQty(id, 1);
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
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.order-shell {
  padding: 0;
  overflow: hidden;
}

.order-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  align-items: stretch;
}

.product-preview {
  background: linear-gradient(165deg, #f1f5f9 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  min-height: 280px;
}

.product-preview img {
  max-width: 100%;
  height: auto;
  max-height: 420px;
  object-fit: contain;
  border-radius: var(--cf-radius);
}

.order-content {
  padding: 1.75rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-content-title {
  margin: 0;
  font-family: var(--cf-display);
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cf-ink);
}

.order-content-hint {
  margin: -0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--cf-muted);
  line-height: 1.45;
}

.pack-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.pack-card:hover {
  border-color: #cbd5e1;
}

.pack-card:focus-visible {
  outline: 2px solid var(--cf-cta);
  outline-offset: 2px;
}

.pack-card.selected {
  border-color: var(--cf-cta);
  background: rgba(16, 185, 129, 0.04);
  box-shadow: 0 0 0 1px var(--cf-cta-soft);
}

.pack-info {
  flex: 1;
  min-width: 0;
}

.pack-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pack-title {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--cf-ink);
}

.pack-desc {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.8125rem;
  color: var(--cf-muted);
  line-height: 1.4;
}

.pack-price {
  font-family: var(--cf-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--cf-cta);
  flex-shrink: 0;
}

.popular-badge {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--cf-ink);
  color: #fff;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}

.qty-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  border: 1px solid var(--cf-line);
  background: #fff;
  color: var(--cf-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.qty-btn:hover {
  border-color: var(--cf-cta);
  background: var(--cf-cta-soft);
}

.qty-btn-plus {
  background: var(--cf-cta);
  border-color: var(--cf-cta);
  color: #fff;
}

.qty-btn-plus:hover {
  background: var(--cf-cta-hover);
  border-color: var(--cf-cta-hover);
}

.qty-val {
  min-width: 1.5rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.9375rem;
}

.urgent-card {
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  padding: 1rem 1.125rem;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.urgent-card.active {
  border-color: rgba(234, 88, 12, 0.45);
  background: var(--cf-warn-soft);
}

.urgent-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.urgent-copy {
  min-width: 0;
}

.urgent-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.urgent-ic {
  color: var(--cf-warn);
  flex-shrink: 0;
}

.urgent-title {
  font-weight: 700;
  font-size: 0.9375rem;
}

.urgent-price {
  font-weight: 700;
  font-size: 0.8125rem;
  color: var(--cf-warn);
}

.urgent-desc {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  color: var(--cf-muted);
  line-height: 1.45;
}

.toggle {
  flex-shrink: 0;
  width: 3rem;
  height: 1.625rem;
  border-radius: 999px;
  border: none;
  background: var(--cf-line);
  cursor: pointer;
  position: relative;
  transition: background 0.25s ease;
}

.toggle.active {
  background: var(--cf-cta);
}

.toggle-dot {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  transition: transform 0.25s ease;
}

.toggle.active .toggle-dot {
  transform: translateX(1.35rem);
}

.urgent-note {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  color: var(--cf-warn);
  line-height: 1.45;
}

.urgent-available {
  margin: 0.5rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cf-success);
}

.dot-ok {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cf-success);
}

.points-preview {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: var(--cf-radius);
  border: 1px solid #fde68a;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.points-ic {
  color: #d97706;
  flex-shrink: 0;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.points-earn {
  font-weight: 700;
  font-size: 0.875rem;
  color: #b45309;
}

.points-balance {
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.summary-bar {
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--cf-line);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.summary-items {
  font-size: 0.8125rem;
  color: var(--cf-muted);
  font-weight: 500;
}

.summary-total {
  font-family: var(--cf-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.summary-cta {
  width: auto;
  min-width: min(100%, 240px);
  flex: 1 1 auto;
}

@media (max-width: 900px) {
  .order-layout {
    grid-template-columns: 1fr;
  }

  .product-preview {
    min-height: 220px;
    max-height: 320px;
  }

  .product-preview img {
    max-height: 260px;
  }

  .summary-cta {
    width: 100%;
  }
}
</style>
