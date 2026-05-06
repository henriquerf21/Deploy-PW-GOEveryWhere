<template>
  <div class="bo-page">
    <header class="bo-page-head">
      <div class="bo-page-head__main">
        <p class="bo-page-head__eyebrow">Mensagens operacionais</p>
        <h1 class="bo-page-head__title">Notificações</h1>
        <p class="bo-page-head__sub">
          Centro de tarefas pendentes: pedidos por aprovar do Front-Office e candidaturas de estafetas vindas da PWA.
        </p>
      </div>
      <div class="bo-page-head__actions">
        <span class="bo-badge" :class="frontOfficeAlerts.length ? 'bo-badge--warn' : 'bo-badge--neutral'">{{ frontOfficeAlerts.length }} pedidos</span>
        <span class="bo-badge" :class="pwaAlerts.length ? 'bo-badge--warn' : 'bo-badge--neutral'">{{ pwaAlerts.length }} candidaturas</span>
      </div>
    </header>

    <section class="bo-card">
      <header class="bo-card__head">
        <div class="bo-tabs" role="tablist" style="border-bottom: none; padding: 0;">
          <button type="button" class="bo-tab" :class="{ 'is-active': activeTab === 'front-office' }" role="tab" :aria-selected="activeTab === 'front-office'" @click="activeTab = 'front-office'">
            Pedidos · Front-Office
            <span class="bo-tab__counter">{{ frontOfficeAlerts.length }}</span>
          </button>
          <button type="button" class="bo-tab" :class="{ 'is-active': activeTab === 'pwa' }" role="tab" :aria-selected="activeTab === 'pwa'" @click="activeTab = 'pwa'">
            Estafetas · PWA
            <span class="bo-tab__counter">{{ pwaAlerts.length }}</span>
          </button>
          <button type="button" class="bo-tab" :class="{ 'is-active': activeTab === 'app' }" role="tab" :aria-selected="activeTab === 'app'" @click="activeTab = 'app'; loadAppNotifs()">
            App · Clientes
            <span class="bo-tab__counter">{{ appUnreadCount }}</span>
          </button>
        </div>
      </header>

      <div class="bo-card__body">
        <div v-if="activeTab === 'front-office'">
          <div v-if="!frontOfficeAlerts.length" class="bo-empty">
            <h3 class="bo-empty__title">Tudo em dia</h3>
            <p class="bo-empty__hint">Não há pedidos pendentes de aprovação.</p>
          </div>
          <div v-else class="bo-stack">
            <div v-if="urgentOrders.length">
              <h4 class="section-title">Urgentes</h4>
              <div class="bo-stack--sm">
                <article v-for="alert in urgentOrders" :key="alert.id" class="alert-card alert-card--danger">
                  <div class="alert-card__main">
                    <div class="bo-row" style="gap: 8px;">
                      <span class="bo-mono bo-muted">{{ alert.time }}</span>
                      <span class="bo-badge bo-badge--danger">Urgente</span>
                    </div>
                    <h5 class="alert-card__title">{{ alert.title }}</h5>
                    <p class="alert-card__msg">{{ alert.message }}</p>
                  </div>
                  <RouterLink :to="{ name: 'order-detail', params: { id: alert.id } }" class="bo-btn bo-btn--danger-solid">Tratar imediatamente</RouterLink>
                </article>
              </div>
            </div>

            <div v-if="normalOrders.length">
              <h4 class="section-title">Normais</h4>
              <div class="bo-stack--sm">
                <article v-for="alert in normalOrders" :key="alert.id" class="alert-card">
                  <div class="alert-card__main">
                    <div class="bo-row" style="gap: 8px;">
                      <span class="bo-mono bo-muted">{{ alert.time }}</span>
                      <span class="bo-badge bo-badge--info">Pedido</span>
                    </div>
                    <h5 class="alert-card__title">{{ alert.title }}</h5>
                    <p class="alert-card__msg">{{ alert.message }}</p>
                  </div>
                  <RouterLink :to="{ name: 'order-detail', params: { id: alert.id } }" class="bo-btn bo-btn--outline">Ver pedido</RouterLink>
                </article>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'app'">
          <div class="bo-row" style="margin-bottom: 14px; justify-content: flex-end;">
            <button type="button" class="bo-btn bo-btn--outline bo-btn--sm" @click="loadAppNotifs">Atualizar lista</button>
          </div>
          <div v-if="appNotifsLoading" class="bo-muted" style="font-size: 13px;">A carregar notificações…</div>
          <div v-else-if="!appNotifs.length" class="bo-empty">
            <h3 class="bo-empty__title">Sem notificações</h3>
            <p class="bo-empty__hint">Não há registos na coleção Notification do Strapi.</p>
          </div>
          <div v-else class="bo-stack--sm">
            <article
              v-for="n in appNotifs"
              :key="n.documentId"
              class="alert-card"
              :class="{ 'alert-card--muted': n.isRead }"
            >
              <div class="alert-card__main">
                <div class="bo-row" style="gap: 8px; flex-wrap: wrap;">
                  <span class="bo-mono bo-muted">{{ formatAppTime(n.sentAt) }}</span>
                  <span class="bo-badge bo-badge--info">{{ n.type || 'aviso' }}</span>
                  <span v-if="!n.isRead" class="bo-badge bo-badge--warn">Não lida</span>
                </div>
                <h5 class="alert-card__title">{{ n.userEmail || 'Cliente' }}</h5>
                <p class="alert-card__msg">{{ n.message }}</p>
              </div>
              <div class="alert-actions">
                <button
                  v-if="!n.isRead"
                  type="button"
                  class="action-btn"
                  @click="markAppRead(n.documentId)"
                >
                  Marcar lida
                </button>
              </div>
            </article>
          </div>
        </div>

        <div v-if="activeTab === 'pwa'">
          <div v-if="!pwaAlerts.length" class="bo-empty">
            <h3 class="bo-empty__title">Sem candidaturas</h3>
            <p class="bo-empty__hint">Não há novos registos de estafetas pendentes de verificação.</p>
          </div>
          <div v-else class="bo-stack--sm">
            <article v-for="alert in pwaAlerts" :key="alert.id" class="alert-card alert-card--warn">
              <div class="alert-card__main">
                <div class="bo-row" style="gap: 8px;">
                  <span class="bo-mono bo-muted">{{ alert.time }}</span>
                  <span class="bo-badge bo-badge--warn">E-01</span>
                </div>
                <h5 class="alert-card__title">{{ alert.title }}</h5>
                <p class="alert-card__msg">{{ alert.message }}</p>
              </div>
              <RouterLink :to="{ name: 'courier-detail', params: { id: alert.id } }" class="bo-btn bo-btn--warn">Avaliar candidatura</RouterLink>
            </article>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { logistics, initLogistics } from '../stores/logisticsStore.js';
import { ORDER_STATUS, COURIER_STATE } from '../constants/logistics.js';
import { boAppNotifications, boMarkAppNotificationRead } from '../api/backofficeApi.js';
import { toast } from '../utils/notify.js';

const activeTab = ref('front-office');
const appNotifs = ref([]);
const appNotifsLoading = ref(false);

const appUnreadCount = computed(() => appNotifs.value.filter((n) => !n.isRead).length);

async function loadAppNotifs() {
  appNotifsLoading.value = true;
  try {
    appNotifs.value = await boAppNotifications({ limit: 100 });
  } catch (e) {
    toast(e?.message || 'Falha ao carregar notificações.', 'error');
    appNotifs.value = [];
  } finally {
    appNotifsLoading.value = false;
  }
}

async function markAppRead(documentId) {
  try {
    await boMarkAppNotificationRead(documentId);
    await loadAppNotifs();
    toast('Marcada como lida.', 'success');
  } catch (e) {
    toast(e?.message || 'Falha ao atualizar.', 'error');
  }
}

function formatAppTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(iso).slice(0, 16);
  }
}

onMounted(() => {
  initLogistics({ force: true });
  void loadAppNotifs();
});

const formatTime = (isoString) => {
  if (!isoString) return 'Agora';
  const d = new Date(isoString);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
};

const frontOfficeAlerts = computed(() => {
  return logistics.orders
    .filter(o => o.status === ORDER_STATUS.PENDING)
    .map(o => ({
      id: o.id,
      time: formatTime(o.createdAt),
      title: `Novo pedido · ${o.id}`,
      message: `O cliente ${o.clientName || 'Desconhecido'} aguarda aprovação.`,
      isUrgent: o.is_urgent === true || o.priority >= 4 || o.type === 'EXPRESS',
    }))
    .sort((a, b) => b.time.localeCompare(a.time));
});

const urgentOrders = computed(() => frontOfficeAlerts.value.filter(a => a.isUrgent));
const normalOrders = computed(() => frontOfficeAlerts.value.filter(a => !a.isUrgent));

const pwaAlerts = computed(() => {
  return logistics.couriers
    .filter(c => c.state === COURIER_STATE.E01 || c.courier_status === 'E-01 Pendente Verificação')
    .map(c => ({
      id: c.id,
      time: formatTime(c.createdAt),
      title: `Candidatura · ${c.name || 'Estafeta'}`,
      message: `Novo registo via PWA na zona ${Array.isArray(c.zones) && c.zones.length ? c.zones.join(', ') : (c.zone || '—')}. Documentos pendentes de validação.`,
    }))
    .sort((a, b) => b.time.localeCompare(a.time));
});
</script>

<style scoped>
.section-title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bo-text-secondary);
}

.alert-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  border-radius: var(--bo-radius);
  transition: border-color var(--bo-transition-fast);
}

.alert-card:hover { border-color: var(--bo-brand-mid); }

.alert-card--danger {
  border-left: 4px solid var(--bo-danger);
  background: linear-gradient(90deg, var(--bo-danger-soft), var(--bo-surface) 60%);
}

.alert-card--warn {
  border-left: 4px solid var(--bo-warning);
  background: linear-gradient(90deg, var(--bo-warning-soft), var(--bo-surface) 60%);
}

.alert-card--muted {
  opacity: 0.72;
}

.alert-card__main {
  flex: 1;
  min-width: 0;
}

.alert-card__title {
  margin: 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--bo-text);
}

.alert-actions {
  flex-shrink: 0;
  margin-left: 16px;
}

.action-btn {
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  background: var(--bo-page);
  border: 1px solid var(--bo-border);
  color: var(--bo-text);
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-block;
  text-align: center;
}

.alert-card__msg {
  margin: 0;
  font-size: 13px;
  color: var(--bo-text-secondary);
  line-height: 1.45;
}

@media (max-width: 700px) {
  .alert-card { flex-direction: column; align-items: stretch; }
}
</style>
