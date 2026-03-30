<template>
  <div id="app-root">
    <router-view v-slot="{ Component, route }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const transitionName = computed(() => 'page-fade');
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

*, *::before, *::after {
  box-sizing: border-box;
}
html {
  scroll-behavior: smooth;
}
html, body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: #f6f7f7;
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
#app {
  min-height: 100vh;
}

.page-fade-enter-active {
  animation: pageFadeIn 0.35s ease-out;
}
.page-fade-leave-active {
  animation: pageFadeOut 0.2s ease-in;
}
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pageFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
