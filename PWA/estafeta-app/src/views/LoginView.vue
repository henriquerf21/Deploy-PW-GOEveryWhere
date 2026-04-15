<template>
  <div class="login-page">
    <!-- Decorative background circles (Figma) -->
    <div class="bg-circle bg-circle-1"></div>
    <div class="bg-circle bg-circle-2"></div>

    <div class="login-content">
      <!-- Logo -->
      <div class="logo-row">
        <img src="/media/brand/logo-goeverywhere.png" alt="GoEverywhere" class="logo-img" />
        <span class="logo-text">GoEverywhere</span>
      </div>

      <!-- Trust badges -->
      <div class="trust-badges">
        <span class="trust-badge trust-badge-green">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          Verificado
        </span>
        <span class="trust-badge trust-badge-gray">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Acesso seguro
        </span>
      </div>

      <!-- Heading -->
      <div class="login-heading">
        <h1>Entra na tua conta</h1>
        <p>Usa o teu email e password de estafeta</p>
      </div>

      <!-- Form -->
      <form class="login-form" @submit.prevent="handleLogin">
        <p v-if="registeredNotice" class="success-msg">{{ registeredNotice }}</p>

        <!-- Email -->
        <div class="field-group">
          <label>Email</label>
          <div class="field-input-wrap">
            <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
            <input
              v-model="email"
              type="email"
              class="field-input"
              placeholder="o.teu@email.com"
              required
            >
          </div>
        </div>

        <!-- Password -->
        <div class="field-group">
          <label>Password</label>
          <div class="field-input-wrap">
            <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              placeholder="A tua password"
              required
            >
            <button type="button" class="field-toggle" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>
          </div>
        </div>

        <!-- Remember + Forgot -->
        <div class="login-meta">
          <label class="remember-check">
            <span class="check-box" :class="{ checked: remember }">
              <span v-if="remember" class="check-dot"></span>
            </span>
            <input type="checkbox" v-model="remember" class="sr-only">
            <span>Lembrar-me</span>
          </label>
          <button type="button" class="forgot-btn">Esqueci a password</button>
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <!-- Login button -->
        <button type="submit" class="login-btn">
          <span>Entrar</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </form>

      <!-- OR divider -->
      <div class="or-divider">
        <span class="or-line"></span>
        <span class="or-text">ou</span>
        <span class="or-line"></span>
      </div>

      <!-- Courier code -->
      <div class="field-group">
        <label>Codigo de estafeta</label>
        <input
          v-model="courierCode"
          class="field-input field-input-plain"
          placeholder="Ex: GE-0047"
        >
      </div>
      <button class="code-btn" @click="handleCodeLogin">Entrar com codigo</button>

      <!-- Register link -->
      <p class="register-link">
        <span>Queres ser estafeta?</span>
        <router-link to="/register" class="register-action">Criar conta</router-link>
      </p>
    </div>

    <!-- Back button -->
    <button class="back-link" @click="$router.back()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      Voltar
    </button>

    <!-- Footer -->
    <footer class="login-footer">
      <div class="footer-brand">
        <span class="footer-g">G</span>
        <span class="footer-name">GoEverywhere</span>
      </div>
      <p class="footer-copy">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '../stores/courierStore.js';

const router = useRouter();
const route = useRoute();
const email = ref('estafeta@goeverywhere.pt');
const password = ref('demo1234');
const courierCode = ref('');
const showPassword = ref(false);
const remember = ref(true);
const error = ref('');
const registeredNotice = computed(() =>
  route.query.registered === '1' ? 'Registo submetido. Aguarda validação no Back-Office.' : ''
);

function handleLogin() {
  if (!email.value.trim()) { error.value = 'Introduz o email.'; return; }
  if (!password.value) { error.value = 'Introduz a password.'; return; }
  error.value = '';
  login(email.value, '+351', password.value);
  router.push('/deliveries');
}

function handleCodeLogin() {
  if (!courierCode.value.trim()) { error.value = 'Introduz o código de estafeta.'; return; }
  error.value = '';
  login(courierCode.value, '+351', 'code');
  router.push('/deliveries');
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: #f8faf9;
  position: relative;
  overflow: hidden;
}

/* Decorative circles */
.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  background: var(--ge-brand);
}
.bg-circle-1 {
  width: 300px; height: 300px;
  top: 40px; right: -60px;
  opacity: 0.08;
}
.bg-circle-2 {
  width: 240px; height: 240px;
  top: 200px; left: -100px;
  opacity: 0.05;
}

.login-content {
  flex: 1;
  position: relative;
  z-index: 2;
  padding: 24px 28px;
  max-width: 397px;
  margin: 0 auto;
  width: 100%;
}

/* Logo */
.logo-row {
  display: flex; align-items: center; gap: 8px;
  justify-content: flex-end;
  padding-top: 4px;
  margin-bottom: 8px;
}
.logo-img {
  width: 47px; height: 44px;
  border-radius: 20px;
  object-fit: cover;
}
.logo-text {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}

/* Trust badges */
.trust-badges {
  display: flex; gap: 8px;
  margin-bottom: 24px;
}
.trust-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px 6px 10px;
  border-radius: var(--ge-radius-full);
  font-family: var(--ge-font-display);
  font-size: 10px; font-weight: 600;
}
.trust-badge-green {
  background: #f0fdf4;
  border: 0.72px solid #dcfce7;
  color: #1b8a4a;
}
.trust-badge-gray {
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  color: #6b7280;
  font-weight: 400;
}

/* Heading */
.login-heading {
  margin-bottom: 0;
}
.login-heading h1 {
  font-family: var(--ge-font-display);
  font-size: 24px; font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
  line-height: 36px;
}
.login-heading p {
  font-family: var(--ge-font);
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 0;
  letter-spacing: -0.15px;
}

/* Fields */
.field-group {
  display: flex; flex-direction: column; gap: 6px;
}
.field-group label {
  font-family: var(--ge-font-display);
  font-size: 12px; font-weight: 500;
  color: #6b7280;
}
.field-input-wrap {
  position: relative;
}
.field-icon {
  position: absolute;
  left: 16px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
.field-input {
  width: 100%;
  padding: 14px 16px 14px 44px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  font-family: var(--ge-font);
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  letter-spacing: -0.15px;
}
.field-input-plain {
  padding: 14px 16px;
}
.field-input:focus {
  border-color: var(--ge-brand);
  box-shadow: 0 0 0 3px rgba(27,138,74,0.1);
}
.field-input::placeholder {
  color: #d1d5db;
}
.field-toggle {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer; padding: 4px;
  display: flex; align-items: center;
}

/* Login meta */
.login-meta {
  display: flex; align-items: center;
  justify-content: space-between;
}
.remember-check {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer;
  font-family: var(--ge-font);
  font-size: 12px; font-weight: 500;
  color: #6b7280;
}
.check-box {
  width: 16px; height: 16px;
  border: 0.72px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
}
.check-box.checked {
  border-color: var(--ge-brand);
}
.check-dot {
  width: 8px; height: 8px;
  background: var(--ge-brand);
  border-radius: 8px;
}
.forgot-btn {
  font-family: var(--ge-font-display);
  font-size: 12px; font-weight: 500;
  color: #1b8a4a;
  background: none; border: none;
  cursor: pointer;
}

/* Login button */
.login-form {
  display: flex; flex-direction: column;
  gap: 16px;
  margin-top: 0;
}
.login-btn {
  width: 100%;
  padding: 16px;
  background: #1b8a4a;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  box-shadow: 0 8px 24px rgba(27,138,74,0.25);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.login-btn:active { transform: scale(0.97); }
.login-btn:hover { background: #157a42; }

/* OR divider */
.or-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 16px 0;
}
.or-line {
  flex: 1; height: 1px; background: #e5e7eb;
}
.or-text {
  font-family: var(--ge-font-display);
  font-size: 12px; color: #9ca3af;
}

/* Code button */
.code-btn {
  width: 100%;
  padding: 14px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px; color: #6b7280;
  cursor: pointer;
  margin-top: 16px;
  transition: background 0.15s;
}
.code-btn:hover { background: #f9fafb; }

/* Error/Success */
.error-msg {
  color: var(--ge-status-error);
  font-size: 13px; font-weight: 500; margin: 0;
}
.success-msg {
  color: var(--ge-brand-dark);
  background: var(--ge-brand-soft);
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  font-size: 13px; margin: 0;
  padding: 10px 12px;
}

/* Register link */
.register-link {
  text-align: center;
  font-size: 13px; color: #6b7280;
  margin: 24px 0 0;
}
.register-action {
  color: #1b8a4a;
  font-weight: 600;
  margin-left: 4px;
}

/* Back link */
.back-link {
  position: relative; z-index: 2;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 8px 28px;
  font-size: 14px; font-weight: 500;
  color: var(--ge-brand);
  background: none; border: none;
  cursor: pointer;
}

/* Footer */
.login-footer {
  position: relative; z-index: 2;
  text-align: center;
  padding: 24px 28px 32px;
}
.footer-brand {
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  margin-bottom: 8px;
}
.footer-g {
  width: 28px; height: 28px;
  background: #1b8a4a;
  color: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
}
.footer-name {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.footer-copy {
  font-size: 11px; color: #9ca3af;
  margin: 0;
}
</style>
