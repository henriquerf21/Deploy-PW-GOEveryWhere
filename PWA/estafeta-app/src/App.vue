<template>
  <div class="app-shell">
    <router-view />
    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { store } from './stores/courierStore.js';
import BottomNav from './components/BottomNav.vue';

const route = useRoute();
const showNav = computed(() => {
  const isAuth = store.auth.loggedIn && !['Login', 'Register'].includes(route.name);
  // Escondemos a navegação se houver uma entrega ativa para manter o foco
  return isAuth && !store.activeDeliveryId;
});
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
