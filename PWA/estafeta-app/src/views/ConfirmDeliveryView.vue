<template>
  <div class="page page--no-nav" v-if="delivery">
    <!-- Header -->
    <div class="page-header">
      <div class="header-lock" title="Entrega em curso — página bloqueada">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span class="header-lock-label">Bloqueado</span>
      </div>
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <!-- Sub-header -->
    <div class="sub-header">
      <button class="back-btn" @click="$router.back()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Confirmar entrega</h2>
    </div>

    <div class="page-body">
      <!-- "Estás no destino!" banner -->
      <div class="destination-banner">
        <div class="db-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="db-text">
          <span class="db-title">Estás no destino!</span>
          <span class="db-desc">Confirma a entrega com assinatura do cliente</span>
        </div>
      </div>

      <!-- Proof requirements info -->
      <div class="section-card requirements-card">
        <div class="req-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <span class="req-text">É obrigatório registar a <strong>assinatura</strong>, sempre com GPS.</span>
      </div>


      <!-- Signature section (optional proof method) -->
      <div class="section-card">
        <span class="section-label">ASSINATURA DO CLIENTE (obrigatório)</span>
        <div class="signature-wrap">
          <canvas ref="sigCanvas" width="360" height="200" @touchstart.prevent @mousedown.prevent></canvas>
          <button class="clear-sig" @click="clearSignature">Limpar</button>
        </div>
        <p v-if="hasSig" class="proof-status proof-ok">✓ Assinatura recolhida</p>
      </div>



      <!-- Location section -->
      <div class="section-card">
        <span class="section-label">LOCALIZAÇÃO *</span>
        <button class="location-btn" @click="captureGPS" :class="{ captured: gpsCoords }">
          <div class="loc-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="gpsCoords ? '#1b8a4a' : '#9ca3af'" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="loc-text">
            <span class="loc-title">{{ gpsCoords ? 'Localização registada ✓' : 'Registar localização' }}</span>
            <span class="loc-desc">{{ gpsCoords ? `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}` : 'Toca para capturar a tua posição GPS' }}</span>
          </div>
        </button>
      </div>

      <!-- Observations section -->
      <div class="section-card">
        <span class="section-label">OBSERVAÇÕES</span>
        <textarea v-model="notes" class="notes-textarea" placeholder="Notas sobre a entrega (ex: entregue ao vizinho, deixado na portaria...)"></textarea>
      </div>

      <!-- Additional docs section -->
      <div class="section-card">
        <span class="section-label">DOCUMENTAÇÃO ADICIONAL</span>
        <textarea v-model="extraDesc" class="notes-textarea" placeholder="Texto descritivo adicional (incidentes, observações, estado da embalagem...)"></textarea>
        <div class="extra-photos">
          <span class="extra-label">Fotografias adicionais</span>
          <label class="add-photo-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Adicionar
            <input type="file" accept="image/*" multiple @change="handleExtraPhotos" class="sr-only">
          </label>
        </div>
        <p v-if="extraPhotos.length" class="extra-count">{{ extraPhotos.length }} foto(s) adicionada(s)</p>
      </div>

      <!-- Checklist -->
      <div class="section-card">
        <span class="section-label">CHECKLIST</span>
        <div class="checklist">
          <div class="check-item" :class="{ done: hasSig }">
            <span class="check-box"><span v-if="hasSig" class="check-mark"></span></span>
            <span>Assinatura do cliente</span>
          </div>
          <div class="check-item" :class="{ done: !!gpsCoords }">
            <span class="check-box"><span v-if="gpsCoords" class="check-mark"></span></span>
            <span>Localização GPS</span>
          </div>
          <div class="check-item optional" :class="{ done: notes.trim().length > 0 }">
            <span class="check-box"><span v-if="notes.trim().length > 0" class="check-mark"></span></span>
            <span>Observações (opcional)</span>
          </div>
          <div class="check-item optional" :class="{ done: extraPhotos.length > 0 || extraDesc.trim().length > 0 }">
            <span class="check-box"><span v-if="extraPhotos.length > 0 || extraDesc.trim().length > 0" class="check-mark"></span></span>
            <span>Documentação extra (opcional)</span>
          </div>
        </div>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>
    </div>

    <!-- Submit button -->
    <div class="submit-section">
      <button class="submit-btn" @click="handleConfirm" :disabled="!canConfirm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        Submeter entrega
      </button>
      <p class="submit-note">Assinatura e Localização GPS são obrigatórios</p>
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
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { getDeliveryById, confirmDelivery, addDeliveryNotes } from '../stores/courierStore.js';

const props = defineProps({ id: String });
const router = useRouter();

const delivery = computed(() => getDeliveryById(props.id));
const error = ref('');
const notes = ref('');
const extraDesc = ref('');
const extraPhotos = ref([]);


// Photo
const photoPreview = ref(null);
const photoFile = ref(null);
const photoInput = ref(null);
const hasPhoto = computed(() => !!photoPreview.value);

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
const hasSig = ref(false);

onMounted(async () => {
  captureGPS();
  await nextTick();
  initSignature();
});

async function initSignature() {
  if (!sigCanvas.value) return;
  try {
    const { default: SignaturePad } = await import('signature_pad');
    signaturePad = new SignaturePad(sigCanvas.value, { backgroundColor: '#fff', penColor: '#111827' });
    signaturePad.addEventListener('endStroke', () => {
      hasSig.value = !signaturePad.isEmpty();
    });
  } catch (err) { console.warn('SignaturePad:', err); }
}

function clearSignature() { 
  signaturePad?.clear(); 
  hasSig.value = false;
}

// GPS
const gpsCoords = ref(null);
const gpsFetching = ref(false);

function captureGPS() {
  if (!('geolocation' in navigator)) return;
  gpsFetching.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => { gpsCoords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }; gpsFetching.value = false; },
    () => { gpsFetching.value = false; },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Extra photos
const extraPhotosData = ref([]);

function handleExtraPhotos(e) {
  const files = Array.from(e.target.files);
  extraPhotosData.value = [...extraPhotosData.value, ...files];
  extraPhotos.value = extraPhotosData.value.map(f => f.name);
}

const hasAnyProof = computed(() => hasSig.value);

// Validation — Requires GPS + at least one proof method
const canConfirm = computed(() => {
  return hasSig.value && !!gpsCoords.value;
});

async function handleConfirm() {
  error.value = '';
  if (!canConfirm.value) {
    const missing = [];
    if (!hasSig.value) missing.push('assinatura');
    if (!gpsCoords.value) missing.push('localização GPS');
    error.value = `Falta: ${missing.join(', ')}.`;
    return;
  }
  const proofMethod = 'photo_and_signature';
  const data = {
    method: proofMethod,
    gps: gpsCoords.value,
    timestamp: new Date().toISOString(),
    photo: photoPreview.value,
    signature: signaturePad ? signaturePad.toDataURL() : null,

    location: gpsCoords.value,
    extraPhotos: extraPhotosData.value,
  };
  if (notes.value.trim()) addDeliveryNotes(props.id, notes.value, extraPhotos.value);
  const ok = await confirmDelivery(props.id, data);
  if (!ok) {
    error.value = 'Falha ao registar confirmação no servidor. Tenta novamente.';
    return;
  }
  router.push(`/completed/${props.id}`);
}
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
.sub-header {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 16px;
  background: #fff; border-top: 0.72px solid #e5e7eb;
}
.back-btn {
  background: none; border: none; cursor: pointer; color: #111827;
}
.sub-header h2 {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  margin: 0; color: #111827;
}

/* Destination banner */
.destination-banner {
  display: flex; align-items: center; gap: 12px;
  padding: 16px;
  background: #f0fdf4;
  border: 0.72px solid #dcfce7;
  border-radius: 16px;
  margin-bottom: 16px;
}
.db-icon {
  width: 40px; height: 40px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.db-text {
  display: flex; flex-direction: column;
}
.db-title {
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 700;
  color: #111827;
}
.db-desc {
  font-size: 12px; color: #6b7280;
}

/* Requirements info */
.requirements-card {
  display: flex; align-items: center; gap: 10px;
  background: #fffbeb;
  border-color: #fef3c7;
  margin-bottom: 12px;
}
.req-icon { flex-shrink: 0; display: flex; }
.req-text {
  font-size: 12px; color: #92400e; line-height: 1.4;
}
.req-text strong { font-weight: 700; }

/* Section cards */
.section-card {
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

/* Photo capture */
.capture-area-wrap { margin-top: 8px; }
.capture-area {
  width: 100%; height: 180px;
  display: flex; align-items: center; justify-content: center;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
}
.capture-area.has-photo { border-style: solid; border-color: var(--ge-brand); }
.capture-area img { width: 100%; height: 100%; object-fit: cover; }
.capture-placeholder {
  display: flex; flex-direction: column;
  align-items: center; gap: 8px;
  font-size: 13px; color: #9ca3af;
}

/* Proof status */
.proof-status {
  font-size: 12px; font-weight: 600; margin: 8px 0 0;
}
.proof-ok { color: #1b8a4a; }

/* Signature */
.signature-wrap {
  position: relative;
  border: 1.5px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  margin-top: 8px;
}
.signature-wrap canvas {
  width: 100%; height: 200px; display: block;
  touch-action: none;
}
.clear-sig {
  position: absolute; top: 8px; right: 8px;
  padding: 4px 10px; font-size: 11px; font-weight: 600;
  background: #fff; border-radius: var(--ge-radius-full);
  color: #6b7280; border: 1px solid #e5e7eb;
  cursor: pointer;
}

/* Location */
.location-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 14px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.location-btn.captured {
  background: #f0fdf4;
  border-color: #dcfce7;
}
.loc-icon {
  width: 36px; height: 36px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.location-btn.captured .loc-icon { background: #dcfce7; }
.loc-text { display: flex; flex-direction: column; }
.loc-title {
  font-size: 14px; font-weight: 600; color: #111827;
}
.loc-desc { font-size: 12px; color: #6b7280; }

/* Notes */
.notes-textarea {
  width: 100%;
  padding: 12px 16px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
  font-family: var(--ge-font);
  font-size: 13px;
  color: #111827;
  resize: vertical;
  min-height: 60px;
  outline: none;
}
.notes-textarea::placeholder { color: #d1d5db; }
.notes-textarea:focus {
  border-color: var(--ge-brand);
  box-shadow: 0 0 0 3px rgba(27,138,74,0.1);
}

/* Extra photos */
.extra-photos {
  display: flex; align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.extra-label {
  font-size: 12px; font-weight: 500; color: #111827;
}
.add-photo-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 12px;
  background: #f9fafb;
  border: 0.72px solid #e5e7eb;
  border-radius: var(--ge-radius-full);
  font-size: 12px; font-weight: 500;
  color: #6b7280;
  cursor: pointer;
}
.extra-count {
  font-size: 11px; color: var(--ge-brand);
  margin: 4px 0 0;
}

/* Checklist */
.checklist {
  display: flex; flex-direction: column; gap: 10px;
}
.check-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: #6b7280;
}
.check-item.done { color: #111827; }
.check-box {
  width: 18px; height: 18px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: #fff;
}
.check-item.done .check-box {
  background: var(--ge-brand);
  border-color: var(--ge-brand);
}
.check-mark {
  width: 8px; height: 5px;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg);
  margin-top: -2px;
}
.check-item.optional { color: #9ca3af; }
.check-item.optional.done { color: #6b7280; }

/* Submit */
.submit-section {
  padding: 16px;
  background: #fff;
  border-top: 0.72px solid #e5e7eb;
  position: sticky; bottom: 0;
}
.submit-btn {
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
  transition: background 0.15s, transform 0.1s;
}
.submit-btn:active { transform: scale(0.97); }
.submit-btn:disabled {
  opacity: 0.5; cursor: not-allowed;
}
.submit-note {
  text-align: center;
  font-size: 11px; color: #9ca3af;
  margin: 8px 0 0;
}
.error-msg { color: var(--ge-status-error); font-size: 13px; margin: 4px 16px; }

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
