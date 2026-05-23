<template>
  <div class="app-shell">
    <router-view />
    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { store } from './stores/courierStore.js';
import BottomNav from './components/BottomNav.vue';
import { requestNotificationPermission } from './utils/notifications.js';

const route = useRoute();
const LOCKED_ROUTES = ['DeliveryDetail', 'ConfirmDelivery'];
const showNav = computed(() => {
  if (!store.auth.loggedIn) return false;
  
  // Hide nav for specific pages
  if (['Login', 'Register', 'DeliveryDetail', 'ConfirmDelivery', 'DeliveryCompleted'].includes(route.name)) return false;
  
  // Hide nav if there's an active delivery in progress
  if (store.activeDeliveryId && route.path && !route.path.startsWith('/completed/')) {
    return false;
  }
  
  return true;
});

watch(() => store.auth.loggedIn, (loggedIn) => {
  if (loggedIn) void requestNotificationPermission();
}, { immediate: true });
</script>

<style scoped>
.app-shell {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  background: var(--ge-page);
}

@media (min-width: 900px) {
  .app-shell {
    min-height: calc(100dvh - 32px);
    margin: 16px auto;
    border: 1px solid var(--ge-border);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 18px 56px rgba(17, 24, 39, 0.14);
  }
}
</style>
