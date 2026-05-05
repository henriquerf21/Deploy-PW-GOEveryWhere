<template>
  <div id="app-root">
    <router-view v-slot="{ Component, route }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
    <GummyBot />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import GummyBot from './components/GummyBot.vue';

const route = useRoute();
const transitionName = computed(() => 'page-slide');

/* ── Global scroll-reveal via IntersectionObserver ── */
import { fetchStores, fetchCatalogProducts } from './stores/orderStore.js';

onMounted(() => {
  // Carregar dados dinâmicos do backend (RF)
  fetchStores();
  fetchCatalogProducts();

  if (typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  /* Observe existing .reveal elements */
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  /* Observe future .reveal elements via MutationObserver */
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.classList?.contains('reveal')) observer.observe(node);
        node.querySelectorAll?.('.reveal').forEach((el) => observer.observe(el));
      });
    });
  });
  mo.observe(document.getElementById('app-root'), { childList: true, subtree: true });
});
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}
html {
  scroll-behavior: smooth;
}
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  font-family: var(--go-font-body, 'Inter', system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#app {
  min-height: 100vh;
}

/* ── Page transition: smooth slide-up + fade ── */
.page-slide-enter-active {
  animation: pageSlideIn 0.4s var(--go-ease, cubic-bezier(0.22, 1, 0.36, 1));
  will-change: opacity, transform;
}
.page-slide-leave-active {
  animation: pageSlideOut 0.22s ease-in;
  will-change: opacity, transform;
}
@keyframes pageSlideIn {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pageSlideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* ── Legacy fallback: keep page-fade for anything still referencing it ── */
.page-fade-enter-active {
  animation: pageSlideIn 0.35s ease-out;
}
.page-fade-leave-active {
  animation: pageSlideOut 0.2s ease-in;
}
</style>
