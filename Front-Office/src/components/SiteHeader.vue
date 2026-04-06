<template>
  <header class="site-header" :class="{ scrolled: isScrolled }">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <img :src="MEDIA.brandLogo" alt="GoEverywhere" class="logo-img" />
        <span class="logo-text"><span class="logo-go">GO</span>Everywhere</span>
      </router-link>
      <nav class="header-nav">
        <router-link to="/product" class="nav-item">Produtos</router-link>
        <router-link to="/" class="nav-item">Início</router-link>
      </nav>
      <div class="header-actions">
        <template v-if="isAuth">
          <router-link to="/dashboard" class="action-btn" title="A tua conta">
            <div class="user-avatar">{{ user?.initials || 'U' }}</div>
            <span>{{ user?.firstName || 'Conta' }}</span>
          </router-link>
          <router-link to="/order/select" class="action-btn" title="Carrinho">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Carrinho</span>
          </router-link>
          <button class="btn-logout" @click="handleLogout" title="Terminar sessão">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sair</span>
          </button>
        </template>
        <template v-else>
          <router-link to="/login-welcome" class="btn-login">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>Entrar</span>
          </router-link>
        </template>
      </div>

      <!-- Mobile menu toggle -->
      <button class="mobile-toggle" @click="mobileOpen = !mobileOpen" aria-label="Menu">
        <svg v-if="!mobileOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition name="mobile-menu">
      <div v-if="mobileOpen" class="mobile-nav">
        <router-link to="/" class="mobile-link" @click="mobileOpen = false">Início</router-link>
        <router-link to="/product" class="mobile-link" @click="mobileOpen = false">Produtos</router-link>
        <template v-if="isAuth">
          <router-link to="/dashboard" class="mobile-link" @click="mobileOpen = false">A Minha Conta</router-link>
          <router-link to="/order/select" class="mobile-link" @click="mobileOpen = false">Carrinho</router-link>
          <button class="mobile-link logout" @click="handleLogout(); mobileOpen = false">Sair</button>
        </template>
        <template v-else>
          <router-link to="/login-welcome" class="mobile-link accent" @click="mobileOpen = false">Entrar</router-link>
        </template>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, isAuthenticated, logout } from '../stores/authStore.js';
import { MEDIA } from '../config/media.js';

const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);
const isAuth = isAuthenticated;
const isScrolled = ref(false);
const mobileOpen = ref(false);

function handleLogout() {
  logout();
  router.push('/login-welcome');
}

function onScroll() {
  isScrolled.value = window.scrollY > 10;
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped>
.site-header {
  font-family: var(--go-font-body);
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background var(--go-duration) var(--go-ease),
              box-shadow var(--go-duration) var(--go-ease);
}
.site-header.scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 12px rgba(0,0,0,0.06);
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: var(--go-ink);
  transition: opacity var(--go-duration-fast);
}
.logo:hover { opacity: 0.8; }
.logo-img {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: contain;
}
.logo-text {
  font-family: var(--go-font-display);
  font-weight: 600;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  letter-spacing: 0.02em;
  color: var(--go-ink);
}
.logo-go {
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-right: 1px;
}
.header-nav {
  display: flex;
  gap: 32px;
}
.nav-item {
  text-decoration: none;
  color: var(--go-muted);
  font-weight: 500;
  font-size: 14px;
  transition: color var(--go-duration-fast);
  position: relative;
}
.nav-item::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--go-primary);
  border-radius: 1px;
  transition: width var(--go-duration) var(--go-ease);
}
.nav-item:hover { color: var(--go-ink); }
.nav-item:hover::after { width: 100%; }
.nav-item.router-link-exact-active { color: var(--go-ink); }
.nav-item.router-link-exact-active::after { width: 100%; }
.header-actions {
  display: flex;
  gap: 14px;
  align-items: center;
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: var(--go-muted);
  font-size: 11px;
  font-weight: 500;
  transition: color var(--go-duration-fast);
}
.action-btn:hover { color: var(--go-ink); }
.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #334155, #0f172a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
}
.btn-login {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  background: #fff;
  color: #0f172a;
  padding: 10px 22px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}
.btn-login:hover {
  border-color: #0f172a;
  transform: translateY(-1px);
}
.btn-logout {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 16px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-logout:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.mobile-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #111827;
  padding: 4px;
}

/* Mobile nav */
.mobile-nav {
  display: none;
  flex-direction: column;
  padding: 16px 32px 24px;
  background: rgba(255,255,255,0.98);
  border-top: 1px solid #f3f4f6;
}
.mobile-link {
  display: block;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  border-bottom: 1px solid #f3f4f6;
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: color 0.2s;
}
.mobile-link:hover { color: #0f172a; }
.mobile-link.accent { color: #0f172a; font-weight: 700; }
.mobile-link.logout { color: #ef4444; }
.mobile-link:last-child { border-bottom: none; }

.mobile-menu-enter-active { animation: mobileSlideDown 0.35s var(--go-ease); }
.mobile-menu-leave-active { animation: mobileSlideUp 0.25s ease-in; }
@keyframes mobileSlideDown {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes mobileSlideUp {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}

@media (max-width: 768px) {
  .header-nav { display: none; }
  .header-actions { display: none; }
  .mobile-toggle { display: flex; }
  .mobile-nav { display: flex; }
  .header-inner { padding: 12px 20px; }
}
</style>
