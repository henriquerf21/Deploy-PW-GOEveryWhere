<template>
  <div class="page-wrapper">
    <!-- Header -->
    <SiteHeader />

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-image" v-observe-visibility>
          <img src="https://codia-f2c.s3.us-west-1.amazonaws.com/default/image/2026-03-27/73295681-b31c-4ac6-9669-b66026c533d3.png" alt="GoGummies" />
          <div class="badge">NOVA Fórmula</div>
        </div>
        <div class="hero-content" v-observe-visibility>
          <h1>Gomas Proteicas</h1>
          <p class="subtitle">Entrega em 30 min</p>
          <p class="description">Encomenda GoGummies online. Nós levantamos no Continente mais perto de ti e entregamos à tua porta.</p>
          <router-link to="/order/select" class="cta-button">
            Encomendar Agora →
          </router-link>
        </div>
      </div>
    </section>

    <!-- Product Info -->
    <section class="product-info">
      <div class="product-inner">
        <div class="product-card" v-observe-visibility>
          <div class="product-header">
            <div>
              <h2>GoGummies</h2>
              <span class="stock-badge">Em stock</span>
              <p class="product-desc">30 gomas proteicas por frasco</p>
            </div>
            <div class="price-block">
              <span class="product-price">€14.99</span>
              <span class="price-label">por frasco</span>
            </div>
          </div>
          <div class="pack-options">
            <div class="pack-option selected">
              <span class="pack-name">1 Frasco</span>
              <span class="pack-price">€14.99</span>
            </div>
            <div class="pack-option">
              <div class="discount-badge">-10%</div>
              <span class="pack-name">Pack 2</span>
              <span class="pack-price">€26.99</span>
            </div>
            <div class="pack-option">
              <div class="discount-badge orange">-15%</div>
              <span class="pack-name">Pack 3</span>
              <span class="pack-price">€38.24</span>
            </div>
          </div>
        </div>

        <!-- Features Row -->
        <div class="features-row">
          <div class="feature">
            <svg class="feature-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>~30 min</span>
          </div>
          <div class="feature">
            <svg class="feature-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span>Portes Grátis em compras >€25</span>
          </div>
          <div class="feature">
            <svg class="feature-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Pagamento Seguro</span>
          </div>
          <div class="feature">
            <svg class="feature-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff9800" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Entrega Urgente Disponível</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose Section -->
    <section class="why-choose">
      <div class="why-inner">
        <h2 v-observe-visibility>Porque escolher GoGummies?</h2>
        <div class="benefits-grid">
          <div class="benefit-card">
            <div class="benefit-icon-wrapper"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg></div>
            <h3>Alto Teor de Proteína</h3>
            <p>Cada dose contém 5g de proteína ultrafiltrada para apoiar a recuperação muscular e manter a saciedade por mais tempo.</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon-wrapper"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            <h3>Sem Açúcares Adicionados</h3>
            <p>Adoçadas naturalmente com stevia e extratos de fruta. Sem quebras de energia, sem culpa e com todo o sabor.</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-icon-wrapper"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="2" y1="21" x2="22" y2="21"/><line x1="12" y1="16" x2="12" y2="21"/></svg></div>
            <h3>Adequado a Vegans</h3>
            <p>Ingredientes 100% de origem vegetal. Sem gelatina ou produtos animais.</p>
          </div>
        </div>
        <router-link to="/order/select" class="cta-button center">
          Encomendar Agora →
        </router-link>
      </div>
    </section>

    <!-- About / Values Section (merged from AboutPage) -->
    <section class="about-section">
      <div class="about-inner">
        <div class="about-hero">
          <h2>Os Nossos Valores</h2>
          <p class="about-subtitle">O que nos move todos os dias</p>
        </div>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">⚡</div>
            <h3>Rapidez</h3>
            <p>Entregas em 30 min como padrão de serviço.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🛡️</div>
            <h3>Confiança</h3>
            <p>Tracking em tempo real em todas as fases.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">💚</div>
            <h3>Cuidado</h3>
            <p>Cada entrega é tratada como única.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">🤝</div>
            <h3>Comunidade</h3>
            <p>Apoiamos e trabalhamos com estafetas locais.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Nav Bar -->
    <div class="bottom-nav">
      <router-link to="/" class="bottom-nav-item">
        <span class="bottom-logo">G</span>
        <span>GoEverywhere</span>
      </router-link>
      <router-link to="/order/select" class="bottom-nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span>Carrinho</span>
      </router-link>
      <router-link to="/dashboard" class="bottom-nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Conta</span>
      </router-link>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-logo">G</span>
          <span>GoEverywhere</span>
        </div>
        <p class="copyright">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, isAuthenticated, logout } from '../stores/authStore.js';

const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);
const isAuth = isAuthenticated;

function handleLogout() {
  logout();
  router.push('/login-welcome');
}

const vObserveVisibility = {
  mounted(el) {
    el.classList.add('reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    el._observer = observer;
  },
  unmounted(el) {
    if (el._observer) el._observer.disconnect();
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.revealed {
  opacity: 1;
  transform: translateY(0);
}

.page-wrapper {
  font-family: 'Poppins', sans-serif;
  background: #f6f7f7;
  color: #111827;
  min-height: 100vh;
}

/* ── Header ── */
.site-header {
  background: rgba(239, 241, 241, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #111827;
}
.logo-img {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  object-fit: cover;
}
.logo-text {
  font-weight: 700;
  font-size: 15px;
}
.header-nav {
  display: flex;
  gap: 32px;
}
.nav-item {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  font-size: 14px;
  transition: color 0.2s;
}
.nav-item:hover, .nav-item.active {
  color: #111827;
}
.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: #111827;
  font-size: 11px;
  font-weight: 500;
  transition: color 0.2s;
}
.action-btn:hover { color: #00c853; }
.btn-logout { display: flex; align-items: center; gap: 6px; background: none; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 8px 16px; font-family: inherit; font-size: 13px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.25s ease; }
.btn-logout:hover { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

/* ── Hero ── */
.hero {
  background: linear-gradient(160deg, #e8f5e9 0%, #f1f8e9 40%, #fffde7 100%);
  padding: 80px 32px 60px;
  overflow: hidden;
}
.hero-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 60px;
}
.hero-image {
  flex: 1;
  position: relative;
  text-align: center;
}
.hero-image img {
  max-width: 100%;
  height: auto;
  max-height: 500px;
  border-radius: 24px;
  object-fit: cover;
}
.badge {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: #00c853;
  color: #fff;
  padding: 6px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
}
.hero-content {
  flex: 1;
}
.hero-content h1 {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}
.description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 32px;
  max-width: 420px;
}
.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #00c853;
  color: #fff;
  padding: 16px 40px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 6px 24px rgba(0, 200, 83, 0.3);
}
.cta-button:hover {
  background: #00b048;
  transform: translateY(-2px);
  box-shadow: 0 10px 32px rgba(0, 200, 83, 0.4);
}
.cta-button.center {
  display: block;
  width: fit-content;
  margin: 40px auto 0;
}

/* ── Product Info ── */
.product-info {
  padding: 60px 32px;
}
.product-inner {
  max-width: 1280px;
  margin: 0 auto;
}
.product-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  margin-bottom: 32px;
}
.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.product-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.stock-badge {
  display: inline-block;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  margin-left: 8px;
}
.product-desc {
  color: #6b7280;
  font-size: 14px;
  margin-top: 8px;
}
.price-block {
  text-align: right;
}
.product-price {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  display: block;
  position: relative !important;
  top: auto !important;
  left: auto !important;
}
.price-label {
  font-size: 13px;
  color: #6b7280;
}
.pack-options {
  display: flex;
  gap: 16px;
}
.pack-option {
  flex: 1;
  position: relative;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.pack-option:hover {
  border-color: #00c853;
}
.pack-option.selected {
  border-color: #00c853;
  background: #f0fdf4;
}
.pack-name {
  display: block;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}
.pack-price {
  color: #6b7280;
  font-size: 14px;
}
.discount-badge {
  position: absolute;
  top: -10px;
  right: -6px;
  background: #ff9800;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}
.discount-badge.orange {
  background: #f44336;
}

/* ── Features ── */
.features-row {
  display: flex;
  gap: 16px;
}
.feature {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.feature-icon {
  flex-shrink: 0;
}
.benefit-icon-wrapper {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: #f0fdf4;
}

/* ── Why Choose ── */
.why-choose {
  padding: 80px 32px;
  background: #fff;
}
.why-inner {
  max-width: 1280px;
  margin: 0 auto;
}
.why-inner h2 {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 48px;
}
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
.benefit-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
}
.benefit-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.benefit-card p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

/* ── About / Values Section ── */
.about-section {
  padding: 80px 32px;
  background: linear-gradient(180deg, #f6f7f7 0%, #e8f5e9 100%);
}
.about-inner {
  max-width: 1000px;
  margin: 0 auto;
}
.about-hero {
  text-align: center;
  margin-bottom: 48px;
}
.about-hero h2 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
}
.about-subtitle {
  font-size: 18px;
  color: #6b7280;
}
.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.value-card {
  background: #fff;
  border-radius: 20px;
  padding: 36px 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  transition: all 0.3s;
}
.value-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
}
.value-icon {
  font-size: 40px;
  margin-bottom: 16px;
}
.value-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}
.value-card p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

/* ── Bottom Nav ── */
.bottom-nav {
  display: none; /* Hidden on desktop, show on mobile */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 8px 0;
  z-index: 99;
}
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: #6b7280;
  font-size: 11px;
}
.bottom-logo {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: #00c853;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

/* ── Footer ── */
.site-footer {
  background: #111827;
  color: #fff;
  padding: 32px;
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}
.footer-logo {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #00c853;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.copyright {
  font-size: 13px;
  color: #9ca3af;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero-inner { flex-direction: column; gap: 32px; }
  .hero-content h1 { font-size: 32px; }
  .benefits-grid { grid-template-columns: 1fr; }
  .features-row { flex-direction: column; }
  .pack-options { flex-direction: column; }
  .values-grid { grid-template-columns: 1fr 1fr; }
  .header-nav { display: none; }
  .bottom-nav { display: flex; justify-content: space-around; }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
}
@media (max-width: 480px) {
  .values-grid { grid-template-columns: 1fr; }
}
</style>
