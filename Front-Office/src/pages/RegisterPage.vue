<template>
  <div class="auth-page">
    <SiteHeader />

    <main class="auth-main">
      <div class="auth-card" style="max-width:520px">
        <router-link to="/login-welcome" class="auth-back-link">← Voltar</router-link>
        <div class="auth-header">
          <h1>Criar conta</h1>
          <p>Regista-te para começar a encomendar</p>
        </div>

        <!-- Global error -->
        <Transition name="shake">
          <div v-if="globalError" class="auth-error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ globalError }}</span>
          </div>
        </Transition>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="auth-form-row-2col">
            <div class="auth-form-group" :class="{ 'has-error': errors.firstName }">
              <label for="reg-fname">Nome *</label>
              <input class="auth-input" type="text" id="reg-fname" v-model="form.firstName" placeholder="O teu nome" @input="clearError('firstName')" />
              <span v-if="errors.firstName" class="auth-field-error">{{ errors.firstName }}</span>
            </div>
            <div class="auth-form-group" :class="{ 'has-error': errors.lastName }">
              <label for="reg-lname">Apelido *</label>
              <input class="auth-input" type="text" id="reg-lname" v-model="form.lastName" placeholder="O teu apelido" @input="clearError('lastName')" />
              <span v-if="errors.lastName" class="auth-field-error">{{ errors.lastName }}</span>
            </div>
          </div>
          <div class="auth-form-group" :class="{ 'has-error': errors.email }">
            <label for="reg-email">Email *</label>
            <input class="auth-input" type="email" id="reg-email" v-model="form.email" placeholder="o.teu@email.com" @input="clearError('email')" />
            <span v-if="errors.email" class="auth-field-error">{{ errors.email }}</span>
          </div>
          <div class="auth-form-group" :class="{ 'has-error': errors.phone }">
            <label for="reg-phone">Telefone *</label>
            <input class="auth-input" type="tel" id="reg-phone" v-model="form.phone" placeholder="+351 900 000 000" @input="clearError('phone')" />
            <span v-if="errors.phone" class="auth-field-error">{{ errors.phone }}</span>
          </div>
          <div class="auth-form-group" :class="{ 'has-error': errors.password }">
            <label for="reg-password">Password *</label>
            <div class="auth-input-wrap">
              <input :type="showPassword ? 'text' : 'password'" id="reg-password" v-model="form.password" placeholder="Mínimo 8 caracteres" @input="clearError('password')" />
              <button type="button" class="auth-toggle-pw" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <span v-if="errors.password" class="auth-field-error">{{ errors.password }}</span>
          </div>
          <div class="auth-form-group" :class="{ 'has-error': errors.confirm }">
            <label for="reg-confirm">Confirmar Password *</label>
            <div class="auth-input-wrap">
              <input :type="showPassword ? 'text' : 'password'" id="reg-confirm" v-model="form.confirm" placeholder="Repete a password" @input="clearError('confirm')" />
            </div>
            <span v-if="errors.confirm" class="auth-field-error">{{ errors.confirm }}</span>
          </div>
          <label class="auth-checkbox-label" :class="{ 'has-error': errors.terms }">
            <input type="checkbox" v-model="form.terms" @change="clearError('terms')" />
            <span>Aceito os <a href="#" class="auth-terms-link">termos e condições</a></span>
          </label>
          <span v-if="errors.terms" class="auth-field-error" style="margin-top:-8px">{{ errors.terms }}</span>

          <button type="submit" class="auth-btn auth-btn-primary" :disabled="isLoading">
            <span v-if="isLoading" class="auth-spinner"></span>
            <span v-else>Criar Conta →</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="auth-divider"><span>ou registar com</span></div>

        <!-- Google OAuth -->
        <button class="auth-btn auth-btn-google" @click="handleGoogleRegister" :disabled="isLoading">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Registar com Google</span>
        </button>

        <p class="auth-switch-text">Já tens conta? <router-link to="/login" class="auth-switch-link">Entrar</router-link></p>
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
import { register, loginWithGoogle } from '../stores/authStore.js';

const router = useRouter();

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
  terms: false,
});

const errors = reactive({
  firstName: '', lastName: '', email: '', phone: '',
  password: '', confirm: '', terms: '',
});
const globalError = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

function clearError(field) {
  errors[field] = '';
  globalError.value = '';
}

function validate() {
  let valid = true;
  Object.keys(errors).forEach(k => errors[k] = '');

  if (!form.firstName.trim()) { errors.firstName = 'O nome é obrigatório.'; valid = false; }
  if (!form.lastName.trim()) { errors.lastName = 'O apelido é obrigatório.'; valid = false; }

  if (!form.email.trim()) {
    errors.email = 'O email é obrigatório.'; valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Introduz um email válido.'; valid = false;
  }

  if (!form.phone.trim()) { errors.phone = 'O telefone é obrigatório.'; valid = false; }

  if (!form.password) {
    errors.password = 'A password é obrigatória.'; valid = false;
  } else if (form.password.length < 8) {
    errors.password = 'A password deve ter pelo menos 8 caracteres.'; valid = false;
  }

  if (!form.confirm) {
    errors.confirm = 'Confirma a tua password.'; valid = false;
  } else if (form.password !== form.confirm) {
    errors.confirm = 'As passwords não coincidem.'; valid = false;
  }

  if (!form.terms) { errors.terms = 'Deves aceitar os termos e condições.'; valid = false; }

  return valid;
}

async function handleRegister() {
  globalError.value = '';
  if (!validate()) return;

  isLoading.value = true;
  await new Promise(r => setTimeout(r, 700));

  const result = register({
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    password: form.password,
  });

  isLoading.value = false;

  if (result.success) {
    router.push('/dashboard');
  } else {
    globalError.value = result.error;
  }
}

async function handleGoogleRegister() {
  isLoading.value = true;
  await new Promise(r => setTimeout(r, 800));

  loginWithGoogle();
  isLoading.value = false;
  router.push('/dashboard');
}
</script>

<style scoped>
/* All shared styles from auth-shared.css — no duplicated CSS here */
</style>
