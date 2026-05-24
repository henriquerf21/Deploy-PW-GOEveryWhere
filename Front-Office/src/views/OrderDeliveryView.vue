<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />
    <CheckoutWizardSteps :current-step="2" />

    <main class="cf-checkout-main">
      <router-link to="/order/select" class="cf-back-link">← Voltar ao carrinho</router-link>

      <header class="cf-checkout-head">
        <p class="cf-checkout-kicker">Morada e contacto</p>
        <h1 class="cf-checkout-title">Entrega</h1>
      </header>

      <div class="form-card cf-panel">
        <section class="form-block" aria-labelledby="sec-contact">
          <h2 id="sec-contact" class="cf-section-title">Quem recebe</h2>
          <div class="form-row-2col">
            <div class="cf-field" :class="{ 'has-error': errors.name }">
              <label class="cf-label" for="delivery-name">Nome completo <span class="req">*</span></label>
              <input
                id="delivery-name"
                v-model="store.delivery.name"
                class="cf-input"
                type="text"
                placeholder="Nome e apelido"
                @blur="validateField('name')"
              />
              <span v-if="errors.name" class="cf-field-error">{{ errors.name }}</span>
            </div>

            <div class="cf-field" :class="{ 'has-error': errors.phone }">
              <label class="cf-label" for="delivery-phone">Telemóvel <span class="req">*</span></label>
              <input
                id="delivery-phone"
                v-model="store.delivery.phone"
                class="cf-input"
                type="tel"
                @input="handlePhoneInput"
                @keydown="handlePhoneKeyDown"
                @blur="validateField('phone')"
              />
              <span v-if="errors.phone" class="cf-field-error">{{ errors.phone }}</span>
            </div>
          </div>
          <div class="cf-field">
            <label class="cf-label" for="delivery-nif">
              NIF <span class="cf-optional">(opcional)</span>
            </label>
            <input
              id="delivery-nif"
              v-model="store.delivery.nif"
              class="cf-input"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="9 dígitos"
            />
          </div>
        </section>

        <hr class="cf-divider" />

        <section class="form-block" aria-labelledby="sec-address">
          <h2 id="sec-address" class="cf-section-title">Morada de entrega</h2>
          
          <button
            type="button"
            class="cf-btn-gps"
            :disabled="gpsLoading"
            @click="detectGPS"
          >
            <Loader2 v-if="gpsLoading" class="spin" :size="18" />
            <MapPin v-else :size="18" />
            Atribuir morada automaticamente
          </button>

          <div class="cf-field" :class="{ 'has-error': errors.address }">
            <label class="cf-label" for="delivery-address">Rua e número <span class="req">*</span></label>
            <input
              id="delivery-address"
              v-model="store.delivery.address"
              class="cf-input"
              type="text"
              placeholder="Ex.: Rua do Comércio, 42"
              @blur="validateField('address')"
            />
            <span v-if="errors.address" class="cf-field-error">{{ errors.address }}</span>
          </div>

          <div class="form-row-3col">
            <div class="cf-field" :class="{ 'has-error': errors.postalCode }">
              <label class="cf-label" for="delivery-postal">Código postal <span class="req">*</span></label>
              <input
                id="delivery-postal"
                v-model="store.delivery.postalCode"
                class="cf-input"
                type="text"
                placeholder="0000-000"
                maxlength="8"
                @input="handlePostalInput"
                @blur="validateField('postalCode')"
              />
            </div>
            <div class="cf-field" :class="{ 'has-error': errors.city }">
              <label class="cf-label" for="delivery-city">Localidade <span class="req">*</span></label>
              <input
                id="delivery-city"
                v-model="store.delivery.city"
                class="cf-input"
                type="text"
                placeholder="Cidade"
                @blur="validateField('city')"
              />
            </div>
            <div class="cf-field">
              <label class="cf-label" for="delivery-floor">Andar / porta</label>
              <input
                id="delivery-floor"
                v-model="store.delivery.floor"
                class="cf-input"
                type="text"
                placeholder="Ex.: 3º Esq."
              />
            </div>
          </div>
        </section>

        <div v-if="store.delivery.assignedStore" class="store-info">
          <div class="store-badge">
            <Store :size="18" />
            <span>Ponto de recolha atribuído</span>
          </div>
          <p class="store-name">{{ store.delivery.assignedStore.name }}</p>
          <p class="store-address">{{ store.delivery.assignedStore.address }}</p>
          
          <div class="store-meta">
            <span class="meta-item"><Route :size="15" /> {{ store.delivery.estimatedDistance?.toFixed(1) || '—' }} km</span>
            <span class="meta-item"><Clock :size="15" /> ~{{ eta }} min</span>
            <span class="meta-item"><Truck :size="15" /> €{{ deliveryFeeFmt }} portes</span>
          </div>

          <button
            type="button"
            class="cf-btn-gps"
            style="margin-bottom: 0.75rem; padding: 0.6rem; font-size: 0.85rem; width: auto; display: inline-flex;"
            @click="geocodeAddress"
          >
            <MapPin :size="14" />
            Atualizar no mapa
          </button>

          <div class="store-map-wrap">
            <DeliveryRouteMap
              v-if="deliveryDestCoords"
              :store-lat="store.delivery.assignedStore.lat"
              :store-lng="store.delivery.assignedStore.lng"
              :dest-lat="deliveryDestCoords.lat"
              :dest-lng="deliveryDestCoords.lng"
              :courier-progress="0"
              height="200px"
            />
          </div>
        </div>

        <div v-else class="store-loading">
          <MapPin :size="22" class="muted-ic" />
          <p>Indica o código postal para localizarmos a loja mais próxima.</p>
        </div>

        <hr class="cf-divider" />

        <div class="cf-field">
          <label class="cf-label" for="delivery-instructions">Notas para o estafeta</label>
          <textarea
            id="delivery-instructions"
            v-model="store.delivery.instructions"
            class="cf-textarea"
            rows="3"
            placeholder="Ex.: Campainha com nome na placa..."
          />
        </div>

        <button
          type="button"
          class="cf-btn-primary form-submit"
          :disabled="!isFormValid"
          @click="goToPayment"
        >
          Continuar para pagamento
          <ArrowRight :size="18" />
        </button>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowRight, Clock, Loader2, MapPin, Route, Store, Truck 
} from 'lucide-vue-next';

import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import CheckoutWizardSteps from '../components/CheckoutWizardSteps.vue';
import DeliveryRouteMap from '../components/DeliveryRouteMap.vue';

import { getDestinationLatLng } from '../utils/mapCoords.js';
import {
  useOrderStore,
  findNearestStore,
  assignDefaultStore,
  isCartValid,
  estimatedETA,
  deliveryFee,
} from '../stores/orderStore.js';

// Importação da Store de Autenticação
import { useAuthStore } from '../stores/authStore.js';

const router = useRouter();
const store = useOrderStore();
const auth = useAuthStore();

const gpsLoading = ref(false);
const errors = reactive({
  name: '', phone: '', address: '', postalCode: '', city: ''
});

// --- FUNÇÃO DE AUXÍLIO PARA PREENCHIMENTO ---
// Esta função atualiza o campo na store e valida-o logo a seguir
function setDeliveryField(field, value) {
  if (value) {
    store.delivery[field] = value;
    validateField(field); 
  }
}

// --- COMPUTE PARA O MAPA ---
const deliveryDestCoords = computed(() => {
  const s = store.delivery.assignedStore;
  if (!s?.lat || !s?.lng) return null;
  return getDestinationLatLng(store.delivery, s.lat, s.lng);
});

// --- VALIDAÇÕES ---
const isNameValid = computed(() => store.delivery.name?.trim().length >= 3);
const isPhoneValid = computed(() => store.delivery.phone?.replace(/\D/g, '').length === 12);
const isAddressValid = computed(() => store.delivery.address?.trim().length >= 5);
const isPostalValid = computed(() => /^\d{4}-\d{3}$/.test(store.delivery.postalCode));
const isCityValid = computed(() => store.delivery.city?.trim().length >= 2);

const isFormValid = computed(() => 
  isNameValid.value && isPhoneValid.value && isAddressValid.value && 
  isPostalValid.value && isCityValid.value
);

const eta = estimatedETA;
const deliveryFeeFmt = computed(() => deliveryFee.value.toFixed(2));

// --- MÉTODOS DE INPUT ---
function validateField(field) {
  errors[field] = '';
  if (field === 'name' && !isNameValid.value) errors.name = 'Nome obrigatório.';
  if (field === 'phone' && !isPhoneValid.value) errors.phone = 'Número inválido.';
  if (field === 'address' && !isAddressValid.value) errors.address = 'Morada obrigatória.';
  if (field === 'postalCode' && !isPostalValid.value) errors.postalCode = 'CP inválido.';
  if (field === 'city' && !isCityValid.value) errors.city = 'Obrigatório.';
}

function handlePhoneKeyDown(e) {
  if ((e.key === 'Backspace' || e.key === 'Delete') && e.target.selectionStart <= 5) {
    e.preventDefault();
  }
}

function handlePhoneInput(e) {
  const prefix = '+351 ';
  let val = e.target.value;
  if (!val.startsWith(prefix)) val = prefix;
  const numbers = val.slice(prefix.length).replace(/\D/g, '').slice(0, 9);
  store.delivery.phone = prefix + numbers;
}

function handlePostalInput(e) {
  let val = e.target.value.replace(/\D/g, '').slice(0, 7);
  if (val.length > 4) {
    val = val.slice(0, 4) + '-' + val.slice(4);
  }
  store.delivery.postalCode = val;
}

// --- GPS E NAVEGAÇÃO ---
async function detectGPS() {
  if (!navigator.geolocation) {
    alert("O teu navegador não suporta geolocalização.");
    return;
  }

  gpsLoading.value = true;

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      store.delivery.gpsLat = latitude;
      store.delivery.gpsLng = longitude;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-PT' } }
        );
        const data = await response.json();

        if (data.address) {
          const addr = data.address;
          store.delivery.address = `${addr.road || ''}${addr.house_number ? ', ' + addr.house_number : ''}`;
          store.delivery.city = addr.city || addr.town || addr.village || 'Braga';
          
          if (addr.postcode) {
            const cp = addr.postcode.replace(/\s/g, '').slice(0, 8);
            store.delivery.postalCode = cp.includes('-') ? cp : `${cp.slice(0, 4)}-${cp.slice(4, 7)}`;
          }

          findNearestStore(latitude, longitude);
        }
      } catch (err) {
        console.error("Erro no reverse geocoding:", err);
        store.delivery.address = `Localização aproximada (Lat: ${latitude.toFixed(4)})`;
      } finally {
        gpsLoading.value = false;
      }
    },
    (err) => {
      gpsLoading.value = false;
      alert("Não foi possível obter a localização. Verifica as permissões.");
    },
    options
  );
}

function goToPayment() {
  if (isFormValid.value) {
    router.push('/order/payment');
  }
}

onMounted(() => {
  if (!isCartValid()) {
    router.replace('/order/select');
    return;
  }

  // Autopreenchimento com dados do utilizador autenticado
  const u = auth.user;
  if (u) {
    const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    if (fullName) setDeliveryField('name', fullName);
    
    if (u.phone) {
      // Garante que o telefone tem o prefixo correto para a validação do checkout
      const cleanPhone = u.phone.replace(/\D/g, '').slice(-9);
      setDeliveryField('phone', `+351 ${cleanPhone}`);
    }
    
    if (u.defaultAddress)    setDeliveryField('address',    u.defaultAddress);
    if (u.defaultPostalCode) setDeliveryField('postalCode', u.defaultPostalCode);
    if (u.defaultCity)       setDeliveryField('city',       u.defaultCity);
    if (u.nif)               store.delivery.nif = u.nif;
  }

  // Fallback para telefone se não tiver no perfil
  if (!store.delivery.phone) {
    store.delivery.phone = '+351 ';
  }

  if (!store.delivery.assignedStore) assignDefaultStore();
});

// RF05/RF06 — Geocoding automático da morada digitada (Nominatim)
// Recalcula loja mais próxima, distância, ETA e portes em tempo real
let geocodeTimer = null;

function geocodeAddress() {
  clearTimeout(geocodeTimer);
  const address = store.delivery.address?.trim();
  const city = store.delivery.city?.trim();
  const postal = store.delivery.postalCode?.trim();

  // Precisa de pelo menos cidade OU código postal para geocodificar
  if (!city && !postal) return;

  geocodeTimer = setTimeout(async () => {
    // Array de tentativas de queries: do mais exato para o mais abrangente
    const queries = [
      [address, postal, city, 'Portugal'].filter(Boolean).join(', '),
      [postal, city, 'Portugal'].filter(Boolean).join(', '),
      [city, 'Portugal'].filter(Boolean).join(', ')
    ];

    try {
      let lat = null;
      let lng = null;

      for (const query of queries) {
        if (!query.trim()) continue;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=pt`,
          { headers: { 'Accept-Language': 'pt-PT' } }
        );
        const results = await response.json();
        
        if (results.length > 0) {
          lat = parseFloat(results[0].lat);
          lng = parseFloat(results[0].lon);
          break; // Encontrou resultado válido, não tenta queries mais abrangentes
        }
      }

      if (lat !== null && lng !== null) {
        // Guardar coordenadas do destino para o mapa
        store.delivery.gpsLat = lat;
        store.delivery.gpsLng = lng;
        // Recalcular loja mais próxima com coordenadas reais
        findNearestStore(lat, lng);
      } else {
        console.warn('Geocoding falhou para todas as tentativas. Mantendo as coordenadas anteriores para evitar sobreposições.');
      }
    } catch (err) {
      console.warn('Erro fatal no Geocoding, a usar fallback:', err);
    }
  }, 800); // Debounce de 800ms para não sobrecarregar a API
}

// Observar mudanças na morada, cidade e código postal
watch(
  () => [store.delivery.address, store.delivery.city, store.delivery.postalCode],
  () => geocodeAddress(),
  { deep: true }
);
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.form-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.75rem;
}

.form-block {
  margin: 0;
}

.req {
  color: var(--cf-danger);
  font-weight: 700;
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row-3col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.input-with-icon {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.input-with-icon .cf-input {
  flex: 1;
}

.cf-btn-gps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-bottom: 1.5rem;
  padding: 0.85rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: var(--cf-bg);
  color: var(--cf-fg);
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cf-btn-gps:hover:not(:disabled) {
  border-color: var(--cf-cta);
  color: var(--cf-cta);
  background: rgba(234, 88, 12, 0.05);
}

.cf-btn-gps:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-btn {
  flex-shrink: 0;
  width: 3rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #f8fafc;
  color: var(--cf-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.icon-btn:hover:not(:disabled) {
  border-color: var(--cf-cta);
  background: var(--cf-cta-soft);
  color: var(--cf-cta-hover);
}

.icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.gps-success {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.875rem 1rem;
  border-radius: var(--cf-radius);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--cf-success);
  margin-bottom: 1rem;
  line-height: 1.45;
}

.gps-success svg {
  flex-shrink: 0;
  color: var(--cf-cta);
}

.store-info {
  margin: 1.5rem 0;
  padding: 1.25rem 1.25rem 1rem;
  border-radius: var(--cf-radius);
  border: 1px solid rgba(16, 185, 129, 0.28);
  background: rgba(16, 185, 129, 0.06);
}

.store-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cf-cta-hover);
  margin-bottom: 0.75rem;
}

.store-badge svg {
  color: var(--cf-cta);
}

.store-name {
  margin: 0 0 0.25rem;
  font-family: var(--cf-display);
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.store-address {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--cf-muted);
  line-height: 1.45;
}

.store-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cf-ink);
}

.meta-item svg {
  color: var(--cf-muted);
}

.store-map-wrap {
  margin-top: 0.25rem;
  border-radius: var(--cf-radius);
  overflow: hidden;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.store-loading {
  margin: 1.5rem 0;
  padding: 1.5rem;
  text-align: center;
  border-radius: var(--cf-radius);
  border: 1px dashed var(--cf-line);
  background: #f8fafc;
}

.store-loading p {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: var(--cf-muted);
  line-height: 1.5;
  max-width: 280px;
  margin-left: auto;
  margin-right: auto;
}

.muted-ic {
  color: var(--cf-muted);
}

.form-submit {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .form-card {
    padding: 1.5rem 1.25rem;
  }

  .form-row-2col,
  .form-row-3col {
    grid-template-columns: 1fr;
  }
}
</style>
