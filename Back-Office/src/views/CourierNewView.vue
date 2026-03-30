<template>
  <div class="page">
    <div class="page__top">
      <RouterLink to="/couriers" class="back-link">← Estafetas</RouterLink>
      <h2 class="page__title">Novo estafeta</h2>
      <p class="page__sub">Após submissão, o registo fica <strong>Pendente verificação (E-01)</strong> até aprovação administrativa.</p>
    </div>

    <form class="form card" @submit.prevent="onSubmit">
      <h3>Dados pessoais</h3>
      <div class="grid2">
        <label class="field"><span>Nome completo *</span><input v-model="f.name" required class="inp" /></label>
        <label class="field"><span>Email *</span><input v-model="f.email" type="email" required class="inp" /></label>
        <label class="field"><span>NIF *</span><input v-model="f.nif" required class="inp" /></label>
        <label class="field"><span>CC (cartão cidadão) *</span><input v-model="f.cc" required class="inp" /></label>
        <label class="field"><span>Data nascimento *</span><input v-model="f.birthDate" type="date" required class="inp" /></label>
        <label class="field"><span>Morada *</span><input v-model="f.address" required class="inp" /></label>
        <label class="field full"><span>IBAN *</span><input v-model="f.iban" required class="inp" placeholder="PT50…" /></label>
      </div>

      <h3>Veículo</h3>
      <label class="field"><span>Tipo *</span>
        <select v-model="f.vehicleType" required class="inp">
          <option disabled value="">Selecionar…</option>
          <option value="Mota">Mota</option>
          <option value="Carro">Carro</option>
          <option value="Bicicleta">Bicicleta</option>
        </select>
      </label>
      <div class="grid3">
        <label class="field"><span>Marca</span><input v-model="f.brand" class="inp" /></label>
        <label class="field"><span>Modelo</span><input v-model="f.model" class="inp" /></label>
        <label class="field"><span>Matrícula</span><input v-model="f.plate" class="inp" /></label>
      </div>
      <div class="grid3">
        <label class="field"><span>Carta condução n.º *</span><input v-model="f.licenseNumber" required class="inp" /></label>
        <label class="field"><span>Seguro (ref.) *</span><input v-model="f.insuranceRef" required class="inp" /></label>
        <label class="field"><span>Inspeção válida até *</span><input v-model="f.inspectionValidUntil" type="date" required class="inp" /></label>
      </div>

      <h3>Documentos (confirmados no registo)</h3>
      <label class="check"><input v-model="f.docId" type="checkbox" /> Cópia ID/CC anexada</label>
      <label class="check"><input v-model="f.docLicense" type="checkbox" /> Carta condução</label>
      <label class="check"><input v-model="f.docInsurance" type="checkbox" /> Apólice seguro</label>
      <label class="check"><input v-model="f.docInspection" type="checkbox" /> Certificado inspeção</label>

      <h3>Zona de atuação *</h3>
      <div class="chips">
        <button v-for="z in ZONES" :key="z" type="button" class="chip" :class="{ on: f.zones.includes(z) }" @click="toggleZ(z)">
          {{ z }}
        </button>
      </div>

      <label class="field narrow"><span>Máx. entregas simultâneas *</span>
        <input v-model.number="f.maxConcurrent" type="number" min="1" max="10" required class="inp" />
      </label>

      <div class="actions">
        <RouterLink to="/couriers" class="btn btn--ghost">Cancelar</RouterLink>
        <button type="submit" class="btn btn--go" :disabled="f.zones.length === 0">Submeter registo</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { registerCourier } from '../stores/logisticsStore.js';
import { ZONES } from '../constants/logistics.js';
import { toast } from '../utils/notify.js';

const router = useRouter();

const f = reactive({
  name: '',
  email: '',
  nif: '',
  cc: '',
  birthDate: '',
  address: '',
  iban: '',
  vehicleType: '',
  brand: '',
  model: '',
  plate: '',
  licenseNumber: '',
  insuranceRef: '',
  inspectionValidUntil: '',
  docId: false,
  docLicense: false,
  docInsurance: false,
  docInspection: false,
  zones: [],
  maxConcurrent: 2,
});

function toggleZ(z) {
  const i = f.zones.indexOf(z);
  if (i >= 0) f.zones.splice(i, 1);
  else f.zones.push(z);
}

function onSubmit() {
  if (!f.zones.length) {
    toast('Seleciona pelo menos uma zona.', 'error');
    return;
  }
  registerCourier({ ...f });
  toast('Registo criado — E-01 Pendente Verificação.', 'success');
  router.push({ name: 'couriers' });
}
</script>

<style scoped>
.page {
  max-width: 800px;
}

.page__top {
  margin-bottom: 16px;
}

.back-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.page__title {
  margin: 10px 0 4px;
  font-size: 22px;
  font-family: var(--bo-font-display);
}

.page__sub {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
}

.card {
  background: var(--bo-surface);
  border-radius: var(--bo-radius-lg);
  border: 1px solid var(--bo-border);
  box-shadow: var(--bo-shadow);
  padding: 24px;
}

.form h3 {
  margin: 24px 0 12px;
  font-size: 15px;
}

.form h3:first-child {
  margin-top: 0;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.grid3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 700px) {
  .grid2,
  .grid3 {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

.field.full {
  grid-column: 1 / -1;
}

.field.narrow {
  max-width: 220px;
  margin-top: 16px;
}

.inp {
  padding: 10px 12px;
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius-sm);
  font-size: 14px;
  font-weight: 500;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--bo-border);
  background: var(--bo-page);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.chip.on {
  border-color: var(--bo-brand);
  background: var(--bo-brand-soft);
  color: var(--bo-brand-hover);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--bo-border);
}

.btn {
  padding: 12px 20px;
  border-radius: var(--bo-radius-sm);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border: none;
  cursor: pointer;
}

.btn--go {
  background: var(--bo-brand);
  color: #fff;
}

.btn--ghost {
  background: transparent;
  border: 1px solid var(--bo-border);
  color: var(--bo-text);
}
</style>
