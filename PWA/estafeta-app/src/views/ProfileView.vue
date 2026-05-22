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
      <button class="logout-btn" @click="handleLogout">Sair</button>
    </div>

    <div class="page-body">
      <!-- Profile card -->
      <div class="profile-card">
        <div class="avatar-wrap">
          <img v-if="profilePhotoUrl" :src="profilePhotoUrl" alt="Foto de perfil" class="avatar-img" />
          <div v-else class="avatar">{{ initials }}</div>
        </div>
        <div class="profile-info">
          <h2>{{ profile.name }}</h2>
          <p class="profile-phone">{{ profile.phone }}</p>
          <span class="state-badge">{{ courierStateLabels[profile.state] }}</span>
        </div>
      </div>

      <!-- Info sections -->
      <div v-if="!isEditing">
        <div class="info-section">
          <span class="section-label">INFORMAÇÕES PESSOAIS</span>
          <div class="info-row"><span class="info-key">Email</span><span>{{ profile.email }}</span></div>
          <div class="info-row"><span class="info-key">Morada</span><span>{{ profile.address }}</span></div>
          <div class="info-row"><span class="info-key">Data nasc.</span><span>{{ profile.birthDate }}</span></div>
          <div class="info-row"><span class="info-key">IBAN</span><span class="iban">{{ profile.iban }}</span></div>
          <div class="info-row"><span class="info-key">Zona</span><span>{{ profile.zone }}</span></div>
        </div>



        <button class="change-btn" @click="startEditing" style="margin: 0 16px;">Editar Perfil</button>
      </div>

      <div v-else class="info-section edit-section">
        <span class="section-label">EDITAR INFORMAÇÕES PESSOAIS</span>
        <div class="field-group">
          <label>Email</label>
          <input v-model="editForm.email" class="field-input" type="email" />
        </div>
        <div class="field-group">
          <label>Morada</label>
          <input v-model="editForm.address" class="field-input" />
        </div>
        <div class="field-group">
          <label>Data Nascimento</label>
          <input v-model="editForm.birthDate" class="field-input" type="date" />
        </div>
        <div class="field-group">
          <label>IBAN</label>
          <input v-model="editForm.iban" class="field-input" />
        </div>



        <p v-if="changeError" class="error-msg">{{ changeError }}</p>

        <div class="modal-actions" style="margin-top: 16px; gap: 8px; display: flex;">
          <button class="btn-cancel" @click="isEditing = false" :disabled="changeSending" style="flex: 1; padding: 12px; background: #f3f4f6; border: none; border-radius: 8px;">Cancelar</button>
          <button class="change-btn" @click="saveProfile" :disabled="changeSending" style="flex: 1; margin: 0; padding: 12px; border: none; border-radius: 8px;">
            {{ changeSending ? 'A guardar...' : 'Guardar Alterações' }}
          </button>
        </div>
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, logout, updateProfile } from '../stores/courierStore.js';
import { courierStateLabels } from '../constants.js';

const router = useRouter();
const profile = computed(() => store.profile);
const initials = computed(() => {
  const parts = profile.value.name.split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
});

// Profile photo URL from Strapi
const profilePhotoUrl = computed(() => {
  if (store.profile.profilePhotoUrl) return store.profile.profilePhotoUrl;
  return null;
});

const isEditing = ref(false);
const changeError = ref('');
const changeSending = ref(false);

const editForm = ref({
  email: '',
  address: '',
  birthDate: '',
  iban: '',
});

function startEditing() {
  editForm.value = {
    email: profile.value.email || '',
    address: profile.value.address || '',
    birthDate: profile.value.birthDate || '',
    iban: profile.value.iban || '',
  };
  changeError.value = '';
  isEditing.value = true;
}

async function saveProfile() {
  changeError.value = '';
  changeSending.value = true;
  try {
    const updates = {
      email: editForm.value.email,
      address: editForm.value.address,
      birthDate: editForm.value.birthDate,
      iban: editForm.value.iban,
    };
    await updateProfile(updates);
    isEditing.value = false;
  } catch (err) {
    changeError.value = err.message || 'Erro ao guardar perfil.';
  } finally {
    changeSending.value = false;
  }
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
.avatar-wrap {
  width: 56px; height: 56px;
  flex-shrink: 0;
}
.avatar-img {
  width: 56px; height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1b8a4a;
}
.avatar {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: #1b8a4a;
  color: #fff;
  font-family: var(--ge-font-display);
  font-size: 20px; font-weight: 700;
  border-radius: 50%;
}
.profile-info h2 {
  margin: 0; font-size: 18px;
  font-family: var(--ge-font-display);
  font-weight: 700; color: #111827;
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

/* Add Vehicle Button */
.add-vehicle-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px;
  background: #f0fdf4;
  border: 1.5px dashed #22c55e;
  border-radius: 14px;
  color: #166534;
  font-family: var(--ge-font-display);
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.add-vehicle-btn:active { transform: scale(0.98); background: #dcfce7; }

/* Change request */
.change-request-section {
  border-color: #fef3c7;
  background: #fffbeb;
}
.change-info-banner {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: #fef3c7;
  border-radius: 12px;
  margin-bottom: 16px;
}
.change-info-icon { flex-shrink: 0; margin-top: 1px; }
.change-info-text {
  margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;
}
.change-success {
  display: flex; align-items: center; gap: 10px;
  padding: 14px;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 12px;
  font-size: 13px; color: #166534; font-weight: 500;
  line-height: 1.4;
}
.field-group {
  display: flex; flex-direction: column; gap: 6px;
  margin-bottom: 12px;
}
.field-group label {
  font-family: var(--ge-font-display);
  font-size: 12px; font-weight: 500;
  color: #92400e;
}
.field-input {
  width: 100%;
  padding: 12px 14px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 12px;
  font-family: var(--ge-font);
  font-size: 13px; color: #111827;
  outline: none;
}
.field-input:focus {
  border-color: var(--ge-brand);
  box-shadow: 0 0 0 3px rgba(27,138,74,0.1);
}
.field-textarea {
  width: 100%;
  padding: 12px 14px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 12px;
  font-family: var(--ge-font);
  font-size: 13px; color: #111827;
  outline: none;
  resize: vertical;
  min-height: 70px;
}
.field-textarea:focus {
  border-color: var(--ge-brand);
  box-shadow: 0 0 0 3px rgba(27,138,74,0.1);
}
.error-msg {
  color: #ef4444; font-size: 12px; margin: 0 0 8px;
}
.change-btn {
  width: 100%;
  padding: 14px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: var(--ge-font-display);
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  box-shadow: 0 4px 12px rgba(245,158,11,0.25);
}
.change-btn:active { transform: scale(0.97); }
.change-btn:disabled {
  opacity: 0.5; cursor: not-allowed;
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
