<template>
  <div class="page" v-if="delivery">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h1>Confirmar Entrega</h1>
    </div>

    <div class="page-body">
      <p class="confirm-info">{{ delivery.orderId }} — {{ delivery.destination.name }}</p>

      <!-- Confirmation Method Tabs -->
      <div class="method-tabs">
        <button
          v-for="m in methods" :key="m.id"
          class="tab-btn" :class="{ active: method === m.id }"
          @click="method = m.id"
        ><span class="tab-icon" v-html="m.icon"></span> {{ m.label }}</button>
      </div>

      <!-- Photo -->
      <div v-if="method === 'photo'" class="method-section">
        <p class="method-desc">Tira uma fotografia como prova de entrega.</p>
        <label class="photo-capture">
          <input type="file" accept="image/*" capture="environment" @change="handlePhoto" style="display:none">
          <div class="capture-area" :class="{ 'has-photo': photoPreview }">
            <img v-if="photoPreview" :src="photoPreview" alt="Prova">
            <span v-else class="capture-placeholder"><span v-html="SVG.camera"></span> Tirar Fotografia</span>
          </div>
        </label>
      </div>

      <!-- Signature -->
      <div v-if="method === 'signature'" class="method-section">
        <p class="method-desc">Peça ao cliente para assinar.</p>
        <div class="signature-area">
          <canvas ref="sigCanvas" width="360" height="200" @touchstart.prevent @mousedown.prevent></canvas>
          <button class="clear-sig" @click="clearSignature">Limpar</button>
        </div>
      </div>

      <!-- QR Code -->
      <div v-if="method === 'qr'" class="method-section">
        <p class="method-desc">Introduz o código QR de confirmação do cliente.</p>
        <div class="input-group">
          <label>Código QR</label>
          <input v-model="qrCode" class="input-field" placeholder="Ex: GE-CONFIRM-2850">
        </div>
      </div>

      <!-- Notes -->
      <div class="notes-section">
        <div class="input-group">
          <label>Notas descritivas (opcional)</label>
          <textarea v-model="notes" class="input-field" rows="2" placeholder="Observações sobre a entrega..."></textarea>
        </div>
        <div class="input-group">
          <label>Imagens adicionais</label>
          <input type="file" accept="image/*" multiple @change="handleExtraPhotos" class="input-field">
        </div>
      </div>

      <!-- GPS info -->
      <div class="gps-info" :class="{ fetching: gpsFetching }">
        <span v-if="gpsCoords"><span class="gps-icon" v-html="SVG.mapPin"></span> {{ gpsCoords.lat.toFixed(5) }}, {{ gpsCoords.lng.toFixed(5) }}</span>
        <span v-else-if="gpsFetching"><span class="gps-icon" v-html="SVG.mapPin"></span> A obter localização...</span>
        <span v-else><span class="gps-icon" v-html="SVG.mapPin"></span> Localização não disponível</span>
      </div>

      <p v-if="error" class="error-msg" style="margin-top:12px">{{ error }}</p>

      <button class="btn btn-primary btn-block btn-lg" style="margin-top:16px" @click="handleConfirm" :disabled="!canConfirm">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
        Confirmar Entrega
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getDeliveryById, confirmDelivery, addDeliveryNotes } from '../stores/courierStore.js';
import { SVG } from '../constants.js';

const props = defineProps({ id: String });
const router = useRouter();

const delivery = computed(() => getDeliveryById(props.id));
const method = ref('photo');
const error = ref('');

const methods = [
  { id: 'photo', icon: SVG.camera, label: 'Foto' },
  { id: 'signature', icon: SVG.edit3, label: 'Assinatura' },
  { id: 'qr', icon: SVG.qrCode, label: 'QR Code' },
];

// Photo
const photoPreview = ref(null);
const photoFile = ref(null);

function handlePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  photoFile.value = file;
  const reader = new FileReader();
  reader.onload = () => { photoPreview.value = reader.result; };
  reader.readAsDataURL(file);
}

// Signature
const sigCanvas = ref(null);
let signaturePad = null;

watch(method, async (m) => {
  if (m === 'signature') {
    await nextTick();
    initSignature();
  }
});

async function initSignature() {
  if (!sigCanvas.value) return;
  try {
    const { default: SignaturePad } = await import('signature_pad');
    signaturePad = new SignaturePad(sigCanvas.value, {
      backgroundColor: '#fff',
      penColor: '#111827',
    });
  } catch (err) {
    console.warn('SignaturePad not loaded:', err);
  }
}

function clearSignature() {
  if (signaturePad) signaturePad.clear();
}

// QR
const qrCode = ref('');

// Notes
const notes = ref('');
const extraPhotos = ref([]);

function handleExtraPhotos(e) {
  extraPhotos.value = Array.from(e.target.files).map(f => f.name);
}

// GPS
const gpsCoords = ref(null);
const gpsFetching = ref(true);

onMounted(() => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsCoords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        gpsFetching.value = false;
      },
      () => { gpsFetching.value = false; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    gpsFetching.value = false;
  }
});

// Validation
const canConfirm = computed(() => {
  if (method.value === 'photo') return !!photoPreview.value;
  if (method.value === 'signature') return signaturePad && !signaturePad.isEmpty();
  if (method.value === 'qr') return qrCode.value.trim().length > 3;
  return false;
});

function handleConfirm() {
  error.value = '';
  if (!canConfirm.value) {
    error.value = 'Completa a confirmação antes de submeter.';
    return;
  }

  const confirmationData = {
    method: method.value,
    gps: gpsCoords.value,
    timestamp: new Date().toISOString(),
  };

  if (method.value === 'photo') confirmationData.photo = photoPreview.value;
  if (method.value === 'signature' && signaturePad) confirmationData.signature = signaturePad.toDataURL();
  if (method.value === 'qr') confirmationData.qrCode = qrCode.value;

  if (notes.value.trim()) {
    addDeliveryNotes(props.id, notes.value, extraPhotos.value);
  }

  confirmDelivery(props.id, confirmationData);
  router.push('/deliveries');
}
</script>

<style scoped>
.back-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--ge-radius); background: var(--ge-page); color: var(--ge-text);
}
.confirm-info {
  font-size: 14px; font-weight: 600;
  color: var(--ge-text-secondary); margin: 0 0 16px;
}
.method-tabs {
  display: flex; gap: 8px; margin-bottom: 20px;
}
.tab-btn {
  flex: 1; padding: 10px 8px; text-align: center;
  border-radius: var(--ge-radius); font-size: 13px; font-weight: 600;
  background: var(--ge-page); color: var(--ge-text-secondary);
  border: 1.5px solid var(--ge-border); transition: all .15s;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
}
.tab-icon { display: inline-flex; }
.tab-icon :deep(svg) { width: 16px; height: 16px; }
.tab-btn.active {
  background: var(--ge-brand-soft); color: var(--ge-brand);
  border-color: var(--ge-brand);
}
.method-section { margin-bottom: 20px; }
.method-desc { font-size: 13px; color: var(--ge-text-secondary); margin: 0 0 12px; }

.photo-capture { cursor: pointer; display: block; }
.capture-area {
  width: 100%; height: 200px;
  display: flex; align-items: center; justify-content: center;
  background: var(--ge-page); border: 2px dashed var(--ge-border);
  border-radius: var(--ge-radius-lg); font-size: 15px;
  color: var(--ge-text-secondary); cursor: pointer;
  overflow: hidden;
}
.capture-placeholder {
  display: inline-flex; align-items: center; gap: 8px;
}
.capture-placeholder :deep(svg) { width: 20px; height: 20px; }
.capture-area.has-photo { border-style: solid; border-color: var(--ge-brand); }
.capture-area img { width: 100%; height: 100%; object-fit: cover; }

.signature-area {
  position: relative; background: #fff; border-radius: var(--ge-radius-lg);
  border: 2px solid var(--ge-border); overflow: hidden;
}
.signature-area canvas {
  width: 100%; height: 200px; display: block;
  touch-action: none;
}
.clear-sig {
  position: absolute; top: 8px; right: 8px;
  padding: 4px 10px; font-size: 11px; font-weight: 600;
  background: var(--ge-page); border-radius: var(--ge-radius-full);
  color: var(--ge-text-secondary); border: 1px solid var(--ge-border);
}

.notes-section { margin-top: 20px; display: flex; flex-direction: column; gap: 12px; }

.gps-info {
  margin-top: 12px; padding: 10px 14px;
  background: var(--ge-brand-soft); border-radius: var(--ge-radius);
  font-size: 12px; color: var(--ge-brand-dark);
  display: flex; align-items: center;
}
.gps-icon { display: inline-flex; margin-right: 6px; }
.gps-icon :deep(svg) { width: 14px; height: 14px; }
.gps-info.fetching { animation: pulse 1.5s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

.error-msg { color: var(--ge-status-error); font-size: 13px; }
</style>
