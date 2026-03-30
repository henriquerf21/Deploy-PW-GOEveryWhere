<template>
  <div class="page">
    <SiteHeader />

    <!-- Ficha de produto: tudo o necessário para comprar num só sítio -->
    <main id="comprar" class="shop" aria-label="Comprar GoGummies">
      <div class="shop-inner">
        <div class="shop-grid">
          <div class="shop-gallery">
            <img
              class="shop-img"
              :src="MEDIA.gogummies.productDetail"
              alt="Frasco GoGummies — produto que vais receber"
            />
          </div>

          <div class="shop-panel">
            <p class="shop-kicker">Gomas proteicas · Sabor limão</p>
            <h1 class="shop-title">GoGummies</h1>
            <p class="shop-lead">5g de proteína por goma · 0% açúcar adicionado · 30 gomas por frasco.</p>

            <p class="shop-stock">
              <span class="stock-dot" aria-hidden="true" />
              Disponível — encomenda hoje, recebe em casa
            </p>

            <div class="shop-field">
              <span class="shop-label" id="pack-label">Quantidade</span>
              <div
                class="pack-grid"
                role="radiogroup"
                aria-labelledby="pack-label"
              >
                <button
                  v-for="opt in packs"
                  :key="opt.id"
                  type="button"
                  class="pack-tile"
                  :class="{ selected: selectedPack === opt.id, popular: opt.popular }"
                  :aria-checked="selectedPack === opt.id"
                  role="radio"
                  @click="selectedPack = opt.id"
                >
                  <span v-if="opt.popular" class="pack-popular">Recomendado</span>
                  <span v-if="opt.badge" class="pack-badge">{{ opt.badge }}</span>
                  <span class="pack-title">{{ opt.title }}</span>
                  <span class="pack-price-line">{{ opt.price }}</span>
                </button>
              </div>
            </div>

            <div class="shop-total" aria-live="polite">
              <span class="shop-total-lbl">Total</span>
              <span class="shop-total-val">{{ currentPack.price }}</span>
            </div>

            <router-link
              :to="{ path: '/order/select', query: { pack: selectedPack } }"
              class="btn-cta btn-cta-xl"
            >
              {{ orderCtaLabel }}
              <ArrowRight :size="20" :stroke-width="1.5" class="btn-cta-ic" aria-hidden="true" />
            </router-link>

            <p class="shop-fine">
              Portes grátis acima de €25 · Pagamento seguro · Acompanhas a encomenda no site
            </p>
            <a href="#info-produto" class="shop-info-link">Saber mais sobre o produto</a>
          </div>
        </div>

        <div class="shop-trust" aria-label="Vantagens">
          <div class="shop-trust-item">
            <Package :size="20" :stroke-width="1.5" aria-hidden="true" />
            <span>Entrega rápida na tua zona</span>
          </div>
          <div class="shop-trust-item">
            <ShieldCheck :size="20" :stroke-width="1.5" aria-hidden="true" />
            <span>Checkout seguro</span>
          </div>
          <div class="shop-trust-item">
            <MessageCircle :size="20" :stroke-width="1.5" aria-hidden="true" />
            <span>Ajudamos se precisares</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Barra fixa no telemóvel: preço + encomendar (sempre à mão) -->
    <div class="sticky-buy" aria-hidden="false">
      <div class="sticky-buy-inner">
        <div class="sticky-price">
          <span class="sticky-price-lbl">Total</span>
          <span class="sticky-price-val">{{ currentPack.price }}</span>
        </div>
        <router-link
          :to="{ path: '/order/select', query: { pack: selectedPack } }"
          class="btn-cta sticky-btn"
        >
          Encomendar
          <ArrowRight :size="18" :stroke-width="1.5" aria-hidden="true" />
        </router-link>
      </div>
    </div>

    <section id="info-produto" class="info-section" aria-labelledby="info-heading">
      <div class="info-inner">
        <div class="info-hero">
          <div class="info-hero-visual">
            <img
              class="info-hero-img"
              :src="MEDIA.gogummies.heroGym"
              alt="Ambiente de ginásio — complementa o teu treino com uma pausa proteica prática"
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="info-hero-copy">
            <p class="info-kicker">Estilo de vida ativo</p>
            <h2 id="info-heading" class="info-heading">Proteína que acompanha o teu ritmo</h2>
            <p class="info-lead">
              Entre séries ou no fim do dia, as GoGummies são um snack proteico simples: sem preparação,
              fáceis de levar na mala ou mochila e com sabor limão refrescante.
            </p>
            <p class="info-body">
              Cada goma contribui para os teus objetivos de proteína diária — útil quando não tens tempo
              para um shake ou uma refeição completa logo a seguir ao treino.
            </p>
          </div>
        </div>

        <ul class="info-cards" aria-label="Destaques do produto">
          <li v-for="card in infoCards" :key="card.title" class="info-card">
            <component :is="card.icon" class="info-card-ic" :size="22" :stroke-width="1.5" aria-hidden="true" />
            <h3 class="info-card-title">{{ card.title }}</h3>
            <p class="info-card-text">{{ card.text }}</p>
          </li>
        </ul>

        <div class="info-delivery">
          <Truck :size="20" :stroke-width="1.5" class="info-delivery-ic" aria-hidden="true" />
          <p>
            <strong>Entrega GoEverywhere.</strong>
            Encomendas na tua zona com acompanhamento no site — portes grátis em compras acima de €25.
          </p>
        </div>
      </div>
    </section>

    <div class="bottom-nav">
      <router-link to="/about" class="bottom-nav-item">
        <span class="bottom-logo">G</span>
        <span>Início</span>
      </router-link>
      <router-link to="/order/select" class="bottom-nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span>Carrinho</span>
      </router-link>
      <router-link to="/dashboard" class="bottom-nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Conta</span>
      </router-link>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { MEDIA } from '../config/media.js';
import {
  ArrowRight,
  Candy,
  Dumbbell,
  MessageCircle,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-vue-next';

const selectedPack = ref('2');

const packs = [
  { id: '1', title: '1 frasco', price: '€14.99', badge: null, popular: false },
  { id: '2', title: 'Pack 2', price: '€26.99', badge: '-10%', popular: true },
  { id: '3', title: 'Pack 3', price: '€38.24', badge: '-15%', popular: false },
];

const currentPack = computed(() => packs.find((p) => p.id === selectedPack.value) || packs[0]);

const orderCtaLabel = computed(() => `Encomendar por ${currentPack.value.price}`);

const infoCards = [
  {
    icon: Dumbbell,
    title: 'Treino e recuperação',
    text: '5g de proteína por goma — um complemento prático antes ou depois do esforço, sem misturadores nem garrafas.',
  },
  {
    icon: Candy,
    title: 'Sabor limão, 0% açúcar adicionado',
    text: 'Formato em goma com 30 unidades por frasco: fácil de dosear e de incluir na rotina.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra com confiança',
    text: 'Checkout seguro e resumo claro no pagamento. Na área de cliente acompanhas o estado da encomenda.',
  },
];
</script>

<style scoped>
.page {
  --cta: #10b981;
  --cta-hover: #059669;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e2e8f0;
  --surface: #f8fafc;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  background: #fff;
  min-height: 100vh;
}

@media (max-width: 768px) {
  /* Uma só barra de ação no fundo — mais óbvio para comprar */
  .page {
    padding-bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
  }
}

/* Loja */
.shop {
  padding: 1.25rem 1.25rem 2rem;
  scroll-margin-top: 72px;
}
.shop-inner {
  max-width: 1040px;
  margin: 0 auto;
}
.shop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 1px solid var(--line);
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06);
}
.shop-gallery {
  background: var(--surface);
  min-height: 360px;
}
.shop-img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 360px;
  object-fit: cover;
  object-position: center;
}
.shop-panel {
  padding: 1.75rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.shop-kicker {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.shop-title {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
  line-height: 1.05;
}
.shop-lead {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--muted);
}
.shop-stock {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
}
.stock-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cta);
  flex-shrink: 0;
}
@media (prefers-reduced-motion: no-preference) {
  .stock-dot {
    animation: pulse-soft 2s ease-in-out infinite;
  }
}
@keyframes pulse-soft {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.shop-field {
  margin-bottom: 1rem;
}
.shop-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--ink);
}

.pack-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.pack-tile {
  position: relative;
  text-align: center;
  padding: 1.1rem 0.4rem 0.85rem;
  padding-top: 1.35rem;
  border-radius: 0.65rem;
  border: 2px solid var(--line);
  background: #fafafa;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.pack-tile:hover {
  border-color: #cbd5e1;
  background: #fff;
}
.pack-tile:focus-visible {
  outline: 2px solid var(--cta);
  outline-offset: 2px;
}
.pack-tile.selected {
  border-color: var(--cta);
  background: #fff;
  box-shadow: 0 0 0 1px var(--cta);
}
.pack-tile.popular {
  padding-top: 1.45rem;
}
.pack-popular {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--ink);
  color: #fff;
  font-size: 0.5625rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  white-space: nowrap;
}
.pack-badge {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  background: var(--ink);
  color: #fff;
  font-size: 0.5625rem;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  border-radius: 0.2rem;
}
.pack-title {
  display: block;
  font-weight: 800;
  font-size: 0.75rem;
  margin-bottom: 0.2rem;
  text-transform: lowercase;
}
.pack-price-line {
  font-family: 'Oswald', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
}

.shop-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 1rem 0;
  margin-bottom: 0.25rem;
  border-top: 1px solid var(--line);
}
.shop-total-lbl {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--muted);
}
.shop-total-val {
  font-family: 'Oswald', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.btn-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--cta);
  color: #fff;
  font-weight: 700;
  font-size: 0.9375rem;
  padding: 0.95rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.28);
}
.btn-cta:hover {
  background: var(--cta-hover);
  transform: translateY(-1px);
}
.btn-cta:focus-visible {
  outline: 2px solid var(--cta);
  outline-offset: 3px;
}
.btn-cta-xl {
  width: 100%;
  font-size: 1.0625rem;
  padding: 1.05rem 1.25rem;
}
.btn-cta-ic {
  flex-shrink: 0;
  transition: transform 0.2s;
}
.btn-cta:hover .btn-cta-ic {
  transform: translateX(4px);
}

.shop-fine {
  margin: 0.85rem 0 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--muted);
  text-align: center;
}
.shop-info-link {
  display: block;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--muted);
}
.shop-info-link:hover {
  color: var(--ink);
}

.shop-trust {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.25rem 2rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: 0.75rem;
  border: 1px solid var(--line);
}
.shop-trust-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ink);
}
.shop-trust-item svg {
  flex-shrink: 0;
  color: var(--muted);
}

/* Sticky mobile */
.sticky-buy {
  display: none;
}
@media (max-width: 768px) {
  .sticky-buy {
    display: block;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    padding: 0.65rem 1rem;
    padding-bottom: calc(0.65rem + env(safe-area-inset-bottom, 0px));
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-top: 1px solid var(--line);
    box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.06);
  }
  .sticky-buy-inner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 1040px;
    margin: 0 auto;
  }
  .sticky-price {
    flex-shrink: 0;
    min-width: 4.5rem;
  }
  .sticky-price-lbl {
    display: block;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .sticky-price-val {
    font-family: 'Oswald', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    line-height: 1;
  }
  .sticky-btn {
    flex: 1;
    min-height: 48px;
  }
}

/* Informação (imagem + texto + destaques) */
.info-section {
  padding: 2.25rem 1.25rem 2.75rem;
  background: var(--surface);
  border-top: 1px solid var(--line);
  scroll-margin-top: 88px;
}
.info-inner {
  max-width: 1040px;
  margin: 0 auto;
}
.info-hero {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 0;
  align-items: stretch;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid var(--line);
  background: #fff;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.05);
  margin-bottom: 1.75rem;
}
.info-hero-visual {
  min-height: 280px;
  background: #0f172a;
}
.info-hero-img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 280px;
  object-fit: cover;
  object-position: center;
}
.info-hero-copy {
  padding: 1.75rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.info-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cta);
}
.info-heading {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(1.5rem, 3.2vw, 1.85rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.15;
  margin: 0 0 0.75rem;
}
.info-lead {
  margin: 0 0 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--ink);
}
.info-body {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--muted);
}
.info-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.info-card {
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  background: #fff;
  padding: 1.15rem 1.1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.info-card:hover {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);
}
.info-card-ic {
  color: var(--cta);
  display: block;
  margin-bottom: 0.65rem;
}
.info-card-title {
  margin: 0 0 0.4rem;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.25;
}
.info-card-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--muted);
}
.info-delivery {
  margin-top: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.15rem;
  border-radius: 0.75rem;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.info-delivery-ic {
  flex-shrink: 0;
  color: var(--cta);
  margin-top: 2px;
}
.info-delivery p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ink);
}
.info-delivery strong {
  color: var(--ink);
}

.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid var(--line);
  padding: 0.5rem 0;
  z-index: 99;
}
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: var(--muted);
  font-size: 0.6875rem;
  font-weight: 500;
}
.bottom-logo {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  background: var(--ink);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .bottom-nav {
    display: none;
  }
}

@media (max-width: 900px) {
  .shop-grid {
    grid-template-columns: 1fr;
  }
  .shop-gallery {
    min-height: 240px;
  }
  .shop-img {
    min-height: 240px;
    max-height: 320px;
  }
  .pack-grid {
    grid-template-columns: 1fr;
  }
  .info-hero {
    grid-template-columns: 1fr;
  }
  .info-hero-visual {
    min-height: 220px;
    max-height: 280px;
  }
  .info-hero-img {
    min-height: 220px;
    max-height: 280px;
  }
  .info-cards {
    grid-template-columns: 1fr;
  }
}

</style>
