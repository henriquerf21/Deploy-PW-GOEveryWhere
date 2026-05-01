<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Title bar -->
    <div class="title-bar">
      <h1>Perfil</h1>
      <button v-if="!isEditing" class="edit-btn" @click="startEdit">Editar</button>
      <button v-else class="edit-btn" @click="cancelEdit">Cancelar</button>
      <button class="logout-btn" @click="handleLogout">Sair</button>
    </div>

    <div class="page-body">
      <!-- Profile card -->
      <div class="profile-card">
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
        <div class="stat-card">
          <span class="stat-val">{{ profile.totalDeliveries }}</span>
          <span class="stat-lbl">Entregas</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ profile.rating }} <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg></span>
          <span class="stat-lbl">Rating</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ profile.onTimePct }}%</span>
          <span class="stat-lbl">No prazo</span>
        </div>
      </div>

      <!-- Info sections -->
      <div class="info-section">
        <span class="section-label">INFORMAÇÕES PESSOAIS</span>
        <div class="info-row"><span class="info-key">Email</span><span v-if="!isEditing">{{ profile.email }}</span><input v-else v-model="form.email" class="row-input" /></div>
        <div class="info-row"><span class="info-key">Morada</span><span v-if="!isEditing">{{ profile.address }}</span><input v-else v-model="form.address" class="row-input" /></div>
        <div class="info-row"><span class="info-key">Data nasc.</span><span v-if="!isEditing">{{ profile.birthDate }}</span><input v-else v-model="form.birthDate" type="date" class="row-input" /></div>
        <div class="info-row"><span class="info-key">IBAN</span><span v-if="!isEditing" class="iban">{{ profile.iban }}</span><input v-else v-model="form.iban" class="row-input iban" /></div>
        <div class="info-row"><span class="info-key">Zona</span><span v-if="!isEditing">{{ profile.zone }}</span><input v-else v-model="form.zone" class="row-input" /></div>
      </div>

      <div class="info-section">
        <span class="section-label">VEÍCULO</span>
        <div class="info-row"><span class="info-key">Tipo</span><span v-if="!isEditing">{{ profile.vehicle.type }}</span><input v-else v-model="form.vehicle.type" class="row-input" /></div>
        <div class="info-row">
          <span class="info-key">Marca/Modelo</span>
          <span v-if="!isEditing">{{ profile.vehicle.brand }} {{ profile.vehicle.model }}</span>
          <div v-else class="row-inputs">
            <input v-model="form.vehicle.brand" class="row-input" placeholder="Marca" />
            <input v-model="form.vehicle.model" class="row-input" placeholder="Modelo" />
          </div>
        </div>
        <div class="info-row"><span class="info-key">Cor</span><span v-if="!isEditing">{{ profile.vehicle.color }}</span><input v-else v-model="form.vehicle.color" class="row-input" /></div>
        <div class="info-row"><span class="info-key">Matrícula</span><span v-if="!isEditing">{{ profile.vehicle.plate }}</span><input v-else v-model="form.vehicle.plate" class="row-input" /></div>
      </div>

      <div class="info-section">
        <span class="section-label">DOCUMENTOS</span>
        <div class="doc-list">
          <div class="doc-item" :class="profile.docs.cc ? 'doc-ok' : 'doc-missing'">
            <span class="doc-circle"><svg v-if="profile.docs.cc" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></span>
            <span>Cartão Cidadão</span>
          </div>
          <div class="doc-item" :class="profile.docs.license ? 'doc-ok' : 'doc-missing'">
            <span class="doc-circle"><svg v-if="profile.docs.license" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></span>
            <span>Carta de Condução</span>
          </div>
          <div class="doc-item" :class="profile.docs.insurance ? 'doc-ok' : 'doc-missing'">
            <span class="doc-circle"><svg v-if="profile.docs.insurance" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></span>
            <span>Seguro do Veículo</span>
          </div>
        </div>
      </div>

      <div v-if="isEditing" class="save-wrap">
        <button class="save-btn" @click="saveEdit">Guardar alterações</button>
      </div>
    </div>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-brand">
        <span class="footer-g">G</span>
        <span class="footer-name">GoEverywhere</span>
      </div>
      <p class="footer-copy">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, logout, updateProfile } from '../stores/courierStore.js';
import { courierStateLabels } from '../constants.js';

const router = useRouter();
const profile = computed(() => store.profile);
const isEditing = ref(false);
const form = reactive({
  name: '', phone: '', email: '', address: '', birthDate: '', iban: '', zone: '',
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

function startEdit() { hydrateForm(); isEditing.value = true; }
function cancelEdit() { isEditing.value = false; }
async function saveEdit() {
  await updateProfile({
    name: form.name, phone: form.phone, email: form.email,
    address: form.address, birthDate: form.birthDate,
    iban: form.iban, zone: form.zone,
    vehicle: { type: form.vehicle.type, brand: form.vehicle.brand, model: form.vehicle.model, color: form.vehicle.color, plate: form.vehicle.plate },
  });
  isEditing.value = false;
}
function handleLogout() { logout(); router.push('/login'); }
</script>

<style scoped>
.logo-mini {
  width: 36px; height: 34px;
  border-radius: 14px; object-fit: cover;
}
.header-title {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.title-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  background: #fff; border-top: 0.72px solid #e5e7eb;
}
.title-bar h1 {
  font-family: var(--ge-font-display);
  font-size: 16px; font-weight: 700;
  margin: 0; color: #111827;
  flex: 1;
}
.edit-btn {
  padding: 6px 14px;
  background: #f0fdf4;
  border: 0.72px solid #dcfce7;
  border-radius: var(--ge-radius-full);
  font-size: 12px; font-weight: 600;
  color: #1b8a4a;
  cursor: pointer;
}
.logout-btn {
  padding: 6px 14px;
  background: #fef2f2;
  border: 0.72px solid #fecaca;
  border-radius: var(--ge-radius-full);
  font-size: 12px; font-weight: 600;
  color: #ef4444;
  cursor: pointer;
}

/* Profile card */
.profile-card {
  display: flex; align-items: center; gap: 16px;
  padding: 20px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  margin-bottom: 12px;
}
.avatar {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: #1b8a4a;
  color: #fff;
  font-family: var(--ge-font-display);
  font-size: 20px; font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}
.profile-info h2 {
  margin: 0; font-size: 18px;
  font-family: var(--ge-font-display);
  font-weight: 700; color: #111827;
}
.inline-input {
  border: 0.72px solid #e5e7eb;
  border-radius: 12px; padding: 8px 12px;
  font-size: 16px; font-weight: 600;
  font-family: var(--ge-font-display);
  width: 100%; max-width: 240px;
  outline: none;
}
.inline-input--small {
  font-size: 13px; font-weight: 500;
  font-family: var(--ge-font);
  margin-top: 4px;
}
.profile-phone {
  font-size: 13px; color: #6b7280;
  margin: 2px 0 6px;
}
.state-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #dcfce7;
  color: #166534;
  border-radius: var(--ge-radius-full);
  font-size: 11px; font-weight: 600;
}

/* Stats */
.stats-row {
  display: flex; gap: 8px;
  margin-bottom: 12px;
}
.stat-card {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center;
  padding: 14px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
}
.stat-val {
  font-family: var(--ge-font-display);
  font-size: 18px; font-weight: 700;
  color: #111827;
  display: flex; align-items: center; gap: 4px;
}
.stat-lbl {
  font-size: 10px; font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Info sections */
.info-section {
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
}
.section-label {
  font-family: var(--ge-font-display);
  font-size: 10px; font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: 10px;
}
.info-row {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 8px 0; font-size: 13px;
  border-bottom: 0.72px solid #f1f5f2;
}
.info-row:last-child { border-bottom: none; }
.info-key { color: #6b7280; font-weight: 500; }
.iban { font-family: var(--ge-font-mono); font-size: 11px; }
.row-input {
  border: 0.72px solid #e5e7eb;
  border-radius: 12px; padding: 6px 10px;
  font-size: 13px; outline: none;
  min-width: 140px;
}
.row-inputs { display: flex; gap: 6px; width: 62%; }
.row-inputs .row-input { flex: 1; min-width: 0; }

/* Documents */
.doc-list {
  display: flex; flex-direction: column; gap: 10px;
}
.doc-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: #111827;
}
.doc-circle {
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.doc-ok .doc-circle { background: #22c55e; }
.doc-missing .doc-circle { background: #ef4444; }

/* Save button */
.save-wrap { margin-top: 12px; }
.save-btn {
  width: 100%;
  padding: 16px;
  background: #1b8a4a;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  box-shadow: 0 8px 24px rgba(27,138,74,0.25);
  cursor: pointer;
}

/* Footer */
.app-footer {
  text-align: center; padding: 32px 28px;
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
.footer-copy { font-size: 11px; color: #9ca3af; margin: 0; }
</style>
