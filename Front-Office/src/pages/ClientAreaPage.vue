<template>
  <div class="page-wrapper">
    <SiteHeader />

    <main class="dashboard-main">
      <div class="dashboard-inner">
        <div class="welcome-card">
          <div class="welcome-avatar" :class="{ 'google-avatar': user?.authMethod === 'google' }">
            {{ user?.initials || 'U' }}
          </div>
          <div>
            <h1>Olá {{ user?.firstName || 'Utilizador' }}</h1>
            <p>Bem-vindo de volta</p>
            <span v-if="user?.authMethod === 'google'" class="auth-badge">
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </span>
          </div>
        </div>

        <div class="dashboard-grid">
          <router-link to="/order/select" class="dash-card">
            <span class="dash-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </span>
            <h3>Nova Encomenda</h3>
            <p>Encomendar GoGummies</p>
          </router-link>
          <router-link to="/order/tracking" class="dash-card">
            <span class="dash-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </span>
            <h3>Encomendas Ativas</h3>
            <p>Ver tracking em tempo real</p>
          </router-link>
          <router-link to="/order/history" class="dash-card">
            <span class="dash-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </span>
            <h3>Histórico</h3>
            <p>Encomendas anteriores</p>
          </router-link>
          <div class="dash-card">
            <span class="dash-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <h3>Definições</h3>
            <p>Dados e preferências</p>
          </div>
        </div>

        <!-- User info card -->
        <div class="info-card">
          <h3>Os teus dados</h3>
          <div class="info-row">
            <span class="info-label">Nome</span>
            <span class="info-value">{{ user?.name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ user?.email || '-' }}</span>
          </div>
          <div class="info-row" v-if="user?.phone">
            <span class="info-label">Telefone</span>
            <span class="info-value">{{ user.phone }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Método de autenticação</span>
            <span class="info-value">{{ user?.authMethod === 'google' ? 'Google OAuth 2.0' : 'Email / Password' }}</span>
          </div>
        </div>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, logout, isAuthenticated } from '../stores/authStore.js';

const router = useRouter();
const auth = useAuthStore();

const user = computed(() => auth.user);

// Redirect if not authenticated
if (!isAuthenticated.value) {
  router.replace('/login');
}

function handleLogout() {
  logout();
  router.push('/login-welcome');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: linear-gradient(180deg, #f6f7f7 0%, #e8f5e9 100%); color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

.dashboard-main { flex: 1; padding: 48px 32px; }
.dashboard-inner { max-width: 800px; margin: 0 auto; }

.welcome-card { display: flex; align-items: center; gap: 20px; background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 8px 40px rgba(0,0,0,0.06); margin-bottom: 32px; animation: cardIn 0.5s ease-out; }
@keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.welcome-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #00c853, #00e676); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 24px; flex-shrink: 0; }
.welcome-avatar.google-avatar { background: linear-gradient(135deg, #4285F4, #34A853); }
.welcome-card h1 { font-size: 24px; font-weight: 700; }
.welcome-card p { font-size: 14px; color: #6b7280; }

.auth-badge { display: inline-flex; align-items: center; gap: 5px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; color: #6b7280; margin-top: 6px; }

.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
.dash-card { background: #fff; border-radius: 16px; padding: 28px; text-decoration: none; color: #111827; box-shadow: 0 4px 16px rgba(0,0,0,0.04); transition: all 0.3s ease; cursor: pointer; border: 2px solid transparent; animation: gridIn 0.5s ease-out backwards; }
.dash-card:nth-child(1) { animation-delay: 0.1s; }
.dash-card:nth-child(2) { animation-delay: 0.2s; }
.dash-card:nth-child(3) { animation-delay: 0.3s; }
.dash-card:nth-child(4) { animation-delay: 0.4s; }
@keyframes gridIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.dash-card:hover { border-color: #00c853; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.dash-icon {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #00a344;
}
.dash-icon svg { flex-shrink: 0; }
.dash-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.dash-card p { font-size: 13px; color: #6b7280; }

/* Info card */
.info-card { background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 8px 32px rgba(0,0,0,0.06); }
.info-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #f3f4f6; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f9fafb; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 13px; color: #6b7280; font-weight: 500; }
.info-value { font-size: 14px; font-weight: 600; color: #111827; }

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .info-row { flex-direction: column; align-items: flex-start; gap: 4px; }
}
</style>
