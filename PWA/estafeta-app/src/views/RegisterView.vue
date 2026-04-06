<template>
  <div class="register-page">
    <div class="reg-header">
      <button class="back-btn" @click="$router.push('/login')">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        Voltar
      </button>
      <h1>Registar como Estafeta</h1>
      <p class="step-indicator">Passo {{ step }} de 4</p>
    </div>

    <div class="progress-bar"><div class="progress-fill" :style="{ width: (step / 4 * 100) + '%' }"></div></div>

    <form class="reg-form" @submit.prevent="nextStep">
      <!-- Step 1: Personal -->
      <template v-if="step === 1">
        <div class="input-group"><label>Nome completo</label><input v-model="form.name" class="input-field" required></div>
        <div class="input-group">
          <label>Telemóvel</label>
          <div class="phone-row">
            <select v-model="form.countryCode" class="input-field" style="width:100px">
              <option v-for="c in COUNTRY_CODES" :key="c.code" :value="c.code">{{ c.label }} {{ c.code }}</option>
            </select>
            <input v-model="form.phone" type="tel" class="input-field" style="flex:1" required>
          </div>
        </div>
        <div class="input-group"><label>Email</label><input v-model="form.email" type="email" class="input-field" required></div>
        <div class="input-group"><label>Data de nascimento</label><input v-model="form.birthDate" type="date" class="input-field" required></div>
        <div class="input-group"><label>Morada</label><input v-model="form.address" class="input-field" required></div>
      </template>

      <!-- Step 2: Vehicle -->
      <template v-if="step === 2">
        <div class="input-group">
          <label>Tipo de veículo</label>
          <select v-model="form.vehicleType" class="input-field" required>
            <option value="">Selecionar...</option>
            <option v-for="v in VEHICLE_TYPES" :key="v" :value="v">{{ v }}</option>
          </select>
        </div>
        <div class="input-group"><label>Marca</label><input v-model="form.vehicleBrand" class="input-field"></div>
        <div class="input-group"><label>Modelo</label><input v-model="form.vehicleModel" class="input-field"></div>
        <div class="input-group"><label>Cor</label><input v-model="form.vehicleColor" class="input-field"></div>
        <div class="input-group"><label>Matrícula</label><input v-model="form.vehiclePlate" class="input-field" placeholder="AA-00-BB"></div>
      </template>

      <!-- Step 3: Documents -->
      <template v-if="step === 3">
        <p class="doc-info">Faz upload dos documentos necessários. Formatos aceites: JPG, PNG, PDF.</p>
        <div class="input-group">
          <label>Cartão de Cidadão / BI</label>
          <input type="file" @change="form.docCC = $event.target.files[0]" accept="image/*,.pdf" class="input-field">
        </div>
        <div class="input-group">
          <label>Carta de Condução</label>
          <input type="file" @change="form.docLicense = $event.target.files[0]" accept="image/*,.pdf" class="input-field">
        </div>
        <div class="input-group">
          <label>Seguro do veículo</label>
          <input type="file" @change="form.docInsurance = $event.target.files[0]" accept="image/*,.pdf" class="input-field">
        </div>
      </template>

      <!-- Step 4: Bank & Zone -->
      <template v-if="step === 4">
        <div class="input-group"><label>IBAN</label><input v-model="form.iban" class="input-field" placeholder="PT50 0000 0000 00000000000 00" required></div>
        <div class="input-group">
          <label>Zona de atuação</label>
          <select v-model="form.zone" class="input-field" required>
            <option value="">Selecionar zona...</option>
            <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>
        <div class="input-group"><label>Password</label><input v-model="form.password" type="password" class="input-field" placeholder="Mín. 6 caracteres" required minlength="6"></div>
        <div class="input-group"><label>Confirmar password</label><input v-model="form.passwordConfirm" type="password" class="input-field" required></div>
      </template>

      <p v-if="error" class="error-msg">{{ error }}</p>
      <p v-if="success" class="success-msg">Registo submetido. A conta ficará em Pendente Verificação (E-01).</p>

      <div class="form-actions">
        <button v-if="step > 1" type="button" class="btn btn-secondary" @click="step--">Anterior</button>
        <button type="submit" class="btn btn-primary" :class="{ 'btn-block': step === 1 }">
          {{ step === 4 ? 'Criar Conta' : 'Seguinte' }}
          <svg v-if="step < 4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </form>

    <div v-if="step === 4" class="pending-note">
      <p><span class="pn-icon" v-html="SVG.clock"></span> Após o registo, a tua conta ficará em <strong>Pendente Verificação</strong> até os documentos serem validados.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { COUNTRY_CODES, VEHICLE_TYPES, ZONES, SVG } from '../constants.js';

const router = useRouter();
const step = ref(1);
const error = ref('');
const success = ref(false);
const form = reactive({
  name: '', phone: '', countryCode: '+351', email: '', birthDate: '', address: '',
  vehicleType: '', vehicleBrand: '', vehicleModel: '', vehicleColor: '', vehiclePlate: '',
  docCC: null, docLicense: null, docInsurance: null,
  iban: '', zone: '', password: '', passwordConfirm: '',
});

function nextStep() {
  error.value = '';
  success.value = false;

  if (step.value === 1) {
    if (!form.name || !form.phone || !form.email) { error.value = 'Preenche todos os campos obrigatórios.'; return; }
  }
  if (step.value === 2) {
    if (!form.vehicleType) { error.value = 'Seleciona o tipo de veículo.'; return; }
  }
  if (step.value === 4) {
    if (form.password.length < 6) { error.value = 'A password deve ter pelo menos 6 caracteres.'; return; }
    if (form.password !== form.passwordConfirm) { error.value = 'As passwords não coincidem.'; return; }
    if (!form.iban || !form.zone) { error.value = 'IBAN e zona são obrigatórios.'; return; }
    success.value = true;
    setTimeout(() => router.push('/login?registered=1'), 700);
    return;
  }

  step.value++;
}
</script>

<style scoped>
.register-page {
  min-height: 100dvh;
  padding: 20px 24px 40px;
  background: var(--ge-page);
}
.reg-header { margin-bottom: 20px; }
.back-btn {
  font-size: 14px;
  color: var(--ge-brand);
  font-weight: 600;
  margin-bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.reg-header h1 {
  font-family: var(--ge-font-display);
  font-size: 22px;
  margin: 0 0 4px;
}
.step-indicator {
  font-size: 13px;
  color: var(--ge-text-secondary);
  margin: 0;
}
.progress-bar {
  height: 4px;
  background: var(--ge-border);
  border-radius: 2px;
  margin-bottom: 24px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--ge-brand);
  border-radius: 2px;
  transition: width .3s;
}
.reg-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.phone-row { display: flex; gap: 8px; }
.doc-info {
  font-size: 13px;
  color: var(--ge-text-secondary);
  margin: 0;
  line-height: 1.5;
}
.error-msg {
  color: var(--ge-status-error);
  font-size: 13px;
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
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
.form-actions .btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.pending-note {
  margin-top: 24px;
  padding: 12px 16px;
  background: var(--ge-status-pending-bg);
  border-radius: var(--ge-radius);
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;
}
.pending-note p { margin: 0; display: flex; align-items: flex-start; gap: 6px; }
.pn-icon { display: inline-flex; flex-shrink: 0; margin-top: 1px; }
.pn-icon :deep(svg) { width: 16px; height: 16px; }
</style>
