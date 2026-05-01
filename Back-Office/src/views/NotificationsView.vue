<template>
  <div class="notifications-page">
    <header class="page-header">
      <h2>Gestor de Notificações</h2>
      <p class="subtitle">Acompanha e gere alertas recebidos das diferentes plataformas do sistema GoEverywhere.</p>
    </header>

    <div class="tabs-container">
      <div class="tabs-nav">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'front-office' }"
          @click="activeTab = 'front-office'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          Front-Office (Pedidos)
          <span class="badge" v-if="frontOfficeAlerts.length">{{ frontOfficeAlerts.length }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'pwa' }"
          @click="activeTab = 'pwa'"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
          PWA (Estafetas)
          <span class="badge badge-warning" v-if="pwaAlerts.length">{{ pwaAlerts.length }}</span>
        </button>
      </div>

      <div class="tab-content" v-if="activeTab === 'front-office'">
        <div v-if="!frontOfficeAlerts.length" class="empty-state">
          <p>Não existem pedidos pendentes de aprovação neste momento.</p>
        </div>
        
        <template v-else>
          <div v-if="urgentOrders.length" class="alerts-section">
            <h3 class="section-title">⚠️ Pedidos Urgentes (Pagos c/ Prioridade)</h3>
            <div class="alert-card danger-card" v-for="alert in urgentOrders" :key="alert.id">
              <div class="alert-info">
                <span class="alert-time">{{ alert.time }}</span>
                <div class="alert-text">
                  <h4>{{ alert.title }} <span class="badge badge-danger">Urgente</span></h4>
                  <p>{{ alert.message }}</p>
                </div>
              </div>
              <div class="alert-actions">
                <router-link :to="{ name: 'order-detail', params: { id: alert.id } }" class="action-btn danger-btn">Tratar Imediatamente</router-link>
              </div>
            </div>
          </div>

          <div v-if="normalOrders.length" class="alerts-section">
            <h3 class="section-title">Pedidos Normais</h3>
            <div class="alert-card" v-for="alert in normalOrders" :key="alert.id">
              <div class="alert-info">
                <span class="alert-time">{{ alert.time }}</span>
                <div class="alert-text">
                  <h4>{{ alert.title }}</h4>
                  <p>{{ alert.message }}</p>
                </div>
              </div>
              <div class="alert-actions">
                <router-link :to="{ name: 'order-detail', params: { id: alert.id } }" class="action-btn">Ver Pedido</router-link>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="tab-content" v-if="activeTab === 'pwa'">
        <div v-if="!pwaAlerts.length" class="empty-state">
          <p>Não existem candidaturas de estafetas pendentes de verificação.</p>
        </div>
        <div class="alert-card warning-card" v-for="alert in pwaAlerts" :key="alert.id">
          <div class="alert-info">
            <span class="alert-time">{{ alert.time }}</span>
            <div class="alert-text">
              <h4>{{ alert.title }}</h4>
              <p>{{ alert.message }}</p>
            </div>
          </div>
          <div class="alert-actions">
            <router-link :to="{ name: 'courier-detail', params: { id: alert.id } }" class="action-btn warning-btn">Avaliar Candidatura</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { logistics, initLogistics } from '../stores/logisticsStore.js';
import { ORDER_STATUS, COURIER_STATE } from '../constants/logistics.js';

const activeTab = ref('front-office');

onMounted(() => {
  // Dá refresh à store para garantir que apanha candidaturas feitas recentemente
  initLogistics({ force: true });
});

// Extrair horas para o layout
const formatTime = (isoString) => {
  if (!isoString) return 'Agora';
  const d = new Date(isoString);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
};

// Pedidos pendentes (Front-Office)
const frontOfficeAlerts = computed(() => {
  return logistics.orders
    .filter(o => o.status === ORDER_STATUS.PENDING)
    .map(o => ({
      id: o.id,
      time: formatTime(o.createdAt),
      title: `Novo Pedido: ${o.id}`,
      message: `O cliente ${o.clientName || 'Desconhecido'} fez um pedido e aguarda aprovação.`,
      isUrgent: o.is_urgent === true || o.priority >= 4 || o.type === 'EXPRESS' || o.urgent
    }))
    .sort((a, b) => b.time.localeCompare(a.time));
});

const urgentOrders = computed(() => frontOfficeAlerts.value.filter(a => a.isUrgent));
const normalOrders = computed(() => frontOfficeAlerts.value.filter(a => !a.isUrgent));

// Estafetas por verificar (PWA)
const pwaAlerts = computed(() => {
  return logistics.couriers
    .filter(c => c.state === COURIER_STATE.E01 || c.courier_status === 'E-01 Pendente Verificação')
    .map(c => ({
      id: c.id,
      time: formatTime(c.createdAt),
      title: `Candidatura: ${c.name || c.fullName}`,
      message: `Novo registo submetido via PWA na zona ${c.zone}. Aguarda validação de documentos.`
    }))
    .sort((a, b) => b.time.localeCompare(a.time));
});
</script>

<style scoped>
.notifications-page {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}
.subtitle {
  color: var(--bo-text-secondary);
  font-size: 15px;
}

.tabs-container {
  background: var(--bo-surface);
  border: 1px solid var(--bo-border);
  border-radius: 12px;
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  border-bottom: 1px solid var(--bo-border);
  background: #f9fafb;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}
.tab-btn:hover {
  background: #f3f4f6;
}
.tab-btn.active {
  color: var(--bo-brand);
  border-bottom-color: var(--bo-brand);
  background: #fff;
}

.badge {
  background: var(--bo-brand);
  color: white;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 4px;
}
.badge-warning {
  background: #eab308;
}

.tab-content {
  padding: 24px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--bo-text-secondary);
  font-style: italic;
}

.alert-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--bo-border);
  border-radius: 8px;
  margin-bottom: 12px;
  background: #fff;
}
.alert-card:last-child {
  margin-bottom: 0;
}
.warning-card {
  border-left: 4px solid #eab308;
}

.alert-info {
  display: flex;
  gap: 16px;
  align-items: center;
}
.alert-time {
  font-size: 13px;
  font-weight: 600;
  color: var(--bo-text-secondary);
  width: 50px;
}
.alert-text h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
}
.alert-text p {
  margin: 0;
  font-size: 14px;
  color: var(--bo-text-secondary);
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
  color: var(--bo-text);
  font-weight: 600;
  font-size: 13px;
  border: 1px solid var(--bo-border);
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-block;
  text-align: center;
}
.action-btn:hover {
  background: var(--bo-brand-soft);
  color: var(--bo-brand);
  border-color: var(--bo-brand);
}
.warning-btn:hover {
  background: #fefce8;
  color: #ca8a04;
  border-color: #fef08a;
}
</style>
