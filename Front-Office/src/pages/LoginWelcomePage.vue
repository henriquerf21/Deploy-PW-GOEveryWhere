<template>
  <div class="page-wrapper">
    <SiteHeader />

    <main class="auth-main">
      <div class="auth-card animate-in">
        <div class="auth-header">
          <img src="https://codia-f2c.s3.us-west-1.amazonaws.com/default/image/2026-03-27/cc79a759-18ff-4328-bb3c-dace7ac8cb32.png" alt="GoEverywhere" class="auth-logo" />
          <h1>GoEverywhere</h1>
          <p class="auth-subtitle">Entregas rápidas, simples e confiáveis</p>
        </div>
        <div class="auth-actions">
          <router-link to="/login" class="btn btn-primary">Entrar na conta</router-link>
          <router-link to="/register" class="btn btn-secondary">Criar conta</router-link>
        </div>

        <div class="auth-divider"><span>ou</span></div>

        <button class="btn btn-google" @click="handleGoogleLogin" :disabled="isLoading">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span v-if="isLoading">A conectar...</span>
          <span v-else>Continuar com Google</span>
        </button>

        <div class="auth-divider"><span>ou</span></div>
        <router-link to="/" class="continue-link">Continuar sem conta</router-link>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginWithGoogle } from '../stores/authStore.js';

const router = useRouter();
const isLoading = ref(false);

async function handleGoogleLogin() {
  isLoading.value = true;
  await new Promise(r => setTimeout(r, 800));
  loginWithGoogle();
  isLoading.value = false;
  router.push('/dashboard');
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: linear-gradient(180deg, #f6f7f7 0%, #e8f5e9 100%); color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

.auth-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 32px; }

.auth-card {
  background: #fff;
  border-radius: 24px;
  padding: 48px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  text-align: center;
}

.animate-in {
  animation: cardIn 0.5s ease-out;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.auth-header { margin-bottom: 36px; }
.auth-logo { width: 72px; height: 72px; border-radius: 24px; margin-bottom: 16px; }
.auth-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.02em; }
.auth-subtitle { color: #6b7280; font-size: 14px; }

.auth-actions { display: flex; flex-direction: column; gap: 12px; }
.btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; text-align: center; transition: all 0.3s ease; border: none; cursor: pointer; font-family: inherit; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #00c853; color: #fff; box-shadow: 0 4px 16px rgba(0,200,83,0.25); }
.btn-primary:hover { background: #00b048; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,200,83,0.35); }
.btn-secondary { background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; }
.btn-secondary:hover { background: #e5e7eb; transform: translateY(-1px); }

.btn-google { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.04); width: 100%; }
.btn-google:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

.auth-divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; color: #9ca3af; font-size: 13px; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

.continue-link { color: #6b7280; font-size: 14px; text-decoration: none; transition: color 0.2s; }
.continue-link:hover { color: #00c853; }

@media (max-width: 768px) {
  .auth-card { padding: 32px 24px; }
}
</style>
