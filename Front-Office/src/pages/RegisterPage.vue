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

        <div v-if="globalError" class="auth-error-banner" style="margin-bottom: 20px; color: red;">
          <span>{{ globalError }}</span>
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <div class="auth-form-row-2col">
            <div class="auth-form-group" :class="{ 'has-error': errors.firstName }">
              <label for="reg-fname">Nome *</label>
              <input 
                class="auth-input" 
                type="text" 
                id="reg-fname" 
                v-model="form.firstName" 
                placeholder="O teu nome" 
                @input="validateField('firstName')" 
              />
              <span v-if="errors.firstName" class="auth-field-error">{{ errors.firstName }}</span>
            </div>

            <div class="auth-form-group" :class="{ 'has-error': errors.lastName, 'field-disabled': !isFirstNameValid }">
              <label for="reg-lname">Apelido *</label>
              <input 
                class="auth-input" 
                type="text" 
                id="reg-lname" 
                v-model="form.lastName" 
                placeholder="O teu apelido" 
                :disabled="!isFirstNameValid"
                @input="validateField('lastName')" 
              />
              <span v-if="errors.lastName" class="auth-field-error">{{ errors.lastName }}</span>
            </div>
          </div>

          <div class="auth-form-group" :class="{ 'has-error': errors.email, 'field-disabled': !isLastNameValid }">
            <label for="reg-email">Email *</label>
            <input 
              class="auth-input" 
              type="email" 
              id="reg-email" 
              v-model="form.email" 
              placeholder="o.teu@email.com" 
              :disabled="!isLastNameValid"
              @input="validateField('email')" 
            />
            <span v-if="errors.email" class="auth-field-error">{{ errors.email }}</span>
          </div>

          <div class="auth-form-group" :class="{ 'has-error': errors.phone, 'field-disabled': !isEmailValid }">
            <label for="reg-phone">Telefone *</label>
            <input 
              class="auth-input" 
              type="tel" 
              id="reg-phone" 
              v-model="form.phone" 
              :disabled="!isEmailValid"
              @input="handlePhoneInput" 
              @keydown="handlePhoneKeyDown"
            />
            <span v-if="errors.phone" class="auth-field-error">{{ errors.phone }}</span>
          </div>

          <div class="auth-form-group" :class="{ 'has-error': errors.password, 'field-disabled': !isPhoneValid }">
            <label for="reg-password">Password *</label>
            <div class="auth-input-wrap">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                id="reg-password" 
                v-model="form.password" 
                placeholder="Mínimo 8 caracteres" 
                :disabled="!isPhoneValid"
                @input="validateField('password')" 
              />
              <button type="button" class="auth-toggle-pw" @click="showPassword = !showPassword" :disabled="!isPhoneValid">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <span v-if="errors.password" class="auth-field-error">{{ errors.password }}</span>
          </div>

          <div class="auth-form-group" :class="{ 'has-error': errors.confirm, 'field-disabled': !isPasswordValid }">
            <label for="reg-confirm">Confirmar Password *</label>
            <input 
              class="auth-input"
              :type="showPassword ? 'text' : 'password'" 
              id="reg-confirm" 
              v-model="form.confirm" 
              placeholder="Repete a password" 
              :disabled="!isPasswordValid"
              @input="validateField('confirm')" 
            />
            <span v-if="errors.confirm" class="auth-field-error">{{ errors.confirm }}</span>
          </div>

          <label class="auth-checkbox-label" :class="{ 'has-error': errors.terms, 'field-disabled': !isConfirmValid }">
            <input type="checkbox" v-model="form.terms" :disabled="!isConfirmValid" @change="validateField('terms')" />
            <span>Aceito os <a href="#" class="auth-terms-link">termos e condições</a></span>
          </label>

          <button type="submit" class="auth-btn auth-btn-primary" :disabled="isLoading || !isFormValid">
            <span v-if="isLoading" class="auth-spinner"></span>
            <span v-else>Criar Conta →</span>
          </button>
        </form>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { register } from '../stores/authStore.js';

const router = useRouter();

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '+351 ',
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

// --- VALIDAÇÕES COMPUTADAS ---
const isFirstNameValid = computed(() => form.firstName.trim().length >= 2);
const isLastNameValid = computed(() => form.lastName.trim().length >= 2);
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email));
const isPhoneValid = computed(() => form.phone.replace(/\D/g, '').length === 12);
const isPasswordValid = computed(() => form.password.length >= 8);
const isConfirmValid = computed(() => form.confirm.length >= 8 && form.confirm === form.password);
const isFormValid = computed(() => isConfirmValid.value && form.terms);

// --- FUNÇÕES ---
function validateField(field) {
  errors[field] = '';
  globalError.value = '';

  if (field === 'email' && form.email && !isEmailValid.value) {
    errors.email = 'Introduz um email válido.';
  }
  if (field === 'password' && form.password && !isPasswordValid.value) {
    errors.password = 'A password deve ter pelo menos 8 caracteres.';
  }
  if (field === 'confirm' && form.confirm && !isConfirmValid.value) {
    errors.confirm = 'As passwords não coincidem.';
  }
}

function handlePhoneKeyDown(e) {
  if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.selectionStart <= 5) {
    e.preventDefault();
  }
}

function handlePhoneInput(e) {
  const prefix = '+351 ';
  let val = e.target.value;
  if (!val.startsWith(prefix)) val = prefix;
  const numbers = val.slice(prefix.length).replace(/\D/g, '').slice(0, 9);
  form.phone = prefix + numbers;
  errors.phone = (numbers.length > 0 && numbers.length < 9) ? 'O número deve ter 9 dígitos.' : '';
}

async function handleRegister() {
  if (!isFormValid.value) return;
  isLoading.value = true;
  globalError.value = '';

  try {
    const result = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone.replace(/\s/g, ''),
      password: form.password,
    });

    if (result && result.success) {
      router.push('/dashboard');
    } else {
      globalError.value = result?.error || 'Erro ao criar conta.';
    }
  } catch (err) {
    globalError.value = 'Erro de ligação.';
  } finally {
    isLoading.value = false; // Isto para o reload infinito
  }
}
</script>

<style scoped>
.field-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.field-disabled input {
  pointer-events: none;
  background-color: #f9fafb;
}
/* Adiciona aqui os estilos do spinner se não existirem no global */
.auth-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}
@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>