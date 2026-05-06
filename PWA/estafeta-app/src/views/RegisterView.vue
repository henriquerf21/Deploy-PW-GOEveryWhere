<template>
  <div class="register-page">
    <!-- Header with logo -->
    <div class="reg-top">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="reg-logo-img" />
      <span class="reg-logo-text">GoEverywhere</span>
    </div>

    <!-- Back + Progress -->
    <div class="reg-nav" v-if="step < 5">
      <button class="back-link" @click="step > 1 ? step-- : $router.push('/login')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        Voltar
      </button>
    </div>

    <!-- Step indicators -->
    <div class="step-tabs" v-if="step < 5">
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
        <div v-show="step === 1">
          <h2 class="step-title">Dados pessoais</h2>
          <div class="field-group"><label>Nome Completo</label><input v-model="form.fullName" class="field-input" required></div>
          <div class="field-group"><label>Email</label><input v-model="form.email" type="email" class="field-input" required></div>
          <div class="field-group">
            <label>Telemóvel</label>
            <div class="phone-row">
              <div class="country-code">
                <span>+351</span>
              </div>
              <input v-model="form.phone" type="tel" class="field-input" @input="handleNumber(9, 'phone', $event)" required>
            </div>
          </div>
          <div class="field-group"><label>Data de nascimento</label><input v-model="form.birthDate" type="tel" class="field-input" @input="handleDateMask" placeholder="DD/MM/AAAA" maxlength="10" required></div>
          <div class="field-group"><label>NIF</label><input v-model="form.nif" type="tel" class="field-input" @input="handleNumber(9, 'nif', $event)"></div>
          <div class="field-group"><label>Nº CC / BI</label><input v-model="form.cc" type="tel" class="field-input" @input="handleNumber(8, 'cc', $event)"></div>
          <div class="field-group"><label>Morada</label><input v-model="form.address" class="field-input"></div>
          <div class="form-row">
            <div class="field-group"><label>Código postal</label><input v-model="form.postalCode" type="tel" class="field-input" @input="handlePostalCode" placeholder="0000-000"></div>
            <div class="field-group"><label>Cidade</label><input v-model="form.city" class="field-input"></div>
          </div>
        </div>

        <!-- Step 2: Veiculo e zona -->
        <div v-show="step === 2">
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
              <div class="field-group"><label>Marca</label><input v-model="form.vehicleBrand" class="field-input"></div>
              <div class="field-group"><label>Modelo</label><input v-model="form.vehicleModel" class="field-input"></div>
            </div>
            <div class="form-row">
              <div class="field-group"><label>Cor</label><input v-model="form.vehicleColor" class="field-input" @input="handleLettersOnly('vehicleColor', $event)"></div>
              <div class="field-group"><label>Ano</label><input v-model="form.vehicleYear" type="tel" class="field-input" @input="handleNumber(4, 'vehicleYear', $event)" maxlength="4"></div>
            </div>
            <div class="field-group" v-if="['carro', 'mota'].includes(form.vehicleType)"><label>Matrícula</label><input v-model="form.vehiclePlate" class="field-input"></div>
            <div class="field-group" v-if="['carro', 'mota'].includes(form.vehicleType)"><label>Carta de condução nº</label><input v-model="form.licenseNo" class="field-input"></div>
          </template>
          <div class="field-group">
            <label>Zona de atuação</label>
            <select v-model="form.zone" class="field-input">
              <option value="">Selecionar zona...</option>
              <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
            </select>
          </div>
        </div>

        <!-- Step 3: Documentos -->
        <div v-show="step === 3">
          <h2 class="step-title">Documentos</h2>
          
          <!-- Cartão de cidadão -->
          <div class="upload-area" @click="$refs.ccInput.click()">
            <div class="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <p class="upload-hint">Toca para carregar</p>
            <p class="upload-label">Cartão de Cidadão (Frente e Verso)</p>
            <input ref="ccInput" type="file" accept="image/*,.pdf" class="sr-only" @change="form.docCc = $event.target.files[0]">
          </div>
          <p v-if="form.docCc" class="file-name">✓ {{ form.docCc.name }}</p>

          <!-- Carta de Condução (Condicional) -->
          <div class="upload-area" v-if="['carro', 'mota'].includes(form.vehicleType)" @click="$refs.licenseInput.click()">
            <div class="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <p class="upload-hint">Toca para carregar</p>
            <p class="upload-label">Carta de Condução</p>
            <input ref="licenseInput" type="file" accept="image/*,.pdf" class="sr-only" @change="form.docLicense = $event.target.files[0]">
          </div>
          <p v-if="form.docLicense && ['carro', 'mota'].includes(form.vehicleType)" class="file-name">✓ {{ form.docLicense.name }}</p>

          <!-- Foto de Rosto (câmera obrigatória — será usada como foto de perfil) -->
          <div class="selfie-profile-notice">
            <div class="selfie-notice-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p class="selfie-notice-text">
              <strong>Esta foto será usada como a tua foto de perfil</strong> na conta GoEverywhere.
              Certifica-te que estás bem iluminado e sem acessórios (chapéus, óculos de sol, etc.).
            </p>
          </div>
          <div class="upload-area selfie-upload" @click="$refs.selfieInput.click()">
            <div v-if="selfiePreview" class="selfie-preview-wrap">
              <img :src="selfiePreview" alt="Pré-visualização" class="selfie-preview-img" />
              <span class="selfie-retake">Tirar outra foto</span>
            </div>
            <template v-else>
              <div class="upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 00-16 0"/></svg>
              </div>
              <p class="upload-hint">Abre a câmera para tirar a foto</p>
              <p class="upload-label">Foto de Rosto / Perfil (Câmera obrigatória)</p>
            </template>
            <input ref="selfieInput" type="file" accept="image/*" capture="user" class="sr-only" @change="handleSelfieCapture">
          </div>
          <p v-if="form.docSelfie" class="file-name">✓ Foto de perfil capturada</p>

          <!-- Seguro do Veículo (Condicional) -->
          <div class="upload-area" v-if="['carro', 'mota'].includes(form.vehicleType)" @click="$refs.insuranceInput.click()">
            <div class="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <p class="upload-hint">Toca para carregar</p>
            <p class="upload-label">Seguro do Veículo</p>
            <input ref="insuranceInput" type="file" accept="image/*,.pdf" class="sr-only" @change="form.docInsurance = $event.target.files[0]">
          </div>
          <p v-if="form.docInsurance && ['carro', 'mota'].includes(form.vehicleType)" class="file-name">✓ {{ form.docInsurance.name }}</p>

          <!-- Comprovativo de IBAN -->
          <div class="upload-area" @click="$refs.ibanProofInput.click()">
            <div class="upload-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            </div>
            <p class="upload-hint">Toca para carregar</p>
            <p class="upload-label">Comprovativo de IBAN</p>
            <input ref="ibanProofInput" type="file" accept="image/*,.pdf" class="sr-only" @change="form.docIban = $event.target.files[0]">
          </div>
          <p v-if="form.docIban" class="file-name">✓ {{ form.docIban.name }}</p>
        </div>

        <!-- Step 4: Pagamento e conta -->
        <div v-show="step === 4">
          <h2 class="step-title">Pagamento e conta</h2>
          <div class="field-group">
            <label>IBAN</label>
            <div class="phone-row">
              <div class="country-code">
                <span>PT50</span>
              </div>
              <input v-model="form.iban" type="tel" class="field-input" @input="handleNumber(21, 'iban', $event)" placeholder="000000000000000000000">
            </div>
          </div>
          <div class="field-group"><label>Titular da conta</label><input v-model="form.accountHolder" class="field-input" :placeholder="form.fullName"></div>
          <div class="field-group"><label>Password para Login</label><input v-model="form.password" type="password" class="field-input" placeholder="Cria uma password segura"></div>

          <div class="summary-card" v-if="form.fullName">
            <h3>Resumo da candidatura</h3>
            <div class="summary-row"><span>Nome</span><strong>{{ form.fullName }}</strong></div>
            <div class="summary-row"><span>Email</span><strong>{{ form.email || '—' }}</strong></div>
            <div class="summary-row"><span>Telefone</span><strong>{{ form.phone || '—' }}</strong></div>
            <div class="summary-row"><span>Veículo</span><strong>{{ vehicleTypes.find(v => v.id === form.vehicleType)?.label || '—' }}</strong></div>
            <div class="summary-row"><span>Zonas</span><strong>{{ form.zone || '—' }}</strong></div>
          </div>
        </div>

        <!-- Step 5: Success / Waiting / Rejected -->
        <div v-show="step === 5" class="success-step">
          <div v-if="waitingStatus === 'pending'">
            <div class="success-icon-wrapper">
              <svg class="spinner" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--ge-brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            </div>
            <h2 class="step-title" style="text-align: center; margin-top: 0;">Candidatura Submetida!</h2>
            <p class="success-msg">A aguardar confirmação da equipa de suporte GoEverywhere.</p>
            
            <div class="waiting-alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p><strong>Não saias desta página</strong> até a confirmação estar validada. Pode demorar no máx 20 minutos.</p>
            </div>
          </div>
          
          <div v-else-if="waitingStatus === 'approved'">
            <div class="success-icon-wrapper" style="background: rgba(34,197,94,0.1);">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 class="step-title" style="text-align: center; margin-top: 0;">Conta Verificada!</h2>
            <p class="success-msg">A tua candidatura foi aprovada com sucesso. Já podes começar a fazer entregas.</p>
            
            <button type="button" class="continue-btn" style="margin-top: 24px;" @click="$router.push('/login')">
              <span>Fazer Login</span>
            </button>
          </div>
          
          <div v-else-if="waitingStatus === 'rejected'">
            <div class="success-icon-wrapper" style="background: rgba(239,68,68,0.1);">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 class="step-title" style="text-align: center; margin-top: 0; color: #ef4444;">Candidatura Rejeitada</h2>
            <p class="success-msg">A tua candidatura não pôde ser aceite neste momento.</p>
            
            <div class="waiting-alert" style="background: #fef2f2; border-color: #fecaca; color: #991b1b;">
              <p><strong>Motivo:</strong> {{ rejectionReason }}</p>
            </div>
            
            <button type="button" class="continue-btn" style="margin-top: 24px; background: #374151;" @click="$router.push('/login')">
              <span>Voltar ao início</span>
            </button>
          </div>
        </div>

        <p v-if="error && step < 5" class="error-msg">{{ error }}</p>

        <!-- Bottom button -->
        <button type="submit" class="continue-btn" v-if="step < 5">
          <span>{{ step === 4 ? 'Submeter candidatura' : 'Continuar' }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
        <p class="step-counter" v-if="step < 5">Passo {{ step }} de 4</p>
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
import { computed, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ZONES } from '../constants.js';
import { API_URL } from '../config/env.js';

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
  fullName: '', email: '', phone: '', countryCode: '+351',
  birthDate: '', nif: '', cc: '', address: '', postalCode: '', city: '',
  vehicleType: '', vehicleBrand: '', vehicleModel: '', vehicleColor: '',
  vehicleYear: '', vehiclePlate: '', licenseNo: '', zone: '',
  docLicense: null, docCc: null, docSelfie: null, docInsurance: null, docIban: null,
  iban: '', accountHolder: '', password: ''
});

// Selfie preview for profile photo
const selfiePreview = ref(null);

function handleSelfieCapture(e) {
  const file = e.target.files[0];
  if (!file) return;
  form.docSelfie = file;
  const reader = new FileReader();
  reader.onload = () => { selfiePreview.value = reader.result; };
  reader.readAsDataURL(file);
}

function handleNumber(max, field, e) {
  let val = e.target.value.replace(/\D/g, ''); // apenas números
  if (val.length > max) val = val.slice(0, max);
  form[field] = val;
  e.target.value = val;
}

function handleLettersOnly(field, e) {
  let val = e.target.value.replace(/[0-9]/g, ''); // remove números
  form[field] = val;
  e.target.value = val;
}

function handleDateMask(e) {
  let val = e.target.value.replace(/\D/g, ''); // apenas números
  if (val.length > 8) val = val.slice(0, 8);
  
  if (val.length > 4) {
    val = val.slice(0, 2) + '/' + val.slice(2, 4) + '/' + val.slice(4);
  } else if (val.length > 2) {
    val = val.slice(0, 2) + '/' + val.slice(2);
  }
  
  form.birthDate = val;
  e.target.value = val;
}

function handlePostalCode(e) {
  let val = e.target.value.replace(/\D/g, ''); // apenas números
  if (val.length > 7) val = val.slice(0, 7);
  if (val.length > 4) {
    val = val.slice(0, 4) + '-' + val.slice(4);
  }
  form.postalCode = val;
  e.target.value = val;
}

const isSubmitting = ref(false);

async function submitRegistration() {
  error.value = '';
  isSubmitting.value = true;
  step.value = 5; // Mostrar o spinner visualmente
  
  try {
    // 1. Função auxiliar para carregar ficheiros para o Strapi
    const uploadFile = async (file) => {
      if (!file) return null;
      const formData = new FormData();
      formData.append('files', file);
      
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Falha no upload do ficheiro.');
      const data = await res.json();
      return data[0]?.id;
    };

    // 2. Fazer upload de todos os ficheiros em simultâneo
    const [ccId, selfieId, ibanId, licenseId, insuranceId] = await Promise.all([
      uploadFile(form.docCc),
      uploadFile(form.docSelfie),
      uploadFile(form.docIban),
      uploadFile(form.docLicense),
      uploadFile(form.docInsurance)
    ]);

    // Obter Labels em vez de IDs
    const dateParts = form.birthDate.split('/');
    const birthDateISO = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    // Obter Labels em vez de IDs
    const zoneLabel = ZONES.find(z => z.id === form.zone)?.label || form.zone;
    const vehicleLabel = form.vehicleType;

    // 3. Payload principal do estafeta
    const payload = {
      data: {
        fullName: form.fullName,
        email: form.email,
        phone: form.countryCode + form.phone,
        password: form.password,
        nif: form.nif,
        cc: form.cc,
        iban: 'PT50' + form.iban,
        birthDate: birthDateISO,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        zone: form.zone,
        vehicleType: form.vehicleType,
        vehicleBrand: form.vehicleBrand,
        vehicleModel: form.vehicleModel,
        vehicleColor: form.vehicleColor,
        vehicleYear: form.vehicleYear,
        vehiclePlate: form.vehiclePlate,
        licenseNo: form.licenseNo,
        accountHolder: form.accountHolder,
        courier_status: 'E-01 Pendente Verificação',
        isOnline: false,
        docCc: ccId ?? null,
        docSelfie: selfieId ?? null,
        docIban: ibanId ?? null,
        drivingLicense: licenseId ?? null,
        insurance: insuranceId ?? null,
      }
    };

    // 4. Gravar estafeta no Backend
    const res = await fetch(`${API_URL}/courier-estafetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      if (errData?.error?.message?.toLowerCase().includes('unique')) {
        throw new Error('Este número de telemóvel já se encontra registado. Tenta outro ou faz login.');
      }
      throw new Error('Ocorreu um erro ao registar a candidatura. ' + (errData?.error?.message || ''));
    }
    
    const courierData = await res.json();
    const documentId = courierData.data?.documentId;
    
    // Sucesso garantido! A PWA fica a aguardar no Step 5
    if (documentId) {
      waitingStatus.value = 'pending';
      startStatusPolling(documentId);
    }
  } catch (err) {
    console.error(err);
    error.value = err.message || 'Ocorreu um erro ao submeter. Tenta novamente.';
    step.value = 4; // Voltar atrás para deixar o utilizador retentar
  } finally {
    isSubmitting.value = false;
  }
}

const waitingStatus = ref('pending'); // pending, approved, rejected
const rejectionReason = ref('');

let pollTimer = null;
function startStatusPolling(docId) {
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}/courier-estafetas?filters[documentId][$eq]=${docId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.data || json.data.length === 0) return;
      const courier = json.data[0];
      const status = courier.courier_status || '';
      
      if (status.startsWith('E-02') || status.startsWith('E-06')) {
        clearInterval(pollTimer);
        waitingStatus.value = 'approved';
      } else if (status.startsWith('E-03')) {
        clearInterval(pollTimer);
        waitingStatus.value = 'rejected';
        rejectionReason.value = courier.rejectionReason || 'Não cumpriu os requisitos mínimos. Por favor entra em contacto com o suporte.';
      }
    } catch (e) {
      console.warn('Polling error', e);
    }
  }, 5000); // Polling every 5 seconds for better UX
}

import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

function nextStep() {
  error.value = '';
  
  if (step.value === 1) {
    if (!form.fullName || !form.email || !form.phone || !form.birthDate || !form.nif || !form.cc || !form.address || !form.postalCode || !form.city) { 
      error.value = 'Preenche todos os campos obrigatórios.'; 
      return; 
    }
    
    // Validação de Idade (18 anos) com formato DD/MM/AAAA
    const dateParts = form.birthDate.split('/');
    if (dateParts.length !== 3 || dateParts[2].length !== 4) {
      error.value = 'Data de nascimento inválida. Usa o formato DD/MM/AAAA.';
      return;
    }
    
    const birthDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T00:00:00`);
    if (isNaN(birthDate.getTime())) {
      error.value = 'Data de nascimento inválida.';
      return;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      error.value = 'Tens de ter pelo menos 18 anos para te candidatares.';
      return;
    }
  }
  
  if (step.value === 2) {
    if (!form.vehicleType || !form.zone || !form.vehicleBrand || !form.vehicleModel || !form.vehicleColor || !form.vehicleYear) { 
      error.value = 'Preenche todos os dados do veículo e da zona de atuação.'; 
      return; 
    }
    
    if (form.vehicleYear.length !== 4) {
      error.value = 'O ano do veículo deve ter exatamente 4 dígitos (ex: 2021).';
      return;
    }
    
    const isMotorized = ['carro', 'mota'].includes(form.vehicleType);
    if (isMotorized && (!form.vehiclePlate || !form.licenseNo)) {
      error.value = 'A matrícula e carta de condução são obrigatórias para veículos motorizados.';
      return;
    }
  }

  if (step.value === 3) {
    if (!form.docCc || !form.docSelfie || !form.docIban) {
      error.value = 'Faltam documentos obrigatórios (CC, Selfie ou IBAN).';
      return;
    }
    const isMotorized = ['carro', 'mota'].includes(form.vehicleType);
    if (isMotorized && (!form.docLicense || !form.docInsurance)) {
      error.value = 'A Carta de Condução e o Seguro são obrigatórios para este veículo.';
      return;
    }
  }

  if (step.value === 4) {
    if (!form.iban || !form.accountHolder || !form.password) { 
      error.value = 'Preenche os dados de pagamento e cria uma password.'; 
      return; 
    }
    
    if (form.iban.length !== 21) {
      error.value = 'O IBAN (depois de PT50) tem de ter exatamente 21 algarismos.';
      return;
    }
    
    // Iniciar integração com o Backend Strapi
    submitRegistration();
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

/* Success Step 5 */
.success-step {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; 
  padding: 60px 16px 40px;
  min-height: 50vh;
}
.success-icon-wrapper {
  display: flex; justify-content: center; align-items: center;
  margin-bottom: 24px;
}
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.success-msg {
  color: #6b7280; font-size: 15px;
  line-height: 1.5; margin-bottom: 32px;
  max-width: 280px;
}
.waiting-alert {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  background: #fefce8; border: 1px solid #fef08a;
  padding: 16px; border-radius: 12px;
  max-width: 300px;
}
.waiting-alert p {
  color: #854d0e; font-size: 13px; line-height: 1.5; margin: 0;
}
.waiting-alert strong { font-weight: 700; }

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

/* Selfie profile notice */
.selfie-profile-notice {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 12px;
  margin-bottom: 12px;
}
.selfie-notice-icon { flex-shrink: 0; margin-top: 2px; }
.selfie-notice-text {
  margin: 0;
  font-size: 12px; color: #166534; line-height: 1.5;
}
.selfie-notice-text strong { font-weight: 700; }

.selfie-upload { position: relative; }
.selfie-preview-wrap {
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
  width: 100%;
}
.selfie-preview-img {
  width: 120px; height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #1b8a4a;
  box-shadow: 0 4px 12px rgba(27,138,74,0.2);
}
.selfie-retake {
  font-size: 12px; font-weight: 600;
  color: #1b8a4a;
  cursor: pointer;
}
</style>
