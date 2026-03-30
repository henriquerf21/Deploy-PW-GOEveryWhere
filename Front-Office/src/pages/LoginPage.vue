<template>
  <div class="page-wrapper">
    <SiteHeader />

    <main class="auth-main">
      <div class="auth-card">
        <router-link to="/login-welcome" class="back-link">← Voltar</router-link>
        <div class="auth-header">
          <h1>Bem-vindo de volta</h1>
          <p>Entra na tua conta para encomendar</p>
        </div>

        <!-- Global error -->
        <Transition name="shake">
          <div v-if="globalError" class="error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ globalError }}</span>
          </div>
        </Transition>

        <form class="auth-form" @submit.prevent="handleLogin">
          <div class="form-group" :class="{ 'has-error': errors.email }">
            <label for="login-email">Email</label>
            <div class="input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input
                type="email"
                id="login-email"
                v-model="form.email"
                placeholder="o.teu@email.com"
                @input="clearError('email')"
              />
            </div>
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>
          <div class="form-group" :class="{ 'has-error': errors.password }">
            <label for="login-password">Password</label>
            <div class="input-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                :type="showPassword ? 'text' : 'password'"
                id="login-password"
                v-model="form.password"
                placeholder="A tua password"
                @input="clearError('password')"
              />
              <button type="button" class="toggle-pw" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Esconder password' : 'Mostrar password'">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.remember" />
              <span>Lembrar-me</span>
            </label>
            <a href="#" class="forgot-link">Esqueci a password</a>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span v-else>Entrar →</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="auth-divider"><span>ou continuar com</span></div>

        <!-- Google OAuth -->
        <button class="btn btn-google" @click="handleGoogleLogin" :disabled="isLoading">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Entrar com Google</span>
        </button>

        <p class="switch-text">Ainda sem conta? <router-link to="/register" class="switch-link">Criar conta</router-link></p>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { login, loginWithGoogle } from '../stores/authStore.js';

const router = useRouter();

const form = reactive({
  email: '',
  password: '',
  remember: false,
});

const errors = reactive({ email: '', password: '' });
const globalError = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

function clearError(field) {
  errors[field] = '';
  globalError.value = '';
}

function validate() {
  let valid = true;
  if (!form.email.trim()) {
    errors.email = 'O email é obrigatório.';
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Introduz um email válido.';
    valid = false;
  }
  if (!form.password) {
    errors.password = 'A password é obrigatória.';
    valid = false;
  } else if (form.password.length < 6) {
    errors.password = 'A password deve ter pelo menos 6 caracteres.';
    valid = false;
  }
  return valid;
}

async function handleLogin() {
  globalError.value = '';
  if (!validate()) return;

  isLoading.value = true;
  // Simulate network delay
  await new Promise(r => setTimeout(r, 600));

  const result = login(form.email, form.password);
  isLoading.value = false;

  if (result.success) {
    router.push('/dashboard');
  } else {
    globalError.value = result.error;
  }
}

async function handleGoogleLogin() {
  isLoading.value = true;
  // Simulate OAuth redirect delay
  await new Promise(r => setTimeout(r, 800));

  loginWithGoogle();
  isLoading.value = false;
  router.push('/dashboard');
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: linear-gradient(180deg, #f6f7f7 0%, #e8f5e9 100%); color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

.auth-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 32px; }
.auth-card { background: #fff; border-radius: 24px; padding: 48px; max-width: 480px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.08); animation: cardIn 0.5s ease-out; }
@keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

.back-link { display: inline-flex; align-items: center; gap: 4px; color: #6b7280; font-size: 13px; text-decoration: none; margin-bottom: 24px; transition: color 0.2s; }
.back-link:hover { color: #00c853; }

.auth-header { margin-bottom: 28px; }
.auth-header h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
.auth-header p { color: #6b7280; font-size: 14px; }

/* Error banner */
.error-banner { display: flex; align-items: center; gap: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 500; margin-bottom: 16px; animation: shakeIn 0.4s ease; }
.shake-enter-active { animation: shakeIn 0.4s ease; }
@keyframes shakeIn {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.form-group.has-error .input-wrapper { border-color: #ef4444; background: #fef2f2; }
.input-wrapper { display: flex; align-items: center; gap: 8px; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; background: #f9fafb; transition: all 0.25s ease; }
.input-wrapper:focus-within { border-color: #00c853; background: #fff; box-shadow: 0 0 0 3px rgba(0,200,83,0.08); }
.input-wrapper input { flex: 1; border: none; outline: none; font-size: 14px; font-family: inherit; background: transparent; color: #111827; }
.input-wrapper input::placeholder { color: #9ca3af; }
.toggle-pw { background: none; border: none; cursor: pointer; display: flex; align-items: center; padding: 2px; transition: opacity 0.2s; }
.toggle-pw:hover { opacity: 0.7; }

.field-error { font-size: 12px; color: #ef4444; font-weight: 500; animation: fadeIn 0.2s ease; }

.form-row { display: flex; justify-content: space-between; align-items: center; }
.checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #6b7280; cursor: pointer; }
.checkbox-label input { accent-color: #00c853; width: 16px; height: 16px; }
.forgot-link { font-size: 13px; color: #00c853; text-decoration: none; font-weight: 500; }

.btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; text-align: center; transition: all 0.3s ease; border: none; cursor: pointer; font-family: inherit; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
.btn-primary { background: #00c853; color: #fff; box-shadow: 0 4px 16px rgba(0,200,83,0.25); }
.btn-primary:hover:not(:disabled) { background: #00b048; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,200,83,0.35); }

/* Google button */
.btn-google { background: #fff; color: #374151; border: 1.5px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-top: 0; }
.btn-google:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

/* Divider */
.auth-divider { display: flex; align-items: center; gap: 16px; margin: 20px 0; color: #9ca3af; font-size: 13px; }
.auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

/* Spinner */
.spinner { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.switch-text { text-align: center; margin-top: 24px; font-size: 13px; color: #6b7280; }
.switch-link { color: #00c853; font-weight: 600; text-decoration: none; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .auth-card { padding: 32px 24px; }
}
</style>
