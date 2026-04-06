<template>
  <div class="page">
    <div class="page-header">
      <h1>Perfil</h1>
      <button v-if="!isEditing" class="edit-btn" @click="startEdit">Editar</button>
      <button v-else class="edit-btn" @click="cancelEdit">Cancelar</button>
      <button class="logout-btn" @click="handleLogout">Sair</button>
    </div>

    <div class="page-body">
      <!-- Profile card -->
      <div class="profile-card card">
        <div class="avatar">{{ initials }}</div>
        <div class="profile-info">
          <h2 v-if="!isEditing">{{ profile.name }}</h2>
          <input v-else v-model="form.name" class="inline-input" aria-label="Nome" />
          <p class="profile-phone" v-if="!isEditing">{{ profile.phone }}</p>
          <input v-else v-model="form.phone" class="inline-input inline-input--small" aria-label="Telefone" />
          <span class="state-badge">{{ courierStateLabels[profile.state] }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat">
          <span class="stat-val">{{ profile.totalDeliveries }}</span>
          <span class="stat-lbl">Entregas</span>
        </div>
        <div class="stat">
          <span class="stat-val">{{ profile.rating }}</span>
          <span class="stat-lbl">Rating</span>
        </div>
        <div class="stat">
          <span class="stat-val">{{ profile.onTimePct }}%</span>
          <span class="stat-lbl">No prazo</span>
        </div>
      </div>

      <!-- Info sections -->
      <div class="info-section card">
        <div class="info-title">Informações Pessoais</div>
        <div class="info-row"><span class="info-label">Email</span><span v-if="!isEditing">{{ profile.email }}</span><input v-else v-model="form.email" class="row-input" /></div>
        <div class="info-row"><span class="info-label">Morada</span><span v-if="!isEditing">{{ profile.address }}</span><input v-else v-model="form.address" class="row-input" /></div>
        <div class="info-row"><span class="info-label">Data nasc.</span><span v-if="!isEditing">{{ profile.birthDate }}</span><input v-else v-model="form.birthDate" type="date" class="row-input" /></div>
        <div class="info-row"><span class="info-label">IBAN</span><span v-if="!isEditing" class="iban">{{ profile.iban }}</span><input v-else v-model="form.iban" class="row-input iban" /></div>
        <div class="info-row"><span class="info-label">Zona</span><span v-if="!isEditing">{{ profile.zone }}</span><input v-else v-model="form.zone" class="row-input" /></div>
      </div>

      <div class="info-section card">
        <div class="info-title">Veículo</div>
        <div class="info-row"><span class="info-label">Tipo</span><span v-if="!isEditing">{{ profile.vehicle.type }}</span><input v-else v-model="form.vehicle.type" class="row-input" /></div>
        <div class="info-row">
          <span class="info-label">Marca/Modelo</span>
          <span v-if="!isEditing">{{ profile.vehicle.brand }} {{ profile.vehicle.model }}</span>
          <div v-else class="row-inputs">
            <input v-model="form.vehicle.brand" class="row-input" placeholder="Marca" />
            <input v-model="form.vehicle.model" class="row-input" placeholder="Modelo" />
          </div>
        </div>
        <div class="info-row"><span class="info-label">Cor</span><span v-if="!isEditing">{{ profile.vehicle.color }}</span><input v-else v-model="form.vehicle.color" class="row-input" /></div>
        <div class="info-row"><span class="info-label">Matrícula</span><span v-if="!isEditing">{{ profile.vehicle.plate }}</span><input v-else v-model="form.vehicle.plate" class="row-input" /></div>
      </div>

      <div class="info-section card">
        <div class="info-title">Documentos</div>
        <div class="doc-row">
          <span :class="profile.docs.cc ? 'doc-ok' : 'doc-missing'">
            <span class="doc-icon" v-html="profile.docs.cc ? SVG.checkCircle : SVG.xCircle"></span> Cartão Cidadão
          </span>
          <span :class="profile.docs.license ? 'doc-ok' : 'doc-missing'">
            <span class="doc-icon" v-html="profile.docs.license ? SVG.checkCircle : SVG.xCircle"></span> Carta Condução
          </span>
          <span :class="profile.docs.insurance ? 'doc-ok' : 'doc-missing'">
            <span class="doc-icon" v-html="profile.docs.insurance ? SVG.checkCircle : SVG.xCircle"></span> Seguro
          </span>
        </div>
      </div>

      <div v-if="isEditing" class="save-wrap">
        <button class="btn btn-primary btn-block btn-lg" @click="saveEdit">Guardar alterações</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, logout, updateProfile } from '../stores/courierStore.js';
import { courierStateLabels, SVG } from '../constants.js';

const router = useRouter();
const profile = computed(() => store.profile);
const isEditing = ref(false);
const form = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  birthDate: '',
  iban: '',
  zone: '',
  vehicle: { type: '', brand: '', model: '', color: '', plate: '' },
});
const initials = computed(() => {
  const parts = profile.value.name.split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
});

function hydrateForm() {
  form.name = profile.value.name || '';
  form.phone = profile.value.phone || '';
  form.email = profile.value.email || '';
  form.address = profile.value.address || '';
  form.birthDate = profile.value.birthDate || '';
  form.iban = profile.value.iban || '';
  form.zone = profile.value.zone || '';
  form.vehicle.type = profile.value.vehicle?.type || '';
  form.vehicle.brand = profile.value.vehicle?.brand || '';
  form.vehicle.model = profile.value.vehicle?.model || '';
  form.vehicle.color = profile.value.vehicle?.color || '';
  form.vehicle.plate = profile.value.vehicle?.plate || '';
}

function startEdit() {
  hydrateForm();
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
}

function saveEdit() {
  updateProfile({
    name: form.name,
    phone: form.phone,
    email: form.email,
    address: form.address,
    birthDate: form.birthDate,
    iban: form.iban,
    zone: form.zone,
    vehicle: {
      type: form.vehicle.type,
      brand: form.vehicle.brand,
      model: form.vehicle.model,
      color: form.vehicle.color,
      plate: form.vehicle.plate,
    },
  });
  isEditing.value = false;
}

function handleLogout() {
  logout();
  router.push('/login');
}
</script>

<style scoped>
.logout-btn {
  margin-left: 8px;
  font-size: 13px; font-weight: 600;
  color: var(--ge-status-error);
  padding: 8px 14px;
  background: var(--ge-status-error-bg);
  border-radius: var(--ge-radius-full);
}
.edit-btn {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: var(--ge-brand);
  padding: 8px 14px;
  background: var(--ge-brand-soft);
  border-radius: var(--ge-radius-full);
}
.profile-card {
  display: flex; align-items: center; gap: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.avatar {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: var(--ge-brand);
  color: #fff;
  font-family: var(--ge-font-display);
  font-size: 20px; font-weight: 700;
  border-radius: 50%;
}
.profile-info h2 { margin: 0; font-size: 18px; font-family: var(--ge-font-display); }
.inline-input {
  border: 1px solid var(--ge-border);
  border-radius: var(--ge-radius-sm);
  padding: 8px 10px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--ge-font-display);
  width: 100%;
  max-width: 240px;
}
.inline-input--small {
  font-size: 13px;
  font-weight: 500;
  font-family: var(--ge-font);
  margin-top: 4px;
}
.profile-phone { font-size: 13px; color: var(--ge-text-secondary); margin: 2px 0 6px; }
.state-badge {
  display: inline-block;
  padding: 3px 10px;
  background: var(--ge-brand-soft);
  color: var(--ge-brand);
  border-radius: var(--ge-radius-full);
  font-size: 11px; font-weight: 600;
}

.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.stat {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 14px;
  background: var(--ge-surface);
  border-radius: var(--ge-radius-lg);
  border: 1px solid var(--ge-border-light);
}
.stat-val { font-family: var(--ge-font-display); font-size: 20px; font-weight: 700; }
.stat-lbl { font-size: 10px; color: var(--ge-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

.info-section { padding: 16px; margin-bottom: 12px; }
.info-title {
  font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
  color: var(--ge-text-secondary);
  margin-bottom: 12px;
}
.info-row {
  display: flex; justify-content: space-between;
  padding: 6px 0; font-size: 13px;
  border-bottom: 1px solid var(--ge-border-light);
}
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--ge-text-muted); }
.iban { font-family: monospace; font-size: 11px; }
.row-input {
  border: 1px solid var(--ge-border);
  border-radius: var(--ge-radius-sm);
  padding: 6px 10px;
  font-size: 13px;
  min-width: 140px;
}
.row-inputs {
  display: flex;
  gap: 6px;
  width: 62%;
}
.row-inputs .row-input {
  flex: 1;
  min-width: 0;
}

.doc-row { display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
.doc-icon { display: inline-flex; vertical-align: middle; margin-right: 6px; }
.doc-icon :deep(svg) { width: 16px; height: 16px; }
.doc-ok { color: var(--ge-brand); display: flex; align-items: center; }
.doc-missing { color: var(--ge-status-error); display: flex; align-items: center; }
.save-wrap {
  margin: 12px 0 8px;
}
</style>
