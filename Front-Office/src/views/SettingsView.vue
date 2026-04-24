<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />

    <main class="cf-checkout-main settings-main">
      <header class="hist-head">
        <p class="cf-checkout-kicker">A tua conta</p>
        <h1 class="cf-checkout-title">Definições</h1>
      </header>

      <!-- Dados Pessoais -->
      <section class="settings-section">
        <h2 class="section-title">Dados Pessoais</h2>
        <div class="settings-card">

          <div class="field-row">
            <label>Nome Completo</label>
            <input v-model="form.fullName" type="text" placeholder="O teu nome completo" class="cf-input" />
          </div>

          <div class="field-row">
            <label>Telemóvel</label>
            <div class="phone-input-wrapper">
              <span class="phone-prefix">+351</span>
              <input
                :value="form.phone"
                type="tel"
                placeholder="9XX XXX XXX"
                class="cf-input phone-input"
                maxlength="9"
                @input="formatPhone"
              />
            </div>
          </div>
          <div class="field-row">
            <label>NIF</label>
            <input
              v-model="form.nif"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="9 dígitos (opcional)"
              class="cf-input"
              @input="formatNif"
            />
            <span class="field-hint">Para faturação nas entregas.</span>
          </div>
          <div class="field-row">
            <label>Email</label>
            <input :value="user?.email" type="email" disabled class="cf-input disabled" />
            <span class="field-hint">O email não pode ser alterado.</span>
          </div>
          <div class="field-row">
            <label>Método de autenticação</label>
            <input :value="user?.provider === 'google' ? 'Google OAuth 2.0' : 'Email / Password'" disabled class="cf-input disabled" />
          </div>
        </div>
      </section>

      <!-- Alterar Password — só aparece se NÃO for Google -->
      <section v-if="user?.provider !== 'google'" class="settings-section">
        <h2 class="section-title">Alterar Password</h2>
        <div class="settings-card">
          <div class="field-row">
            <label>Password atual</label>
            <input v-model="form.currentPassword" type="password" placeholder="••••••••" class="cf-input" />
          </div>
          <div class="field-row">
            <label>Nova password</label>
            <input v-model="form.newPassword" type="password" placeholder="••••••••" class="cf-input" />
          </div>
          <div class="field-row">
            <label>Confirmar nova password</label>
            <input v-model="form.confirmPassword" type="password" placeholder="••••••••" class="cf-input" />
            <span v-if="passwordMismatch" class="field-error">As passwords não coincidem.</span>
          </div>
        </div>
      </section>

      <!-- Morada Predefinida -->
      <section class="settings-section">
        <h2 class="section-title">Morada Predefinida</h2>
        <p class="section-desc">Esta morada será usada para preencher automaticamente os teus pedidos.</p>
        <div class="settings-card">
          <div class="field-row">
            <label>Morada</label>
            <input v-model="form.defaultAddress" type="text" placeholder="Rua, número, andar..." class="cf-input" />
          </div>
          <div class="two-col">
            <div class="field-row">
              <label>Código Postal</label>
              <input
                :value="form.defaultPostalCode"
                type="text"
                placeholder="XXXX-XXX"
                class="cf-input"
                maxlength="8"
                @input="formatPostalCode"
              />
            </div>
            <div class="field-row">
              <label>Cidade</label>
              <input v-model="form.defaultCity" type="text" placeholder="Cidade" class="cf-input" />
            </div>
          </div>
        </div>
      </section>

      <!-- Guardar -->
      <div class="settings-actions">
        <button class="btn-save" @click="saveSettings" :disabled="saving">
          {{ saving ? 'A guardar...' : 'Guardar Alterações' }}
        </button>
      </div>

      <!-- Toast de sucesso -->
      <Transition name="toast">
        <div v-if="toastMessage" class="toast-notification">{{ toastMessage }}</div>
      </Transition>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import { useAuthStore, isAuthenticated } from '../stores/authStore.js';

const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);

// Redireciona se não estiver autenticado [cite: 17, 121]
if (!isAuthenticated.value) router.replace('/login-welcome');

const saving = ref(false);
const toastMessage = ref('');

const form = reactive({
  fullName: '',
  phone: '',
  nif: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  defaultAddress: '',
  defaultPostalCode: '',
  defaultCity: '',
});

const passwordMismatch = computed(() =>
  form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword
);

onMounted(() => {
  if (user.value) {
    // Une o firstName e lastName para o campo de Nome Completo 
    form.fullName = `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim();
    form.phone             = user.value.phone             || '';
    form.nif               = user.value.nif               || '';
    form.defaultAddress    = user.value.defaultAddress    || '';
    form.defaultPostalCode = user.value.defaultPostalCode || '';
    form.defaultCity       = user.value.defaultCity       || '';
  }
});

async function saveSettings() {
  if (passwordMismatch.value) return;
  saving.value = true;

  // Lógica para separar o Nome Completo em firstName e lastName para o backend 
  const nameParts = form.fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  try {
    // 1. Guardar dados pessoais e morada no Strapi [cite: 85, 137]
    // NOTA: Incluímos username e email porque são obrigatórios no teu esquema JSON
    const response = await fetch(`http://localhost:1337/api/users/${user.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        username: user.value.username, // Obrigatório no esquema
        email: user.value.email,       // Obrigatório no esquema
        firstName: firstName,
        lastName: lastName,
        phone:             form.phone,
        nif:               form.nif,
        defaultAddress:    form.defaultAddress,
        defaultPostalCode: form.defaultPostalCode,
        defaultCity:       form.defaultCity,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro detalhado do Strapi:", errorData);
      showToast(errorData?.error?.message || 'Erro ao guardar dados. Tenta novamente.');
      return;
    }

    // Atualiza o estado global na store para refletir no checkout
    const updated = await response.json();
    auth.user = { ...auth.user, ...updated };

    // 2. Alterar password se preenchida (apenas para login por email/password) [cite: 17, 121, 123]
    if (user.value?.provider !== 'google' && form.newPassword) {
      const passResponse = await fetch(`http://localhost:1337/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          currentPassword:      form.currentPassword,
          password:             form.newPassword,
          passwordConfirmation: form.confirmPassword,
        })
      });

      if (!passResponse.ok) {
        showToast('Dados guardados, mas erro ao alterar password.');
        return;
      }

      form.currentPassword = '';
      form.newPassword     = '';
      form.confirmPassword = '';
    }

    showToast('Alterações guardadas com sucesso!');
  } catch (err) {
    console.error("Erro de ligação:", err);
    showToast('Erro de ligação ao servidor.');
  } finally {
    saving.value = false;
  }
}

function formatPhone(e) {
  // Mantém apenas números e limita a 9 dígitos para o perfil
  form.phone = e.target.value.replace(/\D/g, '').slice(0, 9);
}

function formatNif(e) {
  form.nif = e.target.value.replace(/\D/g, '').slice(0, 9);
}

function formatPostalCode(e) {
  let val = e.target.value.replace(/\D/g, '').slice(0, 7);
  if (val.length > 4) {
    val = val.slice(0, 4) + '-' + val.slice(4);
  }
  form.defaultPostalCode = val;
}

function showToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => { toastMessage.value = ''; }, 3000);
}
</script>

<style scoped>

.phone-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: var(--cf-surface);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.phone-input-wrapper:focus-within {
  border-color: var(--cf-cta);
}

.phone-prefix {
  padding: 0.75rem 0.875rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--cf-muted);
  background: var(--cf-line);
  border-right: 1px solid var(--cf-line);
  white-space: nowrap;
}

.phone-input {
  border: none !important;
  border-radius: 0 !important;
  flex: 1;
}

.phone-input:focus {
  outline: none;
  border: none !important;
}

.field-error {
  font-size: 0.75rem;
  color: var(--cf-danger);
  margin-top: 2px;
}

.settings-main {
  padding-bottom: 4rem;
}

.settings-section {
  max-width: 700px;
  margin: 0 auto 2rem;
}

.section-title {
  font-family: var(--cf-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--cf-heading);
}

.section-desc {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 1rem;
}

.settings-card {
  background: var(--cf-card);
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius-lg);
  padding: 1.5rem;
  box-shadow: var(--cf-shadow);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-row label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cf-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.cf-input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-size: 0.9375rem;
  background: var(--cf-surface);
  color: var(--cf-text);
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.cf-input:focus {
  outline: none;
  border-color: var(--cf-cta);
}

.cf-input.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--cf-line);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.settings-actions {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  background: var(--cf-cta);
  color: #fff;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 700;
  font-size: 0.9375rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
  transition: background 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  background: var(--cf-cta-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #fff;
  padding: 0.875rem 1.5rem;
  border-radius: var(--cf-radius);
  font-size: 0.9375rem;
  font-weight: 500;
  z-index: 300;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}

.toast-enter-active { animation: toastIn 0.25s ease; }
.toast-leave-active { animation: toastOut 0.2s ease; }

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes toastOut {
  to { opacity: 0; }
}

@media (max-width: 768px) {
  .two-col { grid-template-columns: 1fr; }
  .settings-actions { justify-content: stretch; }
  .btn-save { width: 100%; }
}
</style>