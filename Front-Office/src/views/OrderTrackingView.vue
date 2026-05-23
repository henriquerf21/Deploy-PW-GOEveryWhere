<template>
  <div class="page-wrapper cf-checkout">
    <SiteHeader />

    <main class="cf-checkout-main tracking-main">
      <header class="track-head">
        <p class="cf-checkout-kicker">Em tempo real</p>
        <h1 class="cf-checkout-title">Acompanhamento</h1>
      </header>

      <div class="cf-tabs" role="tablist">
        <span class="cf-tab is-active" role="tab" aria-selected="true">Encomenda ativa</span>
        <router-link to="/order/history" class="cf-tab" role="tab">Histórico</router-link>
      </div>

      <div v-if="order" class="tracking-layout">
        <div v-if="isImpossibleReview" class="impossible-review-banner" role="status">
          <strong>Incidente antes da recolha</strong>
          <p>O estafeta reportou um problema. A nossa equipa está a analisar e pode atribuir outro estafeta — não precisas de fazer nada por agora.</p>
        </div>
        <div class="map-card">
          <div class="map-leaflet-host">
            <DeliveryRouteMap
              v-if="trackingMapCoords"
              :key="order.id"
              :store-lat="trackingMapCoords.storeLat"
              :store-lng="trackingMapCoords.storeLng"
              :dest-lat="trackingMapCoords.destLat"
              :dest-lng="trackingMapCoords.destLng"
              :courier-lat="courierGps.lat"
              :courier-lng="courierGps.lng"
              :courier-progress="mapCourierProgress"
              height="300px"
            />
          </div>
          <div class="eta-bar">
            <span class="transit-badge" :style="{ background: currentStateData?.color + '18', color: currentStateData?.color }">
              {{ currentStateData?.label }}
            </span>
            <div v-if="dynamicEta > 0 && isInTransitPhase" class="eta-info">
              <span class="eta-label">ETA</span>
              <span class="eta-time">~{{ dynamicEta }} min</span>
            </div>
          </div>
        </div>

        <div class="details-card">
          <div class="order-header">
            <h3>Encomenda {{ order.orderId || '#' + order.id }}</h3>
            <div class="order-items-list">
              <span v-for="item in order.products" :key="item.name" class="order-items">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981" style="margin-right:8px"><circle cx="12" cy="12" r="8"/></svg>
                {{ item.qty }}x {{ item.name }}
              </span>
            </div>
          </div>

          <div class="timeline">
            <div v-for="step in timelineSteps" :key="step.state" 
                 class="timeline-step" :class="{ done: step.done, active: step.active, skipped: step.skipped }">
              <div class="timeline-dot">
                <svg v-if="step.done" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <svg v-else-if="step.skipped" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="3">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span class="timeline-label" :class="{ 'label-skipped': step.skipped }">{{ step.label }}</span>
            </div>
          </div>

          <!-- Courier info card (visible from S-05 Aprovada onwards) -->
          <div v-if="courierInfo && showCourierCard" class="courier-card">
            <span class="courier-card-label">ESTAFETA ATRIBUÍDO</span>
            <div class="courier-card-body">
              <div class="courier-avatar-wrap">
                <img v-if="courierInfo.photoUrl" :src="courierInfo.photoUrl" alt="Foto do estafeta" class="courier-avatar-img" />
                <div v-else class="driver-avatar">{{ courierInfo.initials }}</div>
              </div>
              <div class="courier-details">
                <span class="courier-name">{{ courierInfo.name }}</span>
                <span class="courier-vehicle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 3H8l-4 8h16l-4-8zM4 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-6"/></svg>
                  {{ courierInfo.vehicleType }} {{ courierInfo.vehicleBrand ? '— ' + courierInfo.vehicleBrand + ' ' + courierInfo.vehicleModel : '' }}
                </span>
                <span v-if="courierInfo.phone" class="courier-phone">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {{ courierInfo.phone }}
                </span>
                <span v-if="courierInfo.rating" class="courier-rating-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9"/></svg>
                  {{ courierInfo.rating }}
                </span>
              </div>
            </div>
            <button class="btn-chat-courier" @click="openChat = true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"></path></svg>
              Falar com o Estafeta
            </button>
          </div>

          <!-- S-03: Info Adicional Solicitada — Alerta + Resposta -->
          <div v-if="order.status === 'S-03'" class="s03-card">
            <div class="s03-header">
              <div class="s03-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div>
                <h4 class="s03-title">Informação Adicional Solicitada</h4>
                <p class="s03-subtitle">O administrador precisa de esclarecimentos sobre o teu pedido.</p>
              </div>
            </div>

            <div v-if="order.adminMessage" class="s03-message">
              <span class="s03-message-label">Mensagem do Admin:</span>
              <p class="s03-message-text">{{ order.adminMessage }}</p>
            </div>

            <div v-if="s03Sent" class="s03-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Resposta enviada com sucesso! O pedido voltou para análise.</span>
            </div>

            <div v-else class="s03-reply-form">
              <label for="s03-reply" class="s03-reply-label">A tua resposta</label>
              <textarea
                id="s03-reply"
                v-model="s03ReplyText"
                class="s03-textarea"
                placeholder="Explica o que o admin pediu (ex: confirmar morada, nº de porta, etc.)"
                rows="3"
              ></textarea>
              <div class="s03-reply-actions">
                <span class="s03-char-count" :class="{ 'min-reached': s03ReplyText.trim().length >= 3 }">
                  {{ s03ReplyText.trim().length }} / mín. 3 caracteres
                </span>
                <button
                  class="s03-btn-send"
                  :disabled="s03ReplyText.trim().length < 3 || s03Sending"
                  @click="submitS03Reply"
                >
                  {{ s03Sending ? 'A enviar...' : 'Enviar Resposta' }}
                </button>
              </div>
            </div>
          </div>

          <!-- S-14: Cancelado pelo Admin — Alerta com Motivo -->
          <!-- S-04: Rejeitado — Alerta com Motivo -->
          <div v-if="order.status === 'S-04'" class="s14-card s04-theme">
            <div class="s14-header">
              <div class="s14-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <h4 class="s14-title">Encomenda Rejeitada</h4>
                <p class="s14-subtitle">A tua encomenda não foi aceite pela operação.</p>
              </div>
            </div>

            <div v-if="order.rejectionReason" class="s14-reason">
              <span class="s14-reason-label">Motivo da Rejeição:</span>
              <p class="s14-reason-text">{{ order.rejectionReason }}</p>
            </div>

            <div class="s14-actions">
              <button @click="handleAcknowledgeAndGo('/order/select')" class="s14-btn-new">Tentar Nova Encomenda</button>
              <button @click="handleAcknowledgeAndGo('/order/history')" class="s14-btn-history">Ver no Histórico</button>
            </div>
          </div>

          <!-- S-14: Cancelado pelo Admin — Alerta com Motivo -->
          <div v-if="order.status === 'S-14'" class="s14-card">
            <div class="s14-header">
              <div class="s14-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <h4 class="s14-title">Encomenda Cancelada pela Operação</h4>
                <p class="s14-subtitle">A tua encomenda não pôde ser processada.</p>
              </div>
            </div>

            <div v-if="order.cancelReason" class="s14-reason">
              <span class="s14-reason-label">Motivo do Cancelamento:</span>
              <p class="s14-reason-text">{{ order.cancelReason }}</p>
            </div>

            <div class="s14-actions">
              <button @click="handleAcknowledgeAndGo('/order/select')" class="s14-btn-new">Tentar Nova Encomenda</button>
              <button @click="handleAcknowledgeAndGo('/order/history')" class="s14-btn-history">Ver no Histórico</button>
            </div>
          </div>

          <!-- Botão de cancelamento — só aparece nos estados S-01 a S-06 -->
          <div v-if="['S-01', 'S-02', 'S-03', 'S-05', 'S-06'].includes(order.status)" class="cancel-zone">
            <button class="btn-cancel-active" @click="openCancelModal(order)">
              Cancelar Pedido
            </button>
            <p class="cancel-hint">Podes cancelar enquanto o pedido não for aceite por um estafeta.</p>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h3>Sem encomenda ativa</h3>
        <p>Não tens nenhuma entrega a decorrer neste momento.</p>
        <router-link to="/order/select" class="btn-new-order">Fazer nova encomenda</router-link>
      </div>
    </main>
    <SiteFooter />

    <Transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Chat Modal -->
    <div v-if="openChat" class="modal-overlay">
      <div class="modal-card chat-modal">
        <div class="chat-header">
          <h3>Chat com {{ courierInfo?.name || 'Estafeta' }}</h3>
          <button @click="openChat = false" class="close-btn">&times;</button>
        </div>
        <div class="chat-messages" ref="chatContainer">
          <div v-for="msg in sortedChatMessages" :key="msg.id || `${msg.time}-${msg.sender}`" 
               class="chat-bubble" :class="{ 'mine': msg.sender === 'client', 'theirs': msg.sender === 'courier' }">
            <span class="msg-sender" v-if="msg.sender === 'courier'">{{ courierInfo?.name || 'Estafeta' }}</span>
            <span class="msg-sender" v-else>Tu</span>
            <p>{{ msg.text }}</p>
            <span class="msg-time">{{ new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
          </div>
          <div v-if="!(order.chatHistory?.length)" class="no-messages">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"></path></svg>
            <p>Ainda não existem mensagens.</p>
          </div>
        </div>
        <div class="chat-input-area">
          <input v-model="chatInput" @keyup.enter="handleSendChat" placeholder="Escreve uma mensagem..." />
          <button class="btn-send-chat" @click="handleSendChat" :disabled="!chatInput.trim() || sendingChat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Cancelamento (S-13) -->
    <div v-if="showCancelModal" class="modal-overlay">
      <div class="modal-card cancel-modal">
        <h3>Cancelar Encomenda</h3>
        <p>Indica o motivo do cancelamento obrigatório:</p>
        <textarea
          v-model="cancelReasonInput"
          placeholder="Ex: Enganei-me na morada ou nos itens..."
          class="cancel-textarea"
        ></textarea>
        <div class="modal-btns">
          <button @click="showCancelModal = false" class="btn-back">Voltar</button>
          <button
            @click="confirmOrderCancellation"
            :disabled="cancelReasonInput.trim().length < 5 || cancelling"
            class="btn-confirm-cancel"
          >
            {{ cancelling ? 'A cancelar encomenda...' : 'Confirmar Cancelamento' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Sucesso pós-cancelamento -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-card success-modal">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h3>Encomenda Cancelada</h3>
        <p>A tua encomenda foi cancelada com sucesso.</p>
        <div class="modal-btns success-btns">
          <button @click="goToHistory" class="btn-history">
            Ver Histórico
          </button>
          <button @click="goToNewOrder" class="btn-reorder">
            Encomendar Novamente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
import DeliveryRouteMap from '../components/DeliveryRouteMap.vue';
import { getDestinationLatLng } from '../utils/mapCoords.js';
import { CONTINENTE_STORES_STATIC } from '../data/continent-stores.js';
import { resolveStoreCoords } from '../utils/storeCoords.js';
import { CONTINENTE_STORES, fetchStores } from '../stores/orderStore.js';
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  useOrderStore, ORDER_STATES, getCourierDisplayName, resolveCourierFromOrder, fetchUserOrders,
  cancelActiveOrder, replyToInfoRequest, sendChatMessage, applyOrderChatMessage, socket, acknowledgeActiveOrder,
} from '../stores/orderStore.js';
import { sortChatHistory } from '../utils/chatHistory.js';
import { requestNotificationPermission, notifyOrderStateChange, sendNotification } from '../utils/notifications.js';
import { API_URL, BACKEND_URL } from '../config/env.js';
import authState from '../stores/authStore.js';

const router = useRouter();
const store = useOrderStore();

const order = computed(() => store.activeOrder);
const sortedChatMessages = computed(() => sortChatHistory(order.value?.chatHistory || []));
const toastMessage = ref('');
let pollingTimer = null;
let gpsPollTimer = null;
let currentOrderRoom = null;

watch(() => order.value?.courierGpsLat, () => syncCourierGpsFromOrder());
watch(() => order.value?.delivery, () => syncCourierGpsFromOrder(), { deep: true });

// ── GPS REAL DO ESTAFETA ────────────────────────────────────────────
const courierGps = reactive({ lat: null, lng: null });
const dynamicEta = ref(0);
let lastGpsSocketAt = 0;
const GPS_SOCKET_GUARD_MS = 15000;

const isInTransitPhase = computed(() => {
  if (!order.value) return false;
  return ['S-07', 'S-08', 'S-09', 'S-10'].includes(order.value.status);
});

/** Sem GPS real, não interpolar estafeta na linha (evita pin a meio do percurso) */
const mapCourierProgress = computed(() => {
  if (courierGps.lat != null && courierGps.lng != null) return 0;
  return -1;
});

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readGpsFromDeliveryEntity(delivery) {
  if (!delivery) return null;
  const attrs = delivery.attributes || delivery;
  const lat = Number(attrs.courierLatitude);
  const lng = Number(attrs.courierLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

function syncCourierGpsFromOrder() {
  if (Date.now() - lastGpsSocketAt < GPS_SOCKET_GUARD_MS) return;
  const o = order.value;
  if (!o) return;
  if (o.courierGpsLat != null && o.courierGpsLng != null) {
    updateGpsCoords(o.courierGpsLat, o.courierGpsLng);
    return;
  }
  const fromDelivery = readGpsFromDeliveryEntity(o.delivery);
  if (fromDelivery) updateGpsCoords(fromDelivery.lat, fromDelivery.lng);
}

async function fetchCourierGps() {
  if (!order.value?.documentId) return;
  if (Date.now() - lastGpsSocketAt < GPS_SOCKET_GUARD_MS && courierGps.lat != null) return;
  syncCourierGpsFromOrder();
  if (courierGps.lat != null && courierGps.lng != null) return;

  try {
    const params = new URLSearchParams({
      'filters[order][documentId][$eq]': order.value.documentId,
      'pagination[pageSize]': '1',
    });
    const headers = { 'Content-Type': 'application/json' };
    if (authState.token) headers.Authorization = `Bearer ${authState.token}`;
    const res = await fetch(`${API_URL}/deliveries?${params}`, { headers });
    if (!res.ok) return;
    const json = await res.json();
    const row = json.data?.[0];
    const attrs = row?.attributes || row || {};
    updateGpsCoords(Number(attrs.courierLatitude), Number(attrs.courierLongitude));
  } catch {
    /* sem GPS — mapa mostra só loja, cliente e rota */
  }
}

function updateGpsCoords(lat, lng) {
  const coords = trackingMapCoords.value;
  if (!coords || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return;
  }
  courierGps.lat = lat;
  courierGps.lng = lng;
  const distKm = haversineKm(lat, lng, coords.destLat, coords.destLng);
  dynamicEta.value = Math.max(1, Math.round(5 + distKm * 2.5));
}

function handleAcknowledgeAndGo(path) {
  acknowledgeActiveOrder();
  router.push(path);
}

async function refreshOrderAndCourierData({ silent = true } = {}) {
  const previousStatus = order.value?.status;
  await fetchUserOrders({ silent });
  if (order.value?.status && previousStatus && order.value.status !== previousStatus) {
    showStateToast(order.value.status);
    notifyOrderStateChange(order.value.id, order.value.status, ORDER_STATES[order.value.status]);
  }
  if (order.value) {
    fetchCourierInfo();
    if (isInTransitPhase.value) syncCourierGpsFromOrder();
  }
}

// --- Chat ---
const openChat = ref(false);
const chatInput = ref('');
const sendingChat = ref(false);
const chatContainer = ref(null);

async function handleSendChat() {
  if (!chatInput.value.trim() || sendingChat.value) return;
  sendingChat.value = true;
  const res = await sendChatMessage(order.value.documentId, chatInput.value.trim(), 'client');
  if (res.success) {
    chatInput.value = '';
    // scroll to bottom
    setTimeout(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    }, 100);
  }
  sendingChat.value = false;
}

watch(openChat, (val) => {
  if (val) {
    setTimeout(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    }, 100);
  }
});

// --- Cancelamento (S-13) ---
const showCancelModal = ref(false);
const orderToCancel = ref(null);
const cancelReasonInput = ref('');
const cancelling = ref(false);
const showSuccessModal = ref(false);

// --- S-03: Info Adicional Solicitada ---
const s03ReplyText = ref('');
const s03Sending = ref(false);
const s03Sent = ref(false);

watch(() => order.value?.status, (newStatus) => {
  if (newStatus === 'S-03') {
    s03Sent.value = false;
    s03ReplyText.value = '';
  }
});

// --- Courier info (visible from S-05 onwards) ---
const courierInfo = ref(null);
const deliveryStatusCode = ref(null);

function toStatusCode(status) {
  return String(status || '').substring(0, 4).toUpperCase();
}

const COURIER_CARD_ORDER_STATUSES = ['S-06', 'S-07', 'S-08', 'S-09', 'S-10', 'S-11', 'S-15', 'S-16'];

function hasAssignedCourier(orderLike) {
  const courier = resolveCourierFromOrder(orderLike);
  if (!courier) return false;
  return !!(getCourierDisplayName(courier) || courier.phone || courier.documentId || courier.id);
}

const showCourierCard = computed(() => {
  if (!order.value) return false;
  if (!COURIER_CARD_ORDER_STATUSES.includes(order.value.status)) return false;
  return hasAssignedCourier(order.value) || !!courierInfo.value;
});

function fetchCourierInfo() {
  if (!order.value) return;

  const deliveryData = order.value.delivery || null;
  const courierData = resolveCourierFromOrder(order.value);

  const rawDeliveryStatus = deliveryData?.delivery_status || null;
  deliveryStatusCode.value = toStatusCode(rawDeliveryStatus);

  const displayName = getCourierDisplayName(courierData);
  if (courierData && (displayName || courierData.phone || courierData.documentId || courierData.id)) {
    setCourierInfo(courierData, displayName || 'Estafeta');
  } else {
    courierInfo.value = null;
  }
}

function setCourierInfo(raw, displayName) {
  const selfie = raw.docSelfie?.data?.attributes || raw.docSelfie || null;
  let photoUrl = null;
  if (selfie?.url) {
    photoUrl = selfie.url.startsWith('http') ? selfie.url : `${BACKEND_URL}${selfie.url}`;
  }
  const name = displayName || getCourierDisplayName(raw) || 'Estafeta';
  const nameParts = name.split(/\s+/).filter(Boolean);
  const initials = nameParts.length >= 2 ? nameParts[0][0] + nameParts[nameParts.length - 1][0] : (nameParts[0]?.[0] || '?');
  courierInfo.value = {
    name,
    phone: raw.phone || '',
    vehicleType: raw.vehicleType || '',
    vehicleBrand: raw.vehicleBrand || '',
    vehicleModel: raw.vehicleModel || '',
    rating: raw.rating || null,
    photoUrl,
    initials,
  };
}

async function submitS03Reply() {
  if (!order.value || s03ReplyText.value.trim().length < 3) return;
  s03Sending.value = true;
  const result = await replyToInfoRequest(order.value.documentId, s03ReplyText.value.trim());
  if (result.success) {
    s03Sent.value = true;
    s03ReplyText.value = '';
    showStateToast('S-02');
  } else {
    alert(`Erro: ${result.error}`);
  }
  s03Sending.value = false;
}

function openCancelModal(o) {
  orderToCancel.value = o;
  cancelReasonInput.value = '';
  showCancelModal.value = true;
}

async function confirmOrderCancellation() {
  if (!orderToCancel.value || cancelReasonInput.value.trim().length < 5) return;
  cancelling.value = true;
  const result = await cancelActiveOrder(orderToCancel.value.documentId, cancelReasonInput.value);
  if (result.success) {
    showCancelModal.value = false;
    cancelReasonInput.value = '';
    showSuccessModal.value = true;
  } else {
    alert(`Erro: ${result.error}`);
  }
  cancelling.value = false;
}

function goToHistory() {
  showSuccessModal.value = false;
  router.push('/order/history');
}

function goToNewOrder() {
  showSuccessModal.value = false;
  router.push('/order/select');
}

// ── CICLO DE VIDA ──────────────────────────────────────────────────
onMounted(async () => {
  requestNotificationPermission();
  await fetchStores();
  await fetchUserOrders();
  // Atualiza estado de aceitação/estafeta através da Delivery.
  if (order.value) {
    fetchCourierInfo();
  }
  if (order.value && isInTransitPhase.value) {
    await fetchCourierGps();
  }

  // Ligar aos websockets para atualizações imediatas

  if (order.value?.documentId) {
    currentOrderRoom = order.value.documentId;
    socket.emit('join_room', currentOrderRoom);
  }

  socket.on('gps_update', (data) => {
    if (data.lat == null || data.lng == null) return;
    const room = order.value?.documentId != null ? String(order.value.documentId) : '';
    if (data.room != null && room && String(data.room) !== room) return;
    lastGpsSocketAt = Date.now();
    updateGpsCoords(Number(data.lat), Number(data.lng));
  });

  if (isInTransitPhase.value) {
    gpsPollTimer = setInterval(() => {
      if (order.value && isInTransitPhase.value) void fetchCourierGps();
    }, 5000);
  }

  socket.on('order_status_update', async (data) => {
    if (!order.value?.documentId || !data?.room) return;
    if (String(data.room) !== String(order.value.documentId)) return;
    if (data.status) {
      const code = String(data.status).substring(0, 4);
      if (ORDER_STATES[code]) {
        const prev = order.value.status;
        order.value.status = code;
        if (prev !== code) {
          showStateToast(code);
          notifyOrderStateChange(order.value.id, code, ORDER_STATES[code]);
        }
        fetchCourierInfo();
        return;
      }
    }
    await refreshOrderAndCourierData({ silent: true });
  });

  socket.on('global_order_status_update', async (data) => {
    if (!order.value?.documentId) return;
    const room = data?.room != null ? String(data.room) : '';
    if (room && room !== String(order.value.documentId)) return;
    if (data?.status) {
      const code = String(data.status).substring(0, 4);
      if (ORDER_STATES[code] && order.value.status !== code) {
        order.value.status = code;
        showStateToast(code);
        notifyOrderStateChange(order.value.id, code, ORDER_STATES[code]);
        void fetchCourierInfo();
        return;
      }
    }
    await refreshOrderAndCourierData({ silent: true });
  });

  socket.on('chat_message', (data) => {
    if (order.value && String(data.room) === String(order.value.documentId)) {
      applyOrderChatMessage(order.value, data);

      if (data.message?.sender === 'courier') {
        if (!openChat.value) {
          showStateToast('Nova mensagem do estafeta!');
          sendNotification('GoEverywhere — Nova mensagem', {
            body: String(data.message.text || '').slice(0, 160),
            tag: `chat-${order.value.documentId}`,
            onClick: () => { openChat.value = true; },
          });
        }
      }

      if (openChat.value) {
        setTimeout(() => {
          if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
          }
        }, 100);
      }
    }
  });

  pollingTimer = setInterval(async () => {
    if (order.value && !ORDER_STATES[order.value.status]?.terminal) {
      const oldStatus = order.value.status;
      await fetchUserOrders({ silent: true });
      if (order.value && order.value.status !== oldStatus) {
        showStateToast(order.value.status);
        notifyOrderStateChange(order.value.id, order.value.status, ORDER_STATES[order.value.status]);
      }
      if (order.value) fetchCourierInfo();
    }
  }, 60000);
});

onUnmounted(() => {
  clearInterval(pollingTimer);
  clearInterval(gpsPollTimer);
  socket.off('gps_update');
  socket.off('order_status_update');
  socket.off('global_order_status_update');
  if (currentOrderRoom) {
    socket.emit('leave_room', currentOrderRoom);
    currentOrderRoom = null;
  }
  // Mantém a ligação global, apenas sai da sala
});

// ── COMPUTED ────────────────────────────────────────────────────────
const isImpossibleReview = computed(() => {
  if (order.value?.status !== 'S-06') return false;
  const del = order.value.delivery;
  const raw = del?.delivery_status || del?.attributes?.delivery_status || '';
  return toStatusCode(raw) === 'E-14';
});

const currentStateData = computed(() => order.value ? ORDER_STATES[order.value.status] : null);

const routeProgress = computed(() => {
  if (!order.value) return 0;
  const flow = ['S-01','S-02','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const idx = flow.indexOf(order.value.status);
  return idx < 0 ? 0 : Math.min(100, (idx / (flow.length - 1)) * 100);
});

// --- Animação Fluida do Estafeta (RF08) ---
const displayProgress = ref(0);
let animationFrame = null;

watch(routeProgress, (newVal) => {
  const start = displayProgress.value;
  const end = newVal;
  
  if (start === end) return;
  
  // Se for o primeiro carregamento ou voltar ao início, salta diretamente sem animar desde o 0 de forma visível
  if (start === 0 && end > 0 && !animationFrame) {
    displayProgress.value = end;
    return;
  }
  
  const startTime = performance.now();
  const duration = 2500; // 2.5s de animação fluida para a nova posição
  
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  function animate(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);
    // easeInOutQuad
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    displayProgress.value = start + (end - start) * ease;
    
    if (t < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
  animationFrame = requestAnimationFrame(animate);
}, { immediate: true });

const trackingMapCoords = computed(() => {
  const o = order.value;
  if (!o) return null;

  const dc = o.deliveryCoords;
  let storeLat = null;
  let storeLng = null;
  let destLat = null;
  let destLng = null;

  if (dc?.storeLat != null && dc?.storeLng != null) {
    storeLat = Number(dc.storeLat);
    storeLng = Number(dc.storeLng);
  } else if (o.storeLatitude != null && o.storeLongitude != null) {
    storeLat = Number(o.storeLatitude);
    storeLng = Number(o.storeLongitude);
  } else {
    const catalog = CONTINENTE_STORES.length ? CONTINENTE_STORES : CONTINENTE_STORES_STATIC;
    const resolved = resolveStoreCoords(o.store, catalog);
    if (resolved) {
      storeLat = resolved.lat;
      storeLng = resolved.lng;
    }
  }

  if (dc?.destLat != null && dc?.destLng != null) {
    destLat = Number(dc.destLat);
    destLng = Number(dc.destLng);
  } else if (o.deliveryLatitude != null && o.deliveryLongitude != null) {
    destLat = Number(o.deliveryLatitude);
    destLng = Number(o.deliveryLongitude);
  }

  if (storeLat == null) return null;
  if (destLat == null) {
    const dest = getDestinationLatLng(o.delivery || {}, storeLat, storeLng);
    destLat = dest.lat;
    destLng = dest.lng;
  }

  return { storeLat, storeLng, destLat, destLng };
});

const timelineSteps = computed(() => {
  if (!order.value) return [];

  // S-03 só aparece como concluído se a encomenda realmente passou por Info Solicitada
  const s03WasTriggered = !!order.value.adminMessage;

  const flow = [
    { state: 'S-01', label: 'Pedido recebido, aguarda confirmação', optional: false },
    { state: 'S-02', label: 'Pedido em análise', optional: false },
    { state: 'S-03', label: 'Informação adicional solicitada', optional: true, triggered: s03WasTriggered },
    { state: 'S-05', label: 'Pedido aprovado', optional: false },
    { state: 'S-07', label: 'Estafeta atribuído', optional: false },
    { state: 'S-08', label: 'Estafeta na loja a recolher encomenda', optional: false },
    { state: 'S-09', label: 'Em trânsito para a tua morada', optional: false },
    { state: 'S-10', label: 'Estafeta chegou ao destino', optional: false },
    { state: 'S-11', label: 'Entrega concluída ✓', optional: false },
  ];
  const currentFlow = ['S-01','S-02','S-03','S-05','S-06','S-07','S-08','S-09','S-10','S-11'];
  const currentIdx = currentFlow.indexOf(order.value.status);

  return flow.map((step) => {
    const stepIdx = currentFlow.indexOf(step.state);
    const isPast = stepIdx < currentIdx && stepIdx !== -1;

    // Etapa opcional não acionada e já ultrapassada = skipped
    if (step.optional && !step.triggered && isPast) {
      return { ...step, done: false, active: false, skipped: true };
    }

    return {
      ...step,
      done: isPast,
      active: step.state === order.value.status,
      skipped: false,
    };
  });
});

// ── MÉTODOS ────────────────────────────────────────────────────────
function showStateToast(newState) {
  const data = ORDER_STATES[newState];
  if (data) {
    toastMessage.value = `Atualização: ${data.label}`;
    setTimeout(() => { toastMessage.value = ''; }, 3000);
  }
}

</script>


<style scoped>
.success-modal {
  text-align: center;
}

.success-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.success-btns {
  flex-direction: column;
  gap: 0.5rem;
}

.btn-history {
  background: var(--cf-card);
  color: var(--cf-muted);
  border: 1px solid var(--cf-line);
  padding: 0.75rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.btn-history:hover {
  background: var(--cf-surface);
}

.btn-reorder {
  background: var(--cf-cta);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.btn-reorder:hover {
  background: var(--cf-cta-hover);
}

.cancel-zone {
  margin-top: 2rem;
  text-align: center;
  padding: 1.5rem;
  border-top: 1px dashed var(--cf-line);
}

.btn-cancel-active {
  background: white;
  color: #ef4444;
  border: 1px solid #ef4444;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-active:hover {
  background: #fef2f2;
  transform: translateY(-2px);
}

.cancel-hint {
  font-size: 0.8rem;
  color: var(--cf-muted);
  margin-top: 0.5rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  padding: 1.75rem;
  max-width: 400px;
  width: 100%;
  border: 1px solid var(--cf-line);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
  text-align: center;
}

.modal-card h3 {
  font-family: var(--cf-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.modal-card p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 1.25rem;
}

.cancel-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin: 1rem 0;
  font-family: inherit;
  resize: none;
}

.modal-btns {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.btn-back {
  background: var(--cf-card);
  color: var(--cf-muted);
  border: 1px solid var(--cf-line);
  padding: 0.5rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-back:hover {
  background: var(--cf-surface);
}

.btn-confirm-cancel {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}




.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tracking-main {
  padding-bottom: 3rem;
}

.track-head {
  margin-bottom: 1.5rem;
  max-width: 36rem;
}

.impossible-review-banner {
  grid-column: 1 / -1;
  margin-bottom: 0.5rem;
  padding: 14px 16px;
  border-radius: var(--cf-radius-lg);
  border: 1px solid #fcd34d;
  background: #fffbeb;
  color: #92400e;
  font-size: 14px;
  line-height: 1.45;
}

.impossible-review-banner strong {
  display: block;
  margin-bottom: 4px;
}

.tracking-layout {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.map-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  overflow: hidden;
  border: 1px solid var(--cf-line);
  box-shadow: var(--cf-shadow);
}

.map-leaflet-host {
  min-height: 280px;
  position: relative;
}

.map-leaflet-host.in-transit {
  box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.35);
}

.map-leaflet-host.arrived {
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.35);
}

.eta-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--cf-line);
}

.eta-info {
  text-align: right;
}

.eta-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cf-muted);
}

.eta-time {
  display: block;
  font-family: var(--cf-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.transit-badge {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
}

.details-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  padding: 1.75rem;
  border: 1px solid var(--cf-line);
  box-shadow: var(--cf-shadow);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.order-header h2 {
  font-family: var(--cf-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.order-items {
  font-size: 0.8125rem;
  color: var(--cf-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.urgent-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--cf-warn-soft);
  color: var(--cf-warn);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.timeline {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
}

.timeline-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  position: relative;
  font-size: 0.875rem;
  color: var(--cf-muted);
}

.timeline-step.done {
  color: var(--cf-success);
  font-weight: 500;
}

.timeline-step.active {
  color: var(--cf-ink);
  font-weight: 600;
}

.timeline-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--cf-line);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.timeline-step.done .timeline-dot {
  background: var(--cf-success);
}

.timeline-step.active .timeline-dot {
  background: var(--cf-cta);
  box-shadow: 0 0 0 4px var(--cf-cta-soft);
}

.timeline-dot.empty {
  background: #e2e8f0;
}

.timeline-step.skipped .timeline-dot {
  background: #e2e8f0;
  border: 1.5px dashed #cbd5e1;
}

.timeline-step.skipped {
  color: #cbd5e1;
}

.label-skipped {
  text-decoration: line-through;
  color: #cbd5e1;
}

.timeline-content {
  display: flex;
  flex-direction: column;
}

.timeline-time {
  font-size: 0.6875rem;
  color: var(--cf-muted);
}

.timeline-connector {
  position: absolute;
  left: 12px;
  top: 36px;
  width: 2px;
  height: 20px;
  background: var(--cf-line);
}

.done-connector {
  background: var(--cf-success);
}

.driver-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #f8fafc;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.driver-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--cf-cta);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.driver-info {
  flex: 1;
  min-width: 0;
}

.driver-name {
  font-weight: 700;
  font-size: 0.9375rem;
}

.driver-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8125rem;
  color: var(--cf-muted);
}

.driver-transport {
  font-size: 0.75rem;
  color: var(--cf-muted);
}

.driver-actions {
  display: flex;
  gap: 8px;
}

.driver-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--cf-line);
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cf-ink);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.driver-btn:hover {
  border-color: var(--cf-cta);
  background: var(--cf-cta-soft);
  color: var(--cf-cta-hover);
}

.btn-cancel {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid var(--cf-danger);
  border-radius: var(--cf-radius);
  background: #fff;
  color: var(--cf-danger);
  font-family: var(--cf-font);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-cancel:hover {
  background: #fef2f2;
}

.delivered-section {
  margin-top: 0.5rem;
}

.delivered-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--cf-success);
  font-size: 0.9375rem;
}

.rate-section {
  text-align: center;
}

.rate-section p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 0.75rem;
}

.star-rating {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
}

.star-btn:focus-visible {
  outline: 2px solid var(--cf-cta);
  outline-offset: 2px;
}

.btn-rate-submit {
  background: var(--cf-cta);
  color: #fff;
  border: none;
  padding: 0.75rem 1.75rem;
  border-radius: var(--cf-radius);
  font-weight: 700;
  font-family: var(--cf-font);
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
  transition: background 0.2s ease;
}

.btn-rate-submit:hover:not(:disabled) {
  background: var(--cf-cta-hover);
}

.btn-rate-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.empty-state {
  max-width: 400px;
  margin: 4rem auto;
  text-align: center;
}

.empty-state h3 {
  font-family: var(--cf-display);
  font-size: 1.375rem;
  font-weight: 700;
  margin: 1rem 0 0.5rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.btn-new-order {
  display: block;
  background: var(--cf-cta);
  color: #fff;
  padding: 0.875rem 1.5rem;
  border-radius: var(--cf-radius);
  font-weight: 700;
  font-size: 0.9375rem;
  text-decoration: none;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28);
  transition: background 0.2s ease;
}

.btn-new-order:hover {
  background: var(--cf-cta-hover);
}

.btn-history-link {
  display: block;
  color: var(--cf-muted);
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
}

.btn-history-link:hover {
  color: var(--cf-cta);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-card {
  background: var(--cf-card);
  border-radius: var(--cf-radius-lg);
  padding: 1.75rem;
  max-width: 420px;
  width: 100%;
  border: 1px solid var(--cf-line);
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
}

.modal-card h3 {
  font-family: var(--cf-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.modal-card p {
  font-size: 0.875rem;
  color: var(--cf-muted);
  margin-bottom: 1rem;
  line-height: 1.45;
}

.modal-card .form-group {
  margin-bottom: 1rem;
}

.modal-card .form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.modal-card textarea {
  width: 100%;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  padding: 0.75rem;
  font-family: var(--cf-font);
  font-size: 0.875rem;
  min-height: 5rem;
  outline: none;
  resize: vertical;
}

.modal-card textarea:focus {
  border-color: var(--cf-danger);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-modal-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--cf-line);
  border-radius: var(--cf-radius);
  background: #fff;
  font-family: var(--cf-font);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-modal-cancel:hover {
  background: var(--cf-surface);
}

.btn-modal-confirm {
  padding: 0.5rem 1rem;
  background: var(--cf-danger);
  color: #fff;
  border: none;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-confirm:hover:not(:disabled) {
  filter: brightness(0.95);
}

.btn-modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-enter-active {
  animation: modalIn 0.25s ease;
}

.modal-leave-active {
  animation: modalOut 0.2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modalOut {
  to {
    opacity: 0;
  }
}

.toast-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #1e293b;
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  pointer-events: none;
}

.toast-enter-active {
  animation: toastIn 0.35s ease;
}

.toast-leave-active {
  animation: toastOut 0.25s ease;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastOut {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
}

@media (max-width: 768px) {
  .tracking-layout {
    grid-template-columns: 1fr;
  }
}

/* ══════════════════════════════════════════
   COURIER CARD
   ══════════════════════════════════════════ */
.courier-card {
  margin-top: 1.5rem;
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: var(--cf-radius-lg);
  padding: 1.25rem;
  animation: courierCardIn 0.4s ease;
}

@keyframes courierCardIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.courier-card-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #166534;
  margin-bottom: 0.85rem;
}

.courier-card-body {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.courier-avatar-wrap {
  flex-shrink: 0;
}

.courier-avatar-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2.5px solid #22c55e;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.courier-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.courier-name {
  font-family: var(--cf-display);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--cf-ink);
}

.courier-vehicle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  color: var(--cf-muted);
}

.courier-phone {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  color: #166534;
  font-weight: 500;
}

.courier-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8125rem;
  color: var(--cf-muted);
  font-weight: 600;
}

/* ══════════════════════════════════════════
   S-03: INFO ADICIONAL SOLICITADA
   ══════════════════════════════════════════ */
.s03-card {
  margin-top: 1.5rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: var(--cf-radius-lg);
  padding: 1.5rem;
  animation: s03FadeIn 0.4s ease;
}

@keyframes s03FadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.s03-header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.s03-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(249, 115, 22, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.s03-title {
  margin: 0;
  font-family: var(--cf-display);
  font-size: 1rem;
  font-weight: 700;
  color: #92400e;
}

.s03-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: #b45309;
  line-height: 1.4;
}

.s03-message {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.s03-message-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400e;
  margin-bottom: 0.4rem;
}

.s03-message-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #78350f;
  font-weight: 500;
}

.s03-success {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.28);
  border-radius: var(--cf-radius);
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
}

.s03-reply-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.s03-reply-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #92400e;
}

.s03-textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem 1rem;
  border: 1px solid #fde68a;
  border-radius: var(--cf-radius);
  background: #fff;
  font-family: var(--cf-font);
  font-size: 0.875rem;
  color: var(--cf-ink);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.s03-textarea:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
}

.s03-textarea::placeholder {
  color: #d97706;
  opacity: 0.6;
}

.s03-reply-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.s03-char-count {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 500;
}

.s03-char-count.min-reached {
  color: #059669;
}

.s03-btn-send {
  background: var(--cf-cta);
  color: #fff;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: var(--cf-radius);
  font-family: var(--cf-font);
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.25);
  transition: background 0.2s ease, opacity 0.2s ease;
}

.s03-btn-send:hover:not(:disabled) {
  background: var(--cf-cta-hover);
}

.s03-btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ══════════════════════════════════════════
   S-14: CANCELADO PELO ADMIN
   ══════════════════════════════════════════ */
.s14-card {
  margin-top: 1.5rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--cf-radius-lg);
  padding: 1.5rem;
  animation: s03FadeIn 0.4s ease;
}

.s14-header {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.s14-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.s14-title {
  margin: 0;
  font-family: var(--cf-display);
  font-size: 1rem;
  font-weight: 700;
  color: #991b1b;
}

.s14-subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: #b91c1c;
  line-height: 1.4;
}

.s14-reason {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: var(--cf-radius);
  padding: 1rem;
  margin-bottom: 1rem;
}

.s14-reason-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #991b1b;
  margin-bottom: 0.4rem;
}

.s14-reason-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #7f1d1d;
  font-weight: 500;
}

.s14-actions {
  display: flex;
  gap: 0.75rem;
}

.s14-btn-new, .s14-btn-history {
  flex: 1;
  text-align: center;
  padding: 0.65rem 1rem;
  border-radius: var(--cf-radius);
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
}

.s14-btn-new {
  background: var(--cf-cta);
  color: #fff;
}

.s14-btn-history {
  background: #fff;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

/* ------------------- Chat Modal & Button ------------------- */
.btn-chat-courier {
  width: 100%;
  margin-top: 12px;
  display: flex !important; 
  align-items: center; 
  justify-content: center;
  padding: 12px 16px;
  background: var(--go-primary) !important;
  color: #fff !important;
  border: none;
  border-radius: 12px;
  font-family: var(--go-font-display);
  font-size: 14px; 
  font-weight: 700;
  cursor: pointer;
  opacity: 1 !important;
  visibility: visible !important;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}
.btn-chat-courier:hover { 
  background: var(--go-primary-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
}

.chat-modal {
  display: flex; flex-direction: column;
  height: 80vh; max-height: 600px;
  padding: 0;
  overflow: hidden;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--go-line);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--go-surface-light);
}

.chat-header h3 {
  margin: 0; font-size: 16px; font-family: var(--go-font-display); font-weight: 600;
  color: var(--go-ink);
}

.close-btn {
  background: none; border: none; font-size: 24px; cursor: pointer; color: var(--go-muted);
  line-height: 1;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 16px;
  background: #fff;
}

.chat-bubble {
  max-width: 85%;
  display: flex; flex-direction: column; gap: 4px;
}

.chat-bubble.mine {
  align-self: flex-end;
}

.chat-bubble.theirs {
  align-self: flex-start;
}

.msg-sender {
  font-size: 11px; font-weight: 600; color: var(--go-subtle);
}
.chat-bubble.mine .msg-sender {
  text-align: right; color: var(--go-primary);
}

.chat-bubble p {
  margin: 0; padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px; line-height: 1.4;
}

.chat-bubble.mine p {
  background: var(--go-primary); color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-bubble.theirs p {
  background: var(--go-surface); color: var(--go-ink);
  border-bottom-left-radius: 4px;
}

.msg-time {
  font-size: 10px; color: var(--go-subtle);
}
.chat-bubble.mine .msg-time {
  text-align: right;
}

.no-messages {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--go-muted); text-align: center; font-size: 14px;
}
.no-messages svg { margin-bottom: 8px; }

.chat-input-area {
  padding: 16px;
  border-top: 1px solid var(--go-line);
  background: var(--go-surface-light);
  display: flex; align-items: center; gap: 12px;
}

.chat-input-area input {
  flex: 1; padding: 12px 16px;
  border: 1px solid var(--go-line); border-radius: 24px;
  font-family: var(--go-font-body); font-size: 14px;
  outline: none; transition: border-color 0.2s;
}
.chat-input-area input:focus { border-color: var(--go-primary); }

.btn-send-chat {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--go-primary); color: #fff;
  border: none; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.btn-send-chat:hover:not(:disabled) { background: var(--go-primary-hover); transform: scale(1.05); }
.btn-send-chat:disabled { background: var(--go-subtle); cursor: not-allowed; }

</style>
