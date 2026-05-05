<template>
  <div class="auth-page">
    <SiteHeader />

    <main class="auth-main">
      <div class="auth-card" style="text-align:center; max-width:440px">
        <div class="auth-header" style="text-align:center">
          <img :src="MEDIA.brandLogo" alt="GoEverywhere" class="welcome-logo" />
          <h1>GoEverywhere</h1>
          <p>Entregas rápidas, simples e confiáveis</p>
        </div>
        <div class="welcome-actions">
          <router-link to="/login" class="auth-btn auth-btn-primary">Entrar na conta</router-link>
          <router-link to="/register" class="auth-btn auth-btn-secondary">Criar conta</router-link>
        </div>

        <div class="auth-divider"><span>ou</span></div>

        <button class="auth-btn auth-btn-google" @click="handleGoogleLogin" :disabled="isLoading">
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
        <router-link to="/" class="auth-continue-link">Continuar sem conta</router-link>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { googleTokenLogin } from 'vue3-google-login'; // Import necessário para o popup real
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { loginWithGoogle } from '../stores/authStore.js';
import { MEDIA } from '../config/media.js';

const router = useRouter();
const isLoading = ref(false);

async function handleGoogleLogin() {
  isLoading.value = true;

  try {
    // 1. Abre o popup oficial da Google para o utilizador escolher a conta
    const response = await googleTokenLogin();

    // 2. Envia o access_token recebido para o teu authStore processar
    // Aqui estamos a passar o token real que a Google nos deu
    const result = await loginWithGoogle(response.access_token);

    // 3. Se o teu store validar o token com sucesso, redireciona
    if (result && result.success) {
      router.push('/about');
    } else if (result && !result.success) {
      alert(result.error || "Erro ao validar conta Google.");
    }
    
    // Se não tiveres backend e o loginWithGoogle for apenas para guardar dados:
    // router.push('/about');

  } catch (error) {
    // Caso o utilizador feche o popup sem escolher conta
    console.error("Erro no login Google:", error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.welcome-logo {
  width: 72px;
  height: 72px;
  border-radius: var(--go-radius-xl);
  margin-bottom: 16px;
  animation: logoPulse 2s var(--go-ease) infinite;
}

@keyframes logoPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-continue-link {
  display: block;
  margin-top: 10px;
  color: var(--go-neutral-600);
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.auth-continue-link:hover {
  color: var(--go-primary-600);
}
</style>