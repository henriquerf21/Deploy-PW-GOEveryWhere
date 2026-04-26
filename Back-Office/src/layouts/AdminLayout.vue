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
        <a :href="`${frontOfficeUrl}/product`" class="bo-sidebar__back" target="_blank" rel="noopener noreferrer">← Ver site GoGummies</a>
        <button type="button" class="bo-sidebar__logout" @click="logout">Sair do painel</button>
      </div>
    </aside>

    <div class="bo-main">
      <div v-if="shellBusy" class="bo-busy" role="status" aria-live="polite" aria-busy="true">
        <div class="bo-busy__card">
          <div class="bo-busy__spinner" aria-hidden="true" />
          <div>
            <p class="bo-busy__title">A processar…</p>
            <p class="bo-busy__sub">A sincronizar com o Strapi. Aguarda um momento.</p>
          </div>
        </div>
      </div>


      <div class="bo-breadcrumb-bar">
        <h1 class="bo-page-title">{{ pageTitle }}</h1>
        <nav class="bo-breadcrumb" aria-label="Localização">
          <span>GoEverywhere</span>
          <ChevronRight :size="14" class="bo-breadcrumb__sep" />
          <span>Admin</span>
          <template v-if="breadcrumbParent">
            <ChevronRight :size="14" class="bo-breadcrumb__sep" />
            <RouterLink :to="breadcrumbParent.to" class="bo-breadcrumb__link">{{ breadcrumbParent.label }}</RouterLink>
          </template>
          <ChevronRight :size="14" class="bo-breadcrumb__sep" />
          <span class="bo-breadcrumb__current">{{ pageTitle }}</span>
        </nav>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clearBoSession, getSessionUser } from '../auth/session.js';
import { logistics, dismissAdminAlert, getOrderById, getCourierById, initLogistics } from '../stores/logisticsStore.js';
import { ORDER_STATUS, COURIER_STATE } from '../constants/logistics.js';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Bike,
  MapPinned,
  Users,
  BarChart3,
  Bell,
  MessageSquare,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const globalSearch = ref('');
const notifOpen = ref(false);
const msgOpen = ref(false);
const settingsOpen = ref(false);

const recentActivity = computed(() => logistics.activityLog.slice(0, 12));

function closeAllPopovers() {
  notifOpen.value = false;
  msgOpen.value = false;
  settingsOpen.value = false;
}

function toggleNotif() {
  const n = !notifOpen.value;
  closeAllPopovers();
  notifOpen.value = n;
}

function toggleMsg() {
  const n = !msgOpen.value;
  closeAllPopovers();
  msgOpen.value = n;
}

function toggleSettings() {
  const n = !settingsOpen.value;
  closeAllPopovers();
  settingsOpen.value = n;
}

watch(
  () => route.query.q,
  (q) => {
    globalSearch.value = typeof q === 'string' ? q : '';
  },
  { immediate: true }
);

watch(
  () => route.fullPath,
  () => closeAllPopovers()
);

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

const urgentAlerts = computed(() => logistics.adminAlerts);
const visibleUrgentAlerts = computed(() => urgentAlerts.value.slice(0, 4));
const hiddenAlertsCount = computed(() => Math.max(0, urgentAlerts.value.length - visibleUrgentAlerts.value.length));

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
  { name: 'reports', label: 'Relatórios', icon: BarChart3 },
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

function runGlobalSearch() {
  const q = globalSearch.value.trim();
  router.push({ name: 'orders', query: q ? { q } : {} });
}

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

const knownOrderIds = new Set();
const knownCourierIds = new Set();

onMounted(async () => {
  await initLogistics();

  logistics.orders.forEach(o => knownOrderIds.add(o.id));
  logistics.couriers.forEach(c => knownCourierIds.add(c.id));

  setInterval(async () => {
    await initLogistics({ force: true });
  }, 10000);
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
  display: block;
  margin-top: 10px;
  padding: 8px;
  font-size: 12px;
  color: var(--bo-sidebar-dim);
  text-decoration: none;
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

.bo-busy {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 120px 24px 24px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
}

.bo-busy__card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--bo-border);
  background: var(--bo-surface);
  box-shadow: var(--bo-shadow);
  max-width: 420px;
}

.bo-busy__title {
  margin: 0;
  font-weight: 800;
  font-size: 15px;
}

.bo-busy__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--bo-text-secondary);
  line-height: 1.4;
}

.bo-busy__spinner {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--bo-brand);
  animation: bo-spin 0.85s linear infinite;
}

@keyframes bo-spin {
  to {
    transform: rotate(360deg);
  }
}

.bo-urgent-bar {
  background: linear-gradient(90deg, #fef3c7, #fff7ed);
  border-bottom: 1px solid #fcd34d;
  padding: 10px 28px;
  max-height: 170px;
  overflow: hidden;
}

.bo-urgent-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #7c2d12;
}

.bo-urgent-more {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(146, 64, 14, 0.1);
  font-weight: 700;
  font-size: 11px;
}

.bo-urgent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 118px;
  overflow-y: auto;
  padding-right: 2px;
}

.bo-urgent-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #92400e;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(146, 64, 14, 0.18);
}

.bo-urgent-item:last-child {
  border-bottom: none;
}

.bo-urgent-x {
  border: none;
  background: rgba(0, 0, 0, 0.06);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.bo-urgent-x:hover {
  background: rgba(0, 0, 0, 0.1);
}

.bo-topbar {
  height: var(--bo-header-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 28px;
  background: var(--bo-surface);
  border-bottom: 1px solid var(--bo-border);
}

.bo-topbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bo-topbar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 12px;
  border-right: 1px solid var(--bo-border);
  margin-right: 4px;
}

.bo-topbar__avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bo-brand-soft);
  color: var(--bo-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.bo-topbar__name {
  font-size: 14px;
  font-weight: 600;
}

.bo-topbar__chev {
  color: var(--bo-text-secondary);
}

.bo-icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--bo-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bo-icon-btn:hover {
  background: var(--bo-page);
  color: var(--bo-text);
}

.bo-icon-btn.is-on {
  background: var(--bo-page);
  color: var(--bo-brand);
}

.bo-pop {
  position: relative;
}

.bo-pop--end .bo-pop__panel {
  left: auto;
  right: 0;
}

.bo-pop__panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 100;
  min-width: 280px;
  max-width: min(360px, 92vw);
  padding: 14px 16px;
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  border-radius: 12px;
  box-shadow: var(--bo-shadow);
}

.bo-pop__panel--wide {
  min-width: 320px;
  max-width: min(420px, 94vw);
}

.bo-pop__title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
}

.bo-pop__muted {
  margin: 0 0 10px;
  font-size: 13px;
  color: var(--bo-text-secondary);
  line-height: 1.45;
}

.bo-pop__list {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
}

.bo-pop__list--scroll {
  max-height: 260px;
}

.bo-pop__li {
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid var(--bo-border);
  line-height: 1.4;
}

.bo-pop__li--sm {
  font-size: 12px;
  color: var(--bo-text-secondary);
}

.bo-pop__time {
  display: inline-block;
  min-width: 42px;
  font-weight: 600;
  color: var(--bo-text);
  margin-right: 6px;
}

.bo-pop__link {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-brand);
  text-decoration: none;
}

.bo-pop__link:hover {
  text-decoration: underline;
}

.bo-topbar__search-wrap {
  flex: 1;
  max-width: 420px;
  margin: 0 auto;
  position: relative;
}

.bo-topbar__search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bo-text-secondary);
  pointer-events: none;
}

.bo-topbar__search {
  width: 100%;
  height: 42px;
  padding: 0 16px 0 44px;
  border: 1px solid var(--bo-border);
  border-radius: 10px;
  background: var(--bo-page);
  font-size: 14px;
}

.bo-topbar__search::placeholder {
  color: #9ca3af;
}

.bo-topbar__search:focus {
  outline: none;
  border-color: var(--bo-brand-mid);
  box-shadow: 0 0 0 3px rgba(27, 138, 74, 0.12);
}

.bo-breadcrumb-bar {
  padding: 20px 28px 12px;
  background: var(--bo-surface);
  border-bottom: 1px solid var(--bo-border);
}

.bo-page-title {
  margin: 0 0 8px;
  font-family: var(--bo-font-display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.bo-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--bo-text-secondary);
}

.bo-breadcrumb__sep {
  flex-shrink: 0;
  opacity: 0.5;
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

.bo-content {
  flex: 1;
  padding: 24px 28px 40px;
  overflow-x: auto;
}

.bo-content__inner {
  max-width: var(--bo-content-max);
  margin: 0 auto;
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
