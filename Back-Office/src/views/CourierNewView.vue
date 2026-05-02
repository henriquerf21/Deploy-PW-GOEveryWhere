<template>
  <div class="bo-page">
    <RouterLink to="/couriers" class="back-link"><ArrowLeft :size="14" /> Voltar à lista de estafetas</RouterLink>

    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Onboarding</p>
        <h1 class="bo-page-head__title">Novo estafeta</h1>
        <p class="bo-page-head__sub">
          Após submissão o registo fica em estado <strong>E-01 — Pendente verificação</strong>. Documentos carregados são guardados no Strapi Media Library.
        </p>
      </div>
    </header>

    <form class="bo-stack--lg" @submit.prevent="onSubmit">
      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Dados pessoais</h3>
            <p class="bo-card__sub">Identificação completa, contacto e morada.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div class="bo-form-grid">
            <div class="bo-field">
              <label class="bo-field__label">Nome completo <span class="bo-required">*</span></label>
              <input v-model="f.name" required class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Email <span class="bo-required">*</span></label>
              <input v-model="f.email" type="email" required class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Telemóvel</label>
              <input v-model="f.phone" type="tel" class="bo-input" placeholder="+351..." />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">NIF <span class="bo-required">*</span></label>
              <input v-model="f.nif" required class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Cartão de Cidadão (n.º) <span class="bo-required">*</span></label>
              <input v-model="f.cc" required class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Data de nascimento <span class="bo-required">*</span></label>
              <input v-model="f.birthDate" type="date" required class="bo-input" />
            </div>
            <div class="bo-field bo-field--span2">
              <label class="bo-field__label">Morada <span class="bo-required">*</span></label>
              <input v-model="f.address" required class="bo-input" />
            </div>
            <div class="bo-field bo-field--span2">
              <label class="bo-field__label">IBAN <span class="bo-required">*</span></label>
              <input v-model="f.iban" required class="bo-input" placeholder="PT50..." />
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Veículo</h3>
            <p class="bo-card__sub">Tipo, modelo e identificação. Bicicletas dispensam matrícula, seguro e inspeção.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div class="bo-form-grid">
            <div class="bo-field">
              <label class="bo-field__label">Tipo <span class="bo-required">*</span></label>
              <select v-model="f.vehicleType" required class="bo-select">
                <option disabled value="">Selecionar...</option>
                <option value="Mota">Mota</option>
                <option value="Carro">Carro</option>
                <option value="Bicicleta">Bicicleta</option>
              </select>
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Marca</label>
              <input v-model="f.brand" class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Modelo</label>
              <input v-model="f.model" class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Cor</label>
              <input v-model="f.vehicleColor" class="bo-input" placeholder="Preto, branco..." />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Matrícula</label>
              <input v-model="f.plate" class="bo-input" placeholder="00-AA-00" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Carta de condução (n.º) <span class="bo-required">*</span></label>
              <input v-model="f.licenseNumber" required class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Seguro (referência) <span class="bo-required">*</span></label>
              <input v-model="f.insuranceRef" required class="bo-input" />
            </div>
            <div class="bo-field">
              <label class="bo-field__label">Inspeção válida até <span class="bo-required">*</span></label>
              <input v-model="f.inspectionValidUntil" type="date" required class="bo-input" />
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Documentos</h3>
            <p class="bo-card__sub">PDF ou imagem. Cada upload sobe imediatamente para o Strapi.</p>
          </div>
        </header>
        <div class="bo-card__body">
          <div class="docs-grid">
            <div v-for="d in docFields" :key="d.key" class="bo-doc-row" :class="{ 'is-ok': !!f[d.key] }">
              <div class="bo-doc-row__main">
                <span class="bo-doc-row__dot"></span>
                <div>
                  <div class="bo-doc-row__name">{{ d.label }} <span v-if="d.optional" class="bo-muted" style="font-weight: 400; font-size: 12px;">(opcional)</span></div>
                  <div class="bo-doc-row__meta">{{ f[d.key] ? 'Carregado · ' + filename(f[d.key]) : 'Por carregar' }}</div>
                </div>
              </div>
              <div class="bo-doc-row__actions">
                <a v-if="f[d.key]" :href="f[d.key]" target="_blank" class="bo-btn bo-btn--ghost bo-btn--sm">Ver</a>
                <label class="bo-upload">
                  <input type="file" accept="image/*,.pdf" :disabled="uploading[d.key]" @change="onUpload($event, d.key)" />
                  <span>{{ uploading[d.key] ? 'A carregar...' : (f[d.key] ? 'Substituir' : 'Carregar') }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="bo-card">
        <header class="bo-card__head">
          <div>
            <h3 class="bo-card__title">Zonas e capacidade</h3>
            <p class="bo-card__sub">Define onde opera e quantas entregas em simultâneo aceita.</p>
          </div>
        </header>
        <div class="bo-card__body bo-stack">
          <div>
            <span class="bo-eyebrow" style="display: block; margin-bottom: 8px;">Zonas de atuação <span class="bo-required">*</span></span>
            <div class="zones-grid">
              <button v-for="z in ZONES" :key="z" type="button" class="bo-chip" :class="{ 'is-on': f.zones.includes(z) }" @click="toggleZ(z)">
                {{ z }}
              </button>
            </div>
          </div>
          <div class="bo-field" style="max-width: 220px;">
            <label class="bo-field__label">Máx. entregas simultâneas <span class="bo-required">*</span></label>
            <input v-model.number="f.maxConcurrent" type="number" min="1" max="10" required class="bo-input" />
          </div>
        </div>
      </section>

      <div class="bo-row bo-row--end">
        <RouterLink to="/couriers" class="bo-btn bo-btn--ghost">Cancelar</RouterLink>
        <button type="submit" class="bo-btn bo-btn--primary" :disabled="!f.zones.length">Submeter registo</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import { registerCourier } from '../stores/logisticsStore.js';
import { ZONES } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';
import { validateEmail, validatePtIban, validatePtNif, validatePtPhone, validatePtPlate } from '../utils/boPtValidation.js';
import { boUpload } from '../api/backofficeApi.js';

const router = useRouter();

const f = reactive({
  name: '',
  email: '',
  phone: '',
  nif: '',
  cc: '',
  birthDate: '',
  address: '',
  iban: '',
  vehicleType: '',
  brand: '',
  model: '',
  plate: '',
  vehicleColor: '',
  licenseNumber: '',
  insuranceRef: '',
  inspectionValidUntil: '',
  docCcUrl: '',
  docLicenseUrl: '',
  docInsuranceUrl: '',
  docInspectionUrl: '',
  docSelfieUrl: '',
  docIbanUrl: '',
  zones: [],
  maxConcurrent: 2,
});

const uploading = reactive({
  docCcUrl: false,
  docLicenseUrl: false,
  docInsuranceUrl: false,
  docInspectionUrl: false,
  docSelfieUrl: false,
  docIbanUrl: false,
});

const docFields = [
  { key: 'docCcUrl', label: 'Cartão de Cidadão' },
  { key: 'docLicenseUrl', label: 'Carta de condução' },
  { key: 'docInsuranceUrl', label: 'Apólice de seguro' },
  { key: 'docInspectionUrl', label: 'Certificado de inspeção' },
  { key: 'docSelfieUrl', label: 'Selfie de identificação', optional: true },
  { key: 'docIbanUrl', label: 'Comprovativo de IBAN', optional: true },
];

function toggleZ(z) {
  const i = f.zones.indexOf(z);
  if (i >= 0) f.zones.splice(i, 1);
  else f.zones.push(z);
}

function filename(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return decodeURIComponent(u.pathname.split('/').pop() || url);
  } catch {
    return url.split('/').pop() || url;
  }
}

async function onUpload(event, fieldKey) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) return;
  uploading[fieldKey] = true;
  try {
    const r = await boUpload(file);
    f[fieldKey] = r.url;
    toast(`Documento carregado: ${r.name}`, 'success');
  } catch (err) {
    toast(err?.message || 'Falha no upload do documento.', 'error');
  } finally {
    uploading[fieldKey] = false;
    input.value = '';
  }
}

async function onSubmit() {
  if (!f.zones.length) {
    toast('Seleciona pelo menos uma zona.', 'error');
    return;
  }
  const name = (f.name || '').trim();
  if (!name) {
    toast('Nome obrigatório.', 'error');
    return;
  }
  const email = validateEmail(f.email);
  if (!email.ok) { toast(email.error, 'error'); return; }
  const nif = validatePtNif(f.nif);
  if (!nif.ok) { toast(nif.error, 'error'); return; }
  const iban = validatePtIban(f.iban);
  if (!iban.ok) { toast(iban.error, 'error'); return; }
  const phone = validatePtPhone(f.phone);
  if (!phone.ok) { toast(phone.error, 'error'); return; }
  const plate = validatePtPlate(f.plate);
  if (!plate.ok) { toast(plate.error, 'error'); return; }

  try {
    await registerCourier({
      ...f,
      name,
      email: email.value,
      nif: nif.value,
      iban: iban.value,
      phone: phone.value,
      plate: plate.value,
    });
  } catch (e) {
    toast(e?.message || 'Falha a criar estafeta no Strapi.', 'error');
    return;
  }
  toast('Registo criado — E-01 Pendente Verificação.', 'success');
  router.push({ name: 'couriers' });
}
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
  width: fit-content;
}

.back-link:hover { opacity: 0.75; }

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.zones-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
