<template>
  <div class="page-wrapper">
    <SiteHeader />

    <!-- Wizard Steps -->
    <div class="wizard-steps">
      <router-link to="/order/select" class="step done">
        <div class="step-dot">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span>Carrinho</span>
      </router-link>
      <div class="step-line done-line"></div>
      <div class="step active"><div class="step-dot"></div><span>Entrega</span></div>
      <div class="step-line"></div>
      <div class="step"><div class="step-dot"></div><span>Pagamento</span></div>
    </div>

    <main class="form-main">
      <div class="form-card">
        <h2>Dados pessoais</h2>
        <div class="form-row-2col">
          <div class="form-group" :class="{ error: touched.name && !store.delivery.name.trim() }">
            <label for="delivery-name">Nome <span class="required">*</span></label>
            <input id="delivery-name" type="text" v-model="store.delivery.name" @blur="touched.name = true" placeholder="O teu nome" />
            <span v-if="touched.name && !store.delivery.name.trim()" class="error-msg">Campo obrigatório</span>
          </div>
          <div class="form-group" :class="{ error: touched.phone && !store.delivery.phone.trim() }">
            <label for="delivery-phone">Telefone <span class="required">*</span></label>
            <input id="delivery-phone" type="tel" v-model="store.delivery.phone" @blur="touched.phone = true" placeholder="912 345 678" />
            <span v-if="touched.phone && !store.delivery.phone.trim()" class="error-msg">Campo obrigatório</span>
          </div>
        </div>
        <div class="form-group">
          <label for="delivery-nif">NIF (opcional, para fatura)</label>
          <input id="delivery-nif" type="text" v-model="store.delivery.nif" placeholder="123456789" />
        </div>

        <div class="section-divider"></div>

        <h2>Morada de entrega</h2>
        <div class="form-group" :class="{ error: touched.address && !store.delivery.address.trim() }">
          <label for="delivery-address">Morada <span class="required">*</span></label>
          <div class="input-with-icon">
            <input id="delivery-address" type="text" v-model="store.delivery.address" @blur="touched.address = true" placeholder="Rua, número..." />
            <button class="icon-btn" @click="detectGPS" :disabled="gpsLoading" :title="gpsLoading ? 'A localizar...' : 'Usar GPS'" aria-label="Detetar localização GPS">
              <svg v-if="!gpsLoading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <svg v-else class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </button>
          </div>
          <span v-if="touched.address && !store.delivery.address.trim()" class="error-msg">Campo obrigatório</span>
        </div>
        <div v-if="gpsDetected" class="gps-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>Localização GPS detetada! Morada preenchida automaticamente.</span>
        </div>
        <div class="form-row-3col">
          <div class="form-group" :class="{ error: touched.postalCode && !store.delivery.postalCode.trim() }">
            <label for="delivery-postal">Código Postal <span class="required">*</span></label>
            <input id="delivery-postal" type="text" v-model="store.delivery.postalCode" @blur="touched.postalCode = true" placeholder="4050-262" />
          </div>
          <div class="form-group" :class="{ error: touched.city && !store.delivery.city.trim() }">
            <label for="delivery-city">Cidade <span class="required">*</span></label>
            <input id="delivery-city" type="text" v-model="store.delivery.city" @blur="touched.city = true" placeholder="Braga" />
          </div>
          <div class="form-group">
            <label for="delivery-floor">Andar/Porta</label>
            <input id="delivery-floor" type="text" v-model="store.delivery.floor" placeholder="3º Esq" />
          </div>
        </div>

        <!-- Store Info (RF05 — auto-assigned, client never picks) -->
        <div class="store-info" v-if="store.delivery.assignedStore">
          <div class="store-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Loja mais perto identificada automaticamente</span>
          </div>
          <div class="store-details">
            <p class="store-name">{{ store.delivery.assignedStore.name }}</p>
            <p class="store-address">{{ store.delivery.assignedStore.address }}</p>
          </div>
          <div class="store-meta">
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2"/></svg>
              <span>{{ store.delivery.estimatedDistance?.toFixed(1) || '—' }} km</span>
            </div>
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>~{{ eta }} min</span>
            </div>
            <div class="meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <span>€{{ deliveryFeeFmt }}</span>
            </div>
          </div>
          <div class="map-placeholder">
            <div class="map-pins">
              <div class="map-pin store-pin">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><rect x="2" y="7" width="20" height="5"/></svg>
                <small>{{ store.delivery.assignedStore.name.replace('Continente ', '') }}</small>
              </div>
              <div class="map-route">
                <svg width="48" height="2" viewBox="0 0 48 2"><line x1="0" y1="1" x2="48" y2="1" stroke="#00c853" stroke-width="2" stroke-dasharray="4 3"/></svg>
              </div>
              <div class="map-pin dest-pin">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <small>Destino</small>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!store.delivery.assignedStore" class="store-loading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <p>Preenche a morada para identificar o Continente mais próximo</p>
        </div>

        <div class="section-divider"></div>

        <div class="form-group">
          <label for="delivery-instructions">Instruções de entrega (opcional)</label>
          <textarea id="delivery-instructions" v-model="store.delivery.instructions" placeholder="Ex: Tocar à campainha 2 vezes, deixar à porta..."></textarea>
        </div>

        <button
          class="btn-continue"
          :class="{ disabled: !formValid }"
          :disabled="!formValid"
          @click="goToPayment"
        >
          Continuar para Pagamento
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand"><span class="footer-logo">G</span><span>GoEverywhere</span></div>
        <p class="copyright">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  useOrderStore, findNearestStore, assignDefaultStore,
  isDeliveryValid, isCartValid, estimatedETA, deliveryFee
} from '../stores/orderStore.js';

const router = useRouter();
const store = useOrderStore();

const gpsLoading = ref(false);
const gpsDetected = ref(false);

const touched = ref({
  name: false,
  phone: false,
  address: false,
  postalCode: false,
  city: false,
});

const formValid = computed(() => isDeliveryValid());
const eta = estimatedETA;
const deliveryFeeFmt = computed(() => deliveryFee.value.toFixed(2));

onMounted(() => {
  if (!isCartValid()) {
    router.replace('/order/select');
    return;
  }
  if (!store.delivery.assignedStore) {
    assignDefaultStore();
  }
});

watch(
  () => store.delivery.city,
  (city) => {
    if (city.toLowerCase().includes('guimarães') || city.toLowerCase().includes('guimaraes')) {
      findNearestStore(41.4425, -8.2918);
    } else {
      assignDefaultStore();
    }
  }
);

function detectGPS() {
  if (!navigator.geolocation) {
    alert('Geolocalização não suportada pelo browser.');
    return;
  }
  gpsLoading.value = true;
  gpsDetected.value = false;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      store.delivery.gpsLat = latitude;
      store.delivery.gpsLng = longitude;
      store.delivery.address = `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`;
      store.delivery.city = 'Braga';
      store.delivery.postalCode = '4700-000';
      findNearestStore(latitude, longitude);
      gpsLoading.value = false;
      gpsDetected.value = true;
    },
    () => {
      store.delivery.gpsLat = 41.5518;
      store.delivery.gpsLng = -8.4229;
      store.delivery.address = 'Rua de São José, 15';
      store.delivery.city = 'Braga';
      store.delivery.postalCode = '4050-262';
      findNearestStore(41.5518, -8.4229);
      gpsLoading.value = false;
      gpsDetected.value = true;
    },
    { timeout: 5000 }
  );
}

function goToPayment() {
  if (formValid.value) {
    router.push('/order/payment');
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Raleway:wght@300;400;500;600;700;800&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-wrapper { font-family: 'Poppins', sans-serif; background: #f6f7f7; color: #111827; min-height: 100vh; display: flex; flex-direction: column; }

.site-header { background: rgba(255,255,255,0.88); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; padding: 14px 32px; }
.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #111827; transition: opacity 0.2s; }
.logo:hover { opacity: 0.8; }
.logo-img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; }
.logo-text { font-family: 'Lora', serif; font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }

/* Wizard */
.wizard-steps { max-width: 400px; margin: 28px auto 12px; display: flex; align-items: center; gap: 8px; padding: 0 32px; }
.step { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #9ca3af; text-decoration: none; cursor: default; }
.step.active { color: #00c853; }
.step.done { color: #00c853; cursor: pointer; }
.step-dot { width: 12px; height: 12px; border-radius: 50%; background: #d1d5db; display: flex; align-items: center; justify-content: center; transition: all 0.25s; }
.step.active .step-dot { background: #00c853; box-shadow: 0 0 0 4px rgba(0,200,83,0.15); }
.step.done .step-dot { background: #00c853; width: 18px; height: 18px; }
.step-line { flex: 1; height: 2px; background: #e5e7eb; border-radius: 1px; }
.done-line { background: #00c853; }

/* Form */
.form-main { flex: 1; padding: 12px 32px 60px; }
.form-card { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 24px; padding: 40px; box-shadow: 0 8px 40px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.03); animation: contentIn 0.5s ease-out; }
@keyframes contentIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.form-card h2 { font-family: 'Lora', serif; font-size: 20px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.02em; }

.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: 13px; font-weight: 600; color: #374151; }
.required { color: #ef4444; }
.form-group input, .form-group textarea { border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 12px 14px; font-size: 14px; font-family: 'Poppins', sans-serif; background: #f9fafb; color: #111827; outline: none; transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease; }
.form-group input:focus, .form-group textarea:focus { border-color: #00c853; background: #fff; box-shadow: 0 0 0 3px rgba(0,200,83,0.08); }
.form-group textarea { min-height: 80px; resize: vertical; }
.form-group.error input { border-color: #ef4444; background: #fef2f2; }
.error-msg { font-size: 12px; color: #ef4444; font-weight: 500; }

.form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

.input-with-icon { display: flex; gap: 8px; }
.input-with-icon input { flex: 1; }
.icon-btn { background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 0 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; color: #374151; }
.icon-btn:hover { border-color: #00c853; background: #f0fdf4; color: #00c853; }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner-icon { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.gps-success { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #059669; font-weight: 500; margin-bottom: 16px; animation: fadeIn 0.3s ease; }

.section-divider { height: 1px; background: #e5e7eb; margin: 28px 0; }

/* Store */
.store-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 22px; margin-bottom: 16px; animation: fadeIn 0.3s ease; }
.store-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-size: 13px; font-weight: 600; color: #059669; }
.store-name { font-family: 'Lora', serif; font-weight: 700; font-size: 16px; margin-bottom: 4px; }
.store-address { font-size: 13px; color: #6b7280; margin-bottom: 14px; }
.store-meta { display: flex; gap: 24px; margin-bottom: 18px; }
.meta-item { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; color: #374151; }

.store-loading { background: #f9fafb; border: 1.5px dashed #d1d5db; border-radius: 16px; padding: 28px; text-align: center; color: #9ca3af; font-size: 14px; margin-bottom: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; }

.map-placeholder { background: linear-gradient(145deg, #e8f5e9, #c8e6c9); border-radius: 14px; height: 160px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.map-pins { display: flex; align-items: center; gap: 24px; }
.map-pin { display: flex; flex-direction: column; align-items: center; gap: 6px; background: rgba(255,255,255,0.92); border-radius: 12px; padding: 10px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
.map-pin small { font-size: 11px; font-weight: 700; color: #374151; }
.map-route { display: flex; align-items: center; }

.btn-continue { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: #00c853; color: #fff; padding: 16px; border-radius: 14px; font-weight: 700; font-size: 15px; border: none; cursor: pointer; font-family: 'Poppins', sans-serif; text-align: center; transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(0,200,83,0.25); margin-top: 8px; letter-spacing: 0.01em; }
.btn-continue:hover:not(.disabled) { background: #00b048; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,200,83,0.35); }
.btn-continue:active:not(.disabled) { transform: translateY(0); }
.btn-continue.disabled { background: #d1d5db; cursor: not-allowed; box-shadow: none; }

.site-footer { background: #111827; color: #fff; padding: 32px; }
.footer-inner { max-width: 1280px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-family: 'Lora', serif; }
.footer-logo { width: 34px; height: 34px; border-radius: 10px; background: #00c853; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.copyright { font-size: 13px; color: #9ca3af; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .form-row-2col, .form-row-3col { grid-template-columns: 1fr; }
  .form-card { padding: 24px; border-radius: 16px; }
  .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
}
</style>
