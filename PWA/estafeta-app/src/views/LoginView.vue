<template>
  <div class="login-page">
    <div class="login-header">
      <div class="logo">
        <img src="/media/brand/logo-goeverywhere.svg" alt="GoEverywhere" class="logo-img" />
        <span class="logo-text"><span class="logo-go">GO</span>Everywhere</span>
      </div>
      <p class="subtitle">Área do Estafeta</p>
    </div>

    <form class="login-form" @submit.prevent="handleLogin">
      <p v-if="registeredNotice" class="success-msg">{{ registeredNotice }}</p>
      <div class="input-group">
        <label>Número de telemóvel</label>
        <div class="phone-row">
          <select v-model="countryCode" class="input-field country-select">
            <option v-for="c in COUNTRY_CODES" :key="c.code" :value="c.code">
              {{ c.label }} {{ c.code }}
            </option>
          </select>
          <input
            v-model="phone"
            type="tel"
            class="input-field phone-input"
            placeholder="912 345 678"
            inputmode="tel"
            required
          >
        </div>
      </div>

      <div class="input-group">
        <label>Password</label>
        <div class="password-wrap">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="input-field"
            placeholder="••••••••"
            required
          >
          <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
            <span v-html="showPassword ? SVG.eyeOff : SVG.eye"></span>
          </button>
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>

      <button type="submit" class="btn btn-primary btn-block btn-lg">
        Entrar
      </button>

      <p class="register-link">
        Não tens conta?
        <router-link to="/register">Registar</router-link>
      </p>
    </form>

    <div class="demo-hint">
      <p>Demo: qualquer telemóvel + password</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login } from '../stores/courierStore.js';
import { COUNTRY_CODES, SVG } from '../constants.js';

const router = useRouter();
const route = useRoute();
const phone = ref('910 100 201');
const countryCode = ref('+351');
const password = ref('demo1234');
const showPassword = ref(false);
const error = ref('');
const registeredNotice = computed(() =>
  route.query.registered === '1' ? 'Registo submetido. Aguarda validação no Back-Office.' : ''
);

function handleLogin() {
  if (!phone.value.trim()) {
    error.value = 'Introduz o número de telemóvel.';
    return;
  }
  if (!password.value) {
    error.value = 'Introduz a password.';
    return;
  }
  error.value = '';
  login(phone.value, countryCode.value, password.value);
  router.push('/deliveries');
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px 24px;
  background: linear-gradient(165deg, var(--ge-brand-soft) 0%, var(--ge-page) 40%);
}
.login-header {
  text-align: center;
  margin-bottom: 40px;
}
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}
.logo-img {
  width: 44px; height: 44px;
  border-radius: 10px;
  object-fit: contain;
}
.logo-text {
  font-family: var(--ge-font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--ge-text);
}
.logo-go {
  font-weight: 800;
  letter-spacing: 0.04em;
}
.subtitle {
  font-size: 14px;
  color: var(--ge-text-secondary);
  margin: 4px 0 0;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.phone-row {
  display: flex;
  gap: 8px;
}
.country-select {
  width: 100px;
  flex-shrink: 0;
  padding: 12px 8px;
}
.phone-input {
  flex: 1;
}
.password-wrap {
  position: relative;
}
.password-wrap .input-field {
  padding-right: 44px;
}
.toggle-pw {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ge-text-muted);
  background: none;
  border: none;
  cursor: pointer;
}
.error-msg {
  color: var(--ge-status-error);
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}
.success-msg {
  color: var(--ge-brand-dark);
  background: var(--ge-brand-soft);
  border: 1px solid #bbf7d0;
  border-radius: var(--ge-radius);
  font-size: 13px;
  margin: 0;
  padding: 10px 12px;
}
.register-link {
  text-align: center;
  font-size: 13px;
  color: var(--ge-text-secondary);
  margin: 0;
}
.register-link a {
  color: var(--ge-brand);
  font-weight: 600;
}
.demo-hint {
  margin-top: 32px;
  text-align: center;
}
.demo-hint p {
  font-size: 12px;
  color: var(--ge-text-muted);
  background: var(--ge-border-light);
  padding: 8px 12px;
  border-radius: var(--ge-radius);
  display: inline-block;
}
</style>
