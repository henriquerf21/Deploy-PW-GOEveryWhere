<template>
  <div class="register-page">
    <!-- Header with logo -->
    <div class="reg-top">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="reg-logo-img" />
      <span class="reg-logo-text">GoEverywhere</span>
    </div>

    <!-- Back + Progress -->
    <div class="reg-nav">
      <button class="back-link" @click="step > 1 ? step-- : $router.push('/login')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        Voltar
      </button>
    </div>

    <!-- Step indicators -->
    <div class="step-tabs">
      <div class="step-tab" :class="{ active: step >= 1, current: step === 1 }">
        <span class="step-dot" :class="{ done: step > 1 }">
          <svg v-if="step > 1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
        <span class="step-label">Dados pessoais</span>
      </div>
      <div class="step-tab" :class="{ active: step >= 2, current: step === 2 }">
        <span class="step-dot" :class="{ done: step > 2 }">
          <svg v-if="step > 2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
        <span class="step-label">Veiculo e zona</span>
      </div>
      <div class="step-tab" :class="{ active: step >= 3, current: step === 3 }">
        <span class="step-dot" :class="{ done: step > 3 }">
          <svg v-if="step > 3" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
        </span>
        <span class="step-label">Documentos</span>
      </div>
      <div class="step-tab" :class="{ active: step >= 4, current: step === 4 }">
        <span class="step-dot"></span>
        <span class="step-label">Pagamento e conta</span>
      </div>
    </div>

    <!-- Form body -->
    <div class="reg-body">
      <form @submit.prevent="nextStep">
        <!-- Step 1: Dados pessoais -->
        <template v-if="step === 1">
          <h2 class="step-title">Dados pessoais</h2>
          <div class="form-row">
            <div class="field-group"><label>Nome</label><input v-model="form.firstName" class="field-input" placeholder="Joao" required></div>
            <div class="field-group"><label>Apelido</label><input v-model="form.lastName" class="field-input" placeholder="Silva" required></div>
          </div>
          <div class="field-group"><label>Email</label><input v-model="form.email" type="email" class="field-input" placeholder="joao@email.com" required></div>
          <div class="field-group">
            <label>Telefone</label>
            <div class="phone-row">
              <div class="country-code">
                <span class="flag-emoji">🇵🇹</span>
                <span>+351</span>
              </div>
              <input v-model="form.phone" type="tel" class="field-input" placeholder="912 345 678" required>
            </div>
          </div>
          <div class="field-group"><label>Data de nascimento</label><input v-model="form.birthDate" type="date" class="field-input" required></div>
          <div class="field-group"><label>NIF</label><input v-model="form.nif" class="field-input" placeholder="123 456 789"></div>
          <div class="field-group"><label>N CC / BI</label><input v-model="form.cc" class="field-input" placeholder="12345678"></div>
          <div class="field-group"><label>Morada</label><input v-model="form.address" class="field-input" placeholder="Rua Exemplo, n 10, 2 Esq"></div>
          <div class="form-row">
            <div class="field-group"><label>Codigo postal</label><input v-model="form.postalCode" class="field-input" placeholder="1000-001"></div>
            <div class="field-group"><label>Cidade</label><input v-model="form.city" class="field-input" placeholder="Lisboa"></div>
          </div>
        </template>

        <!-- Step 2: Veiculo e zona -->
        <template v-if="step === 2">
          <h2 class="step-title">Veiculo e zona</h2>
          <label class="step-label-sm">Tipo de veiculo</label>
          <div class="vehicle-grid">
            <button type="button" v-for="v in vehicleTypes" :key="v.id"
              class="vehicle-card" :class="{ selected: form.vehicleType === v.id }"
              @click="form.vehicleType = v.id">
              <span class="vehicle-icon" v-html="v.icon"></span>
              <span>{{ v.label }}</span>
            </button>
          </div>
          <template v-if="form.vehicleType">
            <h3 class="subsection-title">Detalhes do {{ vehicleTypes.find(v => v.id === form.vehicleType)?.label }}</h3>
            <div class="form-row">
              <div class="field-group"><label>Marca</label><input v-model="form.vehicleBrand" class="field-input" placeholder="Ex: Renault"></div>
              <div class="field-group"><label>Modelo</label><input v-model="form.vehicleModel" class="field-input" placeholder="Ex: Clio"></div>
            </div>
            <div class="form-row">
              <div class="field-group"><label>Cor</label><input v-model="form.vehicleColor" class="field-input" placeholder="Ex: Preto"></div>
              <div class="field-group"><label>Ano</label><input v-model="form.vehicleYear" class="field-input" placeholder="Ex: 2022"></div>
            </div>
            <div class="field-group"><label>Matricula</label><input v-model="form.vehiclePlate" class="field-input" placeholder="AA-00-BB"></div>
            <div class="field-group"><label>Carta de conducao n</label><input v-model="form.licenseNo" class="field-input" placeholder="L-12345678"></div>
          </template>
          <div class="field-group">
            <label>Zona de atuação</label>
            <select v-model="form.zone" class="field-input" required>
              <option value="">Selecionar zona...</option>
              <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
            </select>
          </div>
        </template>

        <!-- Step 3: Documentos -->
        <template v-if="step === 3">
          <h2 class="step-title">Documentos</h2>
          <div class="upload-area" @click="$refs.licenseInput.click()">
            <div class="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <p class="upload-hint">Toca para carregar</p>
            <p class="upload-label">Carta de conducao</p>
            <input ref="licenseInput" type="file" accept="image/*,.pdf" class="sr-only" @change="form.docLicense = $event.target.files[0]">
          </div>
          <p v-if="form.docLicense" class="file-name">✓ {{ form.docLicense.name }}</p>
        </template>

        <!-- Step 4: Pagamento e conta -->
        <template v-if="step === 4">
          <h2 class="step-title">Pagamento e conta</h2>
          <div class="field-group"><label>IBAN</label><input v-model="form.iban" class="field-input" placeholder="PT50 0000 0000 0000 0000 0000 0" required></div>
          <div class="field-group"><label>Titular da conta</label><input v-model="form.accountHolder" class="field-input" :placeholder="form.firstName + ' ' + form.lastName"></div>

          <div class="summary-card" v-if="form.firstName">
            <h3>Resumo da candidatura</h3>
            <div class="summary-row"><span>Nome</span><strong>{{ form.firstName }} {{ form.lastName }}</strong></div>
            <div class="summary-row"><span>Email</span><strong>{{ form.email || '—' }}</strong></div>
            <div class="summary-row"><span>Telefone</span><strong>{{ form.phone || '—' }}</strong></div>
            <div class="summary-row"><span>Veiculo</span><strong>{{ vehicleTypes.find(v => v.id === form.vehicleType)?.label || '—' }}</strong></div>
            <div class="summary-row"><span>Zonas</span><strong>{{ form.zone || '—' }}</strong></div>
          </div>
        </template>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <!-- Bottom button -->
        <button type="submit" class="continue-btn">
          <span>{{ step === 4 ? 'Submeter candidatura' : 'Continuar' }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <p class="step-counter">Passo {{ step }} de 4</p>
      </form>
    </div>

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
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ZONES } from '../constants.js';

const router = useRouter();
const step = ref(1);
const error = ref('');

const vehicleTypes = [
  { id: 'bicicleta', label: 'Bicicleta', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 100-2 1 1 0 000 2zM12 17.5V14l-3-3 4-3 2 3h3"/></svg>' },
  { id: 'mota', label: 'Mota', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M9 17h6M5 14l4-7h4l2 4h4"/></svg>' },
  { id: 'carro', label: 'Carro', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 3H8l-4 8h16l-4-8zM4 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-6"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/></svg>' },
  { id: 'trotinete', label: 'Trotinete', icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="19" r="3"/><path d="M6 16V5h3M18 19V5l-3 4"/></svg>' },
];

const form = reactive({
  firstName: '', lastName: '', email: '', phone: '', countryCode: '+351',
  birthDate: '', nif: '', cc: '', address: '', postalCode: '', city: '',
  vehicleType: '', vehicleBrand: '', vehicleModel: '', vehicleColor: '',
  vehicleYear: '', vehiclePlate: '', licenseNo: '', zone: '',
  docLicense: null,
  iban: '', accountHolder: '',
});

function nextStep() {
  error.value = '';
  if (step.value === 1) {
    if (!form.firstName || !form.lastName || !form.email) { error.value = 'Preenche os campos obrigatórios.'; return; }
  }
  if (step.value === 2) {
    if (!form.vehicleType) { error.value = 'Seleciona o tipo de veículo.'; return; }
  }
  if (step.value === 4) {
    if (!form.iban) { error.value = 'IBAN é obrigatório.'; return; }
    router.push('/login?registered=1');
    return;
  }
  step.value++;
}
</script>

<style scoped>
.register-page {
  min-height: 100dvh;
  background: #f8faf9;
  display: flex;
  flex-direction: column;
}
.reg-top {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
}
.reg-logo-img {
  width: 36px; height: 34px;
  border-radius: 14px; object-fit: cover;
}
.reg-logo-text {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.reg-nav {
  padding: 0 16px 8px;
}
.back-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 14px; font-weight: 500;
  color: var(--ge-brand);
  background: none; border: none;
  cursor: pointer;
}

/* Step tabs */
.step-tabs {
  display: flex;
  padding: 0 16px 16px;
  gap: 4px;
}
.step-tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
  opacity: 0.4;
  transition: opacity 0.3s;
}
.step-tab.active { opacity: 1; }
.step-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.3s;
}
.step-tab.active .step-dot { background: var(--ge-brand); }
.step-dot.done { background: var(--ge-brand); }
.step-tab.current .step-dot { box-shadow: 0 0 0 3px rgba(27,138,74,0.2); }
.step-label {
  font-size: 9px; font-weight: 500;
  color: #6b7280;
  text-align: center;
  line-height: 1.2;
}

/* Form body */
.reg-body {
  flex: 1;
  padding: 0 24px 24px;
  background: #fff;
  border-radius: 24px 24px 0 0;
  margin: 0 4px;
}
.step-title {
  font-family: var(--ge-font-display);
  font-size: 20px; font-weight: 700;
  color: #111827;
  margin: 24px 0 16px;
}
.step-label-sm {
  font-family: var(--ge-font-display);
  font-size: 12px; font-weight: 500;
  color: #6b7280;
  display: block;
  margin-bottom: 8px;
}
.subsection-title {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  color: #111827;
  margin: 20px 0 12px;
}
.field-group {
  display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 12px;
}
.field-group label {
  font-family: var(--ge-font-display);
  font-size: 12px; font-weight: 500;
  color: #6b7280;
}
.field-input {
  width: 100%;
  padding: 14px 16px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  font-family: var(--ge-font);
  font-size: 14px; color: #111827;
  outline: none;
  transition: border-color 0.2s;
}
.field-input:focus {
  border-color: var(--ge-brand);
  box-shadow: 0 0 0 3px rgba(27,138,74,0.1);
}
.field-input::placeholder { color: #d1d5db; }
.form-row {
  display: flex; gap: 12px;
}
.form-row .field-group { flex: 1; }

/* Phone row */
.phone-row { display: flex; gap: 8px; }
.country-code {
  display: flex; align-items: center; gap: 4px;
  padding: 14px 12px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  font-size: 14px; color: #111827;
  white-space: nowrap;
}
.flag-emoji { font-size: 18px; }

/* Vehicle cards */
.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.vehicle-card {
  display: flex; flex-direction: column;
  align-items: center; gap: 6px;
  padding: 14px 8px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 16px;
  font-size: 11px; font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}
.vehicle-card.selected {
  border-color: var(--ge-brand);
  background: #f0fdf4;
  color: var(--ge-brand);
}
.vehicle-icon { display: flex; }

/* Upload area */
.upload-area {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  background: #fafafa;
  cursor: pointer;
  margin-bottom: 12px;
  transition: border-color 0.2s;
}
.upload-area:hover { border-color: var(--ge-brand); }
.upload-icon { margin-bottom: 8px; }
.upload-hint { font-size: 12px; color: #9ca3af; margin: 0 0 4px; }
.upload-label { font-size: 14px; font-weight: 600; color: #111827; margin: 0; }
.file-name { font-size: 12px; color: var(--ge-brand); font-weight: 500; margin: 0; }

/* Summary card */
.summary-card {
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  margin-top: 16px;
}
.summary-card h3 {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  margin: 0 0 12px;
}
.summary-row {
  display: flex; justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 0.72px solid #f1f5f2;
}
.summary-row span { color: #6b7280; }
.summary-row strong { color: #111827; font-weight: 500; }

/* Continue button */
.continue-btn {
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
  margin-top: 20px;
  transition: background 0.15s, transform 0.1s;
}
.continue-btn:active { transform: scale(0.97); }
.step-counter {
  text-align: center;
  font-size: 12px; color: #9ca3af;
  margin: 12px 0 0;
}
.error-msg {
  color: var(--ge-status-error);
  font-size: 13px; margin: 4px 0;
}

/* Footer */
.login-footer {
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
  background: #1b8a4a; color: #fff;
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
  font-size: 11px; color: #9ca3af; margin: 0;
}
</style>
