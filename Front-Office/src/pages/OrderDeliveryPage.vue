<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />
    <CheckoutWizardSteps :current-step="2" />

    <main class="cf-checkout-main">
      <router-link to="/order/select" class="cf-back-link">← Voltar ao carrinho</router-link>

      <header class="cf-checkout-head">
        <p class="cf-checkout-kicker">Morada e contacto</p>
        <h1 class="cf-checkout-title">Entrega</h1>
        <p class="cf-checkout-sub">
          Os dados servem para te contactarmos e para o estafeta te encontrar. A loja de recolha é escolhida automaticamente.
        </p>
      </header>

      <div class="form-card cf-panel">
        <section class="form-block" aria-labelledby="sec-contact">
          <h2 id="sec-contact" class="cf-section-title">Quem recebe</h2>
          <div class="form-row-2col">
            <div
              class="cf-field"
              :class="{ 'has-error': touched.name && !store.delivery.name.trim() }"
            >
              <label class="cf-label" for="delivery-name">Nome completo <span class="req">*</span></label>
              <input
                id="delivery-name"
                v-model="store.delivery.name"
                class="cf-input"
                type="text"
                autocomplete="name"
                placeholder="Nome e apelido"
                @blur="touched.name = true"
              />
              <span v-if="touched.name && !store.delivery.name.trim()" class="cf-field-error">Obrigatório</span>
            </div>
            <div
              class="cf-field"
              :class="{ 'has-error': touched.phone && !store.delivery.phone.trim() }"
            >
              <label class="cf-label" for="delivery-phone">Telemóvel <span class="req">*</span></label>
              <input
                id="delivery-phone"
                v-model="store.delivery.phone"
                class="cf-input"
                type="tel"
                autocomplete="tel"
                inputmode="tel"
                placeholder="912 345 678"
                @blur="touched.phone = true"
              />
              <span v-if="touched.phone && !store.delivery.phone.trim()" class="cf-field-error">Obrigatório</span>
            </div>
          </div>
          <div class="cf-field">
            <label class="cf-label" for="delivery-nif">
              NIF <span class="cf-optional">(opcional, para fatura)</span>
            </label>
            <input
              id="delivery-nif"
              v-model="store.delivery.nif"
              class="cf-input"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="9 dígitos"
            />
          </div>
        </section>

        <hr class="cf-divider" />

        <section class="form-block" aria-labelledby="sec-address">
          <h2 id="sec-address" class="cf-section-title">Morada de entrega</h2>
          <div
            class="cf-field"
            :class="{ 'has-error': touched.address && !store.delivery.address.trim() }"
          >
            <label class="cf-label" for="delivery-address">Rua e número <span class="req">*</span></label>
            <div class="input-with-icon">
              <input
                id="delivery-address"
                v-model="store.delivery.address"
                class="cf-input"
                type="text"
                autocomplete="street-address"
                placeholder="Ex.: Rua do Comércio, 42"
                @blur="touched.address = true"
              />
              <button
                type="button"
                class="icon-btn"
                :disabled="gpsLoading"
                :title="gpsLoading ? 'A localizar…' : 'Preencher com a minha localização'"
                :aria-busy="gpsLoading"
                aria-label="Usar localização do dispositivo"
                @click="detectGPS"
              >
                <Loader2 v-if="gpsLoading" class="spin" :size="18" :stroke-width="2" />
                <MapPin v-else :size="18" :stroke-width="1.75" />
              </button>
            </div>
            <span v-if="touched.address && !store.delivery.address.trim()" class="cf-field-error">Obrigatório</span>
          </div>

          <div v-if="gpsDetected" class="gps-success" role="status">
            <CheckCircle2 :size="18" :stroke-width="1.75" aria-hidden="true" />
            <span>Morada sugerida com base na localização. Confirma se está correta.</span>
          </div>

          <div class="form-row-3col">
            <div
              class="cf-field"
              :class="{ 'has-error': touched.postalCode && !store.delivery.postalCode.trim() }"
            >
              <label class="cf-label" for="delivery-postal">Código postal <span class="req">*</span></label>
              <input
                id="delivery-postal"
                v-model="store.delivery.postalCode"
                class="cf-input"
                type="text"
                autocomplete="postal-code"
                placeholder="0000-000"
                @blur="touched.postalCode = true"
              />
            </div>
            <div
              class="cf-field"
              :class="{ 'has-error': touched.city && !store.delivery.city.trim() }"
            >
              <label class="cf-label" for="delivery-city">Localidade <span class="req">*</span></label>
              <input
                id="delivery-city"
                v-model="store.delivery.city"
                class="cf-input"
                type="text"
                autocomplete="address-level2"
                placeholder="Cidade"
                @blur="touched.city = true"
              />
            </div>
            <div class="cf-field">
              <label class="cf-label" for="delivery-floor">Andar / porta</label>
              <input
                id="delivery-floor"
                v-model="store.delivery.floor"
                class="cf-input"
                type="text"
                autocomplete="off"
                placeholder="Ex.: 3º Esq."
              />
            </div>
          </div>
        </section>

        <div v-if="store.delivery.assignedStore" class="store-info">
          <div class="store-badge">
            <Store :size="18" :stroke-width="1.75" aria-hidden="true" />
            <span>Ponto de recolha atribuído</span>
          </div>
          <p class="store-name">{{ store.delivery.assignedStore.name }}</p>
          <p class="store-address">{{ store.delivery.assignedStore.address }}</p>
          <div class="store-meta">
            <span class="meta-item">
              <Route :size="15" :stroke-width="1.75" aria-hidden="true" />
              {{ store.delivery.estimatedDistance?.toFixed(1) || '—' }} km
            </span>
            <span class="meta-item">
              <Clock :size="15" :stroke-width="1.75" aria-hidden="true" />
              ~{{ eta }} min
            </span>
            <span class="meta-item">
              <Truck :size="15" :stroke-width="1.75" aria-hidden="true" />
              €{{ deliveryFeeFmt }} portes
            </span>
          </div>
          <div class="store-map-wrap">
            <DeliveryRouteMap
              v-if="deliveryDestCoords"
              :store-lat="store.delivery.assignedStore.lat"
              :store-lng="store.delivery.assignedStore.lng"
              :dest-lat="deliveryDestCoords.lat"
              :dest-lng="deliveryDestCoords.lng"
              :courier-progress="0"
              height="200px"
              aria-label="Mapa da loja de recolha e da morada de entrega indicativa"
            />
          </div>
        </div>

        <div v-else class="store-loading">
          <MapPin :size="22" :stroke-width="1.5" class="muted-ic" aria-hidden="true" />
          <p>Indica código postal e cidade para calcularmos a loja Continente mais próxima.</p>
        </div>

        <hr class="cf-divider" />

        <div class="cf-field">
          <label class="cf-label" for="delivery-instructions">
            Notas para o estafeta <span class="cf-optional">(opcional)</span>
          </label>
          <textarea
            id="delivery-instructions"
            v-model="store.delivery.instructions"
            class="cf-textarea"
            rows="3"
            autocomplete="off"
            placeholder="Ex.: Campainha com nome na placa, deixar à portaria…"
          />
        </div>

        <button
          type="button"
          class="cf-btn-primary form-submit"
          :disabled="!formValid"
          @click="goToPayment"
        >
          Continuar para pagamento
          <ArrowRight :size="18" :stroke-width="1.75" aria-hidden="true" />
        </button>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import CheckoutWizardSteps from '../components/CheckoutWizardSteps.vue';
import DeliveryRouteMap from '../components/DeliveryRouteMap.vue';
import { getDestinationLatLng } from '../utils/mapCoords.js';
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Route,
  Store,
  Truck,
} from 'lucide-vue-next';
import {
  useOrderStore,
  findNearestStore,
  assignDefaultStore,
  isDeliveryValid,
  isCartValid,
  estimatedETA,
  deliveryFee,
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

const deliveryDestCoords = computed(() => {
  const s = store.delivery.assignedStore;
  if (!s?.lat || !s?.lng) return null;
  return getDestinationLatLng(store.delivery, s.lat, s.lng);
});

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
