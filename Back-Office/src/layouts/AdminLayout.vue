<template>
  <div class="bo-shell">
    <aside class="bo-sidebar" aria-label="Navegação principal">
      <div class="bo-sidebar__brand">
        <div class="bo-sidebar__logo" aria-hidden="true">G</div>
        <div class="bo-sidebar__brand-text">
          <span class="bo-sidebar__title">GoEverywhere</span>
          <span class="bo-sidebar__subtitle">Centro Logístico</span>
        </div>
      </div>
      <p class="bo-sidebar__section">Menu</p>
      <nav class="bo-sidebar__nav">
        <RouterLink
          v-for="item in nav"
          :key="item.name"
          :to="{ name: item.name }"
          class="bo-nav-link"
          :class="{ 'is-active': isActive(item) }"
        >
          <component :is="item.icon" class="bo-nav-link__icon" :size="20" stroke-width="2" />
          {{ item.label }}
          <span v-if="item.name === 'notifications' && (pendingOrdersCount > 0 || pendingCouriersCount > 0)" class="bo-nav-badge">
            {{ pendingOrdersCount }} | {{ pendingCouriersCount }}
          </span>
        </RouterLink>
      </nav>
      <div class="bo-sidebar__footer">
        <div class="bo-sidebar__user">
          <div class="bo-sidebar__avatar" aria-hidden="true">{{ userInitials }}</div>
          <div>
            <div class="bo-sidebar__user-name">{{ displayName }}</div>
            <div class="bo-sidebar__user-email">{{ displayEmail }}</div>
          </div>
          <ChevronDown class="bo-sidebar__chev" :size="18" />
        </div>
        <a :href="`${frontOfficeUrl}/product`" class="bo-sidebar__back" target="_blank" rel="noopener noreferrer"><ExternalLink :size="14" /> Ver site GoGummies</a>
        <button type="button" class="bo-sidebar__logout" @click="logout">Sair do painel</button>
      </div>
    </aside>

    <div class="bo-main">
      <Transition name="bo-loader-fade">
        <div v-if="shellBusy" class="bo-loader-overlay" role="status" aria-live="polite" aria-busy="true">
          <div class="bo-loader">
            <div class="bo-loader__ring" aria-hidden="true"></div>
            <img src="/media/brand/logo-goeverywhere.png" alt="GoEverywhere" class="bo-loader__logo" />
          </div>
        </div>
      </Transition>


      <div class="bo-breadcrumb-bar">
        <nav class="bo-breadcrumb" aria-label="Localização">
          <RouterLink :to="{ name: 'dashboard' }" class="bo-breadcrumb__home">GoEverywhere</RouterLink>
          <ChevronRight :size="13" class="bo-breadcrumb__sep" aria-hidden="true" />
          <span>Admin</span>
          <template v-if="breadcrumbParent">
            <ChevronRight :size="13" class="bo-breadcrumb__sep" aria-hidden="true" />
            <RouterLink :to="breadcrumbParent.to" class="bo-breadcrumb__link">{{ breadcrumbParent.label }}</RouterLink>
          </template>
          <ChevronRight :size="13" class="bo-breadcrumb__sep" aria-hidden="true" />
          <span class="bo-breadcrumb__current">{{ pageTitle }}</span>
        </nav>
        <div class="bo-page-status" :title="streamLabel">
          <span class="bo-status-dot" :class="{ 'is-busy': shellBusy, 'is-offline': realtimeStatus === 'offline' }" aria-hidden="true" />
          <span class="bo-status-label">{{ statusLabel }}</span>
        </div>
      </div>

      <main class="bo-content">
        <div class="bo-content__inner">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clearBoSession, getSessionUser } from '../auth/session.js';
import { logistics, getOrderById, getCourierById, initLogistics, handleRealtimeEvent } from '../stores/logisticsStore.js';
import { ORDER_STATUS, COURIER_STATE } from '../constants/logistics.js';
import { boOpenStream } from '../api/backofficeApi.js';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Bike,
  MapPinned,
  Users,
  Bell,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

function logout() {
  clearBoSession();
  router.push({ name: 'login' });
}

const sessionUser = computed(() => getSessionUser());

const displayName = computed(() => sessionUser.value?.name || 'Administrador');
const displayEmail = computed(() => sessionUser.value?.email || '—');

const userInitials = computed(() => {
  const n = displayName.value || '';
  const p = n.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
  return (n.slice(0, 2) || 'AD').toUpperCase();
});

const shellBusy = computed(() => !!logistics.loading || (logistics.busyCount || 0) > 0);

const frontOfficeUrl = import.meta.env.VITE_FRONT_OFFICE_URL || 'http://localhost:5173';

const nav = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { name: 'notifications', label: 'Notificações', icon: Bell },
  { name: 'products', label: 'Produtos', icon: Package },
  { name: 'orders', label: 'Pedidos', icon: ClipboardList },
  { name: 'couriers', label: 'Estafetas', icon: Bike },
  { name: 'map', label: 'Mapa', icon: MapPinned },
  { name: 'customers', label: 'Clientes', icon: Users },
];

const pageTitle = computed(() => {
  const n = route.name;
  if (n === 'order-detail' && route.params.id) {
    const o = getOrderById(route.params.id);
    return o ? `Pedido ${o.id}` : `Pedido ${route.params.id}`;
  }
  if (n === 'courier-detail' && route.params.id) {
    const c = getCourierById(route.params.id);
    return c ? c.name : 'Estafeta';
  }
  if (n === 'couriers-new') return 'Novo estafeta';
  return route.meta.title || 'Dashboard';
});

const breadcrumbParent = computed(() => {
  const n = route.name;
  if (n === 'order-detail') return { label: 'Pedidos', to: { name: 'orders' } };
  if (n === 'courier-detail' || n === 'couriers-new') return { label: 'Estafetas', to: { name: 'couriers' } };
  return null;
});

function isActive(item) {
  if (item.name === 'couriers') {
    return ['couriers', 'couriers-new', 'courier-detail'].includes(String(route.name));
  }
  if (item.name === 'orders') {
    return route.name === 'orders' || route.name === 'order-detail';
  }
  return route.name === item.name;
}

const pendingOrdersCount = computed(() => {
  return logistics.orders.filter(o => o.status === ORDER_STATUS.PENDING).length;
});
const pendingCouriersCount = computed(() => {
  return logistics.couriers.filter(c => c.state === COURIER_STATE.E01 || c.courier_status === 'E-01 Pendente Verificação').length;
});

const statusLabel = computed(() => {
  if (shellBusy.value) return 'A sincronizar com o Strapi…';
  if (realtimeStatus.value === 'live') return 'Operacional · em tempo real';
  if (realtimeStatus.value === 'connecting') return 'A ligar ao stream…';
  return 'Modo fallback (polling 60s)';
});

const streamLabel = computed(() => {
  if (realtimeStatus.value === 'live') return 'SSE ligado — eventos do Strapi em tempo real.';
  if (realtimeStatus.value === 'connecting') return 'A negociar a ligação SSE…';
  return 'Sem ligação SSE — a fazer fallback de polling a cada 60s.';
});

// Real-time updates via SSE com fallback para polling longo (60s) caso o
// stream esteja indisponível ou se desligue. O polling original a cada 10s
// foi substituído porque é caro em volumes maiores.
const realtimeStatus = ref('connecting'); // 'connecting' | 'live' | 'offline'
let eventSource = null;
let fallbackPollHandle = null;
let refreshDebounce = null;

function scheduleRefresh() {
  if (refreshDebounce) clearTimeout(refreshDebounce);
  refreshDebounce = setTimeout(async () => {
    refreshDebounce = null;
    try {
      await initLogistics({ force: true });
    } catch (err) {
      // ignore — SSE may have raced with a transient backend hiccup
      void err;
    }
  }, 350);
}

function startFallbackPolling() {
  if (fallbackPollHandle) return;
  fallbackPollHandle = setInterval(() => {
    initLogistics({ force: true }).catch(() => {});
  }, 60000);
}

function stopFallbackPolling() {
  if (fallbackPollHandle) {
    clearInterval(fallbackPollHandle);
    fallbackPollHandle = null;
  }
}

function connectStream() {
  try {
    eventSource = boOpenStream();
  } catch {
    realtimeStatus.value = 'offline';
    startFallbackPolling();
    return;
  }
  eventSource.addEventListener('hello', () => {
    realtimeStatus.value = 'live';
    stopFallbackPolling();
  });
  eventSource.addEventListener('change', (e) => {
    realtimeStatus.value = 'live';
    try {
      const payload = JSON.parse(e.data);
      if (payload && payload.entity) {
        handleRealtimeEvent({
          model: payload.entity,
          room: payload.id
        });
      } else {
        scheduleRefresh();
      }
    } catch {
      scheduleRefresh();
    }
  });
  eventSource.onerror = () => {
    // EventSource auto-reconecta — apenas marcamos offline e ligamos fallback.
    realtimeStatus.value = 'offline';
    startFallbackPolling();
  };
  eventSource.onopen = () => {
    realtimeStatus.value = 'live';
    stopFallbackPolling();
  };
}

onMounted(async () => {
  await initLogistics();
  if (typeof window !== 'undefined' && typeof window.EventSource === 'function') {
    connectStream();
  } else {
    realtimeStatus.value = 'offline';
    startFallbackPolling();
  }
});

onBeforeUnmount(() => {
  if (refreshDebounce) clearTimeout(refreshDebounce);
  if (eventSource) {
    try { eventSource.close(); } catch { /* ignore */ }
    eventSource = null;
  }
  stopFallbackPolling();
});
</script>

<style scoped>
.bo-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bo-page);
}

.bo-sidebar {
  width: var(--bo-sidebar-w);
  flex-shrink: 0;
  background: var(--bo-sidebar);
  color: #fff;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  border-right: 1px solid var(--bo-sidebar-border);
}

.bo-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 22px;
  border-bottom: 1px solid var(--bo-sidebar-border);
}

.bo-sidebar__logo {
  width: 32px;
  height: 32px;
  border-radius: var(--bo-radius-sm);
  background: var(--bo-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--bo-font-display);
  font-weight: 800;
  font-size: 13px;
}

.bo-sidebar__brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.bo-sidebar__title {
  font-family: var(--bo-font-display);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.bo-sidebar__subtitle {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bo-sidebar-dim);
}

.bo-sidebar__section {
  margin: 0;
  padding: 22px 22px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--bo-menu-label);
}

.bo-sidebar__nav {
  flex: 1;
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.bo-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--bo-sidebar-muted);
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.bo-nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.bo-nav-link.is-active {
  color: #fff;
  background: rgba(27, 138, 74, 0.35);
  box-shadow: inset 0 0 0 1px rgba(110, 231, 183, 0.2);
}

.bo-nav-badge {
  margin-left: auto;
  background: var(--bo-brand);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.bo-nav-link__icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.bo-sidebar__footer {
  padding: 16px 14px 20px;
  border-top: 1px solid var(--bo-sidebar-border);
}

.bo-sidebar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: var(--bo-radius-sm);
}

.bo-sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.bo-sidebar__user-name {
  font-size: 13px;
  font-weight: 600;
}

.bo-sidebar__user-email {
  font-size: 11px;
  color: var(--bo-sidebar-dim);
}

.bo-sidebar__chev {
  margin-left: auto;
  opacity: 0.5;
}

.bo-sidebar__back {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 8px;
  font-size: 12px;
  color: var(--bo-sidebar-dim);
  text-decoration: none;
  transition: color var(--bo-transition-fast);
}

.bo-sidebar__back:hover {
  color: #fff;
}

.bo-sidebar__logout {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 8px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--bo-sidebar-dim);
  text-align: left;
}

.bo-sidebar__logout:hover {
  color: #fca5a5;
}

.bo-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── Custom Loader ─────────────────────────────────────────── */
.bo-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 246, 250, 0.88);
  backdrop-filter: blur(6px);
}

.bo-loader {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
}

.bo-loader__logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 14px;
  position: relative;
  z-index: 2;
  animation: bo-logo-breathe 2s ease-in-out infinite;
}

.bo-loader__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(27, 138, 74, 0.12);
  border-top-color: var(--bo-brand);
  border-right-color: var(--bo-brand);
  animation: bo-ring-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.bo-loader__ring::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(27, 138, 74, 0.15);
  animation: bo-ring-spin 2.4s cubic-bezier(0.5, 0, 0.5, 1) infinite reverse;
}

@keyframes bo-ring-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bo-logo-breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(0.92); opacity: 0.7; }
}

/* Transition classes for the loader */
.bo-loader-fade-enter-active {
  transition: opacity 0.3s ease;
}
.bo-loader-fade-leave-active {
  transition: opacity 0.5s ease;
}
.bo-loader-fade-enter-from,
.bo-loader-fade-leave-to {
  opacity: 0;
}

.bo-breadcrumb-bar {
  padding: 14px 28px;
  background: var(--bo-surface);
  border-bottom: 1px solid var(--bo-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.bo-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--bo-text-secondary);
}

.bo-breadcrumb__home {
  color: var(--bo-text-secondary);
  font-weight: 500;
  text-decoration: none;
}

.bo-breadcrumb__home:hover { color: var(--bo-brand); }

.bo-breadcrumb__sep {
  flex-shrink: 0;
  opacity: 0.45;
}

.bo-breadcrumb__link {
  color: var(--bo-text-secondary);
  text-decoration: none;
  font-weight: 500;
}

.bo-breadcrumb__link:hover {
  color: var(--bo-brand);
}

.bo-breadcrumb__current {
  color: var(--bo-text);
  font-weight: 600;
}

.bo-page-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  font-size: 12px;
  color: var(--bo-text-secondary);
  font-weight: 600;
}

.bo-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bo-success);
  position: relative;
}

.bo-status-dot::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1px solid var(--bo-success);
  opacity: 0.4;
}

.bo-status-dot.is-busy {
  background: var(--bo-warning);
}

.bo-status-dot.is-busy::before {
  border-color: var(--bo-warning);
  animation: bo-pulse 1.4s ease-out infinite;
}

.bo-status-dot.is-offline {
  background: var(--bo-text-secondary, #94a3b8);
}

.bo-status-dot.is-offline::before {
  border-color: var(--bo-text-secondary, #94a3b8);
  opacity: 0.3;
}

@keyframes bo-pulse {
  0% { transform: scale(0.85); opacity: 0.7; }
  100% { transform: scale(1.6); opacity: 0; }
}

.bo-content {
  flex: 1;
  padding: 12px 16px 32px;
  overflow-x: auto;
}

.bo-content__inner {
  width: 100%;
}

@media (max-width: 960px) {
  .bo-shell {
    flex-direction: column;
  }

  .bo-sidebar {
    width: 100%;
    min-height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    padding-bottom: 8px;
  }

  .bo-sidebar__section {
    display: none;
  }

  .bo-sidebar__nav {
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    padding: 8px 14px;
  }

  .bo-sidebar__footer {
    width: 100%;
  }

  .bo-topbar__search-wrap {
    display: none;
  }
}
</style>
