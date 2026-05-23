<template>
  <div class="page page--no-nav" :class="{ 'page-navigating': isNavigating }" v-if="delivery && deliveryResolved">
    <!-- Header -->
    <div class="page-header">
      <div class="header-lock" title="Entrega em curso — página bloqueada">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        <span class="header-lock-label"> Bloqueado</span>
      </div>
      <img src="/media/brand/logo-goeverywhere.png" alt="" class="logo-mini" />
      <span class="header-title">GoEverywhere</span>
    </div>

    <LocationPermissionBanner v-if="!isNavigating" />

    <!-- Order banner (Figma: < #ORD-2850 URGENTE €6.50 / state) -->
    <div class="order-banner" v-if="!isNavigating">
      <button v-if="delivery.state === 'E-08' || delivery.state === 'E-14'" class="ob-back" type="button" aria-label="Voltar à lista" @click="$router.push('/deliveries')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="ob-info">
        <div class="ob-top-row">
          <span class="ob-id">{{ delivery.orderId }}</span>
          <span class="badge-urgent" v-if="delivery.priority >= 4">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M12 2L1 21h22L12 2z"/></svg>
            URGENTE
          </span>
          <span class="badge-normal" v-else>Normal</span>
        </div>
        <span class="ob-state">{{ stateLabel }}</span>
      </div>
      <span class="ob-price">€{{ delivery.costEuro?.toFixed(2) || '6.50' }}</span>
    </div>

    <div class="page-body">
      <!-- Stepper (Figma: Aceite → Em recolha → Em trânsito → Chegou ao destino) -->
      <div class="stepper-card" v-if="!isNavigating">
        <StatusStepper :currentState="delivery.state" :timestamps="delivery.timestamps" />
      </div>

      <!-- Mapa: viewport limpo + legenda/acções por baixo -->
      <div class="map-card" :class="{ 'fullscreen-map': isNavigating }">
        <div v-if="!isNavigating" class="map-card-head">
          <span class="map-state-badge" :class="mapBadgeClass">
            <span class="msb-icon" v-html="mapBadgeIcon"></span>
            {{ mapBadgeLabel }}
          </span>
        </div>

        <div class="map-viewport">
        <div class="painel-navegacao" v-if="isNavigating">
          <button type="button" class="nav-fab-recenter" title="Centrar" @click="centerOnCourier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </button>

          <div class="nav-hud-top" v-if="navInstruction">
            <NavManeuverIcon :maneuver="navInstruction.maneuver" />
            <div class="nav-turn-text">
              <p class="nav-distance-primary">{{ navDistanceLabel }}</p>
              <p class="nav-street-name">{{ navStreetName }}</p>
            </div>
          </div>
          <div v-else class="nav-hud-top nav-hud-wait">
            <p class="nav-phase">{{ navPhaseLabel }}</p>
            <p class="nav-wait-gps">A obter GPS e percurso… Ativa a localização.</p>
          </div>

          <p v-if="navInstruction" class="nav-phase-badge">{{ navPhaseLabel }}</p>

          <div v-if="navStreetName && navInstruction" class="nav-street-pill">{{ navStreetName }}</div>

          <div class="nav-hud-bottom">
            <div class="nav-trip-grid">
              <div class="nav-trip-col">
                <span class="nav-trip-label">Chegada</span>
                <span class="nav-eta-time">{{ navEtaTime }}</span>
              </div>
              <div class="nav-trip-col">
                <span class="nav-trip-label">Distância</span>
                <span class="nav-trip-value">{{ navRemainingKm }} km</span>
              </div>
              <div class="nav-trip-col">
                <span class="nav-trip-label">Tempo</span>
                <span class="nav-trip-value">{{ navDurationLabel }}</span>
              </div>
            </div>
            <button type="button" class="nav-btn-close-round" aria-label="Sair da navegação" @click="stopNavigation">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div ref="routeMapEl" class="route-map" :class="{ 'fullscreen-view': isNavigating }"></div>

        <div v-if="!isNavigating" class="map-zoom-stack">
          <button type="button" class="map-zoom" aria-label="Aumentar zoom" @click="zoomIn">+</button>
          <button type="button" class="map-zoom" aria-label="Reduzir zoom" @click="zoomOut">−</button>
        </div>

        <div v-if="isNavigating" class="map-controls map-controls--nav">
          <template v-if="enableCourierSim && ['E-09', 'E-10', 'E-11', 'E-12'].includes(delivery.state)">
            <button
              type="button"
              class="map-zoom map-sim-btn"
              :class="{ 'map-sim-btn--active': isSimulatingRoute }"
              @click="handleQuickSim"
            >
              {{ isSimulatingRoute ? 'Parar' : 'Simular' }}
            </button>
            <p v-if="simContinueHint" class="map-sim-hint">{{ simContinueHint }}</p>
          </template>
        </div>
        </div>

        <div v-if="!isNavigating" class="map-card-foot">
          <div v-if="showMapLegend" class="map-legend">
            <span class="ml-item"><img :src="MAP_PINS.courier" alt="" class="ml-pin-img" /> Estafeta</span>
            <span class="ml-item"><img :src="MAP_PINS.store" alt="" class="ml-pin-img" /> Loja</span>
            <span class="ml-item"><img :src="MAP_PINS.home" alt="" class="ml-pin-img" /> Cliente</span>
            <span class="ml-item"><i class="ml-line ml-line-a"></i> Até à loja</span>
            <span class="ml-item"><i class="ml-line ml-line-b"></i> Loja → cliente</span>
          </div>
          <button
            v-if="['E-09', 'E-10', 'E-11', 'E-12'].includes(delivery.state)"
            type="button"
            class="map-nav-cta"
            @click="startNavigation"
          >
            Abrir navegação
          </button>
          <button
            v-if="enableCourierSim && ['E-09', 'E-10', 'E-11', 'E-12'].includes(delivery.state)"
            type="button"
            class="map-sim-subtle"
            :class="{ 'map-sim-subtle--active': isSimulatingRoute }"
            @click="handleQuickSim"
          >
            {{ isSimulatingRoute ? 'Parar' : 'Simular' }}
          </button>
          <p
            v-if="enableCourierSim && simContinueHint && !isNavigating"
            class="map-sim-hint map-sim-hint--below-cta"
          >
            {{ simContinueHint }}
          </p>
        </div>
      </div>

      <template v-if="!isNavigating">
      <!-- REGISTO DE TEMPOS -->
      <div class="section-card">
        <span class="section-label">REGISTO DE TEMPOS</span>
        <div v-for="(t, i) in timeEntries" :key="i" class="time-row">
          <div class="time-left">
            <span class="time-dot" :class="{ done: t.done }">
              <svg v-if="t.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
            </span>
            <span class="time-name" :class="{ 'time-done': t.done }">{{ t.label }}</span>
          </div>
          <span class="time-val">{{ t.time }}</span>
        </div>
      </div>

      <!-- Client / Destinatário (Figma: avatar + name + phone + chat + call) -->
      <div class="section-card client-card" v-if="delivery.destination.name !== 'Cliente' || delivery.destination.phone">
        <div class="client-avatar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
        </div>
        <div class="client-info">
          <span class="client-name">{{ delivery.destination.name }}</span>
          <span class="client-phone">{{ delivery.destination.phone }}</span>
        </div>
        <div class="client-actions">
          <a href="#" class="action-btn action-chat" @click.prevent="openChat = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <div v-if="unreadCount > 0" class="chat-badge">{{ unreadCount }}</div>
          </a>
          <a v-if="delivery.destination.phone" :href="'tel:' + delivery.destination.phone" class="action-btn action-call">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b8a4a" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          </a>
        </div>
      </div>

      <!-- Locations: RECOLHA + ENTREGA (Figma: orange dot, green dot, with full addresses) -->
      <div class="section-card">
        <div class="loc-row">
          <div class="loc-dot loc-dot-orange"></div>
          <div class="loc-detail">
            <span class="loc-label">RECOLHA</span>
            <span class="loc-name">{{ delivery.pickup.name }}</span>
          </div>
        </div>
        <div class="loc-connector"></div>
        <div class="loc-row">
          <div class="loc-dot loc-dot-green"></div>
          <div class="loc-detail">
            <span class="loc-label">ENTREGA</span>
            <span class="loc-name">{{ delivery.destination.address }}</span>
          </div>
        </div>
      </div>

      <!-- ENCOMENDA (Figma: package icon + product name + qty) -->
      <div class="section-card">
        <span class="section-label">ENCOMENDA</span>
        <div v-for="item in delivery.items" :key="item.name" class="item-row">
          <div class="item-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
          </div>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-qty">{{ item.qty }} {{ item.unit }}</span>
          </div>
        </div>
        <div class="item-meta">
          Peso total: {{ delivery.weight }} · Tamanho: {{ delivery.size || 'Médio' }}
        </div>
      </div>

      <!-- Instruções especiais -->
      <div class="section-card instructions-card" v-if="delivery.instructions">
        <div class="instr-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" fill="none" stroke="#fff" stroke-width="2"/></svg>
          <span class="instr-title">Instruções da operação</span>
        </div>
        <p class="instr-text">{{ delivery.instructions }}</p>
      </div>

      <!-- Notas do Cliente -->
      <div class="section-card instructions-card" v-if="delivery.deliveryNotes" style="background: #eff6ff; border-color: #bfdbfe;">
        <div class="instr-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#3b82f6" stroke="none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" fill="none" stroke="#fff" stroke-width="2"/></svg>
          <span class="instr-title" style="color: #1e3a8a;">Notas do cliente</span>
        </div>
        <p class="instr-text" style="color: #1e40af;">{{ delivery.deliveryNotes }}</p>
      </div>




      <!-- CTA Buttons (Figma: per-state styling) -->
      <div class="cta-section" v-if="ctaLabel">
        <!-- E-08: Aceitar Entrega (green) -->
        <button v-if="delivery.state === 'E-08'" class="cta-btn cta-green" @click="handleAccept" :disabled="loadingCTA">
          {{ loadingCTA ? 'A aguardar...' : ctaLabel }}
        </button>
        <button v-else-if="delivery.state === 'E-09'" class="cta-btn cta-green" @click="handleCTA" :disabled="loadingCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          {{ loadingCTA ? 'A processar...' : ctaLabel }}
        </button>
        <!-- E-10: Recolha feita (amber) -->
        <button v-else-if="delivery.state === 'E-10'" class="cta-btn cta-amber" @click="handleCTA" :disabled="loadingCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ loadingCTA ? 'A processar...' : ctaLabel }}
        </button>
        <button v-else-if="delivery.state === 'E-11'" class="cta-btn cta-green" @click="handleCTA" :disabled="loadingCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          {{ loadingCTA ? 'A processar...' : ctaLabel }}
        </button>
        <!-- E-12: Confirmar entrega (green) -->
        <button v-else class="cta-btn cta-green" @click="handleCTA" :disabled="loadingCTA">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          {{ loadingCTA ? 'A processar...' : ctaLabel }}
        </button>
      </div>

      <!-- Impossible delivery (card below CTA) -->
      <div v-if="canMarkImpossible" class="impossible-card" @click="showImpossible = true">
        <div class="impossible-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="impossible-card-text">
          <span class="impossible-card-title">Problema com a encomenda?</span>
          <span class="impossible-card-desc">Se não conseguires entregar antes da recolha, reporta aqui para a equipa reatribuir estafeta.</span>
        </div>
        <svg class="impossible-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      </template>
    </div>

    <!-- Footer -->
    <footer v-if="!isNavigating" class="app-footer">
      <div class="footer-brand">
        <span class="footer-g">G</span>
        <span class="footer-name">GoEverywhere</span>
      </div>
      <p class="footer-copy">© 2026 GoEverywhere, Lda. Todos os direitos reservados.</p>
    </footer>

    <!-- Timer overlay for E-08 -->
    <div v-if="delivery.state === 'E-08'" class="timer-banner">
      <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Tempo para aceitar: <strong>{{ timerDisplay }}</strong></span>
      <button class="timer-accept" @click="handleAccept">Aceitar</button>
    </div>

    <!-- Chat Modal -->
    <Teleport to="body">
      <div v-if="openChat" class="modal-overlay" @click.self="openChat = false">
        <div class="modal-card chat-modal">
          <div class="chat-header">
            <h3>Chat com {{ delivery.destination.name }}</h3>
            <button @click="openChat = false" class="close-btn">&times;</button>
          </div>
          <div class="chat-messages" ref="chatContainer">
            <div v-for="msg in sortedChatMessages" :key="msg.id || `${msg.time}-${msg.sender}`" 
                 class="chat-bubble" :class="{ 'mine': msg.sender === 'courier', 'theirs': msg.sender === 'client' }">
              <span class="msg-sender" v-if="msg.sender === 'client'">{{ delivery.destination.name }}</span>
              <span class="msg-sender" v-else>Tu</span>
              <p>{{ msg.text }}</p>
              <span class="msg-time">{{ formatTime(msg.time) }}</span>
            </div>
            <div v-if="!deliveryChatMessages.length" class="no-messages">
              <p>Nenhuma mensagem ainda.</p>
            </div>
          </div>
          <div class="chat-input-area">
            <input v-model="chatInput" @keyup.enter="handleSendChat" placeholder="Escreve mensagem..." />
            <button class="btn-send-chat" @click="handleSendChat" :disabled="!chatInput.trim() || sendingChat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Impossible delivery modal -->
    <Teleport to="body">
      <div v-if="showImpossible" class="modal-overlay" @click.self="showImpossible = false">
        <div class="modal-card">
          <h3>Qual é o motivo de cancelamento?</h3>
          <div class="field-group">
            <textarea v-model="impossibleReason" class="field-input" rows="3" placeholder="Descreve o motivo..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showImpossible = false">Cancelar</button>
            <button class="btn-danger" @click="handleImpossible">Confirmar</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <div v-else class="page" style="text-align:center; padding-top:80px">
    <p v-if="resolvingDelivery">A carregar entrega…</p>
    <template v-else>
      <p>Entrega não encontrada.</p>
      <button class="cta-btn cta-green" style="margin:16px auto; max-width:200px" @click="$router.push('/deliveries')">Voltar</button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import 'mapbox-gl/dist/mapbox-gl.css';
import { isValidCoord, MAP_PINS } from '../utils/mapbox.js';
import { useMapboxDeliveryMap } from '../composables/useMapboxDeliveryMap.js';
import {
  getDeliveryById, ensureDeliveryLoaded, acceptDelivery, advanceDeliveryState,
  markDeliveryImpossible, sendDeliveryChatMessage, joinOrderRoom,
  declineDeliveryTimeout, requestDeviceLocation, restartGpsTracking, getLastGpsCoords,
  isPaused, store, startQuickDeliverySimulation, stopSimulatedRoute,
  isSimulatingRoute, isSimulatingDelivery, getMapCourierPosition, setActiveDeliveryForView, refreshDeviceGps,
} from '../stores/courierStore.js';
import { isValidGpsPoint } from '../utils/geo.js';
import { DELIVERY_STATE, deliveryStateLabels, STATE_CTA } from '../constants.js';
import StatusStepper from '../components/StatusStepper.vue';
import LocationPermissionBanner from '../components/LocationPermissionBanner.vue';
import NavManeuverIcon from '../components/NavManeuverIcon.vue';
import { formatNavDistance, formatNavDuration, getNavStreetName } from '../utils/navManeuver.js';
import { ENABLE_COURIER_SIM } from '../config/env.js';
import { sortChatHistory } from '../utils/chatHistory.js';

const props = defineProps({ id: String });
const enableCourierSim = ENABLE_COURIER_SIM;
const router = useRouter();
const routeMapEl = ref(null);
let timerInterval = null;
let joinedOrderRoom = null;
const isNavigating = ref(false);
const showMapLegend = computed(() => {
  const s = delivery.value?.state;
  return s && ['E-09', 'E-10', 'E-11', 'E-12'].includes(s);
});

const deliverySnapshot = ref(null);
const delivery = computed(() => {
  const live = getDeliveryById(props.id);
  if (live) return live;
  return deliverySnapshot.value;
});
const deliveryChatMessages = computed(() =>
  (delivery.value?.chatHistory || []).filter(m => {
    const ch = String(m?.channel || '').toLowerCase();
    const sender = String(m?.sender || '').toLowerCase();
    if (ch === 'delivery') return true;
    if (ch === 'info_adicional' || ch === 'ops') return false;
    if (sender === 'admin' || sender === 'bo') return false;
    return sender === 'courier' || sender === 'client';
  })
);
const sortedChatMessages = computed(() => sortChatHistory(deliveryChatMessages.value));
watch(
  () => getDeliveryById(props.id),
  (d) => { if (d) deliverySnapshot.value = d; },
  { immediate: true },
);
watch(() => props.id, () => { deliverySnapshot.value = null; });

const simContinueHint = computed(() => {
  if (!isSimulatingRoute.value || !delivery.value) return '';
  if (['E-09', 'E-10'].includes(delivery.value.state)) {
    return 'Na loja: altera o estado para «Em trânsito para cliente» (E-11) para a simulação seguir até ao cliente.';
  }
  return '';
});
const deliveryResolved = ref(!!delivery.value);
const resolvingDelivery = ref(false);
const ctaLabel = computed(() => delivery.value ? STATE_CTA[delivery.value.state] : null);
/** Só antes da recolha (E-08 recebido, E-09 a caminho da loja). */
const canMarkImpossible = computed(() =>
  delivery.value && ['E-08', 'E-09'].includes(delivery.value.state)
);

const stateLabel = computed(() => {
  if (!delivery.value) return '';
  return {
    'E-08': 'Pedido Recebido',
    'E-09': 'Aceite',
    'E-10': 'Em recolha',
    'E-11': 'Em trânsito',
    'E-12': 'Chegou ao destino',
    'E-13': 'Entregue',
    'E-14': 'Falhou',
  }[delivery.value.state] || deliveryStateLabels[delivery.value.state];
});

// Map badge per Figma
const mapBadgeLabel = computed(() => {
  if (!delivery.value) return '';
  return { 'E-09': 'Aceite', 'E-10': 'Em recolha', 'E-11': 'Em trânsito', 'E-12': 'No destino' }[delivery.value.state] || 'Aceite';
});
const mapBadgeClass = computed(() => {
  if (!delivery.value) return '';
  return { 'E-09': 'msb-green', 'E-10': 'msb-orange', 'E-11': 'msb-blue', 'E-12': 'msb-orange' }[delivery.value.state] || 'msb-green';
});
const mapBadgeIcon = computed(() => {
  const s = delivery.value?.state;
  if (s === 'E-09') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';
  if (s === 'E-10') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  if (s === 'E-11') return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/></svg>';
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>';
});

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// --- Chat logic ---
const openChat = ref(false);
const chatInput = ref('');
const sendingChat = ref(false);
const chatContainer = ref(null);
const unreadCount = ref(0);

// We can just keep track of the last seen length
let lastSeenChatLength = 0;

watch(openChat, (newVal) => {
  if (newVal) {
    unreadCount.value = 0;
    lastSeenChatLength = delivery.value?.chatHistory?.length || 0;
    setTimeout(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    }, 100);
  }
});

watch(() => delivery.value?.chatHistory, (newHistory) => {
  const currentLength = newHistory?.length || 0;
  if (!openChat.value) {
    if (currentLength > lastSeenChatLength) {
      unreadCount.value += (currentLength - lastSeenChatLength);
      lastSeenChatLength = currentLength;
    }
  } else {
    lastSeenChatLength = currentLength;
    setTimeout(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    }, 100);
  }
}, { deep: true });

async function handleSendChat() {
  if (!chatInput.value.trim() || sendingChat.value) return;
  sendingChat.value = true;
  const res = await sendDeliveryChatMessage(delivery.value.orderDocumentId, chatInput.value.trim());
  if (res) {
    chatInput.value = '';
    setTimeout(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    }, 100);
  }
  sendingChat.value = false;
}

const stateOrder = ['E-09', 'E-10', 'E-11', 'E-12'];
const timeEntries = computed(() => {
  const ts = delivery.value?.timestamps || {};
  const curIdx = stateOrder.indexOf(delivery.value?.state);
  return [
    { label: 'Aceite', time: formatTime(ts['E-09']), done: curIdx >= 0 && !!ts['E-09'] },
    { label: 'Em recolha', time: formatTime(ts['E-10']), done: curIdx >= 1 && !!ts['E-10'] },
    { label: 'Em trânsito', time: formatTime(ts['E-11']), done: curIdx >= 2 && !!ts['E-11'] },
    { label: 'Chegou ao destino', time: formatTime(ts['E-12']), done: curIdx >= 3 && !!ts['E-12'] },
  ];
});

// Timer for E-08
const timerSeconds = ref(300);
const timerDisplay = computed(() => {
  if (timerSeconds.value <= 0) return '0:00';
  const m = Math.floor(timerSeconds.value / 60);
  const s = timerSeconds.value % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
});

function calculateRemainingSeconds() {
  if (!delivery.value?.timestamps?.['E-08']) return 300;
  const createdAt = new Date(delivery.value.timestamps['E-08']).getTime();
  const now = new Date().getTime();
  const diffSecs = Math.floor((now - createdAt) / 1000);
  return Math.max(0, 300 - diffSecs);
}

function getRawGps() {
  if (isSimulatingRoute.value || store.gpsSimulated) return null;
  if (!store.gpsFromDevice) return null;
  const local = getLastGpsCoords();
  if (isValidGpsPoint(local)) return { lat: local.lat, lng: local.lng };
  return null;
}

function courierGpsForMap() {
  if (isNavigating.value && navDisplayGps.value) return navDisplayGps.value;
  const d = delivery.value;
  if (!d) return null;
  return getMapCourierPosition(d);
}

const {
  initMap,
  destroyMap,
  renderMap,
  zoomIn,
  zoomOut,
  resize: resizeMap,
  startNavigation: startMapNavigation,
  stopNavigation: stopMapNavigation,
  scheduleRender,
  onGpsTick,
  centerOnCourier,
  navInstruction,
  navDistanceM,
  navEtaTime,
  navRemainingMin,
  navRemainingKm,
  navDisplayGps,
  navPhaseLabel,
} = useMapboxDeliveryMap({
  getDelivery: () => delivery.value,
  getCourierGps: courierGpsForMap,
  getRawGps,
  isNavigating,
});

const navDistanceLabel = computed(() => formatNavDistance(navDistanceM.value));
const navDurationLabel = computed(() => formatNavDuration(navRemainingMin.value));
const navStreetName = computed(() => getNavStreetName(navInstruction.value));

async function startNavigation() {
  requestMapGps();
  restartGpsTracking();
  isNavigating.value = true;
  await startMapNavigation();
}

async function stopNavigation() {
  isNavigating.value = false;
  await stopMapNavigation();
}

function requestMapGps() {
  refreshDeviceGps();
}

async function resolveDeliveryRoute() {
  resolvingDelivery.value = true;
  const resolved = await ensureDeliveryLoaded(props.id);
  resolvingDelivery.value = false;
  if (!resolved) {
    router.replace('/deliveries');
    return null;
  }
  if (String(resolved.id) !== String(props.id)) {
    router.replace(`/deliveries/${resolved.id}`);
    return null;
  }
  deliveryResolved.value = true;
  return resolved;
}

watch(() => props.id, (id) => {
  if (getDeliveryById(id)) deliveryResolved.value = true;
  if (id) setActiveDeliveryForView(id);
  void resolveDeliveryRoute();
});

async function handleQuickSim() {
  if (!delivery.value) return;
  if (isSimulatingRoute.value) {
    stopSimulatedRoute();
    scheduleRender();
    return;
  }
  await startQuickDeliverySimulation(delivery.value);
  scheduleRender();
  if (isNavigating.value) await renderMap();
}

onMounted(async () => {
  const resolved = await resolveDeliveryRoute();
  if (!resolved) return;
  deliverySnapshot.value = resolved;
  setActiveDeliveryForView(resolved.id);

  if (resolved.state === DELIVERY_STATE.E08) {
    timerSeconds.value = calculateRemainingSeconds();
    if (timerSeconds.value <= 0) {
      declineDeliveryTimeout(props.id);
      router.push('/deliveries');
      return;
    }
    timerInterval = setInterval(() => {
      timerSeconds.value = calculateRemainingSeconds();
      if (timerSeconds.value <= 0) {
        clearInterval(timerInterval);
        declineDeliveryTimeout(props.id);
        router.push('/deliveries');
      }
    }, 1000);
  } else if (!['E-08', 'E-13', 'E-14'].includes(resolved.state)) {
    void requestDeviceLocation({ force: true });
  }

  await nextTick();
  if (!routeMapEl.value || !delivery.value) return;

  requestMapGps();
  if (!['E-13', 'E-14'].includes(delivery.value.state) && !isPaused()) {
    restartGpsTracking();
  }

  if (delivery.value?.orderDocumentId) {
    joinedOrderRoom = delivery.value.orderDocumentId;
    joinOrderRoom(joinedOrderRoom);
  }

  const p = delivery.value.pickup;
  const gps = courierGpsForMap();
  const center = gps ? [gps.lng, gps.lat] : [p.lng, p.lat];
  initMap(routeMapEl.value, center);

  if (isSimulatingDelivery(props.id)) {
    nextTick(() => scheduleRender());
  }
});

watch(() => delivery.value?.orderDocumentId, (room) => {
  if (room && room !== joinedOrderRoom) {
    joinedOrderRoom = room;
    joinOrderRoom(room);
  }
});

watch(
  () => [delivery.value?.state, delivery.value?.pickup?.lat, delivery.value?.destination?.lat],
  (cur, prev) => {
    const stateChanged = cur?.[0] !== prev?.[0];
    if (isNavigating.value && stateChanged) {
      void renderMap();
      return;
    }
    if (!isNavigating.value) scheduleRender();
  },
);

watch(() => store.gpsCoords, () => {
  const raw = getRawGps();
  if (raw) onGpsTick(raw);
  else if (!isNavigating.value) scheduleRender();
}, { deep: true });

watch(isSimulatingRoute, (sim) => {
  nextTick(() => resizeMap());
  if (!sim) refreshDeviceGps();
});

watch(isNavigating, () => {
  nextTick(() => resizeMap());
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  destroyMap();
});

const loadingCTA = ref(false);

async function handleAccept() {
  if (timerInterval) clearInterval(timerInterval);
  if (loadingCTA.value) return;
  loadingCTA.value = true;
  try {
    await acceptDelivery(props.id);
    void requestDeviceLocation({ force: true });
  } finally {
    loadingCTA.value = false;
  }
}

async function handleCTA() {
  if (!delivery.value || loadingCTA.value) return;
  loadingCTA.value = true;
  try {
    if (delivery.value.state === DELIVERY_STATE.E12) {
      router.push(`/confirm/${props.id}`);
      return;
    }
    await advanceDeliveryState(props.id);
  } finally {
    loadingCTA.value = false;
  }
}

const showImpossible = ref(false);
const impossibleReason = ref('');

async function handleImpossible() {
  if (!impossibleReason.value.trim()) return;
  await markDeliveryImpossible(props.id, impossibleReason.value, null);
  showImpossible.value = false;
  router.push('/deliveries');
}

</script>

<style scoped>
.logo-mini { width: 36px; height: 34px; border-radius: 14px; object-fit: cover; }
.header-title { font-family: var(--ge-font-display); font-size: 14px; font-weight: 700; color: #111827; }

/* Header Lock */
.header-lock {
  position: absolute;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fef2f2;
  padding: 4px 8px;
  border-radius: var(--ge-radius-full);
  border: 0.72px solid #fee2e2;
}
.header-lock-label {
  font-size: 10px;
  font-weight: 700;
  color: #ef4444;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Order banner */
.order-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: #fff; border-bottom: 0.72px solid #e5e7eb;
}
.ob-back { background: none; border: none; cursor: pointer; padding: 4px; display: flex; }
.ob-info { flex: 1; }
.ob-top-row { display: flex; align-items: center; gap: 8px; }
.ob-id { font-family: var(--ge-font-display); font-size: 16px; font-weight: 700; color: #111827; }
.badge-urgent {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; background: #fef2f2;
  border-radius: var(--ge-radius-full);
  font-size: 10px; font-weight: 600; color: #ef4444;
}
.badge-normal {
  padding: 2px 8px; background: #fffbeb;
  border-radius: var(--ge-radius-full);
  font-size: 10px; font-weight: 600; color: #f59e0b;
}
.ob-state { font-size: 12px; color: #6b7280; }
.ob-price { font-family: var(--ge-font-display); font-size: 16px; font-weight: 700; color: #1b8a4a; }

/* Stepper card */
.stepper-card {
  margin: 12px 16px 0;
  padding: 12px 8px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
}

/* Map */
.map-card {
  margin: 12px 16px;
  border-radius: 16px;
  overflow: hidden;
  border: 0.72px solid #e5e7eb;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.map-card-head {
  padding: 10px 12px 0;
}
.map-card-head .map-state-badge {
  position: static;
  box-shadow: none;
}
.map-viewport {
  position: relative;
  margin: 8px 12px 0;
  border-radius: 12px;
  overflow: hidden;
  border: 0.72px solid #e5e7eb;
}
.map-card-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 12px;
}
.route-map {
  height: 220px;
  background: var(--ge-page);
  overflow: hidden;
}
.map-zoom-stack {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
.page-navigating .page-header { display: none; }
.page-navigating .page-body { padding: 0; }
.map-card.fullscreen-map .map-viewport {
  margin: 0;
  flex: 1;
  border: none;
  border-radius: 0;
}
.map-card.fullscreen-map .route-map.fullscreen-view {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
}
:deep(.mapboxgl-canvas) { outline: none; }
:deep(.mapboxgl-ctrl-top-left),
:deep(.mapboxgl-ctrl-top-right),
:deep(.mapboxgl-ctrl-bottom-left) {
  display: none !important;
}
:deep(.mapboxgl-marker) { z-index: 20; pointer-events: none; }
:deep(.ge-map-marker-icon--store),
:deep(.ge-map-marker-icon--home) { z-index: 25; }
:deep(.ge-map-marker-icon--courier) { z-index: 30; }
:deep(.ge-nav-arrow-marker) { z-index: 50; }
:deep(.mapboxgl-marker svg) { display: none; }
:deep(.ge-nav-arrow-marker svg) { display: block !important; }
:deep(.ge-map-marker-icon) {
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
  pointer-events: none;
  background: none !important;
}
:deep(.ge-map-marker-img) {
  display: block !important;
  width: 100%;
  height: 100%;
}

/* Fullscreen mode map card */
.map-card.fullscreen-map {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  margin: 0; border: none; border-radius: 0; z-index: 9999;
  width: 100%;
  height: 100%;
  height: 100dvh;
}

/* Painel Navegação — estilo turn-by-turn (escuro) */
.painel-navegacao {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 14px 20px;
  z-index: 100;
}
.nav-fab-recenter {
  pointer-events: auto;
  position: absolute;
  top: 12px;
  right: 14px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  z-index: 2;
}
.nav-hud-top {
  pointer-events: auto;
  margin-top: 48px;
  max-width: 100%;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}
.nav-hud-wait { flex-direction: column; align-items: flex-start; gap: 6px; }
.nav-turn-text { flex: 1; min-width: 0; }
.nav-turn-text p { margin: 0; }
.nav-distance-primary {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.nav-street-name {
  font-size: 15px;
  font-weight: 500;
  color: #cbd5e1;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-phase-badge {
  pointer-events: none;
  margin: 8px 0 0;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.85);
  color: #eff6ff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.nav-street-pill {
  pointer-events: none;
  align-self: flex-end;
  margin-bottom: auto;
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-hud-bottom {
  pointer-events: auto;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.4);
}
.nav-trip-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 8px;
  min-width: 0;
}
.nav-trip-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.nav-trip-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}
.nav-eta-time {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}
.nav-trip-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}
.nav-phase {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #93c5fd;
}
.nav-wait-gps {
  margin: 0;
  font-size: 13px;
  color: #cbd5e1;
}
.nav-btn-close-round {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #dc2626;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
}
.map-nav-cta {
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: #1b8a4a;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(27, 138, 74, 0.35);
}
.map-sim-subtle {
  margin-top: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.map-sim-subtle--active {
  color: #2563eb;
  font-weight: 600;
}
.map-sim-hint--below-cta {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.35;
  color: #9ca3af;
  text-align: left;
}
.map-sim-hint {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.35;
  color: #6b7280;
  max-width: 220px;
}
.map-sim-hint--inline {
  margin: 0;
  flex: 1 1 100%;
}
.map-controls {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1200;
}
.map-controls--nav {
  bottom: 100px;
}
.map-sim-btn {
  width: auto;
  min-width: 32px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.92);
}
.map-sim-btn--active {
  background: #2563eb;
  color: #fff;
  border-color: #1d4ed8;
  font-weight: 600;
}
.map-zoom {
  width: 32px; height: 32px;
  background: #fff; border: 0.72px solid #e5e7eb;
  border-radius: 8px; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #111827;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.map-state-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: var(--ge-radius-full);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.msb-icon { display: inline-flex; }
.msb-green { background: #22c55e; }
.msb-orange { background: #f59e0b; }

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  padding: 8px 10px;
  background: #f9fafb;
  border-radius: 10px;
  border: 0.72px solid #e5e7eb;
  font-size: 10px;
  color: #374151;
}
.ml-item { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.ml-pin-img {
  width: 18px;
  height: 22px;
  object-fit: contain;
  display: block;
}
.ml-line {
  width: 14px; height: 3px; border-radius: 2px; display: inline-block;
}
.ml-line-a { background: #38bdf8; }
.ml-line-b { background: #22c55e; }
.msb-blue { background: #3b82f6; }

/* Section cards */
.section-card {
  margin: 0 16px 12px;
  padding: 16px;
  background: #fff;
  border: 0.72px solid #e5e7eb;
  border-radius: 16px;
}
.section-label {
  font-family: var(--ge-font-display);
  font-size: 10px; font-weight: 600;
  color: #9ca3af; letter-spacing: 0.04em;
  display: block; margin-bottom: 10px;
}

/* Time log */
.time-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
}
.time-left { display: flex; align-items: center; gap: 8px; }
.time-dot {
  width: 20px; height: 20px;
  border-radius: 50%; background: #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.time-dot.done { background: #22c55e; }
.time-name { font-size: 13px; color: #6b7280; }
.time-name.time-done { color: #111827; font-weight: 500; }
.time-val { font-size: 13px; color: #111827; font-weight: 500; }

/* Client */
.client-card {
  display: flex; align-items: center; gap: 12px;
}
.client-avatar {
  width: 44px; height: 44px;
  background: #fffbeb;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.client-info { flex: 1; }
.client-name { font-size: 14px; font-weight: 600; color: #111827; display: block; }
.client-phone { font-size: 12px; color: #6b7280; }
.client-actions { display: flex; gap: 8px; }
.action-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  text-decoration: none;
  transition: background 0.15s;
  position: relative;
}
.chat-badge {
  position: absolute; top: -4px; right: -4px;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.action-chat { background: #f0fdf4; border: 0.72px solid #dcfce7; }
.action-call { background: #f0fdf4; border: 0.72px solid #dcfce7; }

/* Locations */
.loc-row { display: flex; align-items: flex-start; gap: 12px; }
.loc-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
.loc-dot-orange { background: #f59e0b; }
.loc-dot-green { background: #22c55e; }
.loc-connector {
  width: 2px; height: 16px;
  background: #e5e7eb;
  margin-left: 5px;
}
.loc-detail { display: flex; flex-direction: column; }
.loc-label { font-size: 10px; font-weight: 700; color: #f59e0b; letter-spacing: 0.04em; }
.loc-row:last-child .loc-label { color: #22c55e; }
.loc-name { font-size: 14px; font-weight: 600; color: #111827; }
.loc-address { font-size: 12px; color: #6b7280; }

/* Items */
.item-row {
  display: flex; align-items: center; gap: 12px;
  padding: 6px 0;
}
.item-icon {
  width: 40px; height: 40px;
  background: #f9fafb;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.item-info { display: flex; flex-direction: column; }
.item-name { font-size: 14px; font-weight: 600; color: #111827; }
.item-qty { font-size: 12px; color: #6b7280; }
.item-meta { font-size: 11px; color: #9ca3af; margin-top: 8px; }

/* Instructions */
.instructions-card { background: #fffbeb; border-color: #fde68a; }
.instr-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.instr-title { font-size: 13px; font-weight: 600; color: #92400e; }
.instr-text { font-size: 13px; color: #78350f; margin: 0; }

/* Doc link */
.doc-link-card { padding: 14px 16px; }
.doc-link-row {
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
}
.doc-link-text { flex: 1; font-size: 13px; color: #111827; }

/* CTA section */
.cta-section {
  padding: 0 16px 8px;
  display: flex; flex-direction: column; gap: 8px;
}
.cta-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 16px;
  font-family: var(--ge-font-display);
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center;
  justify-content: center; gap: 8px;
  cursor: pointer;
  transition: transform 0.1s;
  text-decoration: none;
  color: #fff;
}
.cta-btn:active { transform: scale(0.97); }
.cta-green {
  background: #1b8a4a;
  box-shadow: 0 8px 24px rgba(27,138,74,0.25);
}
.cta-amber {
  background: #f59e0b;
  box-shadow: 0 8px 24px rgba(245,158,11,0.3);
}


/* Impossible card */
.impossible-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 16px 12px;
  padding: 14px 14px 14px 14px;
  background: #fff5f5;
  border: 1px solid #fca5a5;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.impossible-card:active {
  background: #fee2e2;
  transform: scale(0.98);
}
.impossible-card-icon {
  flex-shrink: 0;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: #fee2e2;
  border-radius: 10px;
}
.impossible-card-text {
  flex: 1;
  display: flex; flex-direction: column; gap: 2px;
}
.impossible-card-title {
  font-size: 13px; font-weight: 700;
  color: #b91c1c;
}
.impossible-card-desc {
  font-size: 11px; font-weight: 400;
  color: #7f1d1d;
  line-height: 1.4;
}
.impossible-card-arrow {
  flex-shrink: 0;
  opacity: 0.7;
}

.impossible-hint {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.45;
  margin: 0 0 12px;
}

/* Timer */
.timer-banner {
  position: fixed; bottom: 56px; left: 50%; transform: translateX(-50%);
  width: calc(100% - 32px); max-width: 400px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: #fffbeb; border: 0.72px solid #fde68a;
  border-radius: 16px;
  font-size: 13px; color: #92400e;
  z-index: 50;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.timer-accept {
  padding: 8px 16px;
  background: #1b8a4a; color: #fff;
  border: none; border-radius: 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9998;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal-card {
  width: 100%; max-width: 360px;
  padding: 24px; background: #fff;
  border-radius: 16px;
}
.modal-card h3 { margin: 0 0 16px; font-family: var(--ge-font-display); font-size: 18px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 12px; color: #6b7280; font-weight: 500; }
.field-input {
  width: 100%; padding: 12px 16px;
  background: #f9fafb; border: 0.72px solid #e5e7eb;
  border-radius: 16px; font-size: 14px;
  outline: none; resize: vertical;
}
.modal-actions { display: flex; gap: 12px; margin-top: 16px; }
.btn-cancel {
  flex: 1; padding: 12px;
  background: #fff; border: 0.72px solid #e5e7eb;
  border-radius: 12px; font-size: 14px; font-weight: 600;
  cursor: pointer; color: #6b7280;
}
.btn-danger {
  flex: 1; padding: 12px;
  background: #ef4444; color: #fff;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}

/* Footer */
.app-footer { text-align: center; padding: 32px 28px; }
.footer-brand { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
.footer-g {
  width: 28px; height: 28px;
  background: #1b8a4a; color: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ge-font-display); font-size: 14px; font-weight: 700;
}
.footer-name { font-family: var(--ge-font-display); font-size: 14px; font-weight: 700; color: #111827; }
.footer-copy { font-size: 11px; color: #9ca3af; margin: 0; }

/* Chat Modal */
.chat-modal {
  display: flex; flex-direction: column;
  height: 80vh; max-height: 500px;
  padding: 0; overflow: hidden;
}
.chat-header {
  padding: 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;
  display: flex; align-items: center; justify-content: space-between;
}
.chat-header h3 { margin: 0; font-size: 16px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; line-height: 1; }
.chat-messages {
  flex: 1; padding: 16px; overflow-y: auto; background: #fff;
  display: flex; flex-direction: column; gap: 12px;
}
.chat-bubble { max-width: 85%; display: flex; flex-direction: column; gap: 2px; }
.chat-bubble.mine { align-self: flex-end; }
.chat-bubble.theirs { align-self: flex-start; }
.msg-sender { font-size: 10px; font-weight: 600; color: #9ca3af; }
.chat-bubble.mine .msg-sender { text-align: right; color: var(--ge-brand); }
.chat-bubble p {
  margin: 0; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4;
}
.chat-bubble.mine p { background: var(--ge-brand); color: #fff; border-bottom-right-radius: 4px; }
.chat-bubble.theirs p { background: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px; }
.msg-time { font-size: 9px; color: #9ca3af; }
.chat-bubble.mine .msg-time { text-align: right; }
.no-messages { flex: 1; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; }
.chat-input-area {
  padding: 12px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb;
  display: flex; gap: 8px; align-items: center;
}
.chat-input-area input {
  flex: 1; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 20px;
  font-family: var(--ge-font); font-size: 14px; outline: none;
}
.chat-input-area input:focus { border-color: var(--ge-brand); }
.btn-send-chat {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--ge-brand); color: #fff; border: none;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.btn-send-chat:disabled { background: #9ca3af; cursor: not-allowed; }
</style>
