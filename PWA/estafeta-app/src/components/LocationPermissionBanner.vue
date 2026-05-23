<template>
  <div v-if="show" class="gps-banner" :class="`gps-banner--${tone}`" role="status">
    <div class="gps-banner__icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
    <div class="gps-banner__text">
      <strong>{{ title }}</strong>
      <p>{{ message }}</p>
    </div>
    <button
      v-if="showAction"
      type="button"
      class="gps-banner__btn"
      :disabled="requesting"
      @click="onEnable"
    >
      {{ requesting ? 'A pedir…' : actionLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  store,
  requestDeviceLocation,
  gpsNeedsAttention,
  gpsStatusLabel,
} from '../stores/courierStore.js';

const requesting = ref(false);

const show = computed(() => gpsNeedsAttention.value && !store.gpsSimulated);

const message = computed(() => store.gpsErrorMessage || gpsStatusLabel.value);

const tone = computed(() => {
  if (store.gpsPermission === 'insecure' || message.value.includes('mixed content')) return 'warn';
  if (store.gpsPermission === 'denied') return 'danger';
  return 'info';
});

const title = computed(() => {
  if (message.value.includes('mixed content')) return 'Configuração da API';
  if (store.gpsPermission === 'insecure') return 'GPS bloqueado neste endereço';
  if (store.gpsPermission === 'denied') return 'Localização negada';
  if (store.gpsPermission === 'unsupported') return 'GPS indisponível';
  return 'Ativa a localização';
});

const showAction = computed(() => (
  !message.value.includes('mixed content')
  && store.gpsPermission !== 'unsupported'
  && store.gpsPermission !== 'insecure'
));

const actionLabel = computed(() => (
  store.gpsPermission === 'denied' ? 'Tentar outra vez' : 'Permitir localização'
));

async function onEnable() {
  requesting.value = true;
  try {
    await requestDeviceLocation({ force: true });
  } finally {
    requesting.value = false;
  }
}
</script>

<style scoped>
.gps-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 16px 12px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
}
.gps-banner--info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e3a5f;
}
.gps-banner--warn {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #78350f;
}
.gps-banner--danger {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.gps-banner__icon { flex-shrink: 0; margin-top: 2px; }
.gps-banner__text { flex: 1; min-width: 0; }
.gps-banner__text strong { display: block; margin-bottom: 4px; }
.gps-banner__text p { margin: 0; opacity: 0.92; }
.gps-banner__btn {
  flex-shrink: 0;
  align-self: center;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #1b8a4a;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.gps-banner__btn:disabled { opacity: 0.6; cursor: wait; }
</style>
